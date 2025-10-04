import { z } from "zod"

export const retiringSchema = z.object({
  stanowisko: z.string().min(2, "Podaj nazwę stanowiska"),
  wiek: z.coerce.number().int().min(16, "Minimalny wiek to 16 lat").max(100, "Maksymalny wiek to 100 lat"),
  miasto: z.string().min(2, "Podaj miasto"),
  pensjaNetto: z.coerce.number().min(0, "Wartość nie może być ujemna"),
  wydatkiMiesieczne: z.coerce.number().min(0, "Wartość nie może być ujemna"),
  oszczednosci: z.coerce.number().min(0, "Wartość nie może być ujemna"),
  procentOszczednosci: z.coerce.number().min(0).max(100, "Podaj wartość w zakresie 0-100"),
  stopaZwrotu: z.coerce.number().min(-50, "Nierealistycznie niska").max(50, "Nierealistycznie wysoka"),
  wiekEmerytura: z.coerce.number().int().min(40, "Minimum 40 lat").max(85, "Maksymalnie 85 lat"),
  lataDoswiadczenia: z.coerce.number().min(0, "Wartość nie może być ujemna"),
  sex: z.enum(["male", "female", "unknown"]),
  career_start: z.coerce.number().int().min(10, "Podaj realistyczny wiek startu kariery").max(80, "Maksymalnie 80 lat"),
}).refine((data) => data.wiekEmerytura > data.wiek, {
  message: "Wiek emerytalny musi być większy niż obecny wiek",
  path: ["wiekEmerytura"],
}).refine((data) => data.career_start <= data.wiek, {
  message: "Wiek startu kariery nie może być większy niż Twój wiek",
  path: ["career_start"],
})

export type RetiringFormValues = z.infer<typeof retiringSchema>

export const defaultRetiringValues: RetiringFormValues = {
  stanowisko: "",
  wiek: 30,
  miasto: "",
  pensjaNetto: 8000,
  wydatkiMiesieczne: 4000,
  oszczednosci: 20000,
  procentOszczednosci: 20,
  stopaZwrotu: 6,
  wiekEmerytura: 65,
  lataDoswiadczenia: 5,
  sex: "unknown",
  career_start: 20,
}
