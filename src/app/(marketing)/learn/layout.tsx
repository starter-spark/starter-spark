import { headers } from 'next/headers'

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = (await headers()).get('x-nonce') ?? ''

  return <div data-csp-nonce={nonce || undefined}>{children}</div>
}
