import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowUpRight, ShoppingCart } from 'lucide-react'
import { type ProductRecommendation } from '@/shared/lib/types'

const PAGE_SIZE = 6

type ScanProductGridProps = {
  products: ProductRecommendation[]
}

function getPartnerName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    if (hostname.includes('sephora')) return 'Sephora'
    if (hostname.includes('ulta')) return 'Ulta'
    if (hostname.includes('dermstore')) return 'Dermstore'
    if (hostname.includes('amazon')) return 'Amazon'
    const parts = hostname.split('.')
    const name = parts[0] ?? 'Shop'
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return 'Shop'
  }
}

function CompactProductCard({ product, index }: { product: ProductRecommendation; index: number }) {
  const partner = getPartnerName(product.externalLink)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-rose-100/80 bg-white/70 shadow-sm backdrop-blur-sm hover:border-rose-200 hover:shadow-md transition-all duration-300"
    >
      {/* Product image - short height */}
      <div className="relative h-32 overflow-hidden bg-rose-50/40">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-rose-500 shadow-sm backdrop-blur-sm">
          {product.category}
        </span>
      </div>

      {/* Info area */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h4 className="line-clamp-2 text-xs font-extrabold leading-snug text-rose-950">{product.name}</h4>
        <p className="line-clamp-2 text-[10px] leading-relaxed text-mist/80">{product.reason}</p>

        <a
          href={product.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto block w-full"
        >
          <button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 px-2 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm shadow-rose-500/15 transition-all duration-200 hover:brightness-105 active:scale-[0.97]">
            <ShoppingCart className="h-3 w-3" />
            {partner}
            <ArrowUpRight className="h-3 w-3 opacity-75" />
          </button>
        </a>
      </div>
    </motion.div>
  )
}

export function ScanProductGrid({ products }: ScanProductGridProps) {
  const [page, setPage] = useState(0)
  const [direction, setDirection] = useState(1)

  const totalPages = Math.ceil(products.length / PAGE_SIZE)
  const start = page * PAGE_SIZE
  const pageProducts = products.slice(start, start + PAGE_SIZE)

  const goTo = (next: number) => {
    setDirection(next > page ? 1 : -1)
    setPage(next)
  }

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  }

  return (
    <div className="space-y-4">

      {/* Product grid - 5 columns */}
      <div className="relative overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
            <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 grid-rows-2"
          >
            {pageProducts.map((product, index) => (
              <CompactProductCard key={product.id} product={product} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          {/* Prev button */}
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 0}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200/60 bg-white/70 px-3 py-2 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === page
                  ? 'w-6 bg-gradient-to-r from-rose-500 to-pink-500 shadow-sm'
                  : 'w-2 bg-rose-200/70 hover:bg-rose-300'
                  }`}
              />
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200/60 bg-white/70 px-3 py-2 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-30"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Count indicator */}
      <p className="text-center text-[10px] font-medium text-mist/60">
        Showing {start + 1}–{Math.min(start + PAGE_SIZE, products.length)} of {products.length} products
      </p>
    </div>
  )
}
