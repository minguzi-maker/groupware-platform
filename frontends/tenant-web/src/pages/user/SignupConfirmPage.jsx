/**
 * @author 조휘재
 * 작성일: 2026-11-24
 */

import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { clearSignupToken, readSignupToken, storeSignupToken } from './signupEmailStorage'
import '../../assets/auth/google-sign-in.css'
import { GoogleLogo, NaverLogo } from './SocialLogos'

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL

/** 확인된 가입 토큰을 실은 소셜 가입 주소. */
function socialSignupUrl(registrationId, signupToken) {
  const params = new URLSearchParams({
    root_signup_token: signupToken,
    return_to: '/',
  })
  return `${BACKEND_API_BASE_URL}/user-service/user/oauth2/authorization/${registrationId}?${params}`
}

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

/** location state 의 가입 토큰이 문자열일 때만 앞뒤 공백을 뺀다. */
function tokenFromState(state) {
  const value = state?.signupToken
  return typeof value === 'string' ? value.trim() : ''
}

/** 비밀번호 또는 같은 이메일의 소셜 계정으로 가입을 마친다. 토큰이 없으면 가입 화면으로 되돌린다. */
function SignupConfirmPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const fromState = tokenFromState(location.state)
  const [signupToken] = useState(() => fromState || readSignupToken())
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [result, setResult] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (fromState) storeSignupToken(fromState)
  }, [fromState])

  useEffect(() => {
    if (!signupToken && !done) navigate('/signup', { replace: true })
  }, [signupToken, done, navigate])

  useEffect(() => {
    document.title = done ? '가입 완료' : '비밀번호 설정'
  }, [done])

  async function handleSubmit(event) {
    event.preventDefault()
    setResult('')
    if (password !== passwordConfirm) {
      setResult('비밀번호가 일치하지 않습니다.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/root-signup/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ signupToken, password }),
      })
      const code = await readCode(response)
      if (response.status === 201) {
        clearSignupToken()
        setDone(true)
        return
      }
      if (code === 'INVALID_TOKEN') {
        setResult('가입 확인이 만료되었습니다. 이메일부터 다시 진행해 주세요.')
        return
      }
      if (code === 'EMAIL_TAKEN' || response.status === 409) {
        setResult('이미 가입된 이메일입니다.')
        return
      }
      if (code === 'INVALID_REQUEST') {
        setResult('비밀번호를 입력해 주세요.')
        return
      }
      setResult('회원가입에 실패했습니다.')
    } catch {
      setResult('회원가입에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!signupToken && !done) return null

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-text sm:px-8">
      <div className="grid w-full max-w-md gap-6">
        <Link to="/" className="text-center font-brand text-2xl font-bold tracking-wide text-main no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-3xl">
          GROUPWARE
        </Link>
        {done ? (
          <div className="grid w-full gap-4 rounded-lg border border-main/15 bg-light p-6 shadow-sm sm:gap-5 sm:p-8">
            <h2 className="text-xl font-semibold text-main sm:text-2xl">가입이 완료되었습니다</h2>
            <p className="text-sm text-text sm:text-base">이제 로그인할 수 있습니다.</p>
            <Link
              to="/login"
              className="rounded-lg bg-main px-4 py-3 text-center text-sm font-semibold text-background no-underline hover:bg-main/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
            >
              로그인
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid w-full gap-4 rounded-lg border border-main/15 bg-light p-6 shadow-sm sm:gap-5 sm:p-8">
            <h2 className="text-xl font-semibold text-main sm:text-2xl">비밀번호 설정</h2>
            <label htmlFor="password" className="grid gap-1.5 text-sm font-medium text-text sm:text-base">
              비밀번호
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                autoComplete="new-password"
                required
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-lg border border-main/25 bg-white px-3 py-2.5 text-base font-normal outline-none focus:border-main focus:ring-2 focus:ring-accent sm:px-4 sm:py-3"
              />
            </label>
            <label htmlFor="passwordConfirm" className="grid gap-1.5 text-sm font-medium text-text sm:text-base">
              비밀번호 확인
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                value={passwordConfirm}
                autoComplete="new-password"
                required
                onChange={(event) => setPasswordConfirm(event.target.value)}
                className="rounded-lg border border-main/25 bg-white px-3 py-2.5 text-base font-normal outline-none focus:border-main focus:ring-2 focus:ring-accent sm:px-4 sm:py-3"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-main px-4 py-3 text-sm font-semibold text-background hover:bg-main/90 disabled:opacity-60 sm:text-base"
            >
              {submitting ? '가입 중' : '비밀번호로 가입'}
            </button>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-main/20" />
              <span className="text-sm text-text/70">또는</span>
              <span className="h-px flex-1 bg-main/20" />
            </div>
            <p className="text-sm text-text/70">확인한 이메일과 같은 소셜 계정으로 가입합니다.</p>
            <a
              className="gsi-material-button block no-underline"
              style={{ width: '100%', maxWidth: 'none' }}
              href={socialSignupUrl('google', signupToken)}
            >
              <span className="gsi-material-button-content-wrapper">
                <GoogleLogo />
                <span className="gsi-material-button-contents">Google로 가입</span>
              </span>
            </a>
            <a
              className="relative flex h-10 w-full items-center justify-center rounded-md no-underline"
              style={{ backgroundColor: '#03A94D' }}
              href={socialSignupUrl('naver', signupToken)}
            >
              <span className="absolute left-1 flex">
                <NaverLogo />
              </span>
              <span className="text-sm font-medium text-white">네이버로 가입</span>
            </a>
            {result !== '' && (
              <p className="min-w-0 rounded-lg border border-main/20 bg-white p-3 text-sm">{result}</p>
            )}
          </form>
        )}
      </div>
    </main>
  )
}

export default SignupConfirmPage
