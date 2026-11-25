/**
 * @author 조휘재
 * 작성일: 2026-11-24
 */

import { useEffect, useState } from 'react'

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL
const SESSION_REFRESH = 'groupware-session-refresh'
const EMPTY_SESSION = { status: 'ready', authenticated: false, userId: null, nickname: null }

/** GET /user/session 본문. userId 는 UUID 문자열이고, 닉네임이 없으면 필드가 빠진다. */
function sessionFromBody(body) {
  if (!body || body.authenticated !== true) return EMPTY_SESSION
  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
  if (!userId) return EMPTY_SESSION
  const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : ''
  return { status: 'ready', authenticated: true, userId, nickname: nickname || null }
}

/**
 * 세션을 다시 읽게 알린다. signedOut 이면 빈 세션으로 먼저 바꾼다.
 * @author simoon7
 * 작성일: 2026-11-24
 */
export function refreshSession({ signedOut = false } = {}) {
  window.dispatchEvent(new CustomEvent(SESSION_REFRESH, { detail: { signedOut } }))
}

/** 서버 로그아웃이 되면 세션을 비운다. 204 가 아니면 상태 코드를 던지고 세션은 그대로 둔다. */
export async function logout() {
  const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  if (response.status !== 204) {
    throw new Error(String(response.status))
  }
  refreshSession({ signedOut: true })
}

/** 회원 세션을 읽는다. 401 이면 빈 세션이다. 새로고침 신호가 오면 다시 읽고, 요청이 취소되면 상태를 바꾸지 않는다. */
export function useSession() {
  const [session, setSession] = useState({ ...EMPTY_SESSION, status: 'loading' })
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const onRefresh = (event) => {
      if (event instanceof CustomEvent && event.detail?.signedOut) setSession(EMPTY_SESSION)
      setRefreshKey((value) => value + 1)
    }
    window.addEventListener(SESSION_REFRESH, onRefresh)
    return () => window.removeEventListener(SESSION_REFRESH, onRefresh)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/session`, {
          credentials: 'include',
          signal: controller.signal,
        })
        if (response.status === 401) {
          setSession(EMPTY_SESSION)
          return
        }
        if (!response.ok) {
          throw new Error(String(response.status))
        }
        const body = await response.json().catch(() => null)
        setSession(sessionFromBody(body))
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setSession(EMPTY_SESSION)
      }
    }

    load()
    return () => controller.abort()
  }, [refreshKey])

  return session
}
