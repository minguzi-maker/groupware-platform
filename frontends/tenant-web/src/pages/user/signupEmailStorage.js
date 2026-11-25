/**
 * @author 조휘재
 * 작성일: 2026-11-24
 */

export const SIGNUP_EMAIL_STORAGE_KEY = 'groupware.signupEmail'
const SIGNUP_TOKEN_STORAGE_KEY = 'groupware.signupToken'

/** 가입 안내 화면에 다시 보여 줄 이메일을 세션에 넣는다. 저장이 막혀도 던지지 않는다. */
export function storeSignupEmail(email) {
  try {
    sessionStorage.setItem(SIGNUP_EMAIL_STORAGE_KEY, email)
  } catch {
    // 저장이 막혀도 이번 이동의 location state 로 주소를 보여 줍니다.
  }
}

/** 세션에 남은 가입 이메일을 읽는다. 없거나 저장소가 막히면 빈 문자열. */
export function readSignupEmail() {
  try {
    return sessionStorage.getItem(SIGNUP_EMAIL_STORAGE_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

/** 이메일 확인 뒤 받은 가입 토큰을 세션에 넣는다. 저장이 막혀도 던지지 않는다. */
export function storeSignupToken(token) {
  try {
    sessionStorage.setItem(SIGNUP_TOKEN_STORAGE_KEY, token)
  } catch {
    // 저장이 막혀도 이번 이동의 location state 로 토큰을 넘깁니다.
  }
}

/** 세션에 남은 가입 토큰을 읽는다. 없거나 저장소가 막히면 빈 문자열. */
export function readSignupToken() {
  try {
    return sessionStorage.getItem(SIGNUP_TOKEN_STORAGE_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

/** 비밀번호 가입이 끝나면 가입 토큰을 지운다. */
export function clearSignupToken() {
  try {
    sessionStorage.removeItem(SIGNUP_TOKEN_STORAGE_KEY)
  } catch {
    // 지울 수 없어도 서버 토큰은 한 번 쓰면 끝입니다.
  }
}
