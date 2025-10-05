// filepath: /Users/kamilzak/finansowy-kompas/frontend/src/pages/retiring/DetailsTiles.tsx
import * as React from "react"
import type {PensionPreviewResponse, SalaryCalculateResponse} from "@/lib/api"
import {formatPLN} from "@/lib/utils"
import {darken} from "@mui/material";

function stripAlpha(hex: string): string {
	// Support #RRGGBB or #RRGGBBAA – return #RRGGBB
	if (!hex) return "#000000"
	if (hex.length === 9) return hex.slice(0, 7)
	return hex
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const h = stripAlpha(hex).replace("#", "")
	const bigint = parseInt(h, 16)
	const r = (bigint >> 16) & 255
	const g = (bigint >> 8) & 255
	const b = bigint & 255
	return {r, g, b}
}

function lighten(hex: string, amount: number): string {
	// amount: 0..1
	const {r, g, b} = hexToRgb(hex)
	const rr = Math.round(r + (255 - r) * amount)
	const gg = Math.round(g + (255 - g) * amount)
	const bb = Math.round(b + (255 - b) * amount)
	return `rgb(${rr}, ${gg}, ${bb})`
}

function gradientForIndex(base: string, index: number, total: number): { from: string; to: string; border: string } {
	// darkest -> lightest left to right
	if (total <= 1) {
		const from = lighten(base, 0.15)
		return {from, to: darken(base, 0.35), border: stripAlpha(base)}
	}
	const t = index / (total - 1) // 0..1
	const from = lighten(base, Math.max(0.08, 0.18 - t * 0.08))
	const to = darken(base, .25) // 0.2 .. 0.65
	return {from, to, border: stripAlpha(base)}
}

type Props = {
	data: any
	backend: SalaryCalculateResponse | null | undefined
	preview: PensionPreviewResponse | null | undefined
}

const DetailsTiles: React.FC<Props> = ({data, backend, preview}) => {
	// Build rows of tiles; one base color per row
	// Row 1 (green): Wynagrodzenia
	const row1 = [
		{
			label: "Bieżąca pensja (nom.)",
			value: formatPLN(preview?.current_monthly_salary_nominal ?? preview?.current_monthly_salary ?? data?.pensjaNetto),
		},
		{label: "Końcowa pensja (nom.)", value: formatPLN(preview?.final_monthly_salary_nominal)},
		{label: "Końcowa pensja (real.)", value: formatPLN(preview?.final_monthly_salary_real)},
		{label: "Wiek emerytalny", value: preview?.retirement_age != null ? `${preview?.retirement_age} lat` : "-"},
		{
			label: "Lata do emerytury",
			value: preview?.years_to_retirement != null ? String(preview?.years_to_retirement) : "-"
		},
	]

	// Row 2 (orange): Emerytura
	const row2 = [
		{label: "Emerytura mies. (nom.)", value: formatPLN(preview?.monthly_pension_nominal ?? preview?.monthly_pension)},
		{label: "Emerytura mies. (real.)", value: formatPLN(preview?.monthly_pension_real)},
		{
			label: "Stopa zastąpienia (nom.)",
			value: typeof (preview?.replacement_rate_percent_nominal ?? preview?.replacement_rate_percent) === 'number'
				? `${(preview?.replacement_rate_percent_nominal ?? preview?.replacement_rate_percent)?.toFixed(2)}%`
				: "-",
		},
		{
			label: "Stopa zastąpienia (real.)",
			value: typeof preview?.replacement_rate_percent_real === 'number' ? `${preview?.replacement_rate_percent_real?.toFixed(2)}%` : "-",
		},
	]

	// Row 3 (blue): Kapitał nominalny
	const row3 = [
		{label: "Kapitał I filar (nom.)", value: formatPLN(preview?.i_pillar_capital_nominal ?? preview?.i_pillar_capital)},
		{
			label: "Kapitał II filar (nom.)",
			value: formatPLN(preview?.ii_pillar_capital_nominal ?? preview?.ii_pillar_capital)
		},
		{label: "Kapitał łączny (nom.)", value: formatPLN(preview?.total_capital_nominal ?? preview?.total_capital)},
	]

	// Row 4 (navy): Kapitał realny
	const row4 = [
		{label: "Kapitał I filar (real.)", value: formatPLN(preview?.i_pillar_capital_real)},
		{label: "Kapitał II filar (real.)", value: formatPLN(preview?.ii_pillar_capital_real)},
		{label: "Kapitał łączny (real.)", value: formatPLN(preview?.total_capital_real)},
	]

	// Row 5 (optional, navy/blue/orange/green rotation?): Dodatkowe dane wejściowe bez oszczędności/procentu
	const row5 = [
		{
			label: "Płeć",
			value: data?.sex === 'male' ? 'Mężczyzna' : data?.sex === 'female' ? 'Kobieta' : data?.sex ? 'Nie chcę podawać' : '-'
		},
		{label: "Miasto", value: data?.miasto ?? '-'},
		{label: "Wiek startu kariery", value: typeof data?.career_start === 'number' ? String(data.career_start) : '-'},
	]

	const rows: Array<{ color: string; items: Array<{ label: string; value: string }> }> = [
		{color: '#00672d', items: row1},
		{color: "#e68301", items: row2},
		{color: "#00416e", items: row3},
		{color: "#bc4747", items: row4},
		{color: "#86878e", items: row5},
	]

	return (
		<div className="flex flex-col gap-4">
			{rows.map((row, rIdx) => {
				const items = row.items.filter(Boolean)
				if (!items.length) return null
				const base = row.color
				const colClasses = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
				return (
					<div key={`row-${rIdx}`} className={colClasses}>
						{items.map((tile, idx) => {
							const grad = gradientForIndex(base, idx, items.length)
							const style: React.CSSProperties = {
								background: `linear-gradient(135deg, ${grad.from} 0%, ${grad.to} 100%)`,
								borderColor: grad.border,
							}
							return (
								<div
									key={`tile-${rIdx}-${idx}`}
									className="rounded-xl border shadow-sm p-3 min-h-[88px] flex flex-col justify-between"
									style={style}
								>
									<div className="text-[11px] uppercase tracking-wide text-white/90 drop-shadow-sm">{tile.label}</div>
									<div className="text-lg font-semibold text-white drop-shadow-sm">{tile.value}</div>
								</div>
							)
						})}
					</div>
				)
			})}
		</div>
	)
}

export default DetailsTiles

