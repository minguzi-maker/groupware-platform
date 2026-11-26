/*
 * 날짜: 2026-11-25
 * 버전: 1.0.0
 * 작성자: 한성현
 */
package com.goodlifecoder.groupware.security.config;

import com.goodlifecoder.groupware.security.jwt.AccessTokenClaimValidator;
import com.goodlifecoder.groupware.security.jwt.TokenAuthenticationConverter;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.SecurityFilterChain;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.ECPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception{
        return http.csrf(c -> c.disable())//Bearer 헤더만 받으므로 CSRF 불필요
                .sessionManagement(s -> s
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))//서버에 로그인 상태 저장 안함. 요청시마다 토큰을 새로 검증.
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/actuator/health/**").permitAll()
                        .requestMatchers("/platform/**").hasAuthority("CONTEXT_platform")
                        .anyRequest().hasAuthority("CONTEXT_tenant"))//나머지 모든요청은 tenant를 가지고있어야함.
                .oauth2ResourceServer(o -> o
                        .jwt(j -> j.jwtAuthenticationConverter(new TokenAuthenticationConverter())))//accessTokenDecoder
                .build();
    }

    @Bean
    JwtDecoder accessTokenDecoder(AuthProperties authProperties) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withJwkSource(
                        new ImmutableJWKSet<>(
                                new JWKSet(ecKey(authProperties))
                        )
                )
                .jwsAlgorithm(SignatureAlgorithm.ES256)//헤더에 es256이라고 적힌 토큰만 받는다
                .build();

        decoder.setJwtValidator(// 기본 검증 규칙을 변경
                new DelegatingOAuth2TokenValidator<>(
                        new JwtTimestampValidator(), // 만료시간, 사용시작시간 검증
                        new JwtIssuerValidator(// iss가 현재 인증 서버 값과 같은지 검증
                                authProperties.accessTokenIssuer()
                        ),
                        new AccessTokenClaimValidator()
                )
        );

        return decoder;
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
                    .keyID(authProperties.accessTokenKeyId())// kid
                    .keyUse(KeyUse.SIGNATURE) // 서명 검증용
                    .algorithm(JWSAlgorithm.ES256)//이 공개키는 ES256 서명을 확인할때 쓴다는 알림
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

}
