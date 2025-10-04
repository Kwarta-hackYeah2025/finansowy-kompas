import { useLocation, useNavigate } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AnalysisTable from "@/pages/retiring/AnalysisTable.tsx";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import * as React from "react"
import { colors } from "@/lib/colors"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { retiringSchema, type RetiringFormValues, defaultRetiringValues } from "@/pages/retiring/schema"
import { loadRetiringData, saveRetiringData, removeRetiringData } from "@/lib/storage"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { formatPLN } from "@/lib/utils"

const Analysis = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const initial = React.useMemo<RetiringFormValues>(() => {
    const fromState = (location.state || {}) as Partial<RetiringFormValues>
    // prefer state (fresh submit), then storage, else defaults
    const stored = loadRetiringData()
    return {
      ...defaultRetiringValues,
      ...(stored ?? {}),
      ...(Object.keys(fromState).length ? fromState : {}),
    } as RetiringFormValues
  }, [location.state])

  const [current, setCurrent] = React.useState<RetiringFormValues>(initial)

  const back = () => navigate("/emerytura")

  // Build sample decreasing data until 2080 based on current state
  const startYear = new Date().getFullYear()
  const endYear = 2080
  const startSavings = Math.max(0, Number(current.oszczednosci ?? 20000))
  const startPension = Math.max(0, Number(((current.pensjaNetto ?? 8000) * 0.6) * 12))

  const minFactor = 0.15
  const points = React.useMemo(() => {
    const arr: Array<{ rok: number; oszczednosci: number; emerytura: number }> = []
    const totalYears = Math.max(1, endYear - startYear)
    for (let y = startYear; y <= endYear; y++) {
      const t = (y - startYear) / totalYears
      const factor = (1 - t) * (1 - minFactor) + minFactor
      arr.push({
        rok: y,
        oszczednosci: Math.round(startSavings * factor),
        emerytura: Math.round(startPension * factor),
      })
    }
    return arr
  }, [startYear, endYear, startSavings, startPension])

  const chartConfig = {
    oszczednosci: {
      label: "Oszczędności",
      color: colors.orange, // #ffb34f
    },
    emerytura: {
      label: "Emerytura",
      color: colors.green, // #007834FF
    },
  } satisfies ChartConfig

  const uid = React.useId()
  const gradSavings = `${uid}-grad-oszczednosci`
  const gradPension = `${uid}-grad-emerytura`

  // Edit form
  const editForm = useForm<RetiringFormValues>({
    resolver: zodResolver(retiringSchema),
    defaultValues: current,
    mode: "onBlur",
  })

  // Debounced auto-save on change
  React.useEffect(() => {
    const sub = editForm.watch((values) => {
      const handle = setTimeout(() => {
        const res = retiringSchema.safeParse(values as any)
        if (res.success) {
          saveRetiringData(res.data)
          setCurrent(res.data)
        }
      }, 400)
      return () => clearTimeout(handle)
    })
    return () => sub.unsubscribe()
  }, [editForm])

  const onEditSubmit: SubmitHandler<RetiringFormValues> = (values) => {
    saveRetiringData(values)
    setCurrent(values)
  }

  const onClear = () => {
    removeRetiringData()
    setCurrent(defaultRetiringValues)
    editForm.reset(defaultRetiringValues)
  }

  return (
    <div className="mx-auto w-full max-w-5xl bg-stone-50 rounded-t-xl mt-10">
      <Card className="bg-stone-50 pt-0 pb-8">
        <CardHeader className="bg-white py-4 rounded-t-xl border-b ">
          <CardTitle className="text-2xl">Analiza emerytalna</CardTitle>
          <CardDescription>Podsumowanie danych z możliwością edycji i wizualizacji trendu do 2080 r.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <AnalysisTable data={current} />
            </div>
            <div className="flex flex-col gap-6">
              <ChartContainer config={chartConfig} className="w-full aspect-[16/10]">
                <AreaChart data={points} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id={gradSavings} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-oszczednosci)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-oszczednosci)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id={gradPension} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-emerytura)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-emerytura)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rok" tickMargin={8} />
                  <YAxis tickMargin={8} tickFormatter={(v: number) => formatPLN(v)} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => [formatPLN(Number(value)), name]} />} />
                  <Area type="monotone" dataKey="oszczednosci" stroke="var(--color-oszczednosci)" fill={`url(#${gradSavings})`} strokeWidth={2} />
                  <Area type="monotone" dataKey="emerytura" stroke="var(--color-emerytura)" fill={`url(#${gradPension})`} strokeWidth={2} />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>

              {/* Edit form */}
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="stanowisko" required>Stanowisko</Label>
                  <Input id="stanowisko" {...editForm.register("stanowisko")} />
                  {editForm.formState.errors.stanowisko && (
                    <p className="text-destructive text-xs">{editForm.formState.errors.stanowisko.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="wiek" required>Wiek</Label>
                  <Input id="wiek" type="number" inputMode="numeric" min={16} max={100} {...editForm.register("wiek", { valueAsNumber: true })} />
                  {editForm.formState.errors.wiek && (
                    <p className="text-destructive text-xs">{editForm.formState.errors.wiek.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="miasto" required>Miasto</Label>
                  <Input id="miasto" {...editForm.register("miasto")} />
                  {editForm.formState.errors.miasto && (
                    <p className="text-destructive text-xs">{editForm.formState.errors.miasto.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pensjaNetto" required>Pensja netto (PLN/mies.)</Label>
                  <Input id="pensjaNetto" type="number" inputMode="decimal" step="0.01" min={0} {...editForm.register("pensjaNetto", { valueAsNumber: true })} />
                  {editForm.formState.errors.pensjaNetto && (
                    <p className="text-destructive text-xs">{editForm.formState.errors.pensjaNetto.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="wydatkiMiesieczne" required>Wydatki miesięczne (PLN)</Label>
                  <Input id="wydatkiMiesieczne" type="number" inputMode="decimal" step="0.01" min={0} {...editForm.register("wydatkiMiesieczne", { valueAsNumber: true })} />
                  {editForm.formState.errors.wydatkiMiesieczne && (
                    <p className="text-destructive text-xs">{editForm.formState.errors.wydatkiMiesieczne.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="oszczednosci" required>Oszczędności (PLN)</Label>
                  <Input id="oszczednosci" type="number" inputMode="decimal" step="0.01" min={0} {...editForm.register("oszczednosci", { valueAsNumber: true })} />
                  {editForm.formState.errors.oszczednosci && (
                    <p className="text-destructive text-xs">{editForm.formState.errors.oszczednosci.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="procentOszczednosci" required>Procent oszczędności (% z pensji)</Label>
                  <Input id="procentOszczednosci" type="number" inputMode="decimal" step="0.01" min={0} max={100} {...editForm.register("procentOszczednosci", { valueAsNumber: true })} />
                  {editForm.formState.errors.procentOszczednosci && (
                    <p className="text-destructive text-xs">{editForm.formState.errors.procentOszczednosci.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="stopaZwrotu" required>Przewidywana stopa zwrotu (% rocznie)</Label>
                  <Input id="stopaZwrotu" type="number" inputMode="decimal" step="0.01" min={-50} max={50} {...editForm.register("stopaZwrotu", { valueAsNumber: true })} />
                  {editForm.formState.errors.stopaZwrotu && (
                    <p className="text-destructive text-xs">{editForm.formState.errors.stopaZwrotu.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="wiekEmerytura" required>Wiek emerytalny</Label>
                  <Input id="wiekEmerytura" type="number" inputMode="numeric" min={40} max={85} {...editForm.register("wiekEmerytura", { valueAsNumber: true })} />
                  {editForm.formState.errors.wiekEmerytura && (
                    <p className="text-destructive text-xs">{editForm.formState.errors.wiekEmerytura.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lataDoswiadczenia" required>Lata doświadczenia</Label>
                  <Input id="lataDoswiadczenia" type="number" inputMode="decimal" step="0.1" min={0} {...editForm.register("lataDoswiadczenia", { valueAsNumber: true })} />
                  {editForm.formState.errors.lataDoswiadczenia && (
                    <p className="text-destructive text-xs">{editForm.formState.errors.lataDoswiadczenia.message}</p>
                  )}
                </div>
                <div className="md:col-span-2 flex justify-between gap-3">
                  <Button type="button" variant="outline" onClick={onClear}>Wyczyść dane</Button>
                  <Button type="submit" className="min-w-40 bg-[#007834FF]">Zapisz zmiany</Button>
                </div>
              </form>

              <div className="text-xs text-muted-foreground">
                Zmiany są zapisywane w tej przeglądarce (localStorage) i odświeżają tabelę i wykres.
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={back} variant="outline">Wróć do formularza</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analysis
