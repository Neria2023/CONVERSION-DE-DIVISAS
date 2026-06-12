"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRight } from "lucide-react"

type Method = {
  path: string
  label: string
  fromLabel: string
  toLabel: string
}

const METHODS: Method[] = [
  { path: "eur-to-mxn", label: "Euro → Pesos MX", fromLabel: "EUR", toLabel: "MXN" },
  { path: "usd-to-mxn", label: "Dólar US → Pesos MX", fromLabel: "USD", toLabel: "MXN" },
  { path: "cad-to-mxn", label: "Dólar Canadiense → Pesos MX", fromLabel: "CAD", toLabel: "MXN" },
  { path: "gbp-to-mxn", label: "Libra → Pesos MX", fromLabel: "GBP", toLabel: "MXN" },
  { path: "mxn-to-eur", label: "Pesos MX → Euro", fromLabel: "MXN", toLabel: "EUR" },
  { path: "mxn-to-usd", label: "Pesos MX → Dólar US", fromLabel: "MXN", toLabel: "USD" },
  { path: "mxn-to-cad", label: "Pesos MX → Dólar Canadiense", fromLabel: "MXN", toLabel: "CAD" },
  { path: "mxn-to-gbp", label: "Pesos MX → Libra", fromLabel: "MXN", toLabel: "GBP" },
]

type ApiResult = {
  from: string
  to: string
  fromLabel: string
  toLabel: string
  amount: number
  rate: number
  result: number
  timestamp: string
}

export default function Home() {
  const [methodPath, setMethodPath] = useState(METHODS[0].path)
  const [amount, setAmount] = useState("100")
  const [result, setResult] = useState<ApiResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selected = METHODS.find((m) => m.path === methodPath) ?? METHODS[0]

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/${methodPath}?amount=${encodeURIComponent(amount)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error en la conversión")
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (n: number, code: string) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: code }).format(n)

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Web Service de Conversión de Divisas
          </h1>
          <p className="leading-relaxed text-muted-foreground">
            8 métodos REST con tipos de cambio en tiempo real. Prueba cualquier conversión abajo o
            consume los endpoints directamente.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Probar conversión</CardTitle>
            <CardDescription>
              Selecciona un método e ingresa la cantidad en la moneda origen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConvert} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="method">Método</Label>
                <Select value={methodPath} onValueChange={setMethodPath}>
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.path} value={m.path}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">Cantidad ({selected.fromLabel})</Label>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ingresa una cantidad"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Convirtiendo..." : "Convertir"}
              </Button>
            </form>

            {error && (
              <p className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {result && (
              <div className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-muted/40 p-5">
                <div className="flex items-center justify-center gap-3 text-center">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {result.fromLabel}
                    </p>
                    <p className="text-xl font-semibold">
                      {formatMoney(result.amount, result.from)}
                    </p>
                  </div>
                  <ArrowRight className="size-5 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {result.toLabel}
                    </p>
                    <p className="text-xl font-semibold text-primary">
                      {formatMoney(result.result, result.to)}
                    </p>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Tasa: 1 {result.fromLabel} = {result.rate} {result.toLabel}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endpoints disponibles</CardTitle>
            <CardDescription>
              Cada método acepta GET con <code className="font-mono text-xs">?amount=</code> o POST
              con <code className="font-mono text-xs">{`{ "amount": ... }`}</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-border">
              {METHODS.map((m) => (
                <li
                  key={m.path}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm font-medium">{m.label}</span>
                  <code className="font-mono text-xs text-muted-foreground">
                    GET /api/{m.path}?amount=100
                  </code>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
