import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { formatPLN } from "@/lib/utils"
import { ShoppingCart, Utensils, Home as HomeIcon, PiggyBank, TrendingUp } from "lucide-react"

const nowYear = new Date().getFullYear()
const STORAGE_KEY = "value_simulator_settings"

const defaultRates = {
  cpiDaily: 0.05, // codzienne produkty
  cpiFood: 0.06,  // żywność
  realEstate: 0.04, // nieruchomości
  deposit: 0.03, // lokata (oprocentowanie nominalne)
}

const scenarios = {
  conservative: { label: "Konserwatywny", cpiDaily: 0.03, cpiFood: 0.035, realEstate: 0.025, deposit: 0.025, etf: 0.04 },
  base: { label: "Bazowy", cpiDaily: 0.05, cpiFood: 0.06, realEstate: 0.04, deposit: 0.03, etf: 0.07 },
  optimistic: { label: "Optymistyczny", cpiDaily: 0.02, cpiFood: 0.025, realEstate: 0.03, deposit: 0.03, etf: 0.09 },
  highInflation: { label: "Wysoka inflacja", cpiDaily: 0.08, cpiFood: 0.1, realEstate: 0.06, deposit: 0.04, etf: 0.07 },
  custom: { label: "Własny" },
} as const

type ScenarioKey = keyof typeof scenarios

// Helper: format decimal rate (e.g., 0.07) as percent string with up to 3 decimals without FP artifacts
const toPercentStr = (v: number): string => {
  if (!Number.isFinite(v)) return ""
  const perc = v * 100
  const rounded = Math.round((perc + Number.EPSILON) * 1000) / 1000
  return rounded.toFixed(3).replace(/\.?0+$/, '')
}

const chartConfig = {
  cashDaily: { label: "Gotówka vs koszyk codzienny", icon: ShoppingCart, color: "#ef4444" }, // red-500
  food: { label: "Żywność", icon: Utensils, color: "#f59e0b" }, // amber-500
  realEstate: { label: "Nieruchomości", icon: HomeIcon, color: "#0ea5e9" }, // sky-500
  deposit: { label: "Lokata (realnie)", icon: PiggyBank, color: "#22c55e" }, // green-500
  etf: { label: "ETF / Indeks (realnie)", icon: TrendingUp, color: "#8b5cf6" }, // violet-500
} satisfies ChartConfig

export default function ValueSimulator() {
  const [amount, setAmount] = React.useState<number>(20000)
  const [start, setStart] = React.useState<string>(String(nowYear))
  const [end, setEnd] = React.useState<string>(String(nowYear + 20))
  const [rates, setRates] = React.useState(defaultRates)
  const [etfRate, setEtfRate] = React.useState<number>(0.07)
  // keep user-entered percentage text to avoid jitter and support commas
  const [etfRateStr, setEtfRateStr] = React.useState<string>(toPercentStr(0.07))
  const [rateStrs, setRateStrs] = React.useState<{ cpiDaily: string; cpiFood: string; realEstate: string; deposit: string }>({
    cpiDaily: toPercentStr(defaultRates.cpiDaily),
    cpiFood: toPercentStr(defaultRates.cpiFood),
    realEstate: toPercentStr(defaultRates.realEstate),
    deposit: toPercentStr(defaultRates.deposit),
  })
  const [scenario, setScenario] = React.useState<ScenarioKey>("base")

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (typeof parsed.amount === 'number') setAmount(parsed.amount)
      if (typeof parsed.start === 'number') setStart(String(parsed.start))
      else if (typeof parsed.start === 'string') setStart(parsed.start)
      if (typeof parsed.end === 'number') setEnd(String(parsed.end))
      else if (typeof parsed.end === 'string') setEnd(parsed.end)
      if (parsed.rates) {
        const loadedRates = {
          cpiDaily: Number(parsed.rates.cpiDaily ?? defaultRates.cpiDaily),
          cpiFood: Number(parsed.rates.cpiFood ?? defaultRates.cpiFood),
          realEstate: Number(parsed.rates.realEstate ?? defaultRates.realEstate),
          deposit: Number(parsed.rates.deposit ?? defaultRates.deposit),
        }
        setRates(loadedRates)
        setRateStrs({
          cpiDaily: toPercentStr(loadedRates.cpiDaily),
          cpiFood: toPercentStr(loadedRates.cpiFood),
          realEstate: toPercentStr(loadedRates.realEstate),
          deposit: toPercentStr(loadedRates.deposit),
        })
      }
      if (typeof parsed.etfRate === 'number') {
        setEtfRate(parsed.etfRate)
        setEtfRateStr(toPercentStr(parsed.etfRate))
      }
      if (parsed.scenario && parsed.scenario in scenarios) setScenario(parsed.scenario)
      else setScenario("custom")
    } catch {}
  }, [])

  // Debounced save to localStorage
  React.useEffect(() => {
    const h = setTimeout(() => {
      const payload = { amount, start, end, rates, etfRate, scenario }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)) } catch {}
    }, 400)
    return () => clearTimeout(h)
  }, [amount, start, end, rates, etfRate, scenario])

  // Apply scenario presets
  const onScenarioChange = (key: ScenarioKey) => {
    setScenario(key)
    if (key !== 'custom') {
      const s = scenarios[key] as typeof scenarios["base"]
      const r = { cpiDaily: s.cpiDaily, cpiFood: s.cpiFood, realEstate: s.realEstate, deposit: s.deposit }
      setRates(r)
      setRateStrs({
        cpiDaily: toPercentStr(r.cpiDaily),
        cpiFood: toPercentStr(r.cpiFood),
        realEstate: toPercentStr(r.realEstate),
        deposit: toPercentStr(r.deposit),
      })
      setEtfRate(s.etf)
      setEtfRateStr(toPercentStr(s.etf))
    }
  }

  const years = React.useMemo(() => {
    const sNum = parseInt(start, 10)
    const eNum = parseInt(end, 10)
    if (Number.isNaN(sNum) || Number.isNaN(eNum)) return []
    const s = Math.min(sNum, eNum)
    const e = Math.max(sNum, eNum)
    const out: number[] = []
    for (let y = s; y <= e; y++) out.push(y)
    return out
  }, [start, end])

  const points = React.useMemo(() => {
    if (!years.length) return [] as Array<{ rok: number; cashDaily: number; food: number; realEstate: number; deposit: number; etf: number }>
    const s = years[0]
    return years.map((year) => {
      const k = year - s
      const cpiFactorDaily = Math.pow(1 + rates.cpiDaily, k)
      const cpiFactorFood = Math.pow(1 + rates.cpiFood, k)
      const reFactor = Math.pow(1 + rates.realEstate, k)
      const depositNominal = amount * Math.pow(1 + rates.deposit, k)
      const etfNominal = amount * Math.pow(1 + etfRate, k)

      return {
        rok: year,
        cashDaily: amount / cpiFactorDaily, // realna wartość vs koszyk codzienny
        food: amount / cpiFactorFood,       // realna wartość vs żywność
        realEstate: amount / reFactor,      // realna wartość vs nieruchomości
        deposit: depositNominal / cpiFactorDaily, // realna wartość lokaty vs koszyk codzienny
        etf: etfNominal / cpiFactorDaily,   // realna wartość ETF vs koszyk codzienny
      }
    })
  }, [years, rates, amount, start, end, etfRate])

  const ticks = React.useMemo(() => {
    if (!points.length) return undefined as number[] | undefined
    const step = 2500
    // Filter out non-finite/negative values to avoid generating invalid ticks
    const vals = points
      .flatMap(p => [p.cashDaily, p.food, p.realEstate, p.deposit, p.etf])
      .filter((v) => Number.isFinite(v) && v >= 0)
    if (!vals.length) return undefined
    const max = Math.max(...vals)
    if (!Number.isFinite(max) || max <= 0) return undefined
    const maxTick = Math.ceil(max / step) * step
    const len = Math.floor(maxTick / step) + 1
    // Guard against non-finite or excessively large tick arrays
    if (!Number.isFinite(len) || len <= 0 || len > 1000) return undefined
    return Array.from({ length: len }, (_, i) => i * step)
  }, [points])

  const onReset = () => {
    setAmount(20000)
    setStart(String(nowYear))
    setEnd(String(nowYear + 20))
    setRates(defaultRates)
    setRateStrs({
      cpiDaily: toPercentStr(defaultRates.cpiDaily),
      cpiFood: toPercentStr(defaultRates.cpiFood),
      realEstate: toPercentStr(defaultRates.realEstate),
      deposit: toPercentStr(defaultRates.deposit),
    })
    setEtfRate(0.07)
    setEtfRateStr(toPercentStr(0.07))
    setScenario("base")
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  // Helper to render an icon dot every N points
  const every = 2
  const mkIconDot = (IconComp: React.ComponentType<{ size?: number }>, colorVar: string) =>
    (props: any) => {
      const { cx, cy, index } = props
      const size = 16
      const r = size / 2 + 3
      // Always return an SVG element to satisfy Recharts types
      if (cx == null || cy == null || typeof index !== 'number' || index % every !== 0) {
        return <g />
      }
      return (
        <g transform={`translate(${cx - size / 2}, ${cy - size / 2})`} style={{ color: `var(${colorVar})` }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="#fff" stroke={`var(${colorVar})`} strokeWidth={1.5} />
          <IconComp size={size} />
        </g>
      )
    }

  // Custom tooltip: dedupe overlay lines, show icons, sort desc
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    // keep only visible series (color !== 'transparent') and with a value
    const items = (payload as any[])
      .filter((it) => it && it.value != null && it.color !== 'transparent')
      // dedupe by dataKey (first occurrence wins)
      .filter((it, idx, arr) => idx === arr.findIndex((x) => (x.dataKey || x.name) === (it.dataKey || it.name)))
      .sort((a, b) => Number(b?.value ?? 0) - Number(a?.value ?? 0))

    return (
      <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
        <div className="font-medium">{label}</div>
        <div className="grid gap-1.5">
          {items.map((it) => {
            const key = String(it.dataKey || it.name || 'value')
            const cfg = (chartConfig as any)[key] || {}
            const IconComp = cfg.icon as React.ComponentType<any> | undefined
            const seriesLabel = cfg.label || key
            return (
              <div key={key} className="flex w-full items-center gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5">
                {IconComp ? (
                  <IconComp style={{ color: (cfg?.color) || it.color }} />
                ) : (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: (cfg?.color) || it.color }} />
                )}
                <div className="flex flex-1 items-center justify-between leading-none">
                  <span className="text-muted-foreground">{seriesLabel}</span>
                  <span className="text-foreground font-mono font-medium tabular-nums">{formatPLN(Number(it.value))}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl mt-6">
			<Card className="bg-stone-50 pt-2 pb-8">
				<CardHeader className="bg-white py-4 rounded-t-xl border-b">
				<CardTitle>Symulacja spadku realnej wartości pieniędzy</CardTitle>
          <CardDescription>
            Sprawdź, jak Twoje oszczędności tracą siłę nabywczą względem produktów codziennych, żywności i nieruchomości. Porównaj z lokatą oraz ETF (realnie).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="amount" className="text-sm font-medium">Kwota oszczędności (PLN)</label>
              <Input id="amount" type="number" inputMode="decimal" min={0} step="100" value={amount} onChange={(e) => setAmount(Number(e.target.value || 0))} />
            </div>
            <div>
              <label htmlFor="start" className="text-sm font-medium">Rok startowy</label>
              <Input id="start" type="number" inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label htmlFor="end" className="text-sm font-medium">Rok końcowy</label>
              <Input id="end" type="number" inputMode="numeric" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div>
              <label htmlFor="scenario" className="text-sm font-medium">Scenariusz</label>
              <select id="scenario" className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring" value={scenario} onChange={(e) => onScenarioChange(e.target.value as ScenarioKey)}>
                {Object.entries(scenarios).map(([key, s]) => (
                  <option key={key} value={key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="etf" className="text-sm font-medium">Stopa zwrotu ETF/indeks (% rocznie)</label>
              <Input id="etf" type="number" inputMode="decimal" step="0.001" value={etfRateStr} onChange={(e) => {
                const raw = e.target.value
                setEtfRateStr(raw)
                const num = parseFloat(raw.replace(',', '.'))
                if (Number.isFinite(num)) setEtfRate(Math.max(0, num) / 100)
                setScenario("custom")
              }} onBlur={(e) => {
                const raw = e.target.value
                const num = parseFloat(raw.replace(',', '.'))
                if (Number.isFinite(num)) {
                  const rounded = Math.round(Math.max(0, num) * 1000) / 1000
                  const s = rounded.toFixed(3).replace(/\.?0+$/, '')
                  setEtfRateStr(s)
                }
              }} />
            </div>
						<div>
 						<label htmlFor="cpiDaily" className="text-sm font-medium">Inflacja koszyka codziennego (% rocznie)</label>
 						<Input id="cpiDaily" type="number" inputMode="decimal" step="0.001" value={rateStrs.cpiDaily} onChange={(e) => {
 							const raw = e.target.value
 							setRateStrs(s => ({ ...s, cpiDaily: raw }))
 							const num = parseFloat(raw.replace(',', '.'))
 							if (Number.isFinite(num)) setRates(r => ({ ...r, cpiDaily: Math.max(0, num) / 100 }))
 							setScenario("custom")
 						}} onBlur={(e) => {
 							const raw = e.target.value
 							const num = parseFloat(raw.replace(',', '.'))
 							if (Number.isFinite(num)) {
 								const rounded = Math.round(Math.max(0, num) * 1000) / 1000
 								const s = rounded.toFixed(3).replace(/\.?0+$/, '')
 								setRateStrs(v => ({ ...v, cpiDaily: s }))
 							}
 						}} />
						</div>
						<div>
 						<label htmlFor="cpiFood" className="text-sm font-medium">Inflacja żywności (% rocznie)</label>
 						<Input id="cpiFood" type="number" inputMode="decimal" step="0.001" value={rateStrs.cpiFood} onChange={(e) => {
 							const raw = e.target.value
 							setRateStrs(s => ({ ...s, cpiFood: raw }))
 							const num = parseFloat(raw.replace(',', '.'))
 							if (Number.isFinite(num)) setRates(r => ({ ...r, cpiFood: Math.max(0, num) / 100 }))
 							setScenario("custom")
 						}} onBlur={(e) => {
 							const raw = e.target.value
 							const num = parseFloat(raw.replace(',', '.'))
 							if (Number.isFinite(num)) {
 								const rounded = Math.round(Math.max(0, num) * 1000) / 1000
 								const s = rounded.toFixed(3).replace(/\.?0+$/, '')
 								setRateStrs(v => ({ ...v, cpiFood: s }))
 							}
 						}} />
						</div>
						<div>
 						<label htmlFor="re" className="text-sm font-medium">Wzrost cen nieruchomości (% rocznie)</label>
 						<Input id="re" type="number" inputMode="decimal" step="0.001" value={rateStrs.realEstate} onChange={(e) => {
 							const raw = e.target.value
 							setRateStrs(s => ({ ...s, realEstate: raw }))
 							const num = parseFloat(raw.replace(',', '.'))
 							if (Number.isFinite(num)) setRates(r => ({ ...r, realEstate: Math.max(0, num) / 100 }))
 							setScenario("custom")
 						}} onBlur={(e) => {
 							const raw = e.target.value
 							const num = parseFloat(raw.replace(',', '.'))
 							if (Number.isFinite(num)) {
 								const rounded = Math.round(Math.max(0, num) * 1000) / 1000
 								const s = rounded.toFixed(3).replace(/\.?0+$/, '')
 								setRateStrs(v => ({ ...v, realEstate: s }))
 							}
 						}} />
						</div>
						<div>
 						<label htmlFor="dep" className="text-sm font-medium">Oprocentowanie lokaty (% rocznie)</label>
 						<Input id="dep" type="number" inputMode="decimal" step="0.001" value={rateStrs.deposit} onChange={(e) => {
 							const raw = e.target.value
 							setRateStrs(s => ({ ...s, deposit: raw }))
 							const num = parseFloat(raw.replace(',', '.'))
 							if (Number.isFinite(num)) setRates(r => ({ ...r, deposit: Math.max(0, num) / 100 }))
 							setScenario("custom")
 						}} onBlur={(e) => {
 							const raw = e.target.value
 							const num = parseFloat(raw.replace(',', '.'))
 							if (Number.isFinite(num)) {
 								const rounded = Math.round(Math.max(0, num) * 1000) / 1000
 								const s = rounded.toFixed(3).replace(/\.?0+$/, '')
 								setRateStrs(v => ({ ...v, deposit: s }))
 							}
 						}} />
						</div>
          </div>

          <div className="mt-4 flex gap-3">
            <Button variant="outline" onClick={onReset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Jak zmienia się siła nabywcza Twoich pieniędzy</CardTitle>
          <CardDescription>Kolorowe linie i legenda z ikonami jasno pokazują, dlaczego warto inwestować zamiast trzymać gotówkę.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full h-[520px]">
            <LineChart data={points} margin={{ left: 16, right: 16, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rok" tickMargin={8} />
              <YAxis tickFormatter={(v: number) => formatPLN(v)} tickMargin={8} ticks={ticks} />
              <ChartTooltip content={<CustomTooltip />} />
              {/* Visible lines without dots */}
              <Line type="monotone" dataKey="cashDaily" stroke="var(--color-cashDaily)" dot={false} strokeWidth={2.5} />
              <Line type="monotone" dataKey="food" stroke="var(--color-food)" dot={false} strokeWidth={2.5} />
              <Line type="monotone" dataKey="realEstate" stroke="var(--color-realEstate)" dot={false} strokeWidth={2.5} />
              <Line type="monotone" dataKey="deposit" stroke="var(--color-deposit)" dot={false} strokeWidth={2.5} />
              <Line type="monotone" dataKey="etf" stroke="var(--color-etf)" dot={false} strokeWidth={2.5} />
              {/* Icon overlays rendered last for top layering */}
              <Line type="monotone" dataKey="cashDaily" stroke="transparent" legendType="none" dot={mkIconDot(ShoppingCart, "--color-cashDaily")} activeDot={false} />
              <Line type="monotone" dataKey="food" stroke="transparent" legendType="none" dot={mkIconDot(Utensils, "--color-food")} activeDot={false} />
              <Line type="monotone" dataKey="realEstate" stroke="transparent" legendType="none" dot={mkIconDot(HomeIcon, "--color-realEstate")} activeDot={false} />
              <Line type="monotone" dataKey="deposit" stroke="transparent" legendType="none" dot={mkIconDot(PiggyBank, "--color-deposit")} activeDot={false} />
              <Line type="monotone" dataKey="etf" stroke="transparent" legendType="none" dot={mkIconDot(TrendingUp, "--color-etf")} activeDot={false} />
              <ChartLegend content={<ChartLegendContent hideIcon />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Wniosek</CardTitle>
          <CardDescription>Dlaczego warto inwestować oszczędności?</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nawet jeśli lokata podnosi nominalną wartość środków, realna siła nabywcza pieniędzy spada przy inflacji produktów codziennych, żywności czy nieruchomości. Dywersyfikacja i inwestowanie (np. ETF/indeks, obligacje, nieruchomości) pomaga chronić majątek znacznie lepiej niż samo trzymanie gotówki.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
