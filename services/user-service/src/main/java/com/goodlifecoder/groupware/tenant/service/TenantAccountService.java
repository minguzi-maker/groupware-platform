package com.goodlifecoder.groupware.tenant.service;

import com.goodlifecoder.groupware.tenant.dto.TenantResponse;
import com.goodlifecoder.groupware.tenant.entity.MembershipStatus;
import com.goodlifecoder.groupware.tenant.entity.TenantEntity;
import com.goodlifecoder.groupware.tenant.entity.UserTenantMembershipEntity;
import com.goodlifecoder.groupware.tenant.entity.UserTenantMembershipId;
import com.goodlifecoder.groupware.tenant.repository.TenantRepository;
import com.goodlifecoder.groupware.tenant.repository.UserTenantMembershipRepository;
import com.goodlifecoder.groupware.user.entity.UserEntity;
import com.goodlifecoder.groupware.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 로그인한 회원의 테넌트 목록과 새 테넌트 생성. 만든 회원은 그 테넌트의 루트다.
 */
@Service
@RequiredArgsConstructor
public class TenantAccountService {

    private static final Pattern SLUG = Pattern.compile("^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$");
    private static final int NAME_MAX = 255;

    private final UserRepository users;
    private final TenantRepository tenants;
    private final UserTenantMembershipRepository memberships;

    /** 활성 소속의 활성 테넌트. 없으면 빈 목록. */
    @Transactional(readOnly = true)
    public List<TenantResponse> list(UUID userId) {
        return memberships.findActiveWithTenantByUserId(userId).stream()
                .map(membership -> new TenantResponse(membership.getTenant().getName(), membership.getTenant().getSlug()))
                .toList();
    }

    /** 테넌트를 만들고 요청한 회원을 루트로 넣는다. */
    @Transactional
    public TenantResponse create(UUID userId, String name, String slug) {
        UserEntity user = users.findById(userId).orElseThrow(MissingAccountException::new);
        String keptName = name == null ? "" : name.trim();
        String keptSlug = slug == null ? "" : slug.trim().toLowerCase();
        if (keptName.isEmpty() || keptName.length() > NAME_MAX || !SLUG.matcher(keptSlug).matches()) {
            throw new InvalidTenantException();
        }
        if (tenants.findBySlug(keptSlug).isPresent()) {
            throw new SlugTakenException();
        }
        try {
            TenantEntity saved = tenants.saveAndFlush(TenantEntity.builder()
                    .name(keptName)
                    .slug(keptSlug)
                    .build());
            memberships.saveAndFlush(UserTenantMembershipEntity.builder()
                    .id(new UserTenantMembershipId(user.getId(), saved.getId()))
                    .user(user)
                    .tenant(saved)
                    .root(true)
                    .status(MembershipStatus.ACTIVE)
                    .build());
            return new TenantResponse(saved.getName(), saved.getSlug());
        } catch (DataIntegrityViolationException ex) {
            throw new SlugTakenException();
        }
    }

    /** 세션의 회원 행이 없다. */
    public static class MissingAccountException extends RuntimeException {
    }

    /** 이름이나 주소 이름이 형식에 맞지 않는다. */
    public static class InvalidTenantException extends RuntimeException {
    }

    /** 주소 이름을 다른 테넌트가 이미 쓴다. */
    public static class SlugTakenException extends RuntimeException {
    }
}
