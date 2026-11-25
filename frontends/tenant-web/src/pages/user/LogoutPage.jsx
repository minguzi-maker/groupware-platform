import { useEffect } from 'react'
import { logout } from '../../session'

/** 세션 쿠키가 있는 주소에서 로그아웃한 뒤 랜딩으로 보낸다. */
function LogoutPage() {
  useEffect(() => {
    let cancelled = false
    logout()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) window.location.replace('/')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return null
}

export default LogoutPage
