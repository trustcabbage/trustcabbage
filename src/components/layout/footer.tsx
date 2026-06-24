import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-auto bg-[#1e1b4b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3">
              <img src="/logo-icon.png.png" alt="Trust Cabbage" className="h-8 w-auto" />
            </div>
            <p className="text-slate-400 leading-relaxed text-xs mb-3">
              Trust Cabbage — India&apos;s trust layer.
            </p>
            <p className="text-slate-500 leading-relaxed text-xs">
              India&apos;s first detailed product and services review platform. Read, write and share!
            </p>
          </div>

          {/* For Buyers */}
          <div>
            <p className="font-black text-white mb-4">For Buyers</p>
            <ul className="space-y-2.5 text-slate-400 text-xs">
              <li><Link href="/categories" className="hover:text-white transition-colors">Browse categories</Link></li>
              <li><Link href="/search" className="hover:text-white transition-colors">Search companies</Link></li>
              <li><span className="opacity-50 cursor-not-allowed">How reviews work</span></li>
              <li><Link href="/write-review" className="hover:text-white transition-colors">Write a review</Link></li>
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <p className="font-black text-white mb-4">For Businesses</p>
            <ul className="space-y-2.5 text-slate-400 text-xs">
              <li><Link href="/for-businesses/add" className="hover:text-[#a78bfa] transition-colors">List your company</Link></li>
              <li><Link href="/for-businesses/add" className="hover:text-[#a78bfa] transition-colors">Claim your page</Link></li>
              <li><Link href="/for-businesses" className="hover:text-[#a78bfa] transition-colors">For business owners</Link></li>
              <li><span className="opacity-50 cursor-not-allowed">Pricing</span></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="font-black text-white mb-4">Company</p>
            <ul className="space-y-2.5 text-slate-400 text-xs">
              <li><Link href="/about" className="hover:text-white transition-colors">About Trust Cabbage</Link></li>
              <li><Link href="/review-policy" className="hover:text-white transition-colors">Our review policy</Link></li>
              <li><Link href="/anti-fake-commitment" className="hover:text-white transition-colors">Anti-fake commitment</Link></li>
              <li><span className="opacity-50 cursor-not-allowed">Blog</span></li>
              <li><span className="opacity-50 cursor-not-allowed">Contact us</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="font-black text-white mb-4">Legal</p>
            <ul className="space-y-2.5 text-slate-400 text-xs">
              <li><span className="cursor-not-allowed opacity-50">Privacy Policy</span></li>
              <li><span className="cursor-not-allowed opacity-50">Terms of Use</span></li>
              <li><span className="cursor-not-allowed opacity-50">Cookie Policy</span></li>
            </ul>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Trust Cabbage. Made in India 🥬</p>
          <p className="text-xs text-slate-600">More pages coming soon</p>
        </div>
      </div>
    </footer>
  )
}
