package com.goodlifecoder.groupware.security.entity;

import java.util.List;
import java.util.UUID;


public record TokenUser(UUID userId, String context , UUID tenantId, List<String> permissions) {

    public UUID requireTenantId(){
        if (tenantId == null) throw new IllegalStateException("tenant  토큰이 아닙니다");
        return tenantId;
    }
}
