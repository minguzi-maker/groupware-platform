package com.goodlifecoder.groupware.tenant.repository;

import com.goodlifecoder.groupware.tenant.entity.UserTenantMembershipEntity;
import com.goodlifecoder.groupware.tenant.entity.UserTenantMembershipId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 테넌트 소속. 루트 여부는 이 행에 있다.
 */
public interface UserTenantMembershipRepository extends JpaRepository<UserTenantMembershipEntity, UserTenantMembershipId> {

    /** 회원과 테넌트 한 쌍의 소속. 없으면 비운다. */
    Optional<UserTenantMembershipEntity> findByIdUserIdAndIdTenantId(UUID userId, UUID tenantId);

    /** 회원의 활성 소속과 활성 테넌트. 이름 순이다. */
    @Query("""
            select membership
            from UserTenantMembershipEntity membership
            join fetch membership.tenant tenant
            where membership.id.userId = :userId
              and membership.status = com.goodlifecoder.groupware.tenant.entity.MembershipStatus.ACTIVE
              and tenant.status = com.goodlifecoder.groupware.tenant.entity.TenantStatus.ACTIVE
            order by tenant.name
            """)
    List<UserTenantMembershipEntity> findActiveWithTenantByUserId(@Param("userId") UUID userId);
}
