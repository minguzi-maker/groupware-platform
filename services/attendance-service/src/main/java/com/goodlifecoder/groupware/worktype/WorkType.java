package com.goodlifecoder.groupware.worktype;

import com.goodlifecoder.groupware.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;

import lombok.Builder;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;

import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "work_type")
@NoArgsConstructor(access =  AccessLevel.PROTECTED)
public class WorkType extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private UUID tenantId;              //회사 구분

    @Column(nullable = false, length = 100)
    private  String name;                //근무 유형 이름

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private  WorkStyle workStyle;          //FIXED / STAGGERED /FLEXIBLE

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private Short workDays;             //비트마스크 월1 화2 수4 목8 금16 토32 일64

    private Short weeklyHolidayDow;     // 주휴일 월 ~ 일, 1~7 대입

    @Column(nullable = false)
    private Integer lateGraceMinutes;   // 지각 허용시간

    @Column(nullable = false)
    private Boolean active;             // 삭제시  false(신규직원들 false 데이터 적용 불가)

    @Builder
    public WorkType(UUID tenantId, String name, WorkStyle workStyle, LocalTime startTime,
                    LocalTime endTime, Short workDays, Short weeklyHolidayDow,
                    Integer lateGraceMinutes, Boolean active) {

        this.tenantId = tenantId;
        this.name = name;
        this.workStyle = workStyle != null ?  workStyle: WorkStyle.FIXED;
        this.startTime = startTime;
        this.endTime = endTime;
        this.workDays = workDays != null? workDays : 31;
        this.weeklyHolidayDow = weeklyHolidayDow;
        this.lateGraceMinutes = lateGraceMinutes != null? lateGraceMinutes : 0;
        this.active = true;
    }
}
