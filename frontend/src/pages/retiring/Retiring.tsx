import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import {type Resolver, type SubmitHandler, useForm} from "react-hook-form"
import {useNavigate} from "react-router"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import { retiringSchema, type RetiringFormValues, defaultRetiringValues } from "@/pages/retiring/schema"
import { loadRetiringData, saveRetiringData, removeRetiringData } from "@/lib/storage"
import * as React from "react"

const schema = retiringSchema

const Retiring = () => {
	const navigate = useNavigate()

  const saved = typeof window !== 'undefined' ? loadRetiringData() : null

	const form = useForm<RetiringFormValues>({
		resolver: zodResolver(schema) as Resolver<RetiringFormValues>,
		defaultValues: saved ?? defaultRetiringValues,
		mode: "onBlur",
	})

  // Debounced auto-save on change
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      const handle = setTimeout(() => {
        const res = schema.safeParse(values as any)
        if (res.success) {
          saveRetiringData(res.data)
        }
      }, 400)
      return () => clearTimeout(handle)
    })
    return () => subscription.unsubscribe()
  }, [form])

	const onSubmit: SubmitHandler<RetiringFormValues> = (values) => {
    saveRetiringData(values)
		navigate("/emerytura/analiza", {state: values})
	}

  const onClear = () => {
    removeRetiringData()
    form.reset(defaultRetiringValues)
  }

	const {register, handleSubmit, formState: {errors, isSubmitting}} = form

	return (
		<div className="mx-auto w-full max-w-4xl mt-10">
			<Card className="bg-stone-50 pt-0 pb-8">
				<CardHeader className="bg-white pt-4 rounded-t-xl border-b">
					<CardTitle className="text-2xl">Wpisz podstawowe dane aby przeanalizować Twoją przyszłość</CardTitle>
					<CardDescription>Wypełnij formularz. Wartości procentowe podawaj jako % (np. 6 oznacza 6%).</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div className="flex flex-col gap-2">
							<Label htmlFor="stanowisko" required>Stanowisko</Label>
							<Input id="stanowisko" placeholder="np. Programista" {...register("stanowisko")} />
							{errors.stanowisko && <p className="text-destructive text-sm">{errors.stanowisko.message}</p>}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="wiek" required>Wiek</Label>
							<Input id="wiek" type="number" inputMode="numeric" min={16}
										 max={100} {...register("wiek", {valueAsNumber: true})} />
							{errors.wiek && <p className="text-destructive text-sm">{errors.wiek.message}</p>}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="miasto" required>Miasto</Label>
							<Input id="miasto" placeholder="np. Warszawa" {...register("miasto")} />
							{errors.miasto && <p className="text-destructive text-sm">{errors.miasto.message}</p>}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="pensjaNetto" required>Pensja netto (PLN/mies.)</Label>
							<Input id="pensjaNetto" type="number" inputMode="decimal" step="0.01"
										 min={0} {...register("pensjaNetto", {valueAsNumber: true})} />
							{errors.pensjaNetto && <p className="text-destructive text-sm">{errors.pensjaNetto.message}</p>}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="wydatkiMiesieczne" required>Wydatki miesięczne (PLN)</Label>
							<Input id="wydatkiMiesieczne" type="number" inputMode="decimal" step="0.01"
										 min={0} {...register("wydatkiMiesieczne", {valueAsNumber: true})} />
							{errors.wydatkiMiesieczne &&
								<p className="text-destructive text-sm">{errors.wydatkiMiesieczne.message}</p>}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="oszczednosci" required>Oszczędności (PLN)</Label>
							<Input id="oszczednosci" type="number" inputMode="decimal" step="0.01"
										 min={0} {...register("oszczednosci", {valueAsNumber: true})} />
							{errors.oszczednosci && <p className="text-destructive text-sm">{errors.oszczednosci.message}</p>}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="procentOszczednosci" required>Procent oszczędności (% z pensji)</Label>
							<Input id="procentOszczednosci" type="number" inputMode="decimal" step="0.01" min={0}
										 max={100} {...register("procentOszczednosci", {valueAsNumber: true})} />
							{errors.procentOszczednosci &&
								<p className="text-destructive text-sm">{errors.procentOszczednosci.message}</p>}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="stopaZwrotu" required>Przewidywana stopa zwrotu z inwestycji (% rocznie)</Label>
							<Input id="stopaZwrotu" type="number" inputMode="decimal" step="0.01" min={-50}
										 max={50} {...register("stopaZwrotu", {valueAsNumber: true})} />
							{errors.stopaZwrotu && <p className="text-destructive text-sm">{errors.stopaZwrotu.message}</p>}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="wiekEmerytura" required>Planowany wiek przejścia na emeryturę</Label>
							<Input id="wiekEmerytura" type="number" inputMode="numeric" min={40}
										 max={85} {...register("wiekEmerytura", {valueAsNumber: true})} />
							{errors.wiekEmerytura && <p className="text-destructive text-sm">{errors.wiekEmerytura.message}</p>}
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="lataDoswiadczenia" required>Lata doświadczenia na obecnym stanowisku</Label>
							<Input id="lataDoswiadczenia" type="number" inputMode="decimal" step="0.1"
										 min={0} {...register("lataDoswiadczenia", {valueAsNumber: true})} />
							{errors.lataDoswiadczenia &&
								<p className="text-destructive text-sm">{errors.lataDoswiadczenia.message}</p>}
						</div>

						<div className="md:col-span-2 flex justify-between gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClear}>Wyczyść dane</Button>
							<Button type="submit" disabled={isSubmitting} className="min-w-40 bg-[#007834FF]">Przejdź do analizy</Button>
						</div>
					</form>
				</CardContent>
				<CardFooter className="justify-between text-muted-foreground text-xs">
					<span>Dane pozostają tylko w tej sesji przeglądarki.</span>
				</CardFooter>
			</Card>
		</div>
	)
}

export default Retiring;