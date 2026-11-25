package com.goodlifecoder.groupware.tenant.controller;

import com.goodlifecoder.groupware.security.http.CurrentSessionUser;
import com.goodlifecoder.groupware.tenant.dto.TenantCreateRequest;
import com.goodlifecoder.groupware.tenant.dto.TenantResponse;
import com.goodlifecoder.groupware.tenant.service.TenantAccountService;
import com.goodlifecoder.groupware.tenant.service.TenantAccountService.InvalidTenantException;
import com.goodlifecoder.groupware.tenant.service.TenantAccountService.MissingAccountException;
import com.goodlifecoder.groupware.tenant.service.TenantAccountService.SlugTakenException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 로그인 회원의 테넌트 목록과 생성. 세션이 없으면 401.
 */
@RestController
@RequiredArgsConstructor
public class TenantController {

    private final CurrentSessionUser currentSessionUser;
    private final TenantAccountService tenantAccountService;

    /** 들어갈 수 있는 테넌트. 없으면 빈 배열. */
    @GetMapping("/user/tenants")
    public ResponseEntity<List<TenantResponse>> list(HttpServletRequest request) {
        return currentSessionUser.id(request)
                .map(userId -> ResponseEntity.ok(tenantAccountService.list(userId)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    /** 테넌트를 만든다. 형식 오류는 400, 주소 이름이 겹치면 409. */
    @PostMapping("/user/tenants")
    public ResponseEntity<?> create(HttpServletRequest request, @RequestBody TenantCreateRequest body) {
        UUID userId = currentSessionUser.id(request).orElse(null);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (body == null) {
            return ResponseEntity.badRequest().body(Map.of("code", "INVALID_REQUEST"));
        }
        try {
            TenantResponse created = tenantAccountService.create(userId, body.name(), body.slug());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (MissingAccountException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (InvalidTenantException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", "INVALID_REQUEST"));
        } catch (SlugTakenException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", "SLUG_TAKEN"));
        }
    }
}
