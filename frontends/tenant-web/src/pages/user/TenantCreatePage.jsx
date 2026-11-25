import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL

/** 응답 JSON의 code. 본문이 없거나 형식이 아니면 빈 문자열이다. */
async function readCode(response) {
  const text = await response.text()
  if (!text) return ''
  try {
    const body = JSON.parse(text)
    return typeof body.code === 'string' ? body.code : ''
  } catch {
    return ''
  }
}

/** 소속이 없는 회원이 테넌트를 만든다. */
function TenantCreatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [result, setResult] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = '테넌트 만들기'
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function checkSession() {
      try {
        const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/tenants`, {
          credentials: 'include',
          signal: controller.signal,
        })
        if (response.status === 401) navigate('/login', { replace: true })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    checkSession()
    return () => controller.abort()
  }, [navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setResult('')
    setSubmitting(true)
    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, slug }),
      })
      const code = await readCode(response)
      if (response.status === 201) {
        navigate('/tenants', { replace: true })
        return
      }
      if (response.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      if (code === 'SLUG_TAKEN') {
        setResult('이미 쓰는 주소 이름입니다.')
        return
      }
      if (code === 'INVALID_REQUEST') {
        setResult('이름과 주소 이름을 확인해 주세요. 주소 이름은 소문자, 숫자, 하이픈만 쓸 수 있습니다.')
        return
      }
      setResult('테넌트를 만들지 못했습니다.')
    } catch {
      setResult('테넌트를 만들지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-text sm:px-8">
      <div className="grid w-full max-w-md gap-6">
        <Link to="/" className="text-center font-brand text-2xl font-bold tracking-wide text-main no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-3xl">
          GROUPWARE
        </Link>
        <form onSubmit={handleSubmit} className="grid w-full gap-4 rounded-lg border border-main/15 bg-light p-6 shadow-sm sm:gap-5 sm:p-8">
          <h2 className="text-xl font-semibold text-main sm:text-2xl">테넌트 만들기</h2>
          <label htmlFor="name" className="grid gap-1.5 text-sm font-medium text-text sm:text-base">
            이름
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              autoComplete="organization"
              required
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-main/25 bg-white px-3 py-2.5 text-base font-normal outline-none focus:border-main focus:ring-2 focus:ring-accent sm:px-4 sm:py-3"
            />
          </label>
          <label htmlFor="slug" className="grid gap-1.5 text-sm font-medium text-text sm:text-base">
            주소 이름
            <input
              id="slug"
              name="slug"
              type="text"
              value={slug}
              autoComplete="off"
              spellCheck={false}
              required
              onChange={(event) => setSlug(event.target.value)}
              className="rounded-lg border border-main/25 bg-white px-3 py-2.5 text-base font-normal outline-none focus:border-main focus:ring-2 focus:ring-accent sm:px-4 sm:py-3"
            />
          </label>
          <p className="text-sm text-text/70">주소 이름은 소문자, 숫자, 하이픈만 쓸 수 있습니다.</p>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-main px-4 py-3 text-sm font-semibold text-background hover:bg-main/90 disabled:opacity-60 sm:text-base"
          >
            {submitting ? '만드는 중' : '테넌트 만들기'}
          </button>
          {result !== '' && (
            <p className="min-w-0 rounded-lg border border-main/20 bg-white p-3 text-sm">{result}</p>
          )}
        </form>
      </div>
    </main>
  )
}

export default TenantCreatePage
