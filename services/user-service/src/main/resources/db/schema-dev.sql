-- user-service DB 초기화 스크립트
DROP TABLE IF EXISTS user_tenant_roles CASCADE;
DROP TABLE IF EXISTS user_platform_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS user_tenant_memberships CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS user_social_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 테넌트. slug 는 주소에 쓰고 유일하다. status 는 ACTIVE 또는 SUSPENDED.
CREATE TABLE tenants (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ,
    CONSTRAINT uk_tenants_slug UNIQUE (slug),
    CONSTRAINT tenants_status_check CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

-- 로그인 이메일은 users.email 이다. 비밀번호는 없을 수 있다. 탈퇴하면 둘 다 NULL 이다.
CREATE TABLE users (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname             VARCHAR(100),
    email                VARCHAR(255),
    password             VARCHAR(255),
    enabled              BOOLEAN NOT NULL DEFAULT TRUE,
    account_non_locked   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ,
    updated_at           TIMESTAMPTZ,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT users_email_password_pair CHECK (password IS NULL OR email IS NOT NULL)
);

-- 소셜 로그인 연결. 한 제공자 계정은 한 행이다.
CREATE TABLE user_social_accounts (
    user_id         UUID NOT NULL,
    provider_type   VARCHAR(255) NOT NULL,
    provider_id     VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ,
    CONSTRAINT user_social_accounts_pkey PRIMARY KEY (provider_type, provider_id),
    CONSTRAINT fk_user_social_accounts_user
        FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 테넌트 소속. 한 회원은 테넌트마다 한 행이고, 루트는 테넌트당 한 명이다.
-- status 는 ACTIVE 또는 SUSPENDED.
CREATE TABLE user_tenant_memberships (
    user_id    UUID NOT NULL,
    tenant_id  UUID NOT NULL,
    is_root     BOOLEAN NOT NULL DEFAULT FALSE,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ,
    CONSTRAINT user_tenant_memberships_pkey PRIMARY KEY (user_id, tenant_id),
    CONSTRAINT fk_user_tenant_memberships_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_tenant_memberships_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT user_tenant_memberships_status_check CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

CREATE UNIQUE INDEX uk_user_tenant_memberships_one_root
    ON user_tenant_memberships (tenant_id) WHERE is_root;

CREATE INDEX idx_user_tenant_memberships_tenant
    ON user_tenant_memberships (tenant_id);

-- 역할 목록. scope 는 PLATFORM 또는 TENANT.
-- permissions 원소는 서비스:API 이고, 와일드카드는 그 서비스 안에서만 쓴다. 예: hr:*
-- 루트는 여기 두지 않고 user_tenant_memberships.is_root 에 둔다.
-- CHECK 에는 서브쿼리를 넣을 수 없어 원소 형식은 함수로 확인한다.
CREATE OR REPLACE FUNCTION roles_permissions_valid(permissions text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT cardinality(permissions) > 0
       AND NOT EXISTS (
           SELECT 1
           FROM unnest(permissions) AS permission
           WHERE permission !~ '^[^:*]+:[^:]+$'
       );
$$;

CREATE TABLE roles (
    code         VARCHAR(50) PRIMARY KEY,
    scope        VARCHAR(20) NOT NULL,
    permissions  TEXT[] NOT NULL,
    created_at   TIMESTAMPTZ,
    updated_at   TIMESTAMPTZ,
    CONSTRAINT uk_roles_code_scope UNIQUE (code, scope),
    CONSTRAINT roles_scope_check CHECK (scope IN ('PLATFORM', 'TENANT')),
    CONSTRAINT roles_permissions_format CHECK (roles_permissions_valid(permissions))
);

-- 본사 역할. tenant_id 가 없다. PLATFORM 역할만 참조한다.
CREATE TABLE user_platform_roles (
    user_id     UUID NOT NULL,
    role        VARCHAR(50) NOT NULL,
    scope       VARCHAR(20) NOT NULL DEFAULT 'PLATFORM',
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ,
    CONSTRAINT user_platform_roles_pkey PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_platform_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_platform_roles_role FOREIGN KEY (role, scope) REFERENCES roles (code, scope),
    CONSTRAINT user_platform_roles_scope_check CHECK (scope = 'PLATFORM')
);

-- 테넌트 안 역할. 소속이 있는 회원만 가질 수 있고, TENANT 역할만 참조한다.
CREATE TABLE user_tenant_roles (
    user_id     UUID NOT NULL,
    tenant_id   UUID NOT NULL,
    role        VARCHAR(50) NOT NULL,
    scope       VARCHAR(20) NOT NULL DEFAULT 'TENANT',
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ,
    CONSTRAINT user_tenant_roles_pkey PRIMARY KEY (user_id, tenant_id, role),
    CONSTRAINT fk_user_tenant_roles_membership
        FOREIGN KEY (user_id, tenant_id) REFERENCES user_tenant_memberships (user_id, tenant_id),
    CONSTRAINT fk_user_tenant_roles_role FOREIGN KEY (role, scope) REFERENCES roles (code, scope),
    CONSTRAINT user_tenant_roles_scope_check CHECK (scope = 'TENANT')
);

CREATE INDEX idx_user_tenant_roles_tenant
    ON user_tenant_roles (tenant_id, user_id);

-- 확인용
SELECT * FROM tenants;
SELECT * FROM users;
SELECT * FROM user_social_accounts;
SELECT * FROM user_tenant_memberships;
SELECT * FROM roles;
SELECT * FROM user_platform_roles;
SELECT * FROM user_tenant_roles;
