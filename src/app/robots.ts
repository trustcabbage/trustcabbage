import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  return {
    rules: [
      {
        // Hard disallow for SEO audit crawlers — middleware enforces this with 403
        userAgent: [
          'AhrefsBot', 'SemrushBot', 'serpstatbot', 'MJ12bot', 'DotBot',
          'BLEXBot', 'PetalBot', 'Baiduspider', 'YandexBot', 'Majestic',
          'RogerBot', 'Exabot', 'UptimeRobot', 'Pingdom', 'statuscake',
        ],
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/api/'],
        crawlDelay: 10,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
