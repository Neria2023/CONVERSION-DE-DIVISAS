import { NextRequest, NextResponse } from "next/server"
import { convert, parseAmount, type CurrencyCode } from "@/lib/currency"

/**
 * Crea un par de handlers GET/POST para una conversión específica.
 * - GET  /api/...?amount=100
 * - POST /api/...  body: { "amount": 100 }
 */
export function makeConversionRoute(from: CurrencyCode, to: CurrencyCode) {
  async function handle(amountRaw: unknown) {
    const amount = parseAmount(amountRaw)
    const data = await convert(amount, from, to)
    return NextResponse.json(data)
  }

  async function GET(req: NextRequest) {
    try {
      const amount = req.nextUrl.searchParams.get("amount")
      return await handle(amount)
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Error desconocido" },
        { status: 400 },
      )
    }
  }

  async function POST(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}))
      return await handle(body?.amount)
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Error desconocido" },
        { status: 400 },
      )
    }
  }

  return { GET, POST }
}
