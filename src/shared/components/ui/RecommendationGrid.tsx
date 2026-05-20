import { motion } from 'framer-motion'
import { ProductCard } from '@/shared/components/ui/ProductCard'
import { type ProductRecommendation } from '@/shared/lib/types'

type RecommendationGridProps = {
  products: ProductRecommendation[]
}

export function RecommendationGrid({ products }: RecommendationGridProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: index * 0.06, duration: 0.4 }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  )
}
