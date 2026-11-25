/**
 * @author 조휘재
 * 작성일: 2026-11-24
 */

import { Outlet } from 'react-router'
import Footer from './Footer'
import Header from './Header'

/** 헤더, 본문, 푸터를 한 화면에 둔다. */
function UserLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-text">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default UserLayout
