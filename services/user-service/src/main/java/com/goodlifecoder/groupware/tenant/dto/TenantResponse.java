package com.goodlifecoder.groupware.tenant.dto;

/**
 * 회원이 고를 수 있는 테넌트. 주소에는 slug 를 쓴다.
 */
public record TenantResponse(String name, String slug) {
}
