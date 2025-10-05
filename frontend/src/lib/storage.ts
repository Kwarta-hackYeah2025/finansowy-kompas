import { retiringSchema, type RetiringFormValues } from "@/pages/retiring/schema"

const KEY = "retiring_form_data"
const COEFF_KEY = "retiring_coeffs"

export function loadRetiringData(): RetiringFormValues | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const res = retiringSchema.safeParse(parsed)
    return res.success ? res.data : null
  } catch {
    return null
  }
}

export function saveRetiringData(data: RetiringFormValues) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

export function removeRetiringData() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export type RetiringCoefficients = { alpha: number; beta: number }

export function saveRetiringCoefficients(coeffs: RetiringCoefficients) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(COEFF_KEY, JSON.stringify(coeffs))
  } catch {}
}

export function loadRetiringCoefficients(): RetiringCoefficients | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(COEFF_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed) return null
    const a = Number(parsed.alpha)
    const b = Number(parsed.beta)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null
    return { alpha: a, beta: b }
  } catch {
    return null
  }
}

export function removeRetiringCoefficients() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(COEFF_KEY)
  } catch {}
}
