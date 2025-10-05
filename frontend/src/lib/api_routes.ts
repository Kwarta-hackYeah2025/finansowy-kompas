const raw = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
const cleaned = raw?.replace(/\/$/, "") || ""

export const API_BASE_URL = cleaned || ""

export const endpoints = {
  salary: {
    calculate: "/api/v1/salary/calculate",
  },
  pension: {
    preview: "/api/v1/user-profile/pension/preview",
  },
} as const

export function apiUrl(path: string) {
  if (!path.startsWith("/")) return `${API_BASE_URL}/${path}`
  return `${API_BASE_URL}${path}`
}

