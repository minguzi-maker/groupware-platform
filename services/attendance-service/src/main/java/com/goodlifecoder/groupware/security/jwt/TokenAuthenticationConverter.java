package com.goodlifecoder.groupware.security.jwt;




import com.goodlifecoder.groupware.security.entity.TokenUser;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.UUID;

public class TokenAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt){
        String tenantId = jwt.getClaimAsString("tenant_id");
        TokenUser user = new TokenUser(
                UUID.fromString(jwt.getSubject()),
                jwt.getClaimAsString("context"),
                tenantId == null ? null : UUID.fromString(tenantId),
                List.copyOf(jwt.getClaimAsStringList("permissions")));
        return new TokenAuthentication(user, jwt);
    }

    /* principal = TokenUser, credentials = 원본 토큰 문자열 (다른 서비스 호출 시 그대로 넘김)*/
    static class TokenAuthentication extends  AbstractAuthenticationToken{
        private  final  TokenUser user;
        private  final  Jwt jwt;

        TokenAuthentication(TokenUser user, Jwt jwt){
            super(List.of(new SimpleGrantedAuthority("CONTEXT_" + user.context())));
            this.user = user;
            this.jwt = jwt;
            setAuthenticated(true);
        }
        @Override public Object getPrincipal() {return user;}
        @Override public Object getCredentials(){return jwt.getTokenValue();}
        @Override public String getName()       {return user.userId().toString();}

    }
}
