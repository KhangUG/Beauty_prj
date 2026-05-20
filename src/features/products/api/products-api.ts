import { mockProducts } from '@/shared/data/mock-products'

export async function fetchProducts() {
  await new Promise((resolve) => setTimeout(resolve, 250))
  return mockProducts
}
