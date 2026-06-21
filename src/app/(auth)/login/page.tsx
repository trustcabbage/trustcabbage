import type { Metadata } from 'next'
import { LoginForm } from './_components/login-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Sign in' }

type Props = { searchParams: Promise<{ next?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <p className="text-lg font-black text-white mb-1">
          Trust<span className="text-[#a78bfa]">Cabbage</span>
        </p>
        <h1 className="text-2xl font-black text-white mt-4">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">We&apos;ll send a one-time code to your email</p>
      </div>
      <LoginForm next={next ?? '/'} />
    </div>
  )
}
