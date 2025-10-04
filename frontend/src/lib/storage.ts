import { retiringSchema, type RetiringFormValues } from "@/pages/retiring/schema"

const KEY = "retiring_form_data"

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
