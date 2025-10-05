import { formatPLN } from "@/lib/utils";
import type { SalaryCalculateResponse, PensionPreviewResponse } from "@/lib/api";

const sexLabel = (value: any) => {
	if (value === 'male') return 'Mężczyzna';
	if (value === 'female') return 'Kobieta';
	if (value === 'unknown') return 'Nie chcę podawać';
	return '-';
}

const AnalysisTable = ({data, backend, preview}: { data: any, backend?: SalaryCalculateResponse | null, preview?: PensionPreviewResponse | null }) => {
	if (!data || Object.keys(data).length === 0) {
		return <p className="text-sm text-muted-foreground">Brak danych wejściowych. Wróć do formularza i uzupełnij
			informacje.</p>
	}

	const pct = (v?: number | null) => (typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(2)}%` : '-')

	return <>
		<div className="overflow-x-auto max-w-full bg-white">
			<table className="w-full text-sm border border-gray-200">
				<tbody>
        {/* Preview summary (if available) */}
        {preview && (
          <>
            <tr className="border-b border-gray-200">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Wiek emerytalny (symulacja)</th>
              <td className="px-3 py-2 text-muted-foreground">{preview.retirement_age} lat</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Lata do emerytury (symulacja)</th>
              <td className="px-3 py-2 text-muted-foreground">{preview.years_to_retirement}</td>
            </tr>
            <tr className="border-b border-gray-200 bg-stone-50/60">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Bieżąca pensja (nominalnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(preview.current_monthly_salary_nominal ?? preview.current_monthly_salary ?? data.pensjaNetto)}</td>
            </tr>
            <tr className="border-b border-gray-200 bg-stone-50/60">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Końcowa pensja (nominalnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(preview.final_monthly_salary_nominal)}</td>
            </tr>
            <tr className="border-b border-gray-200 bg-stone-50/60">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Końcowa pensja (realnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(preview.final_monthly_salary_real)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Emerytura miesięczna (nominalnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(preview.monthly_pension_nominal ?? preview.monthly_pension)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Emerytura miesięczna (realnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(preview.monthly_pension_real)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Stopa zastąpienia (nominalnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{pct(preview.replacement_rate_percent_nominal ?? preview.replacement_rate_percent)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Stopa zastąpienia (realnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{pct(preview.replacement_rate_percent_real)}</td>
            </tr>
            <tr className="border-b border-gray-200 bg-stone-50/60">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Kapitał I filar (nominalnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(preview.i_pillar_capital_nominal ?? preview.i_pillar_capital)}</td>
            </tr>
            <tr className="border-b border-gray-200 bg-stone-50/60">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Kapitał II filar (nominalnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(preview.ii_pillar_capital_nominal ?? preview.ii_pillar_capital)}</td>
            </tr>
            <tr className="border-b border-gray-200 bg-stone-50/60">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Kapitał łączny (nominalnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(preview.total_capital_nominal ?? preview.total_capital)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Kapitał I filar (realnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(preview.i_pillar_capital_real)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Kapitał II filar (realnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(preview.ii_pillar_capital_real)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Kapitał łączny (realnie)</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(preview.total_capital_real)}</td>
            </tr>
          </>
        )}

        {/* Backend results (if available) */}
        {backend && (
          <>
            <tr className="border-b border-gray-200 bg-stone-50/60">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Prognozowana pensja</th>
              <td className="px-3 py-2 text-muted-foreground">{formatPLN(backend.salary, 2)}</td>
            </tr>
            <tr className="border-b border-gray-200 bg-stone-50/60">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Lata doświadczenia (obliczone)</th>
              <td className="px-3 py-2 text-muted-foreground">{backend.experience_years}</td>
            </tr>
            <tr className="border-b border-gray-200 bg-stone-50/60">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Wiek emerytalny (obliczony)</th>
              <td className="px-3 py-2 text-muted-foreground">{backend.retirement_age} lat</td>
            </tr>
            <tr className="border-b border-gray-200 bg-stone-50/60">
              <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Lata do emerytury</th>
              <td className="px-3 py-2 text-muted-foreground">{backend.years_to_retirement}</td>
            </tr>
          </>
        )}

        {/* User-provided inputs */}
        <tr className="border-b border-gray-200">
          <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Płeć</th>
          <td className="px-3 py-2 text-muted-foreground">{sexLabel(data.sex)}</td>
        </tr>
        <tr className="border-b border-gray-200">
          <th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Wiek startu kariery</th>
          <td className="px-3 py-2 text-muted-foreground">{typeof data.career_start === 'number' ? data.career_start : '-'}</td>
        </tr>
				<tr className="border-b border-gray-200">
					<th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Stanowisko</th>
					<td className="px-3 py-2 text-muted-foreground">{data.stanowisko ?? "-"}</td>
				</tr>
				<tr className="border-b border-gray-200">
					<th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Wiek</th>
					<td className="px-3 py-2 text-muted-foreground">{data.wiek ?? "-"}</td>
				</tr>
				<tr className="border-b border-gray-200">
					<th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Miasto</th>
					<td className="px-3 py-2 text-muted-foreground">{data.miasto ?? "-"}</td>
				</tr>
				<tr className="border-b border-gray-200">
					<th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Pensja netto (podana)</th>
					<td className="px-3 py-2 text-muted-foreground">
						{typeof data.pensjaNetto === 'number' ? formatPLN(data.pensjaNetto) : "-"}
					</td>
				</tr>
				<tr className="border-b border-gray-200">
					<th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Wydatki miesięczne</th>
					<td className="px-3 py-2 text-muted-foreground">
						{typeof data.wydatkiMiesieczne === 'number' ? formatPLN(data.wydatkiMiesieczne) : "-"}
					</td>
				</tr>
				<tr className="border-b border-gray-200">
					<th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Oszczędności</th>
					<td className="px-3 py-2 text-muted-foreground">
						{typeof data.oszczednosci === 'number' ? formatPLN(data.oszczednosci) : "-"}
					</td>
				</tr>
				<tr className="border-b border-gray-200">
					<th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Procent oszczędności
					</th>
					<td className="px-3 py-2 text-muted-foreground">
						{typeof data.procentOszczednosci === 'number' ? `${data.procentOszczednosci}%` : "-"}
					</td>
				</tr>
				<tr className="border-b border-gray-200">
					<th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Stopa zwrotu</th>
					<td className="px-3 py-2 text-muted-foreground">
						{typeof data.stopaZwrotu === 'number' ? `${data.stopaZwrotu}%` : "-"}
					</td>
				</tr>
				<tr className="border-b border-gray-200">
					<th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Wiek emerytalny</th>
					<td className="px-3 py-2 text-muted-foreground">
						{data.wiekEmerytura ?? "-"} {data.wiekEmerytura ? "lat" : ""}
					</td>
				</tr>
				</tbody>
			</table>
		</div>
	</>
}

export default AnalysisTable;

