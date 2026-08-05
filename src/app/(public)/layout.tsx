import { Suspense } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { EmbedAwareChrome } from '@/components/layout/embed-aware-chrome'
import { NavbarUserSlot } from '@/components/layout/navbar-user-slot'

// Deliberately NOT async, and nothing here is awaited. The moment this
// layout used to await auth.getUser() (plus two more sequential queries)
// before returning JSX, it blocked every navigation on the site until all
// three resolved, up to ~2s, before even a page's own loading.tsx skeleton
// could appear. NavbarUserSlot carries that same lookup but inside its own
// Suspense boundary, so the shell and the page content stream instantly and
// only the user's name/avatar pops in a beat later.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <EmbedAwareChrome
      navbar={
        <Suspense fallback={<Navbar user={null} />}>
          <NavbarUserSlot />
        </Suspense>
      }
      footer={<Footer />}
    >
      {children}
    </EmbedAwareChrome>
  )
}
