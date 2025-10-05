import { useLocation, useNavigate } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AnalysisTable from "@/pages/retiring/AnalysisTable.tsx";
import { ChartContainer, ChartTooltip, type ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import * as React from "react"
import { colors } from "@/lib/colors"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { retiringSchema, type RetiringFormValues, defaultRetiringValues } from "@/pages/retiring/schema"
import { loadRetiringData, saveRetiringData, removeRetiringData, loadRetiringCoefficients, saveRetiringCoefficients } from "@/lib/storage"
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
import { postSalaryCalculate, postPensionPreview } from "@/lib/api"
import type { SalaryCalculateResponse, PensionPreviewResponse } from "@/lib/api"

function formatYAxisShort(v: number): string {
  if (!Number.isFinite(v)) return ""
  const sign = v < 0 ? "-" : ""
  const abs = Math.abs(v)
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000
    return `${sign}${millions.toFixed(1)} mln`
  }
  if (abs >= 1_000) {
    const thousands = Math.round(abs / 1_000)
    return `${sign}${thousands} tys.`
  }
  return `${sign}${Math.round(abs)}`
}

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
  const [preview, setPreview] = React.useState<PensionPreviewResponse | null>((location.state as any)?.preview ?? null)
  const storedCoeffs = React.useMemo(() => loadRetiringCoefficients(), [])

  const back = () => navigate("/emerytura")

  // Build fallback sample decreasing data until 2080 based on current state
  const startYear = new Date().getFullYear()
  const endYear = 2080
  const startSavings = Math.max(0, Number(current.oszczednosci ?? 20000))
  const startAnnualSalary = Math.max(0, Number(current.pensjaNetto ?? 8000) * 12)

  const minFactor = 0.15
  const fallbackPoints = React.useMemo(() => {
    const arr: Array<{ rok: number; annual_salary: number; i_pillar: number; ii_pillar: number; total: number }> = []
    const totalYears = Math.max(1, endYear - startYear)
    for (let y = startYear; y <= endYear; y++) {
      const t = (y - startYear) / totalYears
      const factor = (1 - t) * (1 - minFactor) + minFactor
      const total = Math.round(startSavings * factor)
      const i_pillar = Math.round(total * 0.67)
      const ii_pillar = total - i_pillar
      const annual_salary = Math.round(startAnnualSalary * factor)
      arr.push({
        rok: y,
        annual_salary,
        i_pillar,
        ii_pillar,
        total,
      })
    }
    return arr
  }, [startYear, endYear, startSavings, startAnnualSalary])

  const chartConfig = {
    annual_salary: {
      label: "Roczna pensja",
      color: colors.orange,
    },
    i_pillar: {
      label: "I filar",
      color: colors.blue,
    },
    ii_pillar: {
      label: "II filar",
      color: colors.navy,
    },
    total: {
      label: "Łącznie",
      color: colors.green,
    },
  } satisfies ChartConfig

  // Final points: prefer backend preview timeline if available
  const points = React.useMemo(() => {
    const tl = preview?.timeline
    if (Array.isArray(tl) && tl.length) {
      return tl.map((t) => ({
        rok: t.year,
        annual_salary: Number.isFinite(t.annual_salary) ? t.annual_salary : 0,
        i_pillar: Number.isFinite(t.i_pillar) ? t.i_pillar : 0,
        ii_pillar: Number.isFinite(t.ii_pillar) ? t.ii_pillar : 0,
        total: Number.isFinite(t.total) ? t.total : 0,
      }))
    }
    return fallbackPoints
  }, [preview, fallbackPoints])

  // Filter points to approximately every 5 years (always include last)
  const points5 = React.useMemo(() => {
    const arr = points
    if (!arr?.length) return arr
    const first = arr[0]?.rok
    const last = arr[arr.length - 1]?.rok
    const out = arr.filter(p => Number.isFinite(p.rok) && ((p.rok - first) % 5 === 0))
    if (out.length && out[out.length - 1]?.rok !== last) {
      out.push(arr[arr.length - 1])
    }
    return out
  }, [points])

  // Right Y-axis domain should start at -20% relative to the first annual salary value
  const rightAxisMin = React.useMemo(() => {
    const first = Number(points5?.[0]?.annual_salary)
    if (!Number.isFinite(first)) return 0
    return first * 0.95
  }, [points5])

  // X-axis ticks approximately every 5 years (ensure last year is included)
  const xTicks5 = React.useMemo(() => {
    const ys = points5.map(p => Number(p.rok)).filter((v) => Number.isFinite(v)) as number[]
    if (!ys.length) return undefined as number[] | undefined
    const first = ys[0]
    const last = ys[ys.length - 1]
    const out: number[] = []
    const step = 5
    for (let y = first; y <= last; y++) {
      if ((y - first) % step === 0) out.push(y)
    }
    if (out[out.length - 1] !== last) out.push(last)
    return out
  }, [points5])

  const uid = React.useId()
  const gradAnnual = `${uid}-grad-annual_salary`
  const gradiPillar = `${uid}-grad-i_pillar`
  const gradiiPillar = `${uid}-grad-ii_pillar`
  const gradTotal = `${uid}-grad-total`

    // Custom tooltip with Polish labels and spacing between label and value
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (!active || !payload || !payload.length) return null

      const items = (payload as any[])
        .filter((it) => it && it.value != null && it.color !== 'transparent')
        .filter((it, idx, arr) => idx === arr.findIndex((x) => (x.dataKey || x.name) === (it.dataKey || it.name)))
        .sort((a, b) => Number(b?.value ?? 0) - Number(a?.value ?? 0))

      return (
        <div className="border-border/50 bg-background grid min-w-[10rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
          <div className="font-medium">{label}</div>
          <div className="grid gap-1.5">
            {items.map((it) => {
              const key = String(it.dataKey || it.name || 'value')
              const cfg = (chartConfig as any)[key] || {}
              const seriesLabel = cfg.label || key
              return (
                <div key={key} className="flex w-full items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: `var(--color-${key})` }} />
                  <div className="flex flex-1 items-center justify-between gap-6 leading-none">
                    <span className="text-muted-foreground">{seriesLabel}</span>
                    <span className="text-foreground font-mono font-medium tabular-nums ml-6">{formatPLN(Number(it.value))}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

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
        career_end: values.wiekEmerytura,
      }),
    onSuccess: (data) => {
      // Persist coefficients if provided
      const a = (data as any)?.alpha
      const b = (data as any)?.beta
      if (Number.isFinite(a) && Number.isFinite(b)) {
        saveRetiringCoefficients({ alpha: Number(a), beta: Number(b) })
      }
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

  // Auto-request pension preview when backend and form data are ready
  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!backend) return
      const alpha = (backend as any)?.alpha ?? storedCoeffs?.alpha
      const beta = (backend as any)?.beta ?? storedCoeffs?.beta
      if (!Number.isFinite(alpha) || !Number.isFinite(beta)) return
      try {
        const res = await postPensionPreview({
          current_age: Number(current.wiek),
          years_of_experience: Number(backend.experience_years ?? Math.max(0, Number(current.wiek) - Number(current.career_start))),
          current_monthly_salary: Number(backend.salary ?? current.pensjaNetto),
          is_male: current.sex === "male",
          alpha: Number(alpha),
          beta: Number(beta),
          retirement_age: Number(current.wiekEmerytura),
        })
        if (!cancelled) setPreview(res)
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.response?.data?.message ?? err?.message ?? "Nie udało się pobrać danych do wykresu"
          toast.error("Błąd danych do wykresu", { description: String(msg) })
        }
      }
    }
    run()
    return () => { cancelled = true }
  }, [backend, current.wiek, current.wiekEmerytura, current.sex, current.career_start, current.pensjaNetto, storedCoeffs])

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
    <div className="mx-auto w-full max-w-5xl bg-stone-50 rounded-t-xl mt-2">
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
              <ChartContainer config={chartConfig} className="w-full aspect-[16/16]">
                <AreaChart data={points5} margin={{ left: 16, right: 44, top: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id={gradAnnual} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-annual_salary)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-annual_salary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id={gradiPillar} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-i_pillar)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-i_pillar)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id={gradiiPillar} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-ii_pillar)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-ii_pillar)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id={gradTotal} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rok" tickMargin={8} ticks={xTicks5} />
                  <YAxis yAxisId="left" tickMargin={8} tickCount={10} tickFormatter={(v: number) => formatYAxisShort(v)} />
                  <YAxis yAxisId="right" orientation="right" tickMargin={8} tickCount={10} tickFormatter={(v: number) => formatYAxisShort(v)} domain={[rightAxisMin, 'auto']} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Area yAxisId="right" type="monotone" dataKey="annual_salary" stroke="var(--color-annual_salary)" fill={`url(#${gradAnnual})`} strokeWidth={2} />
                  <Area yAxisId="left" type="monotone" dataKey="i_pillar" stroke="var(--color-i_pillar)" fill={`url(#${gradiPillar})`} strokeWidth={2} />
                  <Area yAxisId="left" type="monotone" dataKey="ii_pillar" stroke="var(--color-ii_pillar)" fill={`url(#${gradiiPillar})`} strokeWidth={2} />
                  <Area yAxisId="left" type="monotone" dataKey="total" stroke="var(--color-total)" fill={`url(#${gradTotal})`} strokeWidth={2} />
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
