'use client'

import { useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'

// Hides the navbar/footer when ?embed=1 is present, e.g. when a page is
// rendered inside a widget iframe (write-review collect mode, review invite
// links opened in a modal). Must be a client component: searchParams is not
// available to a shared layout.tsx otherwise.
export function EmbedAwareChrome({ navbar, footer, children }: { navbar: ReactNode; footer: ReactNode; children: ReactNode }) {
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === '1'

  return (
    <>
      {!isEmbed && navbar}
      <main className="flex-1">{children}</main>
      {!isEmbed && footer}
    </>
  )
}
