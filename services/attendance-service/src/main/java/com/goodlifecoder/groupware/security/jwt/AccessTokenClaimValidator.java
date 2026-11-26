package com.goodlifecoder.groupware.security.jwt;


import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.Set;
import java.util.UUID;


/*
* Access Token 의 커스텀 클레임 (sub, context, tenant_id, permissions) 형식을 검증한다.
* 서명 , 만료 (exp) 검증은 하지 않고 JwtValidators.createDefault()와 함께 등록해야 한다.
* */
public class AccessTokenClaimValidator implements OAuth2TokenValidator<Jwt> {

    //허용하는 context값, set.of는 contains(null)에서 NPE를 던지므로 null 체크를 먼저 한다.
    private static  final  Set<String> CONTEXTS = Set.of("tenant","account","platform");

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        String context = jwt.getClaimAsString("context");
        String tenantId = jwt.getClaimAsString("tenant_id");

        // 1. sub(사용자 id)는 정식 UUID여야 한다.
        if (!isUuid(jwt.getSubject())) return fail("sub가 UUID가 아님");
        //2. context 는 null 이 아니고 허용 목록 안에 있어야 한다.
        if (context == null || !CONTEXTS.contains(context)) return fail("알수 없는 context임");
        //3. tenant 토큰이면 tenant-id가 uuid여야 하고, tenant가 아니면 UUID tenant_id가 있으며 안된다.
        // 양쪽이 같으면 통과, 다르면 실패
        if ("tenant".equals(context) != isUuid(tenantId)) return fail ("tenant_id가 context와 맞지 않음");
        //4. permissions는 문자열로만 된 목록이어야 한다. (클레임이 없거나 다른 타입이면 실패)
        if (!(jwt.getClaim("permissions") instanceof List<?> list)
                || !list.stream().allMatch(String.class::isInstance)) return fail ("permissions가 목록이 아님");
        return OAuth2TokenValidatorResult.success();


    }
    //UUID 파싱 후 다시 문자열로 바꿔 원본과 비교한다.
    // "1-1-1-1-1"같은 축약형은 파싱은 되지만 원본과 달라서 걸러진다.
    private static boolean isUuid (String value){
        if (value == null) return false;
        try {
            return UUID.fromString(value).toString().equalsIgnoreCase(value);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
    //검증 실패 시 invalid_token 에러를 담아 돌려준다. (Spring이 401로 처리)
    private static OAuth2TokenValidatorResult fail (String msg){
        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", msg, null));
    }
}
