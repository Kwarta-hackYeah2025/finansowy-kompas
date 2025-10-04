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
}

export type SalaryCalculateResponse = {
  salary: number
  experience_years: number
  retirement_age: number
  years_to_retirement: number
}

export async function postSalaryCalculate(payload: SalaryCalculatePayload): Promise<SalaryCalculateResponse> {
  const url = apiUrl(endpoints.salary.calculate)
  const res = await api.post(url, payload)
  return res.data as SalaryCalculateResponse
}
