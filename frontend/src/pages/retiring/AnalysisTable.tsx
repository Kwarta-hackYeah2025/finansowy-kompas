import { formatPLN } from "@/lib/utils";
import type { SalaryCalculateResponse } from "@/lib/api";

const sexLabel = (value: any) => {
	if (value === 'male') return 'Mężczyzna';
	if (value === 'female') return 'Kobieta';
	if (value === 'unknown') return 'Nie chcę podawać';
	return '-';
}

const AnalysisTable = ({data, backend}: { data: any, backend?: SalaryCalculateResponse | null }) => {
	if (!data || Object.keys(data).length === 0) {
		return <p className="text-sm text-muted-foreground">Brak danych wejściowych. Wróć do formularza i uzupełnij
			informacje.</p>
	}

	return <>
		<div className="overflow-x-auto max-w-full bg-white">
			<table className="w-full text-sm border border-gray-200">
				<tbody>
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
					<th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Pensja netto</th>
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