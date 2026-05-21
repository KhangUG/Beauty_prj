import { motion } from 'framer-motion'

export default function DashboardPreview() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <motion.div className="p-4 rounded-2xl bg-white/60 border" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h4 className="font-semibold">AI Insights</h4>
        <div className="mt-3 h-40 bg-gradient-to-br from-white/40 to-rose-50 rounded-lg flex items-center justify-center">Chart placeholder</div>
      </motion.div>

      <motion.div className="p-4 rounded-2xl bg-white/60 border" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h4 className="font-semibold">Routine Builder</h4>
        <div className="mt-3 h-40 bg-gradient-to-br from-white/40 to-rose-50 rounded-lg flex items-center justify-center">Cards</div>
      </motion.div>

      <motion.div className="p-4 rounded-2xl bg-white/60 border" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h4 className="font-semibold">Trends</h4>
        <div className="mt-3 h-40 bg-gradient-to-br from-white/40 to-rose-50 rounded-lg flex items-center justify-center">Metrics</div>
      </motion.div>
    </div>
  )
}
