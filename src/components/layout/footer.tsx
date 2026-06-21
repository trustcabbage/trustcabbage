import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-auto bg-[#1e1b4b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="font-black text-white text-lg mb-2">
              Trust<span className="text-[#a78bfa]">Cabbage</span>
            </p>
            <p className="text-slate-400 leading-relaxed text-xs mb-3">
              Trust Cabbage — India&apos;s B2B trust layer.
            </p>
            <p className="text-slate-500 leading-relaxed text-xs">
              India&apos;s first detailed B2B review platform. Real reviews from real businesses.
            </p>
          </div>

          {/* Buyers */}
          <div>
            <p className="font-black text-white mb-4">For Buyers</p>
            <ul className="space-y-2.5 text-slate-400 text-xs">
              <li><Link href="/categories" className="hover:text-[#6d28d9] transition-colors">Browse categories</Link></li>
              <li><Link href="/search" className="hover:text-[#6d28d9] transition-colors">Search companies</Link></li>
              <li><Link href="/write-review" className="hover:text-[#6d28d9] transition-colors">Write a review</Link></li>
            </ul>
          </div>

          {/* Businesses */}
          <div>
            <p className="font-black text-white mb-4">For Businesses</p>
            <ul className="space-y-2.5 text-slate-400 text-xs">
              <li><Link href="/for-businesses/add" className="hover:text-[#a78bfa] transition-colors">List your company</Link></li>
              <li><Link href="/for-businesses" className="hover:text-[#a78bfa] transition-colors">Claim your page</Link></li>
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
