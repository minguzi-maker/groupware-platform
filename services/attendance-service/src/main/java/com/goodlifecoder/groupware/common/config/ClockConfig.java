/*
 * 날짜: 2026-11-25
 * 버전: 1.0.0
 * 작성자: 한성현
 */
package com.goodlifecoder.groupware.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class ClockConfig {

    @Bean
    public Clock clock(){
        return Clock.systemUTC();
    }
}
