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
  const [resendCooldown, setResendCooldown] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  async function sendOtp() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Check your email for the 6-digit code')
    setStep('otp')
    startResendCooldown()
  }

  function startResendCooldown() {
    setResendCooldown(30)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  async function resendOtp() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('New code sent — check your inbox')
    setOtp('')
    startResendCooldown()
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
            <Label htmlFor="otp" className="text-slate-300 text-sm font-bold">Sign-in code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="········"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={8}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-violet-500 tracking-widest text-center text-lg"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Code expires in 10 minutes.</p>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={resendOtp}
                className="text-xs font-black text-violet-400 hover:text-violet-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
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
