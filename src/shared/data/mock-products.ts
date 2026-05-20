import { type ProductRecommendation } from '@/shared/lib/types'

export const mockProducts: ProductRecommendation[] = [
  {
    id: 'p1',
    name: 'Luminous Barrier Serum',
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80',
    description: 'Barrier-repair serum with ceramides and lightweight peptides.',
    reason: 'Hydration signal is strong but acne sensitivity suggests non-comedogenic barrier support.',
    externalLink: 'https://www.sephora.com',
    category: 'Serum',
  },
  {
    id: 'p2',
    name: 'Cloud Balance Gel Cleanser',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=80',
    description: 'Low-foam cleanser to remove excess sebum without stripping moisture.',
    reason: 'Oiliness metric indicates midday shine; this cleanser helps reset the skin film.',
    externalLink: 'https://www.ulta.com',
    category: 'Cleanser',
  },
  {
    id: 'p3',
    name: 'Aurora Caffeine Eye Veil',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80',
    description: 'Cooling eye treatment with caffeine and niacinamide.',
    reason: 'Dark-circle score suggests vascular fatigue; caffeine helps de-puff and brighten.',
    externalLink: 'https://www.dermstore.com',
    category: 'Eye Care',
  },
  {
    id: 'p4',
    name: 'Night Recovery Microcream',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=900&q=80',
    description: 'Peptide-rich overnight cream for elasticity and moisture retention.',
    reason: 'Boosting overnight recovery may increase skin score consistency over time.',
    externalLink: 'https://www.amazon.com',
    category: 'Moisturizer',
  },
]
