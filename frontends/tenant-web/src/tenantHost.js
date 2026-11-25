/** 테넌트 서브도메인을 뺀 앱 주소. 로컬은 `localhost` 다. */
export function appUrl(path, page) {
  const protocol = page.protocol || 'http:'
  const hostname = String(page.hostname ?? '')
  const port = page.port ? `:${page.port}` : ''
  const host = hostname === 'localhost' || hostname.endsWith('.localhost') ? 'localhost' : hostname
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${protocol}//${host}${port}${suffix}`
}

/** 로컬에서 고른 테넌트의 조직원 화면. 그 밖에서는 `/members` 다. */
export function tenantHomeUrl(slug, page) {
  const protocol = page.protocol || 'http:'
  const hostname = String(page.hostname ?? '')
  const port = page.port ? `:${page.port}` : ''
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return `${protocol}//${slug}.localhost${port}/members`
  }
  return '/members'
}

/** 로컬 테넌트 주소의 slug. `localhost` 자체는 빈 문자열이다. */
export function tenantSlug(hostname) {
  const host = String(hostname ?? '').trim().toLowerCase().replace(/\.$/, '')
  const suffix = '.localhost'
  if (!host.endsWith(suffix)) return ''
  const label = host.slice(0, -suffix.length)
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) return ''
  return label
}
