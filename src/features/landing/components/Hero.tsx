import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-600">Beauty · AI · Lux</p>
        <h1 className="mt-4 max-w-xl font-display text-5xl font-extrabold leading-[0.96] text-rose-950 lg:text-7xl">
          The Future of <span className="text-rose-500">Radiance</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-rose-700">
          Experience cinematic AI skincare profiling and curated luxury routines tailored to your skin signature.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <button className="rounded-full bg-rose-600 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110">Start AI Scan</button>
          <button className="rounded-full border border-rose-200 bg-white/70 px-6 py-3 font-semibold text-rose-800">Explore Features</button>
        </div>

        <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-xs text-rose-700">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm">
            <p className="uppercase tracking-[0.2em] text-cyan-600">Skin Score</p>
            <p className="mt-2 text-2xl font-black text-rose-950">86</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm">
            <p className="uppercase tracking-[0.2em] text-cyan-600">Hydration</p>
            <p className="mt-2 text-2xl font-black text-rose-950">High</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm">
            <p className="uppercase tracking-[0.2em] text-cyan-600">Match</p>
            <p className="mt-2 text-2xl font-black text-rose-950">98%</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-tr from-white/90 via-rose-50/80 to-pink-100/80 shadow-[0_30px_80px_rgba(255,192,203,0.25)] backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_55%)]" />
        <img
          src="/luxury-demo.svg"
          alt="Luxury beauty product"
          className="h-[30rem] w-full object-cover opacity-92"
        />
        <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-600">Featured Product</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-semibold text-rose-950">Rose Quartz Serum</h3>
              <p className="mt-1 text-sm text-rose-700">Hydrate, glow, and smooth with a luminous finish.</p>
            </div>
            <p className="text-right text-sm font-semibold text-rose-900">$68</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
