import { ArrowUpRight, ShoppingCart } from 'lucide-react'
import { type ProductRecommendation } from '@/shared/lib/types'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Modal } from '@/shared/components/ui/Modal'
import { useEffect, useState } from 'react'

type ProductCardProps = {
  product: ProductRecommendation
  ctaVariant?: 'A' | 'B'
}

export function ProductCard({ product, ctaVariant }: ProductCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(product.stock && product.stock <= 5 ? product.stock * 3600 : null)

  useEffect(() => {
    let timer: number | undefined
    if (secondsLeft && secondsLeft > 0) {
      timer = window.setInterval(() => {
        setSecondsLeft((s) => (s && s > 0 ? s - 1 : 0))
      }, 1000)
    }
    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [product.id, secondsLeft])

  const formatSeconds = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h}h ${m}m ${sec}s`
  }

  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0 border border-rose-100 hover:border-rose-200 transition-all duration-300">
      <div className="h-52 overflow-hidden relative">
        <img
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.28)] via-transparent to-transparent opacity-50 pointer-events-none" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 text-night">
        <div className="flex justify-between items-center">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-500 font-extrabold">{product.category}</p>
          <span className="text-[10px] font-bold text-cyan-600 bg-cyan/5 border border-cyan/15 rounded-lg px-2 py-0.5">
            Affiliate Link
          </span>
        </div>
        <h3 className="font-display text-xl font-bold text-rose-950 leading-snug">{product.name}</h3>
        <p className="text-sm text-mist/90 leading-relaxed">{product.description}</p>
        <p className="rounded-2xl border border-rose-200/50 bg-gradient-to-br from-rose-50/50 to-white/60 p-3.5 text-xs text-rose-950 font-medium leading-relaxed">
          {product.reason}
        </p>
        {product.matchReason ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-[12px] text-mist/70 font-mono">Match: {product.matchReason}</div>
            <button onClick={() => setModalOpen(true)} className="text-xs text-rose-600 underline">Details</button>
          </div>
        ) : null}
        
        <div className="mt-auto pt-3">
          <a
            href={product.externalLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`block w-full text-center text-xs font-display font-extrabold uppercase tracking-wider py-3.5 shadow-md text-white ${
              ctaVariant === 'B'
                ? 'bg-rose-700 shadow-[0_10px_30px_rgba(200,40,90,0.18)] animate-pulse'
                : 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 shadow-rose-500/15'
            } hover:brightness-105 active:scale-[0.98] transition-all ${!product.externalLink ? 'pointer-events-none opacity-60' : ''}`}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Buy now
              <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
            </span>
          </a>

          {typeof product.stock === 'number' ? (
            <div className="mt-2 flex items-center justify-between text-[12px]">
              <div className={`rounded-full px-2 py-1 ${product.stock <= 5 ? 'bg-rose-50 text-rose-600 font-bold' : 'text-mist/65'}`}>
                {product.stock <= 5 ? `Only ${product.stock} left` : 'In stock'}
              </div>
              <div className="text-right text-[11px] text-mist/60">
                Secure checkout
                {secondsLeft && secondsLeft > 0 ? (
                  <div className="text-[11px] text-rose-600">Offer ends in {formatSeconds(secondsLeft)}</div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    {modalOpen ? (
      <Modal
        open={modalOpen}
        title={product.name}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <img src={product.image} alt={product.name} className="w-full rounded-md object-cover" />
          <p className="text-sm text-mist">{product.description}</p>
          {product.matchReason ? <p className="text-xs font-mono text-mist/70">Reason: {product.matchReason}</p> : null}
          <div className="flex items-center justify-between">
            <div>
              {product.price ? <div className="text-lg font-bold text-rose-900">{product.price}</div> : null}
              {product.originalPrice ? <div className="text-sm line-through text-mist/60">{product.originalPrice}</div> : null}
            </div>
            <a href={product.externalLink} target="_blank" rel="noopener noreferrer">
              <Button className={`px-4 py-2 text-sm ${ctaVariant === 'B' ? 'animate-pulse bg-rose-700 text-white' : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'}`}>
                <ShoppingCart className="h-4 w-4" /> Buy now
              </Button>
            </a>
          </div>
        </div>
      </Modal>
    ) : null}
    </Card>
  )
}


