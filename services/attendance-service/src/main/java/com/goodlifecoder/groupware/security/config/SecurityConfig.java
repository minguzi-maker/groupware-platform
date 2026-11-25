/*
 * 날짜: 2026-11-25
 * 버전: 1.0.0
 * 작성자: 한성현
 */
package com.goodlifecoder.groupware.security.config;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;

import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.ECPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;


@Configuration
@EnableWebSecurity
public class SecurityConfig {


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

        decoder.setJwtValidator(
                new DelegatingOAuth2TokenValidator<>(
                        new JwtTimestampValidator(),
                        new JwtIssuerValidator(
                                authProperties.accessTokenIssuer()
                        )
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
