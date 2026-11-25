package com.goodlifecoder.groupware.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 이메일 비밀번호 해시. DelegatingPasswordEncoder 를 쓴다.
 * SecurityConfig 에 두면 OAuth 가입 서비스와 생성 순서가 순환한다.
 */
@Configuration
public class PasswordEncoderConfig {

    /** 비밀번호 해시. */
    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
