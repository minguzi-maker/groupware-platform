package com.goodlifecoder.groupware.security.config;

import com.goodlifecoder.groupware.security.filter.LoginFilter;
import com.goodlifecoder.groupware.security.filter.SessionCookieAuthenticationFilter;
import com.goodlifecoder.groupware.security.handler.LoginSuccessHandler;
import com.goodlifecoder.groupware.security.http.CurrentSessionUser;
import com.goodlifecoder.groupware.security.http.SessionCookieFactory;
import com.goodlifecoder.groupware.security.oauth.DoorAuthorizationRequestResolver;
import com.goodlifecoder.groupware.security.oauth.RedisOAuth2AuthorizationRequestRepository;
import com.goodlifecoder.groupware.security.oauth.ReturnToAuthorizationRequestResolver;
import com.goodlifecoder.groupware.security.service.AuthService;
import com.goodlifecoder.groupware.security.session.LoginEntrance;
import com.goodlifecoder.groupware.security.service.CustomOAuth2UserService;
import com.goodlifecoder.groupware.security.service.CustomOidcUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 회원 이메일 로그인, 본사 이메일 로그인, 회원 소셜 로그인, 본사 소셜 로그인을 한 체인에 묶는다.
 * 회원 로그인은 account 토큰, 본사 로그인은 platform 토큰만 발급한다. 이전 세션은 끊는다.
 * 회사 선택은 POST /user/tenant-entry, 해제는 POST /user/tenant-exit 이다.
 * 소속 목록은 GET /user/tenants, 새 회사는 POST /user/tenants 이다.
 * 본사 소셜은 /platform/oauth2/authorization 에서 시작하고 본사 토큰만 발급한다.
 * 세션은 STATELESS 이고 CSRF, 폼 로그인, HTTP Basic 은 끈다.
 * 아래에 적은 공개 주소만 통과하고, 나머지는 세션 쿠키가 있어야 한다.
 * /platform/** 는 본사 로그인 세션이어야 한다. 게이트웨이의 context platform 과 같다.
 *
 * @author 조휘재
 * 작성일: 2026-11-23
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private static final String LOGIN_URL = "/user/login";
    private static final String PLATFORM_LOGIN_URL = "/platform/login";
    private static final String OAUTH_AUTHORIZATION_BASE_URI = "/user/oauth2/authorization";
    private static final String PLATFORM_OAUTH_AUTHORIZATION_BASE_URI = "/platform/oauth2/authorization";
    private static final String OAUTH_CALLBACK_URI = "/user/oauth2/code/*";

    private final AuthenticationSuccessHandler socialSuccessHandler;
    private final AuthenticationFailureHandler socialFailureHandler;

    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomOidcUserService customOidcUserService;
    private final AuthService authService;
    private final SessionCookieFactory sessionCookieFactory;
    private final CurrentSessionUser currentSessionUser;
    private final RedisOAuth2AuthorizationRequestRepository authorizationRequestRepository;

    /** 이메일 로그인 필터가 쓸 인증 매니저. */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /** 소셜 인가 요청. PKCE 와 return_to 를 붙인다. 본사 시작 주소는 본사 입구로 표시한다. */
    @Bean
    OAuth2AuthorizationRequestResolver authorizationRequestResolver(ClientRegistrationRepository registrations) {
        return new DoorAuthorizationRequestResolver(
                memberAuthorizationResolver(registrations),
                platformAuthorizationResolver(registrations));
    }

    /** 회원 소셜. 루트 가입 토큰을 인가 요청에 실을 수 있다. */
    private static OAuth2AuthorizationRequestResolver memberAuthorizationResolver(ClientRegistrationRepository registrations) {
        return new ReturnToAuthorizationRequestResolver(pkceResolver(registrations, OAUTH_AUTHORIZATION_BASE_URI));
    }

    /** 본사 소셜. 루트 가입 토큰은 싣지 않는다. */
    private static OAuth2AuthorizationRequestResolver platformAuthorizationResolver(ClientRegistrationRepository registrations) {
        return new ReturnToAuthorizationRequestResolver(
                pkceResolver(registrations, PLATFORM_OAUTH_AUTHORIZATION_BASE_URI),
                false);
    }

    /** PKCE 를 붙인 기본 인가 요청 해석기. */
    private static DefaultOAuth2AuthorizationRequestResolver pkceResolver(
            ClientRegistrationRepository registrations,
            String baseUri
    ) {
        DefaultOAuth2AuthorizationRequestResolver resolver =
                new DefaultOAuth2AuthorizationRequestResolver(registrations, baseUri);
        resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
        return resolver;
    }

    /** 이메일 로그인 필터와 네이버·구글 로그인을 한 체인에 묶는다. */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           AuthenticationManager authenticationManager,
                                           OAuth2AuthorizationRequestResolver authorizationRequestResolver) throws Exception {

        // 로그인 필터
        LoginFilter memberLogin = new LoginFilter(authenticationManager, LOGIN_URL);
        memberLogin.setAuthenticationSuccessHandler(
                new LoginSuccessHandler(authService, sessionCookieFactory, null));
        LoginFilter platformLogin = new LoginFilter(authenticationManager, PLATFORM_LOGIN_URL);
        platformLogin.setAuthenticationSuccessHandler(
                new LoginSuccessHandler(authService, sessionCookieFactory, LoginEntrance.PLATFORM));

        // http 설정
        http
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/user/login",
                                "/platform/login",
                                "/platform/oauth2/authorization/**",
                                "/user/signup",
                                "/user/signup/email-verification",
                                "/user/signup/email-verification/resend",
                                "/user/root-signup",
                                "/user/root-signup/email-verification",
                                "/user/root-signup/email-verification/resend",
                                "/user/root-signup/password",
                                "/user/password-reset",
                                "/user/password-reset/confirm",
                                "/user/oauth2/authorization/**",
                                "/user/oauth2/code/**",
                                "/user/logout",
                                "/internal/session/access"
                        ).permitAll()
                        .requestMatchers("/platform/**").hasAuthority(SessionCookieAuthenticationFilter.PLATFORM_AUTHORITY)
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/prometheus"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                        .accessDeniedHandler((request, response, denied) ->
                                response.setStatus(HttpStatus.FORBIDDEN.value()))
                )
                .oauth2Login(oauth -> oauth
                        .authorizationEndpoint(endpoint -> endpoint
                                .authorizationRequestResolver(authorizationRequestResolver)
                                .authorizationRequestRepository(authorizationRequestRepository)
                        )
                        .redirectionEndpoint(endpoint -> endpoint.baseUri(OAUTH_CALLBACK_URI))
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                                .oidcUserService(customOidcUserService)
                        )
                        .successHandler(socialSuccessHandler)
                        .failureHandler(socialFailureHandler)
                )
                .addFilterAt(memberLogin, UsernamePasswordAuthenticationFilter.class)
                .addFilterAt(platformLogin, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(
                        new SessionCookieAuthenticationFilter(currentSessionUser),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}