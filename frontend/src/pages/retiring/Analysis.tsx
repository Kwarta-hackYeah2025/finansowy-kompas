import {useLocation, useNavigate} from "react-router"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip} from "@/components/ui/chart"
import {Area, AreaChart, CartesianGrid, ReferenceArea, type TooltipProps, XAxis, YAxis} from "recharts"
import * as React from "react"
import {colors} from "@/lib/colors"
import {type SubmitHandler, useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {defaultRetiringValues, type RetiringFormValues, retiringSchema} from "@/pages/retiring/schema"
import {
	loadRetiringCoefficients,
	loadRetiringData,
	removeRetiringData,
	saveRetiringCoefficients,
	saveRetiringData
} from "@/lib/storage"
import {Label} from "@/components/ui/label"
import {Input} from "@/components/ui/input"
import {formatPLN} from "@/lib/utils"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import IconButton from "@mui/material/IconButton"
import CloseIcon from "@mui/icons-material/Close"
import {toast} from "sonner"
import {useMutation} from "@tanstack/react-query"
import type {PensionPreviewResponse, SalaryCalculateResponse} from "@/lib/api"
import {postPensionPreview, postSalaryCalculate} from "@/lib/api"
import DetailsTiles from "@/pages/retiring/DetailsTiles"

// Define default random events for simulation mode
const DEFAULT_SIM_EVENTS = [
	{reason: "bezrobocie", start_age: 20, end_age: 22, basis_zero: true, contrib_multiplier: 0, kind: "przerwa"},
	{
		reason: "niepełny etat",
		start_age: 25,
		end_age: 30,
		basis_zero: false,
		contrib_multiplier: 0.6,
		kind: "niepełny etat"
	},
	{reason: "zagranica bez ZUS", start_age: 35, end_age: 37, basis_zero: true, contrib_multiplier: 0, kind: "zagranica"},
	{reason: "praca dorywcza", start_age: 40, end_age: 42, basis_zero: false, contrib_multiplier: 0.5, kind: "inne"},
] as const

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

	type LocationState = Partial<RetiringFormValues> & {
		backend?: SalaryCalculateResponse
		preview?: PensionPreviewResponse
	}

	const initial = React.useMemo<RetiringFormValues>(() => {
		const fromState = (location.state || {}) as LocationState
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
	const state = (location.state || {}) as LocationState
	const initialBackend = state?.backend
	const [backend, setBackend] = React.useState<SalaryCalculateResponse | null>(initialBackend ?? null)
	const [preview, setPreview] = React.useState<PensionPreviewResponse | null>(state?.preview ?? null)
	const storedCoeffs = React.useMemo(() => loadRetiringCoefficients(), [])

	// Simulation mode toggle
	const [simulationEnabled, setSimulationEnabled] = React.useState<boolean>(false)
	const localSimEvents = React.useMemo(() => DEFAULT_SIM_EVENTS.map(e => ({...e})), [])

	const back = () => navigate("/emerytura")

	// Build fallback sample decreasing data until 2080 based on current state
	const startYear = new Date().getFullYear()
	const endYear = 2080
	const startSavings = Math.max(0, Number(current.oszczednosci ?? 20000))
	const startAnnualSalary = Math.max(0, Number(current.pensjaNetto ?? 8000) * 12)

	const minFactor = 0.15
	const fallbackPoints = React.useMemo(() => {
		const arr: Array<{
			rok: number;
			annual_salary: number;
			i_pillar: number;
			ii_pillar: number;
			total: number;
			annual_salary_real?: number;
			i_pillar_real?: number;
			ii_pillar_real?: number;
			total_real?: number
		}> = []
		const totalYears = Math.max(1, endYear - startYear)
		for (let y = startYear; y <= endYear; y++) {
			const t = (y - startYear) / totalYears
			const factor = (1 - t) * (1 - minFactor) + minFactor
			const total = Math.round(startSavings * factor)
			const i_pillar = Math.round(total * 0.67)
			const ii_pillar = total - i_pillar
			const annual_salary = Math.round(startAnnualSalary * factor)
			// For fallback, assume real ~= nominal for simplicity
			const i_pillar_real = i_pillar
			const ii_pillar_real = ii_pillar
			const total_real = total
			const annual_salary_real = annual_salary
			arr.push({
				rok: y,
				annual_salary,
				i_pillar,
				ii_pillar,
				total,
				annual_salary_real,
				i_pillar_real,
				ii_pillar_real,
				total_real,
			})
		}
		return arr
	}, [startYear, endYear, startSavings, startAnnualSalary])

	const chartConfig = {
		annual_salary: {
			label: "Roczna pensja (nominalna)",
			color: colors.orange,
		},
		annual_salary_real: {
			label: "Roczna pensja (realna)",
			color: "#ffb34fbb",
		},
		i_pillar: {
			label: "I filar (nominalny)",
			color: colors.blue,
		},
		i_pillar_real: {
			label: "I filar (realny)",
			color: "#3f84d2bb",
		},
		ii_pillar: {
			label: "II filar (nominalny)",
			color: colors.navy,
		},
		ii_pillar_real: {
			label: "II filar (realny)",
			color: "#00416ebb",
		},
		total: {
			label: "Łącznie (nominalnie)",
			color: colors.green,
		},
		total_real: {
			label: "Łącznie (realnie)",
			color: "#007834bb",
		},
	} satisfies ChartConfig

	// Final points: prefer backend preview timeline if available
	const points = React.useMemo(() => {
		const tl = preview?.timeline
		if (Array.isArray(tl) && tl.length) {
			return tl.map((t) => ({
				rok: t.year,
				annual_salary: Number.isFinite(Number(t.annual_salary)) ? Number(t.annual_salary) : 0,
				i_pillar: Number.isFinite(Number(t.i_pillar)) ? Number(t.i_pillar) : 0,
				ii_pillar: Number.isFinite(Number(t.ii_pillar)) ? Number(t.ii_pillar) : 0,
				total: Number.isFinite(Number(t.total)) ? Number(t.total) : 0,
				annual_salary_real: Number.isFinite(Number(t.annual_salary_real)) ? Number(t.annual_salary_real) : 0,
				i_pillar_real: Number.isFinite(Number(t.i_pillar_real)) ? Number(t.i_pillar_real) : 0,
				ii_pillar_real: Number.isFinite(Number(t.ii_pillar_real)) ? Number(t.ii_pillar_real) : 0,
				total_real: Number.isFinite(Number(t.total_real)) ? Number(t.total_real) : 0,
			}))
		}
		return fallbackPoints
	}, [preview, fallbackPoints])

	// Compute shaded bands for simulation events (map ages to years on X axis)
	const eventBands = React.useMemo(() => {
		const evs = simulationEnabled ? localSimEvents : (preview?.simulation_events || [])
		if (!Array.isArray(evs) || !evs.length || !points.length) return [] as Array<{
			from: number; to: number; type: 'zero' | 'partial'; label: string; multiplier: number
		}>
		const firstYear = Number(points[0]?.rok)
		const minYear = Number(points[0]?.rok)
		const maxYear = Number(points[points.length - 1]?.rok)
		const currentAge = Number(current.wiek)
		return evs
			.map((e) => {
				const x1 = firstYear + (Number(e.start_age) - currentAge)
				const x2 = firstYear + (Number(e.end_age) - currentAge)
				const from = Math.max(minYear, Math.min(x1, x2))
				const to = Math.min(maxYear, Math.max(x1, x2))
				if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null
				const type: 'zero' | 'partial' = (e.basis_zero || (e as any).contrib_multiplier === 0) ? 'zero' : 'partial'
				return {
					from,
					to,
					type,
					label: (e as any).reason || (e as any).kind || '',
					multiplier: Number((e as any).contrib_multiplier ?? 1)
				}
			})
			.filter(Boolean) as Array<{
			from: number;
			to: number;
			type: 'zero' | 'partial';
			label: string;
			multiplier: number
		}>
	}, [preview, points, current.wiek, simulationEnabled, localSimEvents])

	const bandColors: Record<'zero' | 'partial', string> = {
		zero: 'rgba(239, 68, 68, 0.25)', // red-500 @ 25%
		partial: 'rgba(234, 179, 8, 0.20)', // amber-500 @ 20%
	}
	const bandEdges: Record<'zero' | 'partial', string> = {
		zero: 'rgba(239, 68, 68, 0.6)',
		partial: 'rgba(234, 179, 8, 0.5)',
	}

	// When there are simulation events, use step chart to make flat sections more visible
	const areaType = React.useMemo(() => (eventBands.length > 0 ? 'stepAfter' : 'linear'), [eventBands.length])

	// Build visualization points; when event bands exist, flatten values across those ranges for clarity
	const vizPoints = React.useMemo(() => {
		if (!points?.length || !eventBands.length) return points
		const out = points.map(p => ({...p}))
		for (const b of eventBands) {
			const fromYear = Math.ceil(b.from)
			const toYear = Math.floor(b.to)
			let startIdx = out.findIndex(p => Number(p.rok) >= fromYear)
			if (startIdx === -1) continue
			let endIdx = -1
			for (let i = out.length - 1; i >= 0; i--) {
				if (Number(out[i].rok) <= toYear) { endIdx = i; break }
			}
			if (endIdx < startIdx) continue
			const base = out[Math.max(0, startIdx - 1)] ?? out[startIdx]
			for (let i = startIdx; i <= endIdx; i++) {
				out[i].annual_salary = base.annual_salary
				out[i].annual_salary_real = base.annual_salary_real
				out[i].i_pillar = base.i_pillar
				out[i].ii_pillar = base.ii_pillar
				out[i].total = base.total
				out[i].i_pillar_real = base.i_pillar_real
				out[i].ii_pillar_real = base.ii_pillar_real
				out[i].total_real = base.total_real
			}
		}
		return out
	}, [points, eventBands])

	// Filter points to approximately every 5 years (always include last); when there are event bands, use full data for fidelity
	const points5 = React.useMemo(() => {
		const arr = vizPoints
		if (!arr?.length) return arr
		if (eventBands.length > 0) return arr
		const first = arr[0]?.rok
		const last = arr[arr.length - 1]?.rok
		const out = arr.filter(p => Number.isFinite(p.rok) && ((p.rok - first) % 5 === 0))
		if (out.length && out[out.length - 1]?.rok !== last) {
			out.push(arr[arr.length - 1])
		}
		return out
	}, [vizPoints, eventBands.length])

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
	type RechartsValue = number
	type RechartsName = string
	const CustomTooltip = ({active, payload, label}: TooltipProps<RechartsValue, RechartsName>) => {
		if (!active || !payload || !payload.length) return null

		const items = (payload ?? [])
			.filter((it) => it && (it.value as number | undefined) != null)
			.filter((it, idx, arr) => idx === arr.findIndex((x) => (x.dataKey || x.name) === (it.dataKey || it.name)))
			.sort((a, b) => Number(b?.value ?? 0) - Number(a?.value ?? 0))

		return (
			<div
				className="border-border/50 bg-background grid min-w-[10rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
				<div className="font-medium">{label}</div>
				<div className="grid gap-1.5">
					{items.map((it) => {
						const key = String(it.dataKey || it.name || 'value')
						const cfg = (chartConfig as Record<string, { label?: React.ReactNode }>)?.[key] || {}
						const seriesLabel = cfg.label || key
						return (
							<div key={key} className="flex w-full items-center gap-2">
								<span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{backgroundColor: `var(--color-${key})`}}/>
								<div className="flex flex-1 items-center justify-between gap-6 leading-none">
									<span className="text-muted-foreground">{seriesLabel}</span>
									<span
										className="text-foreground font-mono font-medium tabular-nums ml-6">{formatPLN(Number(it.value))}</span>
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
		resolver: zodResolver<RetiringFormValues>(retiringSchema),
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
			const a = data?.alpha
			const b = data?.beta
			if (Number.isFinite(a) && Number.isFinite(b)) {
				saveRetiringCoefficients({alpha: Number(a), beta: Number(b)})
			}
			setBackend(data)
			toast.success("Zapisano zmiany i wysłano do analizy")
			setOpen(false)
		},
		onError: (err: unknown) => {
			const message = (() => {
				if (typeof err === 'string') return err
				if (err && typeof err === 'object') {
					// @ts-expect-error best-effort extraction
					return err?.response?.data?.message ?? (err as Error)?.message ?? 'Wystąpił błąd podczas zapisu'
				}
				return 'Wystąpił błąd podczas zapisu'
			})()
			toast.error("Nie udało się zapisać zmian", {description: String(message)})
		},
	})

	// Debounced auto-save on change
	React.useEffect(() => {
		const timeoutRef = {current: 0 as unknown as ReturnType<typeof setTimeout>}
		const sub = editForm.watch((values) => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current)
			timeoutRef.current = setTimeout(() => {
				const res = retiringSchema.safeParse(values as RetiringFormValues)
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
			const alpha = backend?.alpha ?? storedCoeffs?.alpha
			const beta = backend?.beta ?? storedCoeffs?.beta
			if (!Number.isFinite(alpha) || !Number.isFinite(beta)) return
			try {
				const payload = {
					current_age: Number(current.wiek),
					years_of_experience: Number(backend.experience_years ?? Math.max(0, Number(current.wiek) - Number(current.career_start))),
					current_monthly_salary: Number(backend.salary ?? current.pensjaNetto),
					is_male: current.sex === "male",
					alpha: Number(alpha),
					beta: Number(beta),
					retirement_age: Number(current.wiekEmerytura),
					simulation_mode: simulationEnabled || undefined,
					simulation_events: simulationEnabled ? localSimEvents as any : undefined,
				}
				const res = await postPensionPreview(payload)
				if (!cancelled) setPreview(res)
			} catch (err: unknown) {
				if (!cancelled) {
					const message = (() => {
						if (typeof err === 'string') return err
						if (err && typeof err === 'object') {
							// @ts-expect-error best-effort extraction
							return err?.response?.data?.message ?? (err as Error)?.message ?? 'Nie udało się pobrać danych do wykresu'
						}
						return 'Nie udało się pobrać danych do wykresu'
					})()
					toast.error("Błąd danych do wykresu", {description: String(message)})
				}
			}
		}
		run()
		return () => {
			cancelled = true
		}
	}, [backend, current.wiek, current.wiekEmerytura, current.sex, current.career_start, current.pensjaNetto, storedCoeffs, simulationEnabled, localSimEvents])

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

	// Helper to render events list panel
	const EventsPanel = () => {
		if (!simulationEnabled) return null
		return (
			<div className="bg-white rounded-lg border p-3">
				<div className="flex items-center justify-between mb-2">
					<div className="text-sm font-medium">Zdarzenia losowe (symulacja)</div>
					<div className="text-xs text-muted-foreground">uwzględnione w prognozie</div>
				</div>
				<div className="flex flex-wrap gap-2">
					{localSimEvents.map((e, idx) => {
						const zero = !!e.basis_zero || Number(e.contrib_multiplier) === 0
						const chipColor = zero ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
						return (
							<div key={`ev-${idx}`}
									 className={`rounded-full border ${chipColor} px-3 py-1 text-xs flex items-center gap-2`}>
								<span className="font-medium">{e.reason}</span>
								<span className="text-muted-foreground">{e.start_age}–{e.end_age} lat</span>
								<span className="inline-flex items-center gap-1">
									<span className="h-1.5 w-1.5 rounded-full"
											style={{backgroundColor: zero ? 'rgb(239 68 68)' : 'rgb(234 179 8)'}}/>
									{zero ? '0%' : `${Math.round(Number(e.contrib_multiplier) * 100)}%`}
								</span>
								<span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">{e.kind}</span>
							</div>
						)
					})}
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto w-full max-w-5xl bg-stone-50 rounded-t-xl mt-2">
			<Card className="bg-stone-50 pt-0 pb-8">
				<CardHeader className="bg-white py-4 rounded-t-xl border-b ">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-2xl">Analiza emerytalna</CardTitle>
							<CardDescription>Podsumowanie danych z możliwością edycji i wizualizacji trendu do 2080
								r.</CardDescription>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setOpen(true)}>Edytuj dane</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-6">
						{/* Top KPIs: Occupation, Experience, Pension and Final Salary (Nominal vs Real) */}
						<div className="bg-white rounded-lg border p-4">
							<div className="flex items-start justify-between gap-4 mb-3">
								<div>
									<div className="text-xs text-muted-foreground">Zawód</div>
									<div className="text-xl font-semibold leading-tight">{current.stanowisko || '-'}</div>
								</div>
								<div className="text-right">
									<div className="text-xs text-muted-foreground">Doświadczenie (mediana)</div>
									<div
										className="text-xl font-semibold leading-tight">{backend?.experience_years ?? '-'} {backend?.experience_years != null ? 'lat' : ''}</div>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
								{/* Pension nominal */}
								<div className="rounded-md border p-3">
									<div className="text-xs text-muted-foreground">Emerytura miesięczna</div>
									<div
										className="text-2xl font-semibold mt-0.5">{formatPLN(Number(preview?.monthly_pension_nominal ?? preview?.monthly_pension ?? 0))}</div>
									<div className="flex items-center justify-between mt-1">
										<span
											className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">nominalnie</span>
										{typeof (preview?.replacement_rate_percent_nominal ?? preview?.replacement_rate_percent) === 'number' && (
											<span
												className="text-[11px] text-muted-foreground">RR: {(preview?.replacement_rate_percent_nominal ?? preview?.replacement_rate_percent)?.toFixed(1)}%</span>
										)}
									</div>
								</div>
								{/* Pension real */}
								<div className="rounded-md border p-3">
									<div className="text-xs text-muted-foreground">Emerytura miesięczna</div>
									<div
										className="text-2xl font-semibold mt-0.5">{formatPLN(Number(preview?.monthly_pension_real ?? 0))}</div>
									<div className="flex items-center justify-between mt-1">
										<span
											className="text-[11px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">realnie</span>
										{typeof preview?.replacement_rate_percent_real === 'number' && (
											<span
												className="text-[11px] text-muted-foreground">RR: {preview?.replacement_rate_percent_real?.toFixed(1)}%</span>
										)}
									</div>
								</div>
								{/* Final salary nominal */}
								<div className="rounded-md border p-3">
									<div className="text-xs text-muted-foreground">Końcowa pensja</div>
									<div
										className="text-2xl font-semibold mt-0.5">{formatPLN(Number(preview?.final_monthly_salary_nominal ?? 0))}</div>
									<div className="flex items-center justify-between mt-1">
										<span
											className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">nominalnie</span>
										<span
											className="text-[11px] text-muted-foreground">W wieku: {preview?.retirement_age ?? '-'} lat</span>
									</div>
								</div>
								{/* Final salary real */}
								<div className="rounded-md border p-3">
									<div className="text-xs text-muted-foreground">Końcowa pensja</div>
									<div
										className="text-2xl font-semibold mt-0.5">{formatPLN(Number(preview?.final_monthly_salary_real ?? 0))}</div>
									<div className="flex items-center justify-between mt-1">
										<span
											className="text-[11px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">realnie</span>
										<span
											className="text-[11px] text-muted-foreground">Za: {preview?.years_to_retirement ?? '-'} lat</span>
									</div>
								</div>
							</div>
						</div>

						{/* Chart */}
						<div className="flex flex-col gap-4">
							<div className="flex items-center justify-between bg-white rounded-lg border p-3">
								<label className="flex items-center gap-2 select-none">
									<input type="checkbox" className="size-4 rounded border" checked={simulationEnabled}
											 onChange={(e) => setSimulationEnabled(e.target.checked)}/>
									<span className="text-sm">Uwzględnij nieprzewidziane zdarzenia losowe</span>
								</label>
								<div className="text-xs text-muted-foreground">wpływają na wysokość składek i kapitału</div>
							</div>

							<EventsPanel/>

							<div className="flex flex-col gap-6 bg-white rounded-lg border p-4">
								<ChartContainer config={chartConfig} className="w-full aspect-[16/10]">
									<AreaChart data={points5} margin={{left: 16, right: 44, top: 10, bottom: 10}}>
										<defs>
											<linearGradient id={gradAnnual} x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="var(--color-annual_salary)" stopOpacity={0.35}/>
												<stop offset="95%" stopColor="var(--color-annual_salary)" stopOpacity={0}/>
											</linearGradient>
											<linearGradient id={gradiPillar} x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="var(--color-i_pillar)" stopOpacity={0.35}/>
												<stop offset="95%" stopColor="var(--color-i_pillar)" stopOpacity={0}/>
											</linearGradient>
											<linearGradient id={gradiiPillar} x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="var(--color-ii_pillar)" stopOpacity={0.35}/>
												<stop offset="95%" stopColor="var(--color-ii_pillar)" stopOpacity={0}/>
											</linearGradient>
											<linearGradient id={gradTotal} x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.35}/>
												<stop offset="95%" stopColor="var(--color-total)" stopOpacity={0}/>
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3"/>
										<XAxis dataKey="rok" tickMargin={8} ticks={xTicks5}/>
										<YAxis yAxisId="left" tickMargin={8} tickCount={10}
												 tickFormatter={(v: number) => formatYAxisShort(v)}/>
										<YAxis yAxisId="right" orientation="right" tickMargin={8} tickCount={10}
												 tickFormatter={(v: number) => formatYAxisShort(v)} domain={[rightAxisMin, 'auto']}/>
										<ChartTooltip content={<CustomTooltip/>}/>

										{/* Simulation event bands (under series) */}
										{eventBands.map((b, idx) => (
											<ReferenceArea key={`band-${idx}`} x1={b.from} x2={b.to}
													 stroke={bandEdges[b.type]} strokeOpacity={0.9} strokeWidth={1}
													 fill={bandColors[b.type]}/>
										))}

										{/* Salary: nominal (filled) and real (line) on right axis */}
										<Area yAxisId="right" type={areaType} dataKey="annual_salary" stroke="var(--color-annual_salary)"
												fill={`url(#${gradAnnual})`} strokeWidth={2}/>
										<Area yAxisId="right" type={areaType} dataKey="annual_salary_real"
												stroke="var(--color-annual_salary_real)" fill="transparent" strokeWidth={2}
												strokeDasharray="4 3"/>

										{/* Pillars: nominal stacked, real as lines */}
										<Area yAxisId="left" type={areaType} dataKey="i_pillar" stackId="nominal"
												stroke="var(--color-i_pillar)" fill={`url(#${gradiPillar})`} strokeWidth={2}/>
										<Area yAxisId="left" type={areaType} dataKey="ii_pillar" stackId="nominal"
												stroke="var(--color-ii_pillar)" fill={`url(#${gradiiPillar})`} strokeWidth={2}/>

										<Area yAxisId="left" type={areaType} dataKey="i_pillar_real" stroke="var(--color-i_pillar_real)"
												fill="transparent" strokeWidth={2} strokeDasharray="4 3"/>
										<Area yAxisId="left" type={areaType} dataKey="ii_pillar_real" stroke="var(--color-ii_pillar_real)"
												fill="transparent" strokeWidth={2} strokeDasharray="4 3"/>

										{/* Totals */}
										<Area yAxisId="left" type={areaType} dataKey="total" stroke="var(--color-total)"
												fill={`url(#${gradTotal})`} strokeWidth={2}/>
										<Area yAxisId="left" type={areaType} dataKey="total_real" stroke="var(--color-total_real)"
												fill="transparent" strokeWidth={2} strokeDasharray="4 3"/>

										<ChartLegend content={<ChartLegendContent/>}/>
									</AreaChart>
								</ChartContainer>

								{/* Segment legend */}
								{eventBands.length > 0 && (
									<div className="flex items-center gap-4 text-xs text-muted-foreground">
										<div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-[2px]"
															 style={{backgroundColor: bandColors.zero}}/> przerwa
												w składkach (0%)
											</div>
											<div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-[2px]"
															 style={{backgroundColor: bandColors.partial}}/> ograniczone
												składki (&lt;100%)
											</div>
										</div>
								)}

								<div className="text-xs text-muted-foreground">
									Zmiany są zapisywane w tej przeglądarce (localStorage) i odświeżają tabelę i wykres.
								</div>
							</div>

							{/* Details (condensed) */}
							<div>
								<h3 className="text-base font-semibold mb-2">Szczegóły</h3>
								<DetailsTiles data={current} backend={backend} preview={preview}/>
							</div>
						</div>
						<div className="flex justify-end mt-6">
							<Button onClick={back} variant="outline">Wróć do formularza</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Edit Modal */}
			<Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
				<DialogTitle className="!pb-2">
					<div className="flex items-center justify-between">
						<span>Edytuj dane</span>
						<IconButton aria-label="Zamknij" onClick={() => setOpen(false)}>
							<CloseIcon/>
						</IconButton>
					</div>
				</DialogTitle>
				<DialogContent dividers>
					<form id="analysis-edit-form" onSubmit={editForm.handleSubmit(onEditSubmit)}
							className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
						<div className="flex flex-col gap-2">
							<Label htmlFor="stanowisko" required>Stanowisko</Label>
							<Input id="stanowisko" {...editForm.register("stanowisko")} />
							{editForm.formState.errors.stanowisko && (
								<p className="text-destructive text-xs">{editForm.formState.errors.stanowisko.message}</p>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="wiek" required>Wiek</Label>
							<Input id="wiek" type="number" inputMode="numeric" min={16}
									 max={100} {...editForm.register("wiek", {valueAsNumber: true})} />
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
							<Input id="pensjaNetto" type="number" inputMode="decimal" step="0.01"
									 min={0} {...editForm.register("pensjaNetto", {valueAsNumber: true})} />
							{editForm.formState.errors.pensjaNetto && (
								<p className="text-destructive text-xs">{editForm.formState.errors.pensjaNetto.message}</p>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="wydatkiMiesieczne" required>Wydatki miesięczne (PLN)</Label>
							<Input id="wydatkiMiesieczne" type="number" inputMode="decimal" step="0.01"
									 min={0} {...editForm.register("wydatkiMiesieczne", {valueAsNumber: true})} />
							{editForm.formState.errors.wydatkiMiesieczne && (
								<p className="text-destructive text-xs">{editForm.formState.errors.wydatkiMiesieczne.message}</p>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="stopaZwrotu" required>Przewidywana stopa zwrotu (% rocznie)</Label>
							<Input id="stopaZwrotu" type="number" inputMode="decimal" step="0.01" min={-50}
									 max={50} {...editForm.register("stopaZwrotu", {valueAsNumber: true})} />
							{editForm.formState.errors.stopaZwrotu && (
								<p className="text-destructive text-xs">{editForm.formState.errors.stopaZwrotu.message}</p>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="wiekEmerytura" required>Wiek emerytalny</Label>
							<Input id="wiekEmerytura" type="number" inputMode="numeric" min={40}
									 max={85} {...editForm.register("wiekEmerytura", {valueAsNumber: true})} />
							{editForm.formState.errors.wiekEmerytura && (
								<p className="text-destructive text-xs">{editForm.formState.errors.wiekEmerytura.message}</p>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="sex" required>Płeć</Label>
							<select id="sex"
									className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring" {...editForm.register("sex")}>
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
							<Input id="career_start" type="number" inputMode="numeric" min={10}
									 max={80} {...editForm.register("career_start", {valueAsNumber: true})} />
							{editForm.formState.errors.career_start && (
								<p className="text-destructive text-xs">{editForm.formState.errors.career_start.message}</p>
							)}
						</div>
					</form>
				</DialogContent>
				<DialogActions>
					<Button type="button" variant="outline" onClick={onClear} disabled={saveMutation.isPending}>Wyczyść
						dane</Button>
					<Button type="submit" form="analysis-edit-form" className="bg-[#007834FF]" disabled={saveMutation.isPending}
								aria-busy={saveMutation.isPending}>
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
