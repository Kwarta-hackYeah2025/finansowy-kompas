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
  simulation_mode?: boolean
  simulation_events?: Array<{
    reason: string
    start_age: number
    end_age: number
    basis_zero: boolean
    contrib_multiplier: number
    kind: string
  }>
}

// Updated shape to support nominal and real values, while keeping legacy optional fields for compatibility
export type PensionPreviewResponse = {
  retirement_age: number
  years_to_retirement: number

  // New fields
  monthly_pension_nominal?: number
  replacement_rate_percent_nominal?: number
  i_pillar_capital_nominal?: number
  ii_pillar_capital_nominal?: number
  total_capital_nominal?: number
  current_monthly_salary_nominal?: number
  final_monthly_salary_nominal?: number

  monthly_pension_real?: number
  replacement_rate_percent_real?: number
  i_pillar_capital_real?: number
  ii_pillar_capital_real?: number
  total_capital_real?: number
  final_monthly_salary_real?: number

  // Legacy (pre-nominal/real) optional fields for backward compatibility
  monthly_pension?: number
  replacement_rate_percent?: number
  i_pillar_capital?: number
  ii_pillar_capital?: number
  total_capital?: number
  current_monthly_salary?: number

  timeline: Array<{
    year: number
    // Nominal series
    i_pillar?: number
    ii_pillar?: number
    total?: number
    annual_salary?: number
    // Real series
    i_pillar_real?: number
    ii_pillar_real?: number
    total_real?: number
    annual_salary_real?: number
  }>

  // Simulation events to visualize as segments on the chart
  simulation_events?: Array<{
    reason: string
    start_age: number
    end_age: number
    basis_zero: boolean
    contrib_multiplier: number
    kind: string
  }>
}

export async function postPensionPreview(payload: PensionPreviewPayload): Promise<PensionPreviewResponse> {
  const url = apiUrl(endpoints.pension.preview)
  const res = await api.post(url, payload)
  return res.data as PensionPreviewResponse
}

// Excel export
export type ExcelPayload = {
  retirement_expected: number
  current_age: number
  sex: "male" | "female" | "unknown"
  salary: number
  simulation_mode: boolean
  total_capital_real: number
  monthly_pension_nominal: number
  monthly_pension_real: number
  zip_code?: string
}

export type ExcelResponse = { ok: true } | Record<string, unknown>

export async function postExcel(payload: ExcelPayload): Promise<ExcelResponse> {
  const url = apiUrl(endpoints.excel)
  const res = await api.post(url, payload)
  return (res.data as ExcelResponse) ?? { ok: true }
}

// Fun facts
export type FunFactsResponse = {
  facts: Array<{ fact: string }>
}

export async function getFunFacts(): Promise<string[]> {
  const url = apiUrl(endpoints.funFacts)
  const res = await api.get(url)
  const data = res.data as FunFactsResponse
  const arr = Array.isArray(data?.facts) ? data.facts : []
  return arr
    .map((f) => (f && typeof f.fact === "string" ? f.fact : ""))
    .filter((s) => !!s)
}
