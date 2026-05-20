import { ArrowUpRight } from 'lucide-react'
import { type ProductRecommendation } from '@/shared/lib/types'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'

type ProductCardProps = {
  product: ProductRecommendation
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0">
      <div className="h-52 overflow-hidden">
        <img
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan">{product.category}</p>
        <h3 className="font-display text-xl font-semibold text-pearl">{product.name}</h3>
        <p className="text-sm text-mist">{product.description}</p>
        <p className="rounded-2xl border border-white/15 bg-white/5 p-3 text-xs text-pearl/90">{product.reason}</p>
        <a href={product.externalLink} target="_blank" rel="noreferrer" className="mt-auto">
          <Button variant="ghost" className="w-full justify-between">
            View Product
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </Card>
  )
}
