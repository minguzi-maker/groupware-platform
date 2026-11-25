package com.goodlifecoder.groupware.tenant.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.goodlifecoder.groupware.tenant.dto.TenantResponse;
import com.goodlifecoder.groupware.tenant.entity.MembershipStatus;
import com.goodlifecoder.groupware.tenant.entity.TenantEntity;
import com.goodlifecoder.groupware.tenant.entity.UserTenantMembershipEntity;
import com.goodlifecoder.groupware.tenant.entity.UserTenantMembershipId;
import com.goodlifecoder.groupware.tenant.repository.TenantRepository;
import com.goodlifecoder.groupware.tenant.repository.UserTenantMembershipRepository;
import com.goodlifecoder.groupware.tenant.service.TenantAccountService.InvalidTenantException;
import com.goodlifecoder.groupware.tenant.service.TenantAccountService.SlugTakenException;
import com.goodlifecoder.groupware.user.entity.UserEntity;
import com.goodlifecoder.groupware.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class TenantAccountServiceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000010");

    private final UserRepository users = org.mockito.Mockito.mock(UserRepository.class);
    private final TenantRepository tenants = org.mockito.Mockito.mock(TenantRepository.class);
    private final UserTenantMembershipRepository memberships =
            org.mockito.Mockito.mock(UserTenantMembershipRepository.class);
    private final TenantAccountService service = new TenantAccountService(users, tenants, memberships);

    @Test
    void listReadsActiveMemberships() {
        when(memberships.findActiveWithTenantByUserId(USER_ID)).thenReturn(List.of(membership("아크미", "acme")));

        assertThat(service.list(USER_ID)).containsExactly(new TenantResponse("아크미", "acme"));
    }

    @Test
    void createRejectsASlugThatCannotBeAHostLabel() {
        when(users.findById(USER_ID)).thenReturn(Optional.of(UserEntity.builder().id(USER_ID).build()));

        assertThatThrownBy(() -> service.create(USER_ID, "아크미", "acme.io"))
                .isInstanceOf(InvalidTenantException.class);

        verify(tenants, never()).saveAndFlush(any());
    }

    @Test
    void createStoresTheMemberAsRoot() {
        when(users.findById(USER_ID)).thenReturn(Optional.of(UserEntity.builder().id(USER_ID).build()));
        when(tenants.findBySlug("acme")).thenReturn(Optional.empty());
        when(tenants.saveAndFlush(any())).thenAnswer(invocation -> {
            TenantEntity draft = invocation.getArgument(0);
            return TenantEntity.builder()
                    .id(TENANT_ID)
                    .name(draft.getName())
                    .slug(draft.getSlug())
                    .status(draft.getStatus())
                    .build();
        });

        TenantResponse created = service.create(USER_ID, " 아크미 ", " ACME ");

        assertThat(created).isEqualTo(new TenantResponse("아크미", "acme"));
        ArgumentCaptor<UserTenantMembershipEntity> captor = ArgumentCaptor.forClass(UserTenantMembershipEntity.class);
        verify(memberships).saveAndFlush(captor.capture());
        UserTenantMembershipEntity membership = captor.getValue();
        assertThat(membership.isRoot()).isTrue();
        assertThat(membership.getStatus()).isEqualTo(MembershipStatus.ACTIVE);
        assertThat(membership.getId()).isEqualTo(new UserTenantMembershipId(USER_ID, TENANT_ID));
    }

    @Test
    void createRejectsASlugAlreadyUsed() {
        when(users.findById(USER_ID)).thenReturn(Optional.of(UserEntity.builder().id(USER_ID).build()));
        when(tenants.findBySlug("acme")).thenReturn(Optional.of(TenantEntity.builder().slug("acme").name("다른 회사").build()));

        assertThatThrownBy(() -> service.create(USER_ID, "아크미", "acme"))
                .isInstanceOf(SlugTakenException.class);

        verify(tenants, never()).saveAndFlush(any());
    }

    private static UserTenantMembershipEntity membership(String name, String slug) {
        TenantEntity tenant = TenantEntity.builder().id(TENANT_ID).name(name).slug(slug).build();
        return UserTenantMembershipEntity.builder()
                .id(new UserTenantMembershipId(USER_ID, TENANT_ID))
                .tenant(tenant)
                .status(MembershipStatus.ACTIVE)
                .build();
    }
}
