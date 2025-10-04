import { formatPLN } from "@/lib/utils";

const AnalysisTable = ({data}: { data: any }) => {
	if (!data || Object.keys(data).length === 0) {
		return <p className="text-sm text-muted-foreground">Brak danych wejściowych. Wróć do formularza i uzupełnij
			informacje.</p>
	}

	return <>
		<div className="overflow-x-auto max-w-full bg-white">
			<table className="w-full text-sm border border-gray-200">
				<tbody>
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
				<tr>
					<th scope="row" className="text-left font-medium px-3 py-2 border-r border-gray-200">Lata doświadczenia</th>
					<td className="px-3 py-2 text-muted-foreground">{data.lataDoswiadczenia ?? "-"}</td>
				</tr>
				</tbody>
			</table>
		</div>
	</>
}

export default AnalysisTable;