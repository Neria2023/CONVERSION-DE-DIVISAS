import { makeConversionRoute } from "@/lib/conversion-route"

export const { GET, POST } = makeConversionRoute("EUR", "MXN")
