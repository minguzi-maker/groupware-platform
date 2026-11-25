/**
 * @author 조휘재
 * 작성일: 2026-11-24
 */

import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { logout, useSession } from '../session'

const MY_LINKS = [
  { to: '/my/profile', label: '내 프로필' },
  { to: '/my/settings', label: '계정 설정' },
]

/** 선택한 메뉴와 그 외 메뉴의 글자색과 배경을 가른다. */
function linkClass(isActive) {
  return `rounded-lg px-2 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3 ${
    isActive ? 'bg-main text-background' : 'text-text hover:bg-main/10'
  }`
}

/** 로그인 회원의 프로필 메뉴. 닉네임이 없으면 MY 로 보여주고, 로그아웃하면 로그인 화면으로 보낸다. */
function MyMenu({ nickname }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

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
        aria-controls="my-menu"
        onClick={() => setOpen((value) => !value)}
        aria-label={typeof nickname === 'string' && nickname.trim() ? nickname.trim() : 'MY'}
        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-main px-2 text-xs font-semibold text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {typeof nickname === 'string' && nickname.trim() ? nickname.trim().slice(0, 1) : 'MY'}
      </button>
      {open && (
        <div
          id="my-menu"
          className="absolute top-full right-0 z-20 mt-2 grid min-w-max gap-1 rounded-lg border border-main/15 bg-white p-2"
          onClick={() => setOpen(false)}
        >
          {MY_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isActive ? 'bg-main text-background' : 'text-text hover:bg-main/10'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/tenants"
            className="rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap text-text no-underline hover:bg-main/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            테넌트 선택하기
          </NavLink>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => {
              setLoggingOut(true)
              logout()
                .then(() => navigate('/', { replace: true }))
                .catch(() => setLoggingOut(false))
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

/** 손님에게 가입과 로그인을 보여 준다. 로그인은 지금 경로를 복귀 경로로 넘긴다. */
function AuthButtons() {
  const location = useLocation()

  return (
    <>
      <NavLink to="/signup" className={({ isActive }) => `${linkClass(isActive)} whitespace-nowrap`}>
        회원가입
      </NavLink>
      <NavLink
        to="/login"
        state={{ from: `${location.pathname}${location.search}` }}
        className="rounded-lg bg-main px-2 py-1.5 text-sm font-semibold whitespace-nowrap text-background hover:bg-main/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3"
      >
        로그인
      </NavLink>
    </>
  )
}

/** 상단 메뉴. 세션이 확정되기 전에는 로그인 버튼을 그리지 않는다. */
function Header() {
  const session = useSession()

  return (
    <header className="border-b border-main/15 bg-header">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8 md:px-12">
        <NavLink
          to="/"
          end
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="font-brand text-lg font-bold tracking-wide text-main">GROUPWARE</span>
        </NavLink>
        <nav aria-label="메뉴" className="flex items-center gap-1">
          {session.status === 'ready' && (session.authenticated ? <MyMenu nickname={session.nickname} /> : <AuthButtons />)}
        </nav>
      </div>
    </header>
  )
}

export default Header
