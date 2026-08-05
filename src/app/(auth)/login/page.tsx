import type { Metadata } from 'next'
import { LoginForm } from './_components/login-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Sign in' }

type Props = { searchParams: Promise<{ next?: string; embed?: string; error?: string }> }

function getLoginContext(next?: string): { title: string; subtitle: string } {
  if (!next) return { title: 'Sign in', subtitle: "We'll send a one-time code to your email." }
  const n = decodeURIComponent(next)
  if (n.startsWith('/for-businesses/add'))
    return { title: 'Verify to list your company', subtitle: 'Enter your email to continue, we\'ll send a one-time code.' }
  if (n.includes('/write-review'))
    return { title: 'Verify to write your review', subtitle: 'Enter your email to continue, we\'ll send a one-time code.' }
  if (n.includes('/claim'))
    return { title: 'Verify to claim your page', subtitle: 'Enter your email to continue claiming your company page.' }
  if (n.startsWith('/dashboard'))
    return { title: 'Sign in to your dashboard', subtitle: 'Enter your email to access your business dashboard.' }
  if (n.startsWith('/team-invite'))
    return { title: 'Sign in to accept your invite', subtitle: 'Use the same email address the invite was sent to.' }
  return { title: 'Sign in', subtitle: "We'll send a one-time code to your email." }
}

export default async function LoginPage({ searchParams }: Props) {
  const { next, embed, error } = await searchParams
  const isEmbed = embed === '1'
  const { title, subtitle } = getLoginContext(next)
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <p className="text-lg font-black text-white mb-1">
          Trust<span className="text-[#a78bfa]">Cabbage</span>
        </p>
        <h1 className="text-2xl font-black text-white mt-4">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      </div>
      <LoginForm next={next ?? '/'} isEmbed={isEmbed} oauthError={error} />
    </div>
  )
}
