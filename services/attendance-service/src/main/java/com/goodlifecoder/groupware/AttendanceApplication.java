package com.goodlifecoder.groupware;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AttendanceApplication {
    /** 애플리케이션을 시작한다. */
    public static void main(String[] args) {
        SpringApplication.run(AttendanceApplication.class, args);
    }

}
