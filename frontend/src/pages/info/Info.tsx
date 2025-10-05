import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent
} from "@/components/ui/chart"
import {Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis, Line, LineChart} from "recharts"
import * as React from "react"
import {formatPLN} from "@/lib/utils"
import {useNavigate} from "react-router"
import {colors} from "@/lib/colors"
import { loadRetiringData } from "@/lib/storage"
import { useQuery } from "@tanstack/react-query"
import { getFunFacts } from "@/lib/api"

const AVERAGE_PENSION = 3720 // PLN (mock)

const jobsData = [
	{
		position: "Programista",
		median: 5600,
		group: "powyżej mediany",
		description: "Specjaliści IT zazwyczaj posiadają długi staż pracy i wyższe zarobki, co przekłada się na wyższą podstawę składek."
	},
	{
		position: "Nauczyciel",
		median: 4100,
		group: "w okolicach średniej",
		description: "Stabilne zatrudnienie, umiarkowane składki – emerytura zwykle w okolicach średniej."
	},
	{
		position: "Pielęgniarka",
		median: 4300,
		group: "w okolicach średniej",
		description: "Wysoka aktywność zawodowa, praca zmianowa – składki odprowadzane regularnie."
	},
	{
		position: "Policjant",
		median: 5900,
		group: "powyżej mediany",
		description: "Służby mundurowe – odrębny system emerytalny, często wcześniejsze świadczenia."
	},
	{
		position: "Sprzedawca",
		median: 3100,
		group: "poniżej średniej",
		description: "Częste umowy krótkoterminowe i niższe wynagrodzenia obniżają podstawę składek."
	},
	{
		position: "Kierowca",
		median: 3800,
		group: "w okolicach średniej",
		description: "Zmienna aktywność, jednak długi staż pracy sprzyja wypracowaniu lat składkowych."
	},
	{
		position: "Księgowy",
		median: 5200,
		group: "powyżej mediany",
		description: "Stała praca biurowa i rosnące płace skutkują wyższą emeryturą."
	},
	{
		position: "Kasjer",
		median: 2900,
		group: "poniżej minimum",
		description: "Emerytury poniżej minimalnej: często niższa aktywność zawodowa, brak wymaganego stażu 25/20 lat."
	},
	{
		position: "Magazynier",
		median: 3400,
		group: "poniżej średniej",
		description: "Wahania zatrudnienia i wynagrodzeń wpływają na niższe składki."
	},
	{
		position: "Lekarz",
		median: 7800,
		group: "powyżej mediany",
		description: "Długie i intensywne kariery, wysokie wynagrodzenia i składki – wyższe świadczenia."
	},
] as const

const fallbackFacts = [
	"Czy wiesz, że najwyższą emeryturę w Polsce otrzymuje mieszkaniec województwa śląskiego – nieprzerwanie pracował przez dziesięciolecia i nie korzystał ze zwolnień lekarskich?",
	"Czy wiesz, że każdy dodatkowy rok pracy zwiększa Twoją przyszłą emeryturę, bo podnosi sumę zwaloryzowanych składek i skraca okres wypłaty?",
	"Czy wiesz, że przerwy w karierze (np. bezrobocie) mogą obniżyć przyszłe świadczenie przez brak składek?",
	"Czy wiesz, że średnia emerytura w Polsce różni się między regionami – wpływ mają wynagrodzenia i struktura zatrudnienia?",
] as const

const chartConfig = {
	median: {
		label: "Mediana",
		color: "hsl(var(--chart-4))",
	},
} satisfies ChartConfig

export default function Info() {
	const [desired, setDesired] = React.useState<number>(5000)
 const [fact, setFact] = React.useState<string>("")
 const [displayedFact, setDisplayedFact] = React.useState<string>("")
 const navigate = useNavigate()

 	// Pobierz ciekawostki z API
 	const { data: funFacts, isLoading: factsLoading, isError: factsError, refetch: refetchFacts } = useQuery({
 		queryKey: ["fun-facts"],
 		queryFn: getFunFacts,
 	})

	const diff = desired - AVERAGE_PENSION
 const diffLabel = diff >= 0 ? `+${formatPLN(diff)}` : `${formatPLN(diff)}`

 	// Ustaw losową ciekawostkę po załadowaniu danych
 	React.useEffect(() => {
 		const list = (funFacts && funFacts.length ? funFacts : Array.from(fallbackFacts)) as string[]
 		if (!list.length) return
 		setFact(prev => (prev && prev.length ? prev : list[Math.floor(Math.random() * list.length)]))
 	}, [funFacts])

 	// Efekt maszyny do pisania (pojawianie się literka po literce)
 	React.useEffect(() => {
 		let cancelled = false
 		setDisplayedFact("")
 		const text = fact || ""
 		if (!text) return
 		let i = 0
 		let timer: number | undefined
 		const step = () => {
 			if (cancelled) return
 			i = Math.min(i + 1, text.length)
 			setDisplayedFact(text.slice(0, i))
 			if (i < text.length) {
 				timer = window.setTimeout(step, 18) as unknown as number
 			}
 		}
 		timer = window.setTimeout(step, 18) as unknown as number
 		return () => {
 			cancelled = true
 			if (timer) window.clearTimeout(timer)
 		}
 	}, [fact])

	const jobsSorted = React.useMemo(() => {
		return [...jobsData].sort((a, b) => b.median - a.median)
	}, [])

	// Dane do komponentu: umowa a emerytura
	const savedForm = React.useMemo(() => (typeof window !== 'undefined' ? loadRetiringData() : null), [])
	const [salary, setSalary] = React.useState<number>(Math.max(0, Number(savedForm?.pensjaNetto ?? 8000)))
	const [activity, setActivity] = React.useState<number>(100) // % etatu średnio w karierze
	const [yearsMax, setYearsMax] = React.useState<number>(45)
	const ANNUITY_YEARS = 20 // uproszczony okres wypłaty
	const coeff = React.useMemo(() => ({ uop: 0.16, b2b: 0.06 }), [])
	const contractConfig = {
		uop: { label: "UoP (umowa o pracę)", color: colors.green },
		b2b: { label: "Zlecenie / B2B", color: colors.orange },
	} satisfies ChartConfig
	const contractData = React.useMemo(() => {
		const arr: Array<{ years: number; uop: number; b2b: number }> = []
		for (let y = 0; y <= yearsMax; y++) {
			const effYears = y * (activity / 100)
			const uopVal = (salary * effYears * coeff.uop) / ANNUITY_YEARS
			const b2bVal = (salary * effYears * coeff.b2b) / ANNUITY_YEARS
			arr.push({ years: y, uop: Math.max(0, Math.round(uopVal)), b2b: Math.max(0, Math.round(b2bVal)) })
		}
		return arr
	}, [salary, activity, coeff, yearsMax])

	const contractData5 = React.useMemo(() => {
		const arr = contractData
		if (!arr.length) return arr
		const filtered = arr.filter(d => d.years % 5 === 0)
		const last = arr[arr.length - 1]
		if (!filtered.length || filtered[filtered.length - 1].years !== last.years) {
			filtered.push(last)
		}
		return filtered
	}, [contractData])

	// X-axis ticks every ~5 years (ensure last value included)
	const yearsTicks = React.useMemo(() => {
		const out: number[] = []
		const step = 5
		for (let y = 0; y <= yearsMax; y += step) out.push(y)
		if (out.length === 0 || out[out.length - 1] !== yearsMax) out.push(yearsMax)
		return out
	}, [yearsMax])

	// Required salary (net and approx. gross) to achieve desired pension for each contract
	const effYearsTotal = React.useMemo(() => Math.max(0, yearsMax * (activity / 100)), [yearsMax, activity])
	const reqNetUop = React.useMemo(() => {
		if (!Number.isFinite(desired) || desired <= 0) return 0
		if (effYearsTotal <= 0 || coeff.uop <= 0) return NaN
		return (desired * ANNUITY_YEARS) / (effYearsTotal * coeff.uop)
	}, [desired, effYearsTotal, coeff])
	const reqNetB2B = React.useMemo(() => {
		if (!Number.isFinite(desired) || desired <= 0) return 0
		if (effYearsTotal <= 0 || coeff.b2b <= 0) return NaN
		return (desired * ANNUITY_YEARS) / (effYearsTotal * coeff.b2b)
	}, [desired, effYearsTotal, coeff])
	const approxGrossFromNetUop = (net: number) => (Number.isFinite(net) ? net / 0.72 : NaN)
	const approxGrossFromNetB2B = (net: number) => (Number.isFinite(net) ? net / 0.8 : NaN)
	const reqGrossUop = React.useMemo(() => approxGrossFromNetUop(reqNetUop), [reqNetUop])
	const reqGrossB2B = React.useMemo(() => approxGrossFromNetB2B(reqNetB2B), [reqNetB2B])

	// Interpolate color between blue (max) and navy (min)
	const hexToRgb = (hex: string) => {
		const h = hex.replace('#', '')
		const bigint = parseInt(h, 16)
		const r = (bigint >> 16) & 255
		const g = (bigint >> 8) & 255
		const b = bigint & 255
		return {r, g, b}
	}
	const rgbToHex = (r: number, g: number, b: number) => `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`
	const mix = (a: string, b: string, t: number) => {
		const A = hexToRgb(a);
		const B = hexToRgb(b)
		const r = Math.round(A.r + (B.r - A.r) * t)
		const g = Math.round(A.g + (B.g - A.g) * t)
		const bl = Math.round(A.b + (B.b - A.b) * t)
		return rgbToHex(r, g, bl)
	}

	// Use an em-space to add visual gap before position text in tooltip
	const SPACING = "\u2003" // em space
	const tooltipFormatter = (value: any, _name: any, _item: any, _index: number, payload: any) => {
		const desc = payload?.description as string | undefined
		const line = `${SPACING}${payload?.position} – ${payload?.group}${desc ? ` — ${desc}` : ""}`
		return [formatPLN(Number(value)), line]
	}

	const reroll = () => {
		const list = (funFacts && funFacts.length ? funFacts : Array.from(fallbackFacts)) as string[]
		if (!list.length) return
		let next = list[Math.floor(Math.random() * list.length)]
		if (list.length > 1) {
			let tries = 0
			while (next === fact && tries < 10) {
				next = list[Math.floor(Math.random() * list.length)]
				tries++
			}
		}
		setFact(next)
	}

	return (
		<div className="mx-auto w-full max-w-6xl mt-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Jaką chcesz mieć emeryturę?</CardTitle>
						<CardDescription>Podaj oczekiwaną kwotę. Porównamy ją z obecną średnią wysokością
							świadczenia.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
							<div className="flex-1">
								<label htmlFor="desired" className="text-sm font-medium">Oczekiwana emerytura (PLN/mies.)</label>
								<Input id="desired" type="number" inputMode="decimal" min={0} step="100" value={desired}
											 onChange={e => setDesired(Number(e.target.value || 0))}/>
							</div>
							<div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
								<Card className="p-3 min-w-44">
									<div className="text-xs text-muted-foreground">Obecna średnia</div>
									<div className="text-lg font-semibold">{formatPLN(AVERAGE_PENSION)}</div>
								</Card>
								<Card className="p-3 min-w-44">
									<div className="text-xs text-muted-foreground">Różnica do średniej</div>
									<div
										className={`text-lg font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{diffLabel}</div>
								</Card>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Ciekawostka</CardTitle>
						<CardDescription>Losowy fakt o emeryturach</CardDescription>
					</CardHeader>
					<CardContent>
						{factsLoading ? (
							<div className="flex items-center gap-3">
								<svg className="size-5 animate-spin text-muted-foreground" viewBox="0 0 24 24" aria-hidden="true">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
								</svg>
								<div className="flex-1">
									<div className="h-2.5 bg-muted/60 rounded w-4/5 mb-2 animate-pulse" />
									<div className="h-2 bg-muted/50 rounded w-3/5 animate-pulse" />
								</div>
							</div>
						) : (
							<>
								<p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{displayedFact}</p>
								<div className="flex gap-2">
									<Button variant="outline" onClick={reroll} disabled={!((funFacts?.length ?? 0) || (fallbackFacts.length ?? 0))}>Losuj ciekawostkę</Button>
									{factsError && (
										<Button variant="outline" onClick={() => refetchFacts()}>Spróbuj ponownie</Button>
									)}
								</div>
							</>
						)}
					</CardContent>
 			</Card>
			</div>
			
			{/* Nowy komponent: wpływ rodzaju umowy i aktywności na emeryturę */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Umowa a wysokość emerytury</CardTitle>
					<CardDescription>Porównaj, jak zmienia się szacowana emerytura przy różnym rodzaju umowy oraz poziomie aktywności zawodowej.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						{/* Highlighted required salary section */}
						<div className="gradient-border  rounded-xl p-[2px]">
							<div className="rounded-[10px] bg-white p-4">
								<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
									<div>
										<div className="text-xs uppercase tracking-wide text-muted-foreground">Aby osiągnąć emeryturę</div>
										<div className="text-2xl font-bold">{formatPLN(desired)}</div>
										<div className="text-xs text-muted-foreground">przy aktywności ok. {Math.round(activity)}% i stażu {Math.round(yearsMax)} lat</div>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
										<div className="rounded-lg border p-3">
											<div className="flex items-center justify-between">
												<span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `rgba(0, 120, 52, 0.11)`, color: colors.green }}>UoP</span>
												<span className="text-xs text-muted-foreground">NETTO</span>
											</div>
											<div className="text-xl sm:text-2xl font-semibold tabular-nums">
												{Number.isFinite(reqNetUop) ? formatPLN(reqNetUop) : '—'}
											</div>
											<div className="text-xs text-muted-foreground">BRUTTO: <span className="font-medium">{Number.isFinite(reqGrossUop) ? formatPLN(reqGrossUop) : '—'}</span></div>
										</div>
										<div className="rounded-lg border p-3">
											<div className="flex items-center justify-between">
												<span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `rgba(255, 179, 79, 0.09)`, color: '#ec9b34' }}>Zlecenie / B2B</span>
												<span className="text-xs text-muted-foreground">NETTO</span>
											</div>
											<div className="text-xl sm:text-2xl font-semibold tabular-nums">
												{Number.isFinite(reqNetB2B) ? formatPLN(reqNetB2B) : '—'}
											</div>
											<div className="text-xs text-muted-foreground">BRUTTO: <span className="font-medium">{Number.isFinite(reqGrossB2B) ? formatPLN(reqGrossB2B) : '—'}</span></div>
										</div>
									</div>
								</div>
								<div className="text-[11px] text-muted-foreground mt-2">Szacunki bazują na uproszczonym modelu (udział składek w pensji i okres wypłaty). Rzeczywiste podatki i koszty mogą się różnić.</div>
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 						<div>
 							<label htmlFor="salaryRange" className="text-sm font-medium">Średnie miesięczne zarobki (PLN)</label>
 							<div className="flex items-center gap-3">
 								<input id="salaryRange" type="range" min={3000} max={50000} step={500} className="w-full" value={salary} onChange={(e) => setSalary(Number(e.target.value || 0))} style={{ accentColor: colors.green }} />
 								<Input type="number" inputMode="decimal" min={0} step={100} value={salary} onChange={(e) => setSalary(Number(e.target.value || 0))} />
 							</div>
 						</div>
 						<div>
 							<label htmlFor="activity" className="text-sm font-medium">Aktywność zawodowa (średnio % etatu)</label>
 							<div className="flex items-center gap-3">
 								<input id="activity" type="range" min={20} max={100} step={5} className="w-full" value={activity} onChange={(e) => setActivity(Number(e.target.value || 0))} style={{ accentColor: '#a8804b' }} />
 								<Input type="number" inputMode="numeric" min={0} max={100} step={1} value={activity} onChange={(e) => setActivity(Number(e.target.value || 0))} />
 							</div>
 						</div>
 						<div>
 							<label htmlFor="yearsMax" className="text-sm font-medium">Liczba lat pracy</label>
 							<div className="flex items-center gap-3">
 								<input id="yearsMax" type="range" min={0} max={90} step={1} className="w-full" value={yearsMax} onChange={(e) => setYearsMax(Number(e.target.value || 0))} style={{ accentColor: colors.navy }} />
 								<Input type="number" inputMode="numeric" min={0} max={90} step={1} value={yearsMax} onChange={(e) => setYearsMax(Number(e.target.value || 0))} />
 							</div>
 						</div>
 					</div>
						<ChartContainer config={contractConfig} className="w-full h-[420px]">
 						<LineChart data={contractData5} margin={{ left: 16, right: 16, top: 10, bottom: 10 }}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="years" tickMargin={8} ticks={yearsTicks} tickFormatter={(v: number) => `${v} lat`} />
								<YAxis tickMargin={8} tickFormatter={(v: number) => formatPLN(Number(v))} />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Line type="monotone" dataKey="uop" stroke="var(--color-uop)" strokeWidth={2.5} dot={false}>
 								<LabelList dataKey="uop" content={(props: any) => {
 									const { x, y, value } = props
 									if (x == null || y == null) return null
 									const label = formatPLN(Number(value))
 									const fontSize = 14
 									const paddingX = 6
 									const paddingY = 4
 									const charWidth = fontSize * 0.6
 									const textWidth = Math.max(20, label.length * charWidth)
 									const w = textWidth + paddingX * 2
 									const h = fontSize + paddingY * 2
 									const rectX = x - w / 2
 									const rectY = (y - 8) - h / 2
 									return (
 										<g pointerEvents="none">
  										<rect x={rectX} y={rectY} width={w} height={h} fill="#fff" stroke="var(--color-uop)" strokeWidth={1} rx={4} ry={4} />
  										<text x={x} y={y - 8} textAnchor="middle" fill="var(--color-uop)" fontSize={14} dominantBaseline="middle">
 												{label}
 											</text>
 										</g>
 									)
 								}} />
								</Line>
								<Line type="monotone" dataKey="b2b" stroke="var(--color-b2b)" strokeWidth={2.5} dot={false}>
									<LabelList dataKey="b2b" content={(props: any) => {
										const { x, y, value } = props
										if (x == null || y == null) return null
 									const label = formatPLN(Number(value))
 									const fontSize = 14
 									const paddingX = 6
 									const paddingY = 4
 									const charWidth = fontSize * 0.6
 									const textWidth = Math.max(20, label.length * charWidth)
 									const w = textWidth + paddingX * 2
 									const h = fontSize + paddingY * 2
 									const rectX = x - w / 2
 									const rectY = (y - 8) - h / 2
 									return (
 										<g pointerEvents="none">
  										<rect x={rectX} y={rectY} width={w} height={h} fill="#fff" stroke="var(--color-b2b)" strokeWidth={1} rx={4} ry={4} />
  										<text x={x} y={y - 8} textAnchor="middle" fill="var(--color-b2b)" fontSize={14} dominantBaseline="middle">
 												{label}
 											</text>
 										</g>
 									)
 								}} />
								</Line>
								<ChartLegend content={<ChartLegendContent />} />
							</LineChart>
						</ChartContainer>
						<p className="text-xs text-muted-foreground">
							Emerytury poniżej minimalnej: świadczeniobiorcy otrzymujący emeryturę w wysokości poniżej minimalnej wykazywali się niską aktywnością zawodową – nie przepracowali minimum 25 lat (mężczyźni) i 20 lat (kobiety), w związku z tym nie nabyli prawa do gwarancji minimalnej emerytury.
						</p>
					</div>
				</CardContent>
			</Card>
			
			<Card>
				<CardHeader>
					<CardTitle>Mediany emerytur dla przykładowych stanowisk</CardTitle>
					<CardDescription>Najedź na słupek, aby zobaczyć charakterystykę grupy.</CardDescription>
				</CardHeader>
				<CardContent>
					<ChartContainer config={chartConfig} className="w-full h-[480px]">
						<BarChart data={jobsSorted} layout="vertical" margin={{left: 20, right: 80, top: 10, bottom: 10}}>
							<CartesianGrid strokeDasharray="3 3"/>
							<XAxis type="number" tickFormatter={(v) => formatPLN(Number(v))}/>
							<YAxis type="category" dataKey="position" width={160}/>
							<ChartTooltip content={<ChartTooltipContent formatter={tooltipFormatter}/>}/>
							<Bar dataKey="median" radius={[4, 4, 4, 4]}>
								{jobsSorted.map((_, i) => {
									const t = jobsSorted.length > 1 ? i / (jobsSorted.length - 1) : 0
									const fill = mix(colors.blue, colors.navy, t)
									return <Cell key={`cell-${i}`} fill={fill}/>
								})}
								<LabelList dataKey="median" content={(props: any) => {
									const {x, y, width, value} = props
									if (x == null || y == null || width == null) return null
									const labelX = x + width + 8
									const labelY = y + 12
									return (
										<text x={labelX} y={labelY} fill="var(--foreground)" fontSize={12}>
											{formatPLN(Number(value))}
										</text>
									)
								}}/>
							</Bar>
							<ChartLegend content={<ChartLegendContent/>}/>
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>

			<Card className="flex w-full items-end mt-6 py-2 px-4">
				<Button onClick={() => navigate('/emerytura')} className="bg-[#007834FF] w-min">Przejdź do symulacji</Button>
			</Card>
		</div>
	)
}
