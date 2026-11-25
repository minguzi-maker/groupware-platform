/**
 * @author 조휘재
 * 작성일: 2026-11-24
 */

import { Link } from 'react-router'

const year = new Date().getFullYear()

/** 서비스 이름, 개인정보 처리 방침, 올해 저작권 표시. */
function Footer() {

  return (
    <footer className="border-t border-main/15 bg-light px-4 py-4 sm:px-8 md:px-12">
      <Link to="/" className="inline-block font-brand text-lg font-bold tracking-wide text-main focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        GROUPWARE
      </Link>
      <p className="mt-3">
        <Link
          to="/privacy"
          className="text-xs text-text/70 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          개인정보처리방침
        </Link>
      </p>
      <p className="mt-3 text-xs text-text/60">© {year} GROUPWARE</p>
    </footer>
  )
}

export default Footer
