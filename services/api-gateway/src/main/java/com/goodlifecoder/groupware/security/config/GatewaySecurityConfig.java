package com.goodlifecoder.groupware.security.config;

import com.goodlifecoder.groupware.common.config.AppProperties;
import com.goodlifecoder.groupware.security.filter.SessionCookieBearerWebFilter;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.ECPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;

@Configuration
public class GatewaySecurityConfig {

    @Bean
    @LoadBalanced
    WebClient.Builder sessionWebClientBuilder() {
        return WebClient.builder().baseUrl("http://user-service");
    }

    @Bean
    SecurityWebFilterChain gatewaySecurity(
            ServerHttpSecurity http,
            @Qualifier("sessionWebClientBuilder") WebClient.Builder sessionWebClientBuilder,
            AppProperties appProperties) {
        SessionCookieBearerWebFilter sessionCookieBearerWebFilter =
                new SessionCookieBearerWebFilter(sessionWebClientBuilder.build());

        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(cors -> cors.configurationSource(corsSource(appProperties)))
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .authorizeExchange(auth -> auth
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers(HttpMethod.POST, "/*/platform/login").permitAll()
                        .pathMatchers("/*/platform/oauth2/authorization/**").permitAll()
                        .pathMatchers("/*/platform/**").hasAuthority("SCOPE_PLATFORM")
                        .pathMatchers("/user-service/user/**").permitAll()
                        // 각 서비스는 JWT 의 permissions 로 권한을 판단한다.

                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                )
                .addFilterBefore(
                        sessionCookieBearerWebFilter,
                        SecurityWebFiltersOrder.AUTHENTICATION
                )
                .build();
    }

    /**
     * 관리 포트(18081)만 인증 없이 연다.
     * 공개 API 포트(8081)의 필터와 섞이지 않게 포트로 구분한다.
     * health와 prometheus만 허용하고 나머지 액추에이터는 거절한다.
     */
    @Bean
    @Order(-1)
    SecurityWebFilterChain managementPortSecurity(
            ServerHttpSecurity http,
            @Value("${management.server.port}") int managementPort) {

        http.securityMatcher(exchange -> {
            var address = exchange.getRequest().getLocalAddress();
            int port = address == null ? -1 : address.getPort();

            if (port == managementPort) {
                return ServerWebExchangeMatcher.MatchResult.match();
            }

            return ServerWebExchangeMatcher.MatchResult.notMatch();
        });

        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .authorizeExchange(auth -> auth
                        .pathMatchers(
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/prometheus"
                        ).permitAll()
                        .anyExchange().denyAll()
                )
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(AppProperties appProperties) {
        return corsSource(appProperties);
    }

    private static UrlBasedCorsConfigurationSource corsSource(AppProperties appProperties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(appProperties.cors().allowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Set-Cookie"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    ReactiveJwtDecoder accessTokenDecoder(AuthProperties authProperties) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withJwkSource(
                        new ImmutableJWKSet<>(
                                new JWKSet(ecKey(authProperties))
                        )
                )
                .jwsAlgorithm(SignatureAlgorithm.ES256)
                .build();

        decoder.setJwtValidator(
                new DelegatingOAuth2TokenValidator<>(
                        new JwtTimestampValidator(),
                        new JwtIssuerValidator(
                                authProperties.accessTokenIssuer()
                        )
                )
        );

        return token -> Mono
                .fromCallable(() -> decoder.decode(token))
                .subscribeOn(Schedulers.boundedElastic());
    }

    private static ECKey ecKey(AuthProperties authProperties) {
        String body = authProperties.accessTokenPublic()
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        try {
            X509EncodedKeySpec spec = new X509EncodedKeySpec(
                    Base64.getDecoder().decode(body)
            );

            ECPublicKey publicKey = (ECPublicKey) KeyFactory
                    .getInstance("EC")
                    .generatePublic(spec);

            return new ECKey.Builder(
                    Curve.forECParameterSpec(publicKey.getParams()),
                    publicKey
            )
                    .keyID(authProperties.accessTokenKeyId())
                    .keyUse(KeyUse.SIGNATURE)
                    .algorithm(JWSAlgorithm.ES256)
                    .build();

        } catch (
                InvalidKeySpecException |
                NoSuchAlgorithmException |
                IllegalArgumentException ex
        ) {
            throw new IllegalStateException(
                    "invalid EC public key",
                    ex
            );
        }
    }

    @Bean
    Converter<Jwt, Mono<AbstractAuthenticationToken>> jwtAuthenticationConverter() {
        ReactiveJwtAuthenticationConverter converter =
                new ReactiveJwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(this::authorities);

        return converter;
    }

    /** context 가 platform 이면 본사 토큰이므로 SCOPE_PLATFORM 을 붙인다. */
    private Flux<GrantedAuthority> authorities(Jwt jwt) {
        if ("platform".equals(jwt.getClaimAsString("context"))) {
            return Flux.just(new SimpleGrantedAuthority("SCOPE_PLATFORM"));
        }
        return Flux.empty();
    }
}