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
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import IconButton from "@mui/material/IconButton"
import CloseIcon from "@mui/icons-material/Close"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { postSalaryCalculate } from "@/lib/api"
import type { SalaryCalculateResponse } from "@/lib/api"

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
  const [open, setOpen] = React.useState(false)
  const initialBackend = (location.state as any)?.backend as SalaryCalculateResponse | undefined
  const [backend, setBackend] = React.useState<SalaryCalculateResponse | null>(initialBackend ?? null)

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

  const saveMutation = useMutation({
    mutationFn: (values: RetiringFormValues) =>
      postSalaryCalculate({
        sex: values.sex,
        age: values.wiek,
        city: values.miasto,
        industry: values.stanowisko,
        career_start: values.career_start,
      }),
    onSuccess: (data) => {
      setBackend(data)
      toast.success("Zapisano zmiany i wysłano do analizy")
      setOpen(false)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Wystąpił błąd podczas zapisu"
      toast.error("Nie udało się zapisać zmian", { description: String(msg) })
    },
  })

  // Debounced auto-save on change
  React.useEffect(() => {
    const timeoutRef = { current: 0 as any }
    const sub = editForm.watch((values) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        const res = retiringSchema.safeParse(values as any)
        if (res.success) {
          saveRetiringData(res.data)
          setCurrent(res.data)
        }
      }, 400)
    })
    return () => {
      sub.unsubscribe()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [editForm])

  const onEditSubmit: SubmitHandler<RetiringFormValues> = (values) => {
    saveRetiringData(values)
    setCurrent(values)
    saveMutation.mutate(values)
  }

  const onClear = () => {
    removeRetiringData()
    setCurrent(defaultRetiringValues)
    editForm.reset(defaultRetiringValues)
    toast.info("Dane wyczyszczone")
  }

  return (
    <div className="mx-auto w-full max-w-5xl bg-stone-50 rounded-t-xl mt-10">
      <Card className="bg-stone-50 pt-0 pb-8">
        <CardHeader className="bg-white py-4 rounded-t-xl border-b ">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Analiza emerytalna</CardTitle>
              <CardDescription>Podsumowanie danych z możliwością edycji i wizualizacji trendu do 2080 r.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(true)}>Edytuj dane</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <AnalysisTable data={current} backend={backend} />
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

      {/* Edit Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle className="!pb-2">
          <div className="flex items-center justify-between">
            <span>Edytuj dane</span>
            <IconButton aria-label="Zamknij" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent dividers>
          <form id="analysis-edit-form" onSubmit={editForm.handleSubmit(onEditSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
              <Label htmlFor="sex" required>Płeć</Label>
              <select id="sex" className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring" {...editForm.register("sex")}>
                <option value="male">Mężczyzna</option>
                <option value="female">Kobieta</option>
                <option value="unknown">Nie chcę podawać</option>
              </select>
              {editForm.formState.errors.sex && (
                <p className="text-destructive text-xs">{editForm.formState.errors.sex.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="career_start" required>Wiek startu kariery</Label>
              <Input id="career_start" type="number" inputMode="numeric" min={10} max={80} {...editForm.register("career_start", { valueAsNumber: true })} />
              {editForm.formState.errors.career_start && (
                <p className="text-destructive text-xs">{editForm.formState.errors.career_start.message}</p>
              )}
            </div>
          </form>
        </DialogContent>
        <DialogActions>
          <Button type="button" variant="outline" onClick={onClear} disabled={saveMutation.isPending}>Wyczyść dane</Button>
          <Button type="submit" form="analysis-edit-form" className="bg-[#007834FF]" disabled={saveMutation.isPending} aria-busy={saveMutation.isPending}>
            {saveMutation.isPending && (
              <svg className="size-4 mr-2 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            Zapisz zmiany
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default Analysis
