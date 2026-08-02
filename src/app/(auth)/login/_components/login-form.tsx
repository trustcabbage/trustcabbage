'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Supabase can surface a raw/empty error body (e.g. an SMTP relay failure) as
// a non-descriptive or JSON-like message. Fall back to something readable.
function authErrorMessage(message: string | undefined): string {
  const fallback = 'Could not send the code. Please try again in a moment.'
  if (!message) return fallback
  const trimmed = message.trim()
  if (!trimmed || trimmed.startsWith('{') || trimmed.startsWith('[')) return fallback
  return trimmed
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

export function LoginForm({ next = '/', isEmbed = false, oauthError }: { next?: string; isEmbed?: boolean; oauthError?: string }) {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (oauthError) toast.error(authErrorMessage(oauthError))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signInWithGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    // On success the browser is already navigating to Google, nothing to do.
    // Only reachable on failure (e.g. provider misconfigured).
    if (error) { setLoading(false); toast.error(authErrorMessage(error.message)) }
  }

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
    if (error) { toast.error(authErrorMessage(error.message)); return }
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
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    setLoading(false)
    if (error) { toast.error(authErrorMessage(error.message)); return }
    toast.success('New code sent, check your inbox')
    setOtp('')
    startResendCooldown()
  }

  async function verifyOtp() {
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    setLoading(false)
    if (error) { toast.error('Invalid or expired code. Try again.'); return }

    // Embedded in an iframe (e.g. the "write a review" auth popup): tell the
    // parent window we're signed in instead of navigating inside the frame,
    // the parent does a full navigation to `next` for the now-authenticated user.
    if (isEmbed && window.parent !== window) {
      window.parent.postMessage({ type: 'tc-login-success', next }, '*')
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-6 backdrop-blur">
      {/* Google can't render its consent screen inside an iframe (it blocks
          this deliberately), so this is only offered on the full-page login,
          never inside the write-review popup. */}
      {step === 'email' && !isEmbed && (
        <>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-800 font-bold py-3 text-sm transition-colors"
          >
            <GoogleIcon /> Continue with Google
          </button>
          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500 font-bold">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}
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
