package com.goodlifecoder.groupware.worktype;

import com.goodlifecoder.groupware.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "work_type")
@NoArgsConstructor(access =  AccessLevel.PROTECTED)
public class workType extends BaseEntity {

    @id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private UUID tenantId;              //회사 구분

    @Column(nullable = false)
    private  String name;                //근무 유형 이름

    @Column(nullable = false, length = 20)
    private  String workStyle;          //FIXED / STAGGERED /FLEXIBLE

    @Column(nullable = false)
    private OffsetDateTime start_time;

    @Column(nullable = false)
    private OffsetDateTime end_time;


}
