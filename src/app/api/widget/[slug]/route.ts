import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const cleanSlug = slug.replace(/\.js$/, '')

  const supabase = await createClient()
  const { data } = await supabase
    .from('companies')
    .select('name, slug, average_rating, total_reviews, invite_token')
    .eq('slug', cleanSlug)
    .single()

  if (!data) {
    return new NextResponse('// Trust Cabbage: company not found', {
      headers: { 'Content-Type': 'application/javascript' },
    })
  }

  const co = data as any
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const rating = (co.average_rating ?? 0) as number
  const totalReviews = (co.total_reviews ?? 0) as number
  const displayRating = rating > 0 ? rating.toFixed(1) : '—'
  const reviewUrl = `${siteUrl}/review/${co.slug}?ref=${co.invite_token}&src=widget&embed=1`
  const profileUrl = `${siteUrl}/company/${co.slug}`

  function starsSvg(r: number): string {
    return [1, 2, 3, 4, 5].map(i => {
      const filled = i <= Math.round(r)
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="${filled ? '#f59e0b' : '#e2e8f0'}"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/></svg>`
    }).join('')
  }

  const js = `(function(){
  var SITE='${siteUrl}';
  var REVIEW_URL='${reviewUrl}';
  var PROFILE_URL='${profileUrl}';
  var SLUG='${co.slug}';
  var RATING=${rating};
  var TOTAL=${totalReviews};
  var DISPLAY_RATING='${displayRating}';
  var STARS_HTML='${starsSvg(rating)}';

  // ── Badge ────────────────────────────────────────────────────────────────
  var badge = document.createElement('div');
  badge.id = 'tc-widget-'+SLUG;
  badge.innerHTML = '<div style="display:inline-flex;align-items:center;gap:10px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.08);cursor:pointer;" id="tc-badge-'+SLUG+'">'
    + '<div style="width:34px;height:34px;background:#1e1b4b;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    + '<span style="color:#a78bfa;font-weight:900;font-size:9px;letter-spacing:.03em;">TC</span>'
    + '</div>'
    + '<div>'
    + '<div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;line-height:1;margin-bottom:3px;">Trust Cabbage</div>'
    + '<div style="display:flex;align-items:center;gap:5px;">' + STARS_HTML
    + '<span style="font-size:13px;font-weight:900;color:#0f172a;">'+DISPLAY_RATING+'</span>'
    + '<span style="font-size:11px;color:#94a3b8;">'+(TOTAL>0?TOTAL+' reviews':'No reviews yet')+'</span>'
    + '</div>'
    + '</div>'
    + '<div style="width:1px;height:28px;background:#f1f5f9;margin:0 2px;"></div>'
    + '<button style="background:#6d28d9;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:900;cursor:pointer;font-family:inherit;white-space:nowrap;" id="tc-cta-'+SLUG+'">Write a review</button>'
    + '</div>';

  var script = document.currentScript;
  if (script && script.parentNode) script.parentNode.insertBefore(badge, script);

  // ── Modal overlay (Calendly-style) ───────────────────────────────────────
  function openModal(){
    if(document.getElementById('tc-overlay-'+SLUG)) return;

    var overlay = document.createElement('div');
    overlay.id = 'tc-overlay-'+SLUG;
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:tcFadeIn .15s ease;';

    var modal = document.createElement('div');
    modal.style.cssText = 'position:relative;width:min(520px,calc(100vw - 32px));height:min(780px,calc(100vh - 48px));background:#f8fafc;border-radius:20px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.35);display:flex;flex-direction:column;animation:tcSlideUp .2s ease;';

    var header = document.createElement('div');
    header.style.cssText = 'background:#1e1b4b;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;';
    header.innerHTML = '<span style="color:#a78bfa;font-weight:900;font-size:13px;">Trust <span style="color:#fff;">Cabbage</span></span>'
      + '<div style="display:flex;align-items:center;gap:8px;">'
      + '<a href="'+PROFILE_URL+'" target="_blank" rel="noopener" style="color:#a78bfa;font-size:11px;font-weight:700;text-decoration:none;opacity:.8;">View full page ↗</a>'
      + '<button id="tc-close-'+SLUG+'" style="background:rgba(255,255,255,.1);border:none;color:#fff;width:26px;height:26px;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;font-family:inherit;">✕</button>'
      + '</div>';

    var iframe = document.createElement('iframe');
    iframe.src = REVIEW_URL;
    iframe.style.cssText = 'flex:1;border:none;width:100%;';
    iframe.allow = 'clipboard-write';
    iframe.title = 'Write a review on Trust Cabbage';

    modal.appendChild(header);
    modal.appendChild(iframe);
    overlay.appendChild(modal);

    var style = document.createElement('style');
    style.textContent = '@keyframes tcFadeIn{from{opacity:0}to{opacity:1}}@keyframes tcSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    document.getElementById('tc-close-'+SLUG).onclick = closeModal;
    overlay.onclick = function(e){ if(e.target === overlay) closeModal(); };
    document.addEventListener('keydown', onKey);
  }

  function closeModal(){
    var overlay = document.getElementById('tc-overlay-'+SLUG);
    if(overlay){ overlay.remove(); document.body.style.overflow = ''; }
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e){ if(e.key === 'Escape') closeModal(); }

  // Listen for "review submitted" message from iframe so we can auto-close
  window.addEventListener('message', function(e){
    if(e.data && e.data.type === 'tc-review-submitted') closeModal();
  });

  document.getElementById('tc-badge-'+SLUG).onclick = openModal;
  document.getElementById('tc-cta-'+SLUG).onclick = function(e){ e.stopPropagation(); openModal(); };
})();`

  return new NextResponse(js, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
