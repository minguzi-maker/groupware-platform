/**
 * @author 조휘재
 * 작성일: 2026-11-24
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { storeSignupEmail } from './signupEmailStorage'

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

/** 가입 폼의 필수 입력 칸. */
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

/** 이메일만 받아 확인 메일을 보낸다. 비밀번호는 코드를 확인한 뒤에 받는다. */
function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [result, setResult] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = '회원가입'
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setResult('')
    setSubmitting(true)
    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/root-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })
      const code = await readCode(response)
      if (response.status === 201) {
        const sentTo = email.trim()
        storeSignupEmail(sentTo)
        navigate('/signup/check-email', { replace: true, state: { email: sentTo } })
        return
      }
      if (code === 'INVALID_REQUEST') {
        setResult('이메일 형식을 확인해 주세요.')
        return
      }
      if (code === 'MAIL_DISABLED') {
        setResult('지금은 이 이메일로 가입할 수 없습니다.')
        return
      }
      if (code === 'MAIL_SEND_FAILED') {
        setResult('확인 메일을 보내지 못했습니다. 다시 시도해 주세요.')
        return
      }
      if (code === 'TOO_MANY_REQUESTS') {
        setResult('요청이 많습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      setResult(response.status === 409 ? '이미 가입된 이메일입니다.' : '회원가입에 실패했습니다.')
    } catch {
      setResult('회원가입에 실패했습니다.')
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
          <h2 className="text-xl font-semibold text-main sm:text-2xl">회원가입</h2>
          <p className="text-sm text-text/70 sm:text-base">이메일로 확인 코드를 보냅니다. 코드를 확인한 뒤에 비밀번호를 정하거나 소셜 계정으로 가입합니다.</p>
          <TextField
            id="email"
            label="이메일"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <div className="mt-1 grid gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-main px-4 py-3 text-sm font-semibold text-background hover:bg-main/90 disabled:opacity-60 sm:text-base"
            >
              {submitting ? '보내는 중' : '확인 메일 보내기'}
            </button>
            <p className="flex flex-wrap items-baseline justify-center gap-x-1.5 text-sm text-text/70">
              <span>이미 계정이 있으신가요?</span>
              <Link
                to="/login"
                className="font-semibold text-main focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                로그인
              </Link>
            </p>
          </div>
          {result !== '' && (
            <p className="min-w-0 rounded-lg border border-main/20 bg-white p-3 text-sm">{result}</p>
          )}
        </form>
      </div>
    </main>
  )
}

export default SignupPage
