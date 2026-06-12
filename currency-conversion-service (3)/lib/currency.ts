// Lógica compartida de conversión de divisas.
// Las tasas se obtienen en tiempo real desde open.er-api.com (sin API key).

export type CurrencyCode = "EUR" | "USD" | "CAD" | "GBP" | "MXN"

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  EUR: "Euro",
  USD: "Dólar US",
  CAD: "Dólar Canadiense",
  GBP: "Libra",
  MXN: "Pesos MX",
}

type RatesResponse = {
  result: string
  base_code: string
  rates: Record<string, number>
}

// Cache simple en memoria para no llamar a la API en cada request (5 min).
let cache: { base: string; rates: Record<string, number>; expires: number } | null = null
const TTL_MS = 5 * 60 * 1000

async function getRates(base: CurrencyCode): Promise<Record<string, number>> {
  const now = Date.now()
  if (cache && cache.base === base && cache.expires > now) {
    return cache.rates
  }

  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
    // Revalidar en el servidor cada 5 min.
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`No se pudieron obtener las tasas de cambio (HTTP ${res.status})`)
  }

  const data = (await res.json()) as RatesResponse
  if (data.result !== "success" || !data.rates) {
    throw new Error("Respuesta inválida del proveedor de tasas de cambio")
  }

  cache = { base, rates: data.rates, expires: now + TTL_MS }
  return data.rates
}

export type ConversionResult = {
  from: CurrencyCode
  to: CurrencyCode
  fromLabel: string
  toLabel: string
  amount: number
  rate: number
  result: number
  timestamp: string
}

/**
 * Convierte una cantidad de una moneda origen a una moneda destino
 * usando tasas obtenidas en tiempo real.
 */
export async function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
): Promise<ConversionResult> {
  if (!Number.isFinite(amount)) {
    throw new Error("La cantidad debe ser un número válido")
  }

  const rates = await getRates(from)
  const rate = rates[to]

  if (typeof rate !== "number") {
    throw new Error(`No hay tasa de cambio disponible para ${from} → ${to}`)
  }

  const result = amount * rate

  return {
    from,
    to,
    fromLabel: CURRENCY_LABELS[from],
    toLabel: CURRENCY_LABELS[to],
    amount,
    rate,
    result: Math.round(result * 100) / 100,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Lee y valida la cantidad desde la query string (?amount=) o el body JSON.
 */
export function parseAmount(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number)
  if (!Number.isFinite(n)) {
    throw new Error("Parámetro 'amount' inválido o ausente")
  }
  return n
}
