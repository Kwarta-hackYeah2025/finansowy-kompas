import axios from "axios"
import { API_BASE_URL, apiUrl, endpoints } from "@/lib/api_routes"

export const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    "Content-Type": "application/json",
  },
})

export type SalaryCalculatePayload = {
  sex: "male" | "female" | "unknown"
  age: number
  city: string
  industry: string
  career_start: number
  career_end: number
}

export type SalaryCalculateResponse = {
  salary: number
  experience_years: number
  retirement_age: number
  years_to_retirement: number
  alpha?: number
  beta?: number
}

export async function postSalaryCalculate(payload: SalaryCalculatePayload): Promise<SalaryCalculateResponse> {
  const url = apiUrl(endpoints.salary.calculate)
  const res = await api.post(url, payload)
  return res.data as SalaryCalculateResponse
}

export type PensionPreviewPayload = {
  current_age: number
  years_of_experience: number
  current_monthly_salary: number
  is_male: boolean
  alpha: number
  beta: number
  retirement_age: number
}

export type PensionPreviewResponse = {
  retirement_age: number
  years_to_retirement: number
  monthly_pension: number
  replacement_rate_percent: number
  i_pillar_capital: number
  ii_pillar_capital: number
  total_capital: number
  current_monthly_salary: number
  timeline: Array<{ year: number; i_pillar: number; ii_pillar: number; total: number; annual_salary: number }>
}

export async function postPensionPreview(payload: PensionPreviewPayload): Promise<PensionPreviewResponse> {
  const url = apiUrl(endpoints.pension.preview)
  const res = await api.post(url, payload)
  return res.data as PensionPreviewResponse
}
