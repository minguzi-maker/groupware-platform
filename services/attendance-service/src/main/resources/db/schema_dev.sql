/*
 * 날짜: 2026-11-25
 * 버전: 1.0.0
 * 작성자: 한성현
 */
-- attendance-service 개발용 초기화 스크립트
-- 기존 테이블을 모두 지우고 다시 만든다. 개발 DB에서만 실행한다.
--   psql -d attendance_service -v ON_ERROR_STOP=1 -f schema_dev.sql
-- 데이터베이스가 없으면 먼저 만든다:
--   CREATE DATABASE attendance_service ENCODING 'UTF8';

DROP TABLE IF EXISTS attendance_record CASCADE;
DROP TABLE IF EXISTS work_schedule_exception CASCADE;
DROP TABLE IF EXISTS work_assignment CASCADE;
DROP TABLE IF EXISTS company_holiday CASCADE;
DROP TABLE IF EXISTS work_type_break CASCADE;
DROP TABLE IF EXISTS work_type CASCADE;

-- 근무 유형
-- 참조 중인 유형이 지워지면 안 되므로 삭제 대신 active = false 로 비활성화한다.
CREATE TABLE work_type (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id           UUID         NOT NULL,
    name                VARCHAR(100) NOT NULL,                      -- 유형명
    work_style          VARCHAR(20)  NOT NULL DEFAULT 'FIXED',      -- 고정, 시차, 선택근무(확장성)
    start_time          TIME         NOT NULL,
    end_time            TIME         NOT NULL,
    work_days           SMALLINT     NOT NULL DEFAULT 31,           -- 비트마스크 월1 화2 수4 목8 금16 토32 일64
    weekly_holiday_dow  SMALLINT,                                   -- 주휴일 월요일~일요일 1~7
    late_grace_minutes  INT          NOT NULL DEFAULT 0,            -- 지각 허용시간
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- 자식 테이블의 (tenant_id, work_type_id) 외래키가 참조하는 대상
    CONSTRAINT uk_work_type_tenant_id   UNIQUE (tenant_id, id),
    CONSTRAINT uk_work_type_tenant_name UNIQUE (tenant_id, name),
    CONSTRAINT ck_work_type_style       CHECK (work_style IN ('FIXED', 'STAGGERED', 'FLEXIBLE')),
    CONSTRAINT ck_work_type_days        CHECK (work_days BETWEEN 1 AND 127),
    CONSTRAINT ck_work_type_holiday_dow CHECK (weekly_holiday_dow BETWEEN 1 AND 7),
    CONSTRAINT ck_work_type_grace       CHECK (late_grace_minutes >= 0),
    CONSTRAINT ck_work_type_time        CHECK (start_time < end_time)
);

-- 근무 유형에 따른 휴게시간
-- 요청으로 받은 work_type_id 는 반드시 (tenant_id, id)로 조회해서 확인한다.
CREATE TABLE work_type_break (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id     UUID   NOT NULL,
    work_type_id  BIGINT NOT NULL,
    start_time    TIME   NOT NULL,
    end_time      TIME   NOT NULL,

    CONSTRAINT fk_wtb_work_type
        FOREIGN KEY (tenant_id, work_type_id) REFERENCES work_type (tenant_id, id),
    CONSTRAINT ck_wtb_time CHECK (start_time < end_time)
);

CREATE INDEX idx_wtb_tenant_work_type
    ON work_type_break (tenant_id, work_type_id);

-- 공통 휴일
CREATE TABLE company_holiday (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id     UUID        NOT NULL,
    holiday_date  DATE        NOT NULL,
    name          VARCHAR(50) NOT NULL,
    holiday_type  VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',  -- 공휴일, 대체휴일, 사측규정휴일
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_company_holiday_tenant_date UNIQUE (tenant_id, holiday_date),
    CONSTRAINT ck_company_holiday_type CHECK (holiday_type IN ('PUBLIC', 'SUBSTITUTE', 'COMPANY'))
);

-- 근무 유형 배정 (회사 전체 / 그룹 / 개인)
CREATE TABLE work_assignment (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id     UUID         NOT NULL,
    work_type_id  BIGINT       NOT NULL,
    target_type   VARCHAR(10)  NOT NULL,   -- 적용 직원 그룹
    target_id     BIGINT,
    start_date    DATE         NOT NULL,   -- 근무유형 적용 날짜
    end_date      DATE,
    memo          VARCHAR(500),            -- 개인 배정 사유(예: 육아 단축)
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),  -- 근무유형 등록 날짜
    created_by    UUID         NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT fk_wa_work_type
        FOREIGN KEY (tenant_id, work_type_id) REFERENCES work_type (tenant_id, id),
    CONSTRAINT ck_wa_target_type
        CHECK (target_type IN ('COMPANY', 'GROUP', 'EMPLOYEE')),
    CONSTRAINT ck_wa_target_id
        CHECK ((target_type = 'COMPANY' AND target_id IS NULL)          -- 회사 배정이면 ID가 비어 있어야 함
            OR (target_type <> 'COMPANY' AND target_id IS NOT NULL)),   -- 회사가 아닌 배정이면 ID가 있어야 함
    CONSTRAINT ck_wa_period
        CHECK (end_date IS NULL OR end_date >= start_date)
);

-- 직원/그룹의 특정 날짜에 적용되는 배정 찾기
CREATE INDEX idx_wa_tenant_target
    ON work_assignment (tenant_id, target_type, target_id, start_date);
CREATE INDEX idx_wa_tenant_work_type
    ON work_assignment (tenant_id, work_type_id);

-- 특정 직원의 근무 예외 (외근, 출장, 시간 변경, 휴무)
CREATE TABLE work_schedule_exception (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id        UUID        NOT NULL,
    emp_id           BIGINT      NOT NULL,
    exception_date   DATE        NOT NULL,
    exception_type   VARCHAR(20) NOT NULL,
    start_time       TIME,                    -- TIME_CHANGE 일 때만
    end_time         TIME,
    clock_in_exempt  BOOLEAN     NOT NULL DEFAULT FALSE,
    reason           VARCHAR(500),
    created_by       UUID        NOT NULL,    -- 등록한 부서장 = 승인자
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_wse_tenant_emp_date UNIQUE (tenant_id, emp_id, exception_date),
    CONSTRAINT ck_wse_type
        CHECK (exception_type IN ('TIME_CHANGE', 'OUTSIDE_WORK', 'BUSINESS_TRIP', 'DAY_OFF')),
    CONSTRAINT ck_wse_time CHECK (
        (exception_type = 'TIME_CHANGE' AND start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
        OR (exception_type <> 'TIME_CHANGE' AND start_time IS NULL AND end_time IS NULL)),
    CONSTRAINT ck_wse_exempt CHECK (
        clock_in_exempt = FALSE OR exception_type IN ('OUTSIDE_WORK', 'BUSINESS_TRIP'))
);

-- 날짜별 예외 목록 (관리자 화면)
CREATE INDEX idx_wse_tenant_date
    ON work_schedule_exception (tenant_id, exception_date);

-- 출퇴근 기록
-- work_date 가 지났는데 clock_out_at 이 NULL 이면 status 는 MISSING_OUT.
CREATE TABLE attendance_record (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id           UUID        NOT NULL,
    emp_id              BIGINT      NOT NULL,
    work_date           DATE        NOT NULL,
    clock_in_at         TIMESTAMPTZ,
    clock_out_at        TIMESTAMPTZ,
    clock_in_source     VARCHAR(10),            -- 본인(WEB) / 관리자(ADMIN) 작성 구분
    clock_out_source    VARCHAR(10),
    -- 아래 4개는 출근해서 행이 만들어지는 순간의 스냅샷
    work_type_id        BIGINT,
    scheduled_in_at     TIMESTAMPTZ,
    scheduled_out_at    TIMESTAMPTZ,
    late_grace_minutes  INT,
    status              VARCHAR(20) NOT NULL,
    late_minutes        INT,
    worked_minutes      INT,                    -- 근태 달력에 쓸 값
    modified_by         UUID,                   -- 기록 수정 주체
    modified_reason     VARCHAR(500),           -- 기록 수정 내용
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_ar_tenant_emp_date UNIQUE (tenant_id, emp_id, work_date),
    -- work_type_id 가 NULL 이면 검사하지 않는다 (MATCH SIMPLE)
    CONSTRAINT fk_ar_work_type
        FOREIGN KEY (tenant_id, work_type_id) REFERENCES work_type (tenant_id, id),
    CONSTRAINT ck_ar_status
        CHECK (status IN ('NORMAL', 'LATE', 'EARLY_LEAVE', 'LATE_AND_EARLY',
                          'ABSENT', 'MISSING_OUT', 'ON_LEAVE', 'HOLIDAY')),
    CONSTRAINT ck_ar_clock_in_source  CHECK (clock_in_source  IN ('WEB', 'ADMIN')),
    CONSTRAINT ck_ar_clock_out_source CHECK (clock_out_source IN ('WEB', 'ADMIN'))
);

-- 날짜별 회사 전체 근태 현황, 미퇴근 배치
CREATE INDEX idx_ar_tenant_date_status
    ON attendance_record (tenant_id, work_date, status);

-- 확인용
SELECT * FROM work_type;
SELECT * FROM work_type_break;
SELECT * FROM company_holiday;
SELECT * FROM work_assignment;
SELECT * FROM work_schedule_exception;
SELECT * FROM attendance_record;
