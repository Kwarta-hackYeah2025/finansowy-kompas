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
import {Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis} from "recharts"
import * as React from "react"
import {formatPLN} from "@/lib/utils"
import {useNavigate} from "react-router"
import {colors} from "@/lib/colors"

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

const facts = [
	"Czy wiesz, że najwyższą emeryturę w Polsce otrzymuje mieszkaniec województwa śląskiego – nieprzerwanie pracował przez dziesięciolecia i nie korzystał ze zwolnień lekarskich?",
	"Czy wiesz, że każdy dodatkowy rok pracy zwiększa Twoją przyszłą emeryturę, bo podnosi sumę zwaloryzowanych składek i skraca okres wypłaty?",
	"Czy wiesz, że przerwy w karierze (np. bezrobocie) mogą obniżyć przyszłe świadczenie przez brak składek?",
	"Czy wiesz, że średnia emerytura w Polsce różni się między regionami – wpływ mają wynagrodzenia i struktura zatrudnienia?",
]

const chartConfig = {
	median: {
		label: "Mediana",
		color: "hsl(var(--chart-4))",
	},
} satisfies ChartConfig

export default function Info() {
	const [desired, setDesired] = React.useState<number>(5000)
	const [fact, setFact] = React.useState<string>(facts[Math.floor(Math.random() * facts.length)])
	const navigate = useNavigate()

	const diff = desired - AVERAGE_PENSION
	const diffLabel = diff >= 0 ? `+${formatPLN(diff)}` : `${formatPLN(diff)}`

	const jobsSorted = React.useMemo(() => {
		return [...jobsData].sort((a, b) => b.median - a.median)
	}, [])

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
		const next = facts[Math.floor(Math.random() * facts.length)]
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
						<p className="text-sm text-muted-foreground mb-3">{fact}</p>
						<Button variant="outline" onClick={reroll}>Losuj ciekawostkę</Button>
					</CardContent>
				</Card>
			</div>

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
