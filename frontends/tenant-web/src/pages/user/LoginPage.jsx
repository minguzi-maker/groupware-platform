/**
 * @author 조휘재
 * 작성일: 2026-11-24
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import '../../assets/auth/google-sign-in.css'
import { GoogleLogo, NaverLogo } from './SocialLogos'

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL

/** 소셜 로그인 주소. 성공하면 테넌트 선택 화면으로 돌아온다. */
function socialLoginUrl(registrationId) {
  const params = new URLSearchParams({ return_to: '/tenants' })
  return `${BACKEND_API_BASE_URL}/user-service/user/oauth2/authorization/${registrationId}?${params}`
}

/** 로그인 폼의 필수 입력 칸. */
function TextField({ id, label, type, value, onChange, autoComplete }) {
  return (
    <label htmlFor={id} className="grid gap-1.5 text-sm font-medium text-text sm:text-base">
      {label}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required
        onChange={onChange}
        className="rounded-lg border border-main/25 bg-white px-3 py-2.5 text-base font-normal outline-none focus:border-main focus:ring-2 focus:ring-accent sm:px-4 sm:py-3"
      />
    </label>
  )
}

/** 이메일 로그인과 구글·네이버 로그인을 연다. */
function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = '로그인'
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const body = await response.text()
      if (response.ok) {
        navigate('/tenants', { replace: true })
        return
      }
      setResult(body ? `${response.status}\n${body}` : String(response.status))
    } catch (error) {
      setResult(error instanceof Error ? error.message : String(error))
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
          <h2 className="text-xl font-semibold text-main sm:text-2xl">로그인</h2>
          <TextField
            id="email"
            label="이메일"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <div className="grid gap-1.5">
            <TextField
              id="password"
              label="비밀번호"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Link
              to="/password-reset"
              className="justify-self-end text-sm font-semibold text-main no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <div className="mt-1 grid gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-main px-4 py-3 text-sm font-semibold text-background hover:bg-main/90 disabled:opacity-60 sm:text-base"
            >
              {submitting ? '로그인 중' : '로그인'}
            </button>
            <p className="flex flex-wrap items-baseline justify-center gap-x-1.5 text-sm text-text/70">
              <span>계정이 없으신가요?</span>
              <Link
                to="/signup"
                className="font-semibold text-main focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                회원가입
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-main/20" />
            <span className="text-sm text-text/70">또는</span>
            <span className="h-px flex-1 bg-main/20" />
          </div>
          <a
            className="gsi-material-button block no-underline"
            style={{ width: '100%', maxWidth: 'none' }}
            href={socialLoginUrl('google')}
          >
            <span className="gsi-material-button-content-wrapper">
              <GoogleLogo />
              <span className="gsi-material-button-contents">Google로 로그인</span>
            </span>
          </a>
          <a
            className="relative flex h-10 w-full items-center justify-center rounded-md no-underline"
            style={{ backgroundColor: '#03A94D' }}
            href={socialLoginUrl('naver')}
          >
            <span className="absolute left-1 flex">
              <NaverLogo />
            </span>
            <span className="text-sm font-medium text-white">네이버 로그인</span>
          </a>
          {result !== '' && (
            <p className="max-h-[40dvh] min-w-0 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-main/20 bg-white p-3 text-sm">
              {result}
            </p>
          )}
        </form>
      </div>
    </main>
  )
}

export default LoginPage
