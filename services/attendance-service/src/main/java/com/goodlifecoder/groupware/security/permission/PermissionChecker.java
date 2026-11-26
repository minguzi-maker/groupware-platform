package com.goodlifecoder.groupware.security.permission;

import com.goodlifecoder.groupware.security.entity.TokenUser;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("perm")
public class PermissionChecker {

    private static final String SERVICE = "attendance:";

    public boolean has(Authentication auth, String api){
        if(api.contains(":")) throw new IllegalArgumentException("API명만 적으세요: " + api);
        return auth.getPrincipal() instanceof TokenUser user
                && (user.permissions().contains(SERVICE + api) || user.permissions().contains(SERVICE + "*"));
    }

}
