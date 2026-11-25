import { useEffect } from 'react'

/** 테넌트 메뉴의 자리 표시 화면. */
function HelloPage({ title }) {
  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <section className="px-4 py-8 sm:px-8 md:px-12">
      <h1 className="text-xl font-semibold text-main sm:text-2xl">{title}</h1>
      <p className="mt-3 text-base">hello world</p>
    </section>
  )
}

export default HelloPage
