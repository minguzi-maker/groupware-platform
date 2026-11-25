import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router'
import { useSession } from '../session'
import { appUrl } from '../tenantHost'

const MENUS = [
  { to: '/members', label: '조직원 관리' },
  { to: '/payroll', label: '급여 관리' },
  { to: '/attendance', label: '근태 관리' },
  { to: '/payment', label: '전자결제' },
  { to: '/iam', label: 'IAM 설정' },
]

/** 선택한 메뉴와 그 외 메뉴의 글자색과 배경을 가른다. */
function linkClass(isActive) {
  return `rounded-lg px-2 py-1.5 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3 ${
    isActive ? 'bg-main text-background' : 'text-text hover:bg-main/10'
  }`
}

/** 테넌트 안 프로필. 테넌트 선택과 로그아웃만 둔다. */
function TenantProfile({ nickname }) {
  const nicknameText = typeof nickname === 'string' ? nickname.trim() : ''
  const label = nicknameText || 'MY'
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="tenant-my-menu"
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-main px-2 text-xs font-semibold text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {nicknameText ? nicknameText.slice(0, 1) : 'MY'}
      </button>
      {open && (
        <div
          id="tenant-my-menu"
          className="absolute top-full right-0 z-20 mt-2 grid min-w-max gap-1 rounded-lg border border-main/15 bg-white p-2"
        >
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              // 서브도메인에서 바로 회사를 해제하면 세션 쿠키가 빠지고 401 이 된다.
              window.location.assign(appUrl('/tenants', window.location))
            }}
            className="rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap text-text hover:bg-main/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          >
            테넌트 선택하기
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              window.location.assign(appUrl('/logout', window.location))
            }}
            className="rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap text-text hover:bg-main/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}

/** 테넌트 서브도메인 상단 메뉴. 프로필은 항상 두고, 닉네임은 세션이 있을 때만 쓴다. */
function SubdomainHeader() {
  const session = useSession()

  return (
    <header className="border-b border-main/15 bg-header px-4 py-3 sm:px-8 md:px-12">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1" aria-label="테넌트 메뉴">
          {MENUS.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => linkClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <TenantProfile nickname={session.authenticated ? session.nickname : null} />
      </div>
    </header>
  )
}

export default SubdomainHeader
