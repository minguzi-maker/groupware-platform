/**
 * @author 조휘재
 * 작성일: 2026-11-24
 */

import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { readSignupEmail, storeSignupEmail, storeSignupToken } from './signupEmailStorage'

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL

/** 응답 JSON. 본문이 없거나 형식이 아니면 null. */
async function readJson(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** location state 의 이메일이 문자열일 때만 앞뒤 공백을 뺀다. */
function emailFromState(state) {
  const value = state?.email
  return typeof value === 'string' ? value.trim() : ''
}

/** 가입 메일 안내와 확인 코드 입력. 주소가 없으면 가입 화면으로 되돌린다. */
function SignupCheckEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const fromState = emailFromState(location.state)
  const [email] = useState(() => fromState || readSignupEmail())
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState('')
  const [resending, setResending] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function resend() {
    setNotice('')
    setResending(true)
    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/root-signup/email-verification/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })
      const body = await readJson(response)
      const errorCode = typeof body?.code === 'string' ? body.code : ''
      if (response.status === 204) {
        setNotice('기다리는 가입이 있으면 확인 메일을 다시 보냈습니다.')
        return
      }
      if (errorCode === 'TOO_MANY_REQUESTS') {
        setNotice('요청이 많습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      if (errorCode === 'MAIL_DISABLED') {
        setNotice('지금은 이 이메일로 가입할 수 없습니다.')
        return
      }
      if (errorCode === 'MAIL_SEND_FAILED') {
        setNotice('확인 메일을 보내지 못했습니다. 다시 시도해 주세요.')
        return
      }
      setNotice('확인 메일을 다시 보내지 못했습니다.')
    } catch {
      setNotice('확인 메일을 다시 보내지 못했습니다.')
    } finally {
      setResending(false)
    }
  }

  async function confirm(event) {
    event.preventDefault()
    setNotice('')
    setSubmitting(true)
    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/root-signup/email-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code: code.trim() }),
      })
      const body = await readJson(response)
      const errorCode = typeof body?.code === 'string' ? body.code : ''
      const signupToken = typeof body?.signupToken === 'string' ? body.signupToken.trim() : ''
      if (response.ok && signupToken) {
        storeSignupToken(signupToken)
        navigate('/signup/confirm', { replace: true, state: { signupToken } })
        return
      }
      if (errorCode === 'TOO_MANY_ATTEMPTS') {
        setNotice('확인 횟수를 넘겼습니다. 확인 메일을 다시 보내 주세요.')
        return
      }
      if (errorCode === 'INVALID_TOKEN') {
        setNotice('코드가 맞지 않거나 만료되었습니다.')
        return
      }
      setNotice('이메일을 확인하지 못했습니다.')
    } catch {
      setNotice('이메일을 확인하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (fromState) storeSignupEmail(fromState)
  }, [fromState])

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    document.title = '이메일 확인'
  }, [])

  if (!email) return null

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-text sm:px-8">
      <div className="grid w-full max-w-md gap-6">
        <Link to="/" className="text-center font-brand text-2xl font-bold tracking-wide text-main no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-3xl">
          GROUPWARE
        </Link>
        <form onSubmit={confirm} className="grid w-full gap-4 rounded-lg border border-main/15 bg-light p-6 shadow-sm sm:gap-5 sm:p-8">
          <h2 className="text-xl font-semibold text-main sm:text-2xl">이메일을 확인해 주세요</h2>
          <p className="min-w-0 text-sm break-all text-text sm:text-base">{email}로 메일을 보냈습니다. 받은 확인 코드를 입력해 주세요.</p>
          <p className="text-sm text-text/70">메일이 보이지 않으면 스팸함도 확인해 주세요. 코드는 10분 동안만 쓸 수 있습니다. 확인하지 않으면 7일 뒤에 가입 정보가 지워지고, 그 이메일로 다시 가입할 수 있습니다.</p>
          <label htmlFor="code" className="grid gap-1.5 text-sm font-medium text-text sm:text-base">
            확인 코드
            <input
              id="code"
              name="code"
              type="text"
              value={code}
              autoComplete="one-time-code"
              spellCheck={false}
              required
              onChange={(event) => setCode(event.target.value)}
              className="rounded-lg border border-main/25 bg-white px-3 py-2.5 text-base font-normal outline-none focus:border-main focus:ring-2 focus:ring-accent sm:px-4 sm:py-3"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-main px-4 py-3 text-sm font-semibold text-background hover:bg-main/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 sm:text-base"
          >
            {submitting ? '확인 중' : '이메일 확인'}
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={resending || submitting}
            className="rounded-lg border border-main/25 bg-white px-4 py-3 text-sm font-semibold text-main hover:bg-main/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 sm:text-base"
          >
            {resending ? '보내는 중' : '확인 메일 다시 보내기'}
          </button>
          {notice ? <p className="text-sm text-text/80">{notice}</p> : null}
          <Link
            to="/login"
            className="text-center text-sm font-semibold text-main no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            로그인
          </Link>
        </form>
      </div>
    </main>
  )
}

export default SignupCheckEmailPage
