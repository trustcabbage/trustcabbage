'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function LoginForm({ next = '/' }: { next?: string }) {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function sendOtp() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Check your email for the 6-digit code')
    setStep('otp')
  }

  async function verifyOtp() {
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    setLoading(false)
    if (error) { toast.error('Invalid or expired code. Try again.'); return }
    router.push(next)
    router.refresh()
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-6 backdrop-blur">
      <form onSubmit={(e) => { e.preventDefault(); step === 'email' ? sendOtp() : verifyOtp() }} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300 text-sm font-bold">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={step === 'otp'}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-violet-500"
          />
        </div>

        {step === 'otp' && (
          <div className="space-y-1.5">
            <Label htmlFor="otp" className="text-slate-300 text-sm font-bold">6-digit code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-violet-500 tracking-widest text-center text-lg"
            />
            <p className="text-xs text-slate-500">Or click the link in the email to sign in automatically.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black py-3 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none mt-2"
        >
          {loading ? 'Please wait…' : step === 'email' ? 'Send code' : 'Verify & sign in'}
        </button>

        {step === 'otp' && (
          <button
            type="button"
            className="w-full text-sm text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => setStep('email')}
          >
            Use a different email
          </button>
        )}
      </form>
    </div>
  )
}
