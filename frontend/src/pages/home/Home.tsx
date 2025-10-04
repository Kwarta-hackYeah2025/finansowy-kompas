"use client"
import hero from '../../assets/hero.png';

const Home = () => {
	return <div>
		<div className="relative h-full max-h-[calc(100vh-1rem)]">
			<img src={hero} alt="Hero" className="w-full h-full object-cover grayscale-55"/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
			<div className="absolute inset-0 flex items-center justify-center text-center">
				<div className="backdrop-blur-sm bg-black/20 rounded-xl px-8 py-10 ring-1 ring-white/30">
	<span
		className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-stone-300 to-amber-300 transition-colors duration-700 hover:from-sky-300 hover:via-emerald-300 hover:to-lime-300">
		Witaj w Kompasie Finansowym!
	</span>
				</div>
			</div>
		</div>
	</div>
}

export default Home;


