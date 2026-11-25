/**
 * @author 조휘재
 * 작성일: 2026-11-24
 */

import { useEffect } from 'react'

const ko = {
  title: '개인정보처리방침',
  lead: 'GROUPWARE는 회원가입, 로그인, 비밀번호 재설정, 테넌트를 연결할 때 필요한 정보만 다룹니다. 이 안내는 아직 완성 전이라 앞으로 고쳐질 수 있습니다.',
  sections: [
    {
      heading: '1. 회원가입과 로그인에 쓰는 정보',
      body: '이메일로 회원가입하면 이메일과 비밀번호를 저장합니다. 비밀번호는 입력한 글자 그대로 두지 않고, 알아볼 수 없게 바꾸어 저장합니다. 이름은 없을 수도 있습니다. 이름이 있으면 로그인한 뒤 화면 위에 표시합니다.',
      table: {
        head: ['구분', '어떤 정보', '어디에 쓰나', '얼마나 두나'],
        rows: [
          ['이메일 가입', '이메일, 비밀번호', '회원가입, 로그인', '탈퇴하면 지웁니다. 비밀번호는 알아볼 수 없게 바꾸어 둡니다.'],
          ['화면에 보이는 이름', '이름. 없을 수 있습니다.', '로그인한 뒤 화면 위에 표시', '탈퇴하면 지웁니다.'],
          ['테넌트', '이름, 주소 이름, 소속한 회원', '테넌트를 구분하고 회원을 연결', '탈퇴해도 테넌트 기록은 남습니다.'],
        ],
      },
    },
    {
      heading: '2. 이메일 확인',
      items: [
        '회원가입 화면에서는 이메일만 받습니다. 확인 메일의 확인 코드를 입력하기 전에는 그 이메일을 최대 7일 보관합니다. 확인 메일을 다시 보내도 이 7일은 늘어나지 않습니다.',
        '확인 코드는 메일로만 보내며, 코드 그대로는 저장하지 않습니다. 코드는 10분 동안만 쓸 수 있습니다. 다섯 번 틀리면 확인 메일을 다시 보낼 때까지 확인할 수 없습니다.',
        '확인 코드가 맞으면 30분 안에 비밀번호 설정을 마치거나, Google로 가입 또는 네이버로 가입을 마쳐야 합니다. 그 전에는 로그인할 수 없습니다.',
        '비밀번호로 가입하거나, 확인한 이메일과 같은 소셜 계정으로 가입을 마치면 회원을 만들고 그 30분 정보는 지웁니다.',
        '가입을 이어 가는 동안 지금 쓰는 브라우저에 이메일과 가입 진행 내용을 잠시 기억해 둡니다. 비밀번호로 가입을 마치면 가입 진행 내용은 지웁니다. 브라우저 창을 닫으면 그 기억도 사라집니다.',
      ],
    },
    {
      heading: '3. Google 로그인과 네이버 로그인',
      body: '로그인과 가입에서 Google로 로그인, 네이버 로그인, Google로 가입, 네이버로 가입을 고를 수 있습니다. 저장하는 것은 어느 서비스인지와, 그 서비스가 계정을 구분하려고 알려 준 값입니다. 이미 연결한 계정으로 다시 로그인하면 이름이나 이메일을 새로 받아 덮어쓰지 않습니다.',
      items: [
        'Google에는 계정을 구분하는 값, 프로필에 있는 이름, 이메일을 요청합니다.',
        '네이버에는 이름과 이메일을 요청합니다.',
        '로그인 화면에서 처음 연결하면, 이름이 있을 때 그 이름을 화면에 보이는 이름으로 저장합니다. 이메일은 저장하지 않습니다.',
        '이메일 확인을 마친 뒤 Google로 가입 또는 네이버로 가입을 할 때는, 그 계정의 이메일이 확인한 이메일과 같을 때만 이메일과 이름을 저장합니다.',
      ],
    },
    {
      heading: '4. 비밀번호 재설정',
      items: [
        '가입한 이메일로 재설정 메일을 보냅니다. 메일의 링크는 30분 동안만 사용할 수 있고, 한 번 쓰면 다시 쓸 수 없습니다. 링크 주소 그대로는 저장하지 않습니다.',
        '새 비밀번호로 바꾸면, 그 회원으로 로그인되어 있던 모든 기기에서 로그아웃됩니다.',
        '없는 이메일을 적어도, 그 이메일이 가입되어 있는지는 알려 주지 않습니다.',
      ],
    },
    {
      heading: '5. 로그인 유지',
      items: [
        '로그인하면 브라우저가 로그인 상태를 7일 동안 기억합니다. 이 기억에는 이메일, 이름, 비밀번호가 들어 있지 않습니다.',
        '서비스 쪽에는 누가 로그인했는지, 어느 테넌트로 들어왔는지가 7일 동안 남을 수 있습니다.',
        '로그아웃하면 지금 쓰는 브라우저만 로그아웃됩니다. 다른 기기의 로그인은 그대로 남습니다.',
        'Google이나 네이버로 로그인하는 동안에는 진행 상태만 10분 기억합니다. 여기에도 이메일이나 이름은 넣지 않습니다.',
        '브라우저가 사이트 정보를 기억하지 못하게 하면 로그인을 유지할 수 없습니다.',
      ],
    },
    {
      heading: '6. 메일이 너무 자주 나가지 않게 하는 기록',
      body: '확인 메일과 재설정 메일이 너무 자주 나가지 않도록, 접속한 인터넷 주소만 잠시 사용합니다. 주소 그대로는 저장하지 않습니다. 같은 이메일로 보낸 기록은 30분 뒤에, 같은 접속 주소로 보낸 기록은 1시간 뒤에 지웁니다. 회원 정보에는 이 주소를 넣지 않습니다.',
    },
    {
      heading: '7. 메일을 보내는 곳',
      body: '확인 코드와 재설정 메일은 Gmail로 보냅니다. 이때 받는 이메일과 메일 내용이 Google에 전달됩니다. 메일이 나가지 않으면 문제 기록에 받는 이메일이 남을 수 있습니다. 이 기록을 언제 지우는지는 정해져 있지 않습니다.',
    },
    {
      heading: '8. 탈퇴',
      body: '탈퇴가 처리되면 이메일, 비밀번호, 화면에 보이던 이름, Google 또는 네이버 연결을 지우고 로그아웃시킵니다. 그 계정으로는 다시 로그인할 수 없습니다. 누구였는지 알 수 없게 비운 회원 기록과, 어느 테넌트에 속해 있었는지는 남습니다.',
    },
  ],
}

/** 방침 표. 가로로 넘치면 스크롤한다. */
function Table({ table }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-main/15">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead className="bg-main/5 text-main">
          <tr>
            {table.head.map((cell) => (
              <th key={cell} className="px-3 py-2 font-semibold">{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.join('|')} className="border-t border-main/10 align-top">
              {row.map((cell) => (
                <td key={cell} className="px-3 py-2 leading-6 text-text/80">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 현재 서비스에서 확인되는 개인정보 처리만 보여 준다. */
function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = ko.title
  }, [])

  return (
    <article className="px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-main sm:text-3xl">{ko.title}</h1>
        <p className="mt-4 text-sm leading-6 text-text/80">{ko.lead}</p>
        {ko.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mt-8 text-lg font-semibold text-main">{section.heading}</h2>
            {section.body && <p className="mt-3 text-sm leading-6 text-text/80">{section.body}</p>}
            {section.items && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-text/80">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.table && <Table table={section.table} />}
          </section>
        ))}
      </div>
    </article>
  )
}

export default PrivacyPolicyPage
