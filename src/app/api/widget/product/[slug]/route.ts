import { NextRequest, NextResponse } from 'next/server'

// Product widget script. Cacheable and identical for every product of a
// company, one script tag per company (like the existing company widget) —
// which specific product and which mode (collect/display) is read at
// runtime from the script tag's own data-* attributes, so no product-
// specific or secret data is baked into the cached response.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const companySlug = slug.replace(/\.js$/, '')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'

  const js = `(function(){
  var SITE='${siteUrl}';
  var SLUG='${companySlug}';
  var script = document.currentScript;
  if (!script) return;

  var productId = script.getAttribute('data-product-id');
  var mode = (script.getAttribute('data-mode') || 'display').toLowerCase();
  if (!productId) { console.error('Trust Cabbage widget: data-product-id is required'); return; }

  var container = document.createElement('div');
  container.id = 'tc-product-widget-' + productId;
  if (script.parentNode) script.parentNode.insertBefore(container, script);

  // ── Collect mode: inline review form via iframe ──────────────────────────
  if (mode === 'collect') {
    var iframe = document.createElement('iframe');
    iframe.src = SITE + '/company/' + SLUG + '/write-review?product=' + encodeURIComponent(productId) + '&embed=1&src=widget';
    iframe.style.cssText = 'width:100%;min-height:640px;border:none;border-radius:12px;';
    iframe.title = 'Write a review on Trust Cabbage';
    container.appendChild(iframe);
    return;
  }

  // ── Display mode: fetch + render rating, excerpts, Q&A ───────────────────
  container.innerHTML = '<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#94a3b8;font-size:12px;padding:12px 0;">Loading reviews…</div>';

  fetch(SITE + '/api/widget/product-data?slug=' + encodeURIComponent(SLUG) + '&product=' + encodeURIComponent(productId))
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (data.error) { container.innerHTML = ''; return; }

      function starsSvg(r){
        var out = '';
        for (var i = 1; i <= 5; i++) {
          var filled = i <= Math.round(r);
          out += '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 20 20" fill="' + (filled ? '#f59e0b' : '#e2e8f0') + '"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z"/></svg>';
        }
        return out;
      }

      var html = '<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;border:1px solid #e2e8f0;border-radius:12px;padding:16px;max-width:480px;">';

      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">'
        + '<span style="display:flex;gap:2px;">' + starsSvg(data.rating_avg) + '</span>'
        + '<span style="font-size:14px;font-weight:900;color:#0f172a;">' + (data.rating_avg > 0 ? data.rating_avg.toFixed(1) : '—') + '</span>'
        + '<span style="font-size:12px;color:#94a3b8;">(' + data.review_count + ' review' + (data.review_count !== 1 ? 's' : '') + ')</span>'
        + '</div>';

      (data.excerpts || []).forEach(function(ex){
        html += '<div style="font-size:13px;color:#475569;line-height:1.5;padding:8px 0;border-top:1px solid #f1f5f9;">'
          + '"' + ex.text + '"<div style="font-size:11px;color:#94a3b8;margin-top:2px;">' + ex.author + '</div>'
          + '</div>';
      });

      if ((data.questions || []).length > 0) {
        html += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;">'
          + '<div style="font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Questions</div>';
        data.questions.forEach(function(q){
          html += '<div style="font-size:12px;color:#334155;margin-bottom:4px;"><strong>Q:</strong> ' + q.question + '</div>';
          if (q.answer) html += '<div style="font-size:12px;color:#64748b;margin-bottom:8px;padding-left:14px;"><strong>A:</strong> ' + q.answer + '</div>';
        });
        html += '</div>';
      }

      html += '<div style="display:flex;gap:8px;margin-top:12px;">'
        + '<a href="' + data.write_review_url + '" target="_blank" rel="noopener" style="flex:1;text-align:center;background:#6d28d9;color:#fff;font-size:12px;font-weight:900;padding:8px 12px;border-radius:8px;text-decoration:none;">Write a review</a>'
        + '<a href="' + data.product_url + '" target="_blank" rel="noopener" style="flex:1;text-align:center;background:#f8fafc;color:#6d28d9;font-size:12px;font-weight:900;padding:8px 12px;border-radius:8px;text-decoration:none;border:1px solid #e2e8f0;">See all reviews</a>'
        + '</div>';

      html += '<div style="text-align:center;margin-top:10px;font-size:10px;color:#cbd5e1;">Powered by Trust Cabbage</div>';
      html += '</div>';

      container.innerHTML = html;
    })
    .catch(function(){ container.innerHTML = ''; });
})();`

  return new NextResponse(js, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
