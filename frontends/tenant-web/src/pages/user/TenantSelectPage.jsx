import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { tenantHomeUrl } from '../../tenantHost'

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL

/** 목록 항목에서 이름과 주소 이름만 남긴다. */
function readTenants(body) {
  if (!Array.isArray(body)) return []
  return body.flatMap((item) => {
    const name = typeof item?.name === 'string' ? item.name.trim() : ''
    const slug = typeof item?.slug === 'string' ? item.slug.trim() : ''
    return name && slug ? [{ name, slug }] : []
  })
}

/** 로그인한 회원의 테넌트. 없으면 생성 화면으로 보낸다. */
function TenantSelectPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState([])
  const [notice, setNotice] = useState('')
  const [status, setStatus] = useState('loading')
  const [entering, setEntering] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const left = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/tenant-exit`, {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal,
        })
        if (left.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/tenants`, {
          credentials: 'include',
          signal: controller.signal,
        })
        if (response.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        if (!response.ok) {
          setNotice('테넌트 목록을 불러오지 못했습니다.')
          setStatus('ready')
          return
        }
        const tenants = readTenants(await response.json().catch(() => null))
        if (tenants.length === 0) {
          navigate('/tenants/new', { replace: true })
          return
        }
        setTenants(tenants)
        setStatus('ready')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setNotice('테넌트 목록을 불러오지 못했습니다.')
        setStatus('ready')
      }
    }

    load()
    return () => controller.abort()
  }, [navigate])

  async function enter(slug) {
    setNotice('')
    setEntering(slug)
    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/tenant-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tenant: slug }),
      })
      if (response.status === 204) {
        window.location.assign(tenantHomeUrl(slug, window.location))
        return
      }
      if (response.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setNotice(response.status === 403 ? '이 테넌트에 들어갈 수 없습니다.' : '테넌트에 들어가지 못했습니다.')
    } catch {
      setNotice('테넌트에 들어가지 못했습니다.')
    } finally {
      setEntering('')
    }
  }

  useEffect(() => {
    document.title = '테넌트 선택'
  }, [])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-text sm:px-8">
      <div className="grid w-full max-w-md gap-6">
        <Link to="/" className="text-center font-brand text-2xl font-bold tracking-wide text-main no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-3xl">
          GROUPWARE
        </Link>
        <div className="grid w-full gap-4 rounded-lg border border-main/15 bg-light p-6 shadow-sm sm:gap-5 sm:p-8">
          <h2 className="text-xl font-semibold text-main sm:text-2xl">테넌트 선택</h2>
          {status === 'loading' ? (
            <p className="text-sm text-text/70 sm:text-base">테넌트를 확인하고 있습니다.</p>
          ) : (
            <ul className="grid gap-2">
              {tenants.map((tenant) => (
                <li key={tenant.slug}>
                  <button
                    type="button"
                    disabled={entering !== ''}
                    onClick={() => enter(tenant.slug)}
                    className="grid w-full gap-0.5 rounded-lg border border-main/25 bg-white px-4 py-3 text-left hover:bg-main/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                  >
                    <span className="text-sm font-semibold text-main sm:text-base">{tenant.name}</span>
                    <span className="text-xs text-text/70">{tenant.slug}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {notice !== '' && (
            <p className="min-w-0 rounded-lg border border-main/20 bg-white p-3 text-sm">{notice}</p>
          )}
        </div>
      </div>
    </main>
  )
}

export default TenantSelectPage
