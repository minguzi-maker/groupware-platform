import { Routes, Route } from 'react-router'

import UserLayout from './components/UserLayout'
import SubdomainHeader from './components/SubdomainHeader'

import HomePage from './pages/user/HomePage'
import SubdomainPage from './pages/SubdomainPage'
import HelloPage from './pages/HelloPage'
import { tenantSlug } from './tenantHost'
import LoginPage from './pages/user/LoginPage'
import SignupPage from './pages/user/SignupPage'
import SignupCheckEmailPage from './pages/user/SignupCheckEmailPage'
import SignupConfirmPage from './pages/user/SignupConfirmPage'
import PasswordResetPage from './pages/user/PasswordResetPage'
import TenantSelectPage from './pages/user/TenantSelectPage'
import TenantCreatePage from './pages/user/TenantCreatePage'
import LogoutPage from './pages/user/LogoutPage'

import PrivacyPolicyPage from './pages/user/PrivacyPolicyPage'

/** `acme.localhost` 처럼 테넌트 호스트로 들어온 화면. 헤더와 본문만 둔다. */
function SubdomainApp() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-text">
      <SubdomainHeader />
      <main className="flex-1">
        <Routes>
          <Route path="/members" element={<HelloPage title="조직원 관리" />} />
          <Route path="/payroll" element={<HelloPage title="급여 관리" />} />
          <Route path="/attendance" element={<HelloPage title="근태 관리" />} />
          <Route path="/payment" element={<HelloPage title="전자결제" />} />
          <Route path="/iam" element={<HelloPage title="IAM 설정" />} />
          <Route path="*" element={<SubdomainPage />} />
        </Routes>
      </main>
    </div>
  )
}

/** 회원 웹 라우트. 로그인·가입·메일 확인·비밀번호 재설정은 헤더와 푸터 밖에 둔다. */
function App() {
  if (tenantSlug(window.location.hostname)) {
    return <SubdomainApp />
  }

  return (
    // BrowserRouter 는 main.jsx 에 존재합니다.
    // 로그인(/login), 회원가입(/signup), 이메일 확인(/signup/check-email),
    // 비밀번호 또는 소셜 가입(/signup/confirm), 비밀번호 재설정(/password-reset),
    // 테넌트 선택(/tenants), 테넌트 생성(/tenants/new), 로그아웃(/logout)은
    // 이 레이아웃 밖에 두어 헤더와 풋터를 노출하지 않습니다.
    <Routes>
      {/**
       * @author 조휘재
       * 작성일: 2026-11-24
       */}
      <Route path="/login" element={<LoginPage />} />
      {/**
       * @author 조휘재
       * 작성일: 2026-11-24
       */}
      <Route path="/signup" element={<SignupPage />} />
      {/**
       * @author 조휘재
       * 작성일: 2026-11-24
       */}
      <Route path="/signup/check-email" element={<SignupCheckEmailPage />} />
      {/**
       * @author 조휘재
       * 작성일: 2026-11-24
       */}
      <Route path="/signup/confirm" element={<SignupConfirmPage />} />
      {/**
       * @author 조휘재
       * 작성일: 2026-11-24
       */}
      <Route path="/password-reset" element={<PasswordResetPage />} />
      {/**
       * @author 조휘재
       * 작성일: 2026-11-24
       */}
      <Route path="/tenants" element={<TenantSelectPage />} />
      {/**
       * @author 조휘재
       * 작성일: 2026-11-24
       */}
      <Route path="/tenants/new" element={<TenantCreatePage />} />
      {/**
       * @author 조휘재
       * 작성일: 2026-11-24
       */}
      <Route path="/logout" element={<LogoutPage />} />

      {/**
       * @author 조휘재
       * 작성일: 2026-11-24
       */}
      <Route element={<UserLayout />}>

        {/**
         * @author 조휘재
         * 작성일: 2026-11-24
         */}
        <Route path="/" element={<HomePage />} />
        {/**
         * @author 조휘재
         * 작성일: 2026-11-24
         */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />

      </Route>
    </Routes>
  )
}

export default App
