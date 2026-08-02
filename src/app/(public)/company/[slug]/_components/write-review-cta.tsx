'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

interface WriteReviewCtaProps {
  href: string
  isLoggedIn: boolean
  className?: string
  children: React.ReactNode
}

// Wherever this is dropped, logged-in visitors get a plain link (unchanged
// behaviour). Logged-out visitors get a dismissible popup with the sign-in
// form in an iframe, instead of being yanked to a full-page redirect. Not
// compulsory: closing it is one click, nothing forces the sign-in through.
export function WriteReviewCta({ href, isLoggedIn, className, children }: WriteReviewCtaProps) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!open) return
    setVisible(false)
    const raf = requestAnimationFrame(() => setVisible(true))

    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'tc-login-success') {
        window.location.href = e.data.next || href
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('message', onMessage)
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('message', onMessage)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, href])

  function close() {
    setVisible(false)
    setTimeout(() => setOpen(false), 200)
  }

  if (isLoggedIn) {
    return <Link href={href} className={className}>{children}</Link>
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div
            className={`relative w-full max-w-md bg-[#1e1b4b] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
              visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'
            }`}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              src={`/login?next=${encodeURIComponent(href)}&embed=1`}
              title="Sign in to write a review"
              className="w-full h-[560px] border-none"
            />
          </div>
        </div>
      )}
    </>
  )
}
