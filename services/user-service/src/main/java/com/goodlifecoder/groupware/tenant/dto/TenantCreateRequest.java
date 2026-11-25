package com.goodlifecoder.groupware.tenant.dto;

/**
 * 테넌트 생성 본문. slug 는 주소에 쓰는 이름이다.
 */
public record TenantCreateRequest(String name, String slug) {
}
