import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  // Auth: only company admin for this company can download
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()

  const { data: co } = await supabase
    .from('companies').select('id, slug, invite_token').eq('slug', slug).single()

  if (!co || !profile) return new NextResponse('Not found', { status: 404 })

  const isAdmin = (profile as any).role === 'admin'
  const isOwner = (profile as any).role === 'company_admin' && (profile as any).company_id === (co as any).id
  if (!isAdmin && !isOwner) return new NextResponse('Forbidden', { status: 403 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const inviteUrl = `${siteUrl}/review/${(co as any).slug}?ref=${(co as any).invite_token}&src=qr`

  const buffer = await QRCode.toBuffer(inviteUrl, {
    type: 'png',
    width: 600,
    margin: 2,
    color: {
      dark: '#1e1b4b',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="trustcabbage-qr-${slug}.png"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
