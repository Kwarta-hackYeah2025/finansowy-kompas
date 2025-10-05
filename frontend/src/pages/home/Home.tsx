"use client";
import {motion} from "framer-motion";
import hero from "../../assets/hero.webp";
import {Button} from "@/components/ui/button";
import {useNavigate} from "react-router";

const Home = () => {
	const navigate = useNavigate();
	const btnStyles =
		"px-20 text-2xl h-16 ring-1 ring-white/30 rounded-sm cursor-pointer bg-gradient-to-br from-[#00993f] to-[#007834FF] hover:to-[#ffb34f] transition-colors duration-300";

	const slideDown = {
		hidden: {opacity: 0, y: -100},
		visible: (i: number) => ({
			opacity: 1,
			y: 20,
			transition: {
				delay: i * 0.5,
				duration: 1,
				ease: "easeOut",
			},
		}),
	} as const;


	return (
		<div className="relative h-full max-h-[calc(100vh-1rem)]">
			<img
				src={hero}
				alt="Hero"
				className="w-full h-full object-cover grayscale-55"
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>

			<div className="absolute inset-0 flex flex-col items-center md:items-end justify-center text-center space-y-10">
				{/* Dół → Góra */}
				<div className="w-full">
					{/* Tekst główny */}
					<div className="backdrop-blur-sm bg-black/35 px-8 pb-8 ring-1 ring-white/30 z-20 w-full">
						<span
							className="text-5xl md:text-6xl whitespace-pre-wrap font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-stone-300 to-amber-300 transition-colors duration-700 hover:from-sky-300 hover:via-emerald-300 hover:to-lime-300">
							<span className="text-xl md:text-2xl">Witaj w{'\n'}</span> Finansowym{'\n'} Kompasie!
						</span>
					</div>

					{/* Góra → Dół */}
					<div className="flex w-full justify-center gap-6 md:gap-8 z-10">
						{["Wartość pieniądza", "Emerytura"].map((text, i) => (
							<motion.div
								key={text}
								custom={i}
								// @ts-expect-error framer-motion dynamic variants typing
								variants={slideDown}
								initial="hidden"
								animate="visible"
							>
								<Button className={btnStyles}>{text}</Button>
							</motion.div>
						))}

						{/* CTA: przeniesione tutaj, responsywne i z pulsującym highlightem */}

					</div>
					<motion.div
						custom={3}
						// @ts-expect-error framer-motion dynamic variants typing
						variants={slideDown}
						initial="hidden"
						animate="visible"
						className="mx-auto mt-10 w-fit"
					>
						<div id="box" className="gradient-border pulse-ring text-3xl z-10">
							<Button
								onClick={() => navigate("/emerytura")}
								className="w-full leading-4 uppercase whitespace-pre-wrap h-full text-xl md:text-2xl rounded-[3rem] cursor-pointer bg-gradient-to-t from-stone-100 to-stone-300 text-emerald-950 hover:shadow-2xl hover:text-emerald-800 py-4 px-10"
								variant="secondary"
							>
								Rozpocznij analizę {'\n'} swojej przyszłości...
							</Button>
						</div>
					</motion.div>
				</div>
			</div>
			{/* Usunięto absolutnie pozycjonowany CTA, aby nie nachodził na treść */}
		</div>
	);
};

export default Home;
