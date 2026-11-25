/**
 * @author 조휘재
 * 작성일: 2026-11-24
 */

import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL

/** 비밀번호 재설정 폼의 필수 입력 칸. */
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

/** 재설정 화면의 가운데 정렬 틀. */
function AuthShell({ title, children }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-text sm:px-8">
      <div className="grid w-full max-w-md gap-6">
        <Link to="/" className="text-center font-brand text-2xl font-bold tracking-wide text-main no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-3xl">
          GROUPWARE
        </Link>
        <div className="grid w-full gap-4 rounded-lg border border-main/15 bg-light p-6 shadow-sm sm:gap-5 sm:p-8">
          <h2 className="text-xl font-semibold text-main sm:text-2xl">{title}</h2>
          {children}
        </div>
      </div>
    </main>
  )
}

/** 응답 본문의 code. 본문이 없거나 JSON 이 아니면 빈 문자열. */
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

/** 메일 비활성·발송 실패·형식 오류 코드를 안내 문구로 바꾼다. */
function requestError(code) {
  if (code === 'MAIL_DISABLED') return '지금은 재설정 메일을 보낼 수 없습니다.'
  if (code === 'MAIL_SEND_FAILED') return '메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.'
  if (code === 'INVALID_REQUEST') return '이메일 주소를 확인해 주세요.'
  return '비밀번호 재설정에 실패했습니다.'
}

/** 재설정 메일을 요청하고, token 이 있으면 새 비밀번호를 보낸다. */
function PasswordResetPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [done, setDone] = useState(() => location.state?.done === true)
  const [result, setResult] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = '비밀번호 재설정'
  }, [])

  async function requestReset(event) {
    event.preventDefault()
    setResult('')
    setSubmitting(true)
    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      })
      if (response.status === 204) {
        setSentTo(email.trim())
        return
      }
      setResult(requestError(await readCode(response)))
    } catch {
      setResult('비밀번호 재설정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmReset(event) {
    event.preventDefault()
    setResult('')
    if (password !== passwordConfirm) {
      setResult('비밀번호가 일치하지 않습니다.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/user-service/user/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      })
      if (response.status === 204) {
        setDone(true)
        navigate('/password-reset', { replace: true, state: { done: true } })
        return
      }
      const code = await readCode(response)
      setResult(code === 'INVALID_TOKEN' ? '재설정 링크가 만료되었거나 이미 사용했습니다.' : '비밀번호 재설정에 실패했습니다.')
    } catch {
      setResult('비밀번호 재설정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <AuthShell title="비밀번호를 바꿨습니다">
        <p className="text-sm text-text sm:text-base">새 비밀번호로 로그인해 주세요.</p>
        <Link
          to="/login"
          className="rounded-lg bg-main px-4 py-3 text-center text-sm font-semibold text-background no-underline hover:bg-main/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
        >
          로그인
        </Link>
      </AuthShell>
    )
  }

  if (sentTo) {
    return (
      <AuthShell title="이메일을 확인해 주세요">
        <p className="min-w-0 text-sm break-all text-text sm:text-base">계정이 있으면 {sentTo}로 재설정 메일을 보냈습니다.</p>
        <p className="text-sm text-text/70">메일이 보이지 않으면 스팸함도 확인해 주세요. 링크는 30분 동안만 사용할 수 있습니다.</p>
        <Link
          to="/login"
          className="rounded-lg bg-main px-4 py-3 text-center text-sm font-semibold text-background no-underline hover:bg-main/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-base"
        >
          로그인으로 돌아가기
        </Link>
      </AuthShell>
    )
  }

  if (token) {
    return (
      <AuthShell title="새 비밀번호">
        <form onSubmit={confirmReset} className="grid gap-4 sm:gap-5">
          <TextField
            id="password"
            label="새 비밀번호"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <TextField
            id="passwordConfirm"
            label="새 비밀번호 확인"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-main px-4 py-3 text-sm font-semibold text-background hover:bg-main/90 disabled:opacity-60 sm:text-base"
          >
            {submitting ? '변경 중' : '비밀번호 변경'}
          </button>
          <p className="text-center text-sm text-text/70">
            <Link
              to="/login"
              className="font-semibold text-main focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              로그인으로 돌아가기
            </Link>
          </p>
          {result !== '' && (
            <p className="min-w-0 rounded-lg border border-main/20 bg-white p-3 text-sm">{result}</p>
          )}
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="비밀번호 재설정">
      <form onSubmit={requestReset} className="grid gap-4 sm:gap-5">
        <TextField
          id="email"
          label="이메일"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-main px-4 py-3 text-sm font-semibold text-background hover:bg-main/90 disabled:opacity-60 sm:text-base"
        >
          {submitting ? '보내는 중' : '재설정 메일 보내기'}
        </button>
        <p className="text-center text-sm text-text/70">
          <Link
            to="/login"
            className="font-semibold text-main focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            로그인으로 돌아가기
          </Link>
        </p>
        {result !== '' && (
          <p className="min-w-0 rounded-lg border border-main/20 bg-white p-3 text-sm">{result}</p>
        )}
      </form>
    </AuthShell>
  )
}

export default PasswordResetPage
