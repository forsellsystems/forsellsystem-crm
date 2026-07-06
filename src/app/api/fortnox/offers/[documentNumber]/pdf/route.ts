import { NextResponse, type NextRequest } from 'next/server'
import { getOfferPdf } from '@/lib/fortnox/offers'
import { FortnoxNotConnectedError } from '@/lib/fortnox/client'

// Streams a Fortnox offer PDF through the server so the access token never
// reaches the browser. Opened via a link on the deal page.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentNumber: string }> }
) {
  const { documentNumber } = await params

  try {
    const pdf = await getOfferPdf(documentNumber)
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="offert-${documentNumber}.pdf"`,
      },
    })
  } catch (err) {
    if (err instanceof FortnoxNotConnectedError) {
      return new NextResponse('Fortnox är inte anslutet.', { status: 400 })
    }
    console.error('Fortnox PDF failed:', err)
    return new NextResponse('Kunde inte hämta offert-PDF från Fortnox.', { status: 502 })
  }
}
