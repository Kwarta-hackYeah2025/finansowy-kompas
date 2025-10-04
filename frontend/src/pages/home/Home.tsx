"use client";
import {motion} from "framer-motion";
import hero from "../../assets/hero.png";
import {Button} from "@/components/ui/button";

const Home = () => {
	const btnStyles = "px-20 text-2xl h-16 ring-1 ring-white/30 cursor-pointer bg-emerald-800 bg-gradient-to-t from-emerald-700 to-emerald-600";

	// warianty animacji dla przycisków
	const slideUp = {
		hidden: {opacity: 0, y: 100},
		visible: (i: number) => ({
			opacity: 1,
			y: 0,
			transition: {delay: i * 0.5, duration: 1, ease: "easeOut"},
		}),
	};

	const slideDown = {
		hidden: {opacity: 0, y: -100},
		visible: (i: number) => ({
			opacity: 1,
			y: 0,
			transition: {delay: i * 0.5, duration: 1, ease: "easeOut"},
		}),
	};

	return (
		<div className="relative h-full max-h-[calc(100vh-1rem)]">
			<img
				src={hero}
				alt="Hero"
				className="w-full h-full object-cover grayscale-55"
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

			<div className="absolute inset-0 flex flex-col items-end justify-center text-center space-y-10">
				{/* Dół → Góra */}
				<div className="w-[500px] mr-10">
					<div className="flex w-full justify-between gap-8">
						{["Inflacja", "PPK"].map((text, i) => (
							<motion.div
								key={text}
								custom={i}
								variants={slideUp}
								initial="hidden"
								animate="visible"
							>
								<Button className={btnStyles}>{text}</Button>
							</motion.div>
						))}
					</div>

					{/* Tekst główny */}
					<div className="backdrop-blur-sm bg-black/20 rounded-xl px-8 py-8 ring-1 ring-white/30 z-20 w-full">
  <span
		className="text-6xl whitespace-pre-wrap font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-stone-300 to-amber-300 transition-colors duration-700 hover:from-sky-300 hover:via-emerald-300 hover:to-lime-300">
    <span className="text-2xl">Witaj w{'\n'}</span> Finansowym{'\n'} Kompasie!
  </span>
					</div>

					{/* Góra → Dół */}
					<div className="flex w-full justify-between gap-8 z-10">
						{["Giełda", "Lokaty"].map((text, i) => (
							<motion.div
								key={text}
								custom={i}
								variants={slideDown}
								initial="hidden"
								animate="visible"
							>
								<Button className={btnStyles}>{text}</Button>
							</motion.div>
						))}
					</div>
				</div>
			</div>

		</div>
	);
};

export default Home;
