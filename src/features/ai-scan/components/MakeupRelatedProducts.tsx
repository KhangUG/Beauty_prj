import { ScanProductGrid } from '@/shared/components/ui/ScanProductGrid'
import type { MatchedMakeupProduct } from '@/features/ai-scan/types/makeup-vto'
import type { ProductRecommendation } from '@/shared/lib/types'

type MakeupRelatedProductsProps = {
  products: MatchedMakeupProduct[]
  isLoading: boolean
  activeCategories: string[]
}

function toGridProduct(product: MatchedMakeupProduct): ProductRecommendation & { matchScore: number; matchReason: string } {
  return {
    id: product.productId,
    name: product.name,
    image: product.image,
    description: product.description ?? '',
    reason: product.matchReason,
    externalLink: product.externalLink,
    category: product.categoryName,
    matchScore: product.matchScore,
    matchReason: product.matchReason,
  }
}

export function MakeupRelatedProducts({ products, isLoading, activeCategories }: MakeupRelatedProductsProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-rose-100/60 bg-white/90 shadow-sm">
      <div className="shrink-0 border-b border-rose-100 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-rose-600">Related Products</p>
        <p className="mt-1 text-xs text-mist">
          Matched from catalog by effect category, color, texture and pattern.
        </p>
        {activeCategories.length > 0 ? (
          <p className="mt-2 text-[10px] text-rose-600">
            Active: {activeCategories.join(', ')}
          </p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-mist">Loading product catalog...</p>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/40 p-6 text-center text-xs text-mist">
            <p className="font-semibold text-rose-800">No matching products yet</p>
            <p className="mt-2">
              Add products in Admin with category API keys (e.g. lip_color, blush) and AI configs (hex color, texture).
            </p>
          </div>
        ) : (
          <ScanProductGrid products={products.map(toGridProduct)} />
        )}
      </div>
    </div>
  )
}
