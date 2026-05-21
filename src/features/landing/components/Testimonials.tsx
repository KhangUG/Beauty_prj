import { motion } from 'framer-motion'

const quotes = [
  { id: 1, text: 'Transformed my routine — results in weeks.', author: 'A. Rivera' },
  { id: 2, text: 'Feels like a personal dermatologist in my pocket.', author: 'S. Kim' },
  { id: 3, text: 'Luxurious, thoughtful and accurate.', author: 'M. Laurent' },
]

export default function Testimonials() {
  return (
    <div>
      <h3 className="text-xl font-extrabold mb-4">What people say</h3>
      <div className="flex gap-4 overflow-x-auto py-2">
        {quotes.map((q) => (
          <motion.div key={q.id} className="min-w-[240px] p-4 bg-white/60 rounded-2xl border" whileHover={{ y: -6 }}>
            <p className="text-sm">“{q.text}”</p>
            <p className="mt-3 text-xs font-semibold">— {q.author}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
