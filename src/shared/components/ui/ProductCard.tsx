import { ArrowUpRight, ShoppingCart } from 'lucide-react'
import { type ProductRecommendation } from '@/shared/lib/types'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'

type ProductCardProps = {
  product: ProductRecommendation
}

export function ProductCard({ product }: ProductCardProps) {
  // Helper to extract domain/partner name from affiliate URL
  const getPartnerName = (url: string) => {
    try {
      const hostname = new URL(url).hostname
      if (hostname.includes('sephora')) return 'Sephora'
      if (hostname.includes('ulta')) return 'Ulta'
      if (hostname.includes('dermstore')) return 'Dermstore'
      if (hostname.includes('amazon')) return 'Amazon'
      // fallback to domain name without subdomains or just 'Đối tác'
      const parts = hostname.replace('www.', '').split('.')
      return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Đối tác'
    } catch {
      return 'Đối tác'
    }
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
        
        <div className="mt-auto pt-3">
          <a 
            href={product.externalLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block w-full"
          >
            <Button 
              variant="primary" 
              className="w-full text-xs font-display font-extrabold uppercase tracking-wider py-3.5 justify-center gap-2 shadow-md bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white shadow-rose-500/15 hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              Mua tại {getPartnerName(product.externalLink)}
              <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
            </Button>
          </a>
        </div>
      </div>
    </Card>
  )
}


