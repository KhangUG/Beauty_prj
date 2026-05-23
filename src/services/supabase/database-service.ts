import { supabase, type Json } from '@/services/supabase/client'
import { type ScanResult, type OrderRecord } from '@/shared/lib/types'
import { getSubscriptionTier, setSubscriptionTier } from '@/shared/lib/subscription'

type SaveRecommendationInput = {
  productId: string
  reason: string
}

export type AdminProductRecord = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  external_url: string | null
  brand: string | null
  category_id: string
  created_at: string
}

export type AdminScanRecord = {
  id: string
  created_at: string
  user_id: string
  metrics: ScanResult
  score: number
}

export type AdminRecommendationRecord = {
  id: string
  scan_id: string
  product_id: string
  reason: string
  created_at: string
}

export type AdminCategoryRecord = {
  id: string
  name: string
  api_category_key: string
  created_at: string
}

export type AdminProductConfigRecord = {
  id: string
  product_id: string
  hex_color: string | null
  texture: string | null
  color_intensity: number | null
  pattern_name: string | null
  extra_params: Json | null
  created_at: string
}

type CreateProductInput = Omit<AdminProductRecord, 'id' | 'created_at'>

type UpdateProductInput = Partial<CreateProductInput>

type CreateRecommendationInput = {
  scanId: string
  productId: string
  reason: string
}

type UpdateRecommendationInput = Partial<CreateRecommendationInput>

type UpdateScanInput = Partial<Pick<AdminScanRecord, 'score' | 'metrics'>>

export type MakeupCatalogRow = {
  productId: string
  name: string
  description: string | null
  image: string
  externalLink: string
  brand: string | null
  categoryId: string
  categoryName: string
  apiCategoryKey: string
  hexColor: string | null
  texture: string | null
  colorIntensity: number | null
  patternName: string | null
}

export const databaseService = {
  async getMakeupCatalog(): Promise<MakeupCatalogRow[]> {
    const [{ data: products, error: productsError }, { data: categories, error: categoriesError }, { data: configs, error: configsError }] =
      await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*'),
        supabase.from('product_configs').select('*'),
      ])

    if (productsError) throw productsError
    if (categoriesError) throw categoriesError
    if (configsError) throw configsError

    const categoryMap = new Map((categories ?? []).map((category) => [category.id, category as AdminCategoryRecord]))
    const configMap = new Map((configs ?? []).map((config) => [config.product_id, config as AdminProductConfigRecord]))

    return ((products ?? []) as AdminProductRecord[]).map((product) => {
      const category = categoryMap.get(product.category_id)
      const config = configMap.get(product.id)

      return {
        productId: product.id,
        name: product.name,
        description: product.description,
        image: product.image_url ?? '',
        externalLink: product.external_url ?? '',
        brand: product.brand,
        categoryId: product.category_id,
        categoryName: category?.name ?? 'Uncategorized',
        apiCategoryKey: category?.api_category_key ?? 'general',
        hexColor: config?.hex_color ?? null,
        texture: config?.texture ?? null,
        colorIntensity: config?.color_intensity ?? null,
        patternName: config?.pattern_name ?? null,
      }
    })
  },

  async getProducts() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AdminProductRecord[]
  },

  async getAdminProducts() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AdminProductRecord[]
  },

  async createProduct(input: CreateProductInput) {
    const { data, error } = await supabase.from('products').insert(input).select('*').single()
    if (error) throw error
    return data as AdminProductRecord
  },

  async updateProduct(id: string, input: UpdateProductInput) {
    const { data, error } = await supabase.from('products').update(input).eq('id', id).select('*').single()
    if (error) throw error
    return data as AdminProductRecord
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },

  async getAdminCategories() {
    const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AdminCategoryRecord[]
  },

  async createCategory(input: Omit<AdminCategoryRecord, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('categories').insert(input).select('*').single()
    if (error) throw error
    return data as AdminCategoryRecord
  },

  async updateCategory(id: string, input: Partial<Omit<AdminCategoryRecord, 'id' | 'created_at'>>) {
    const { data, error } = await supabase.from('categories').update(input).eq('id', id).select('*').single()
    if (error) throw error
    return data as AdminCategoryRecord
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  },

  async getAdminProductConfigs() {
    const { data, error } = await supabase.from('product_configs').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AdminProductConfigRecord[]
  },

  async createProductConfig(input: Omit<AdminProductConfigRecord, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('product_configs').insert(input).select('*').single()
    if (error) throw error
    return data as AdminProductConfigRecord
  },

  async updateProductConfig(id: string, input: Partial<Omit<AdminProductConfigRecord, 'id' | 'created_at'>>) {
    const { data, error } = await supabase.from('product_configs').update(input).eq('id', id).select('*').single()
    if (error) throw error
    return data as AdminProductConfigRecord
  },

  async deleteProductConfig(id: string) {
    const { error } = await supabase.from('product_configs').delete().eq('id', id)
    if (error) throw error
  },

  async getScanHistory(userId: string) {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async getScanCountThisMonth(userId: string) {
    const startOfMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()
    const { data, error } = await supabase
      .from('scans')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth)

    if (error) throw error
    return (data ?? []).length
  },

  async getAdminScans() {
    const { data, error } = await supabase.from('scans').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AdminScanRecord[]
  },

  async updateScan(id: string, input: UpdateScanInput) {
    const { data, error } = await supabase.from('scans').update(input).eq('id', id).select('*').single()
    if (error) throw error
    return data as AdminScanRecord
  },

  async deleteScan(id: string) {
    const { error } = await supabase.from('scans').delete().eq('id', id)
    if (error) throw error
  },

  async saveScan(userId: string, scanResult: ScanResult) {
    const { data, error } = await supabase
      .from('scans')
      .insert({
        user_id: userId,
        score: scanResult.skinScore,
        metrics: scanResult,
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  },

  async saveRecommendations(scanId: string, items: SaveRecommendationInput[]) {
    if (items.length === 0) return

    const { error } = await supabase.from('recommendations').insert(
      items.map((item) => ({
        scan_id: scanId,
        product_id: item.productId,
        reason: item.reason,
      })),
    )

    if (error) throw error
  },

  async getAdminRecommendations() {
    const { data, error } = await supabase.from('recommendations').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AdminRecommendationRecord[]
  },

  async createRecommendation(input: CreateRecommendationInput) {
    const { data, error } = await supabase
      .from('recommendations')
      .insert({ scan_id: input.scanId, product_id: input.productId, reason: input.reason })
      .select('*')
      .single()
    if (error) throw error
    return data as AdminRecommendationRecord
  },

  async updateRecommendation(id: string, input: UpdateRecommendationInput) {
    const payload: {
      scan_id?: string
      product_id?: string
      reason?: string
    } = {}

    if (input.scanId) payload.scan_id = input.scanId
    if (input.productId) payload.product_id = input.productId
    if (input.reason) payload.reason = input.reason

    const { data, error } = await supabase.from('recommendations').update(payload).eq('id', id).select('*').single()
    if (error) throw error
    return data as AdminRecommendationRecord
  },

  async deleteRecommendation(id: string) {
    const { error } = await supabase.from('recommendations').delete().eq('id', id)
    if (error) throw error
  },

  getUsersWithRoles() {
    const stored = localStorage.getItem('lumina_user_roles')
    if (stored) {
      try {
        const users = JSON.parse(stored) as Array<{ id: string; email: string; role: string; created_at: string }>
        return users.map((user) => ({
          ...user,
          subscription_tier: getSubscriptionTier(user.id) ?? 'free',
        }))
      } catch {
        // ignore
      }
    }
    const defaultUsers = [
      { id: 'u1', email: 'admin@lumina.ai', role: 'superadmin', created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
      { id: 'u2', email: 'catalog-manager@lumina.ai', role: 'catalog', created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString() },
      { id: 'u3', email: 'operations-lead@lumina.ai', role: 'operations', created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
      { id: 'u4', email: 'content-writer@lumina.ai', role: 'content', created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
      { id: 'u5', email: 'analyst-read@lumina.ai', role: 'analyst', created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
      { id: 'u6', email: 'guest-customer@gmail.com', role: 'user', created_at: new Date().toISOString() },
    ]
    localStorage.setItem('lumina_user_roles', JSON.stringify(defaultUsers))
    defaultUsers.forEach((user) => setSubscriptionTier(user.id, 'free'))
    return defaultUsers.map((user) => ({ ...user, subscription_tier: 'free' }))
  },

  updateUserRole(userId: string, role: string) {
    const users = this.getUsersWithRoles()
    const updated = users.map((u: any) => (u.id === userId ? { ...u, role } : u))
    localStorage.setItem('lumina_user_roles', JSON.stringify(updated))
    return updated
  },

  updateUserSubscriptionTier(userId: string, subscriptionTier: string) {
    setSubscriptionTier(userId, subscriptionTier)
    return this.getUsersWithRoles()
  },

  createUserWithRole(email: string, role: string, subscriptionTier = 'free') {
    const users = this.getUsersWithRoles()
    const newUser = {
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      email,
      role,
      created_at: new Date().toISOString(),
      subscription_tier: subscriptionTier,
    }
    const updated = [...users, newUser]
    localStorage.setItem('lumina_user_roles', JSON.stringify(updated))
    setSubscriptionTier(newUser.id, subscriptionTier)
    return newUser
  },

  deleteUserRole(userId: string) {
    const users = this.getUsersWithRoles()
    const updated = users.filter((u: any) => u.id !== userId)
    localStorage.setItem('lumina_user_roles', JSON.stringify(updated))
    return updated
  },

  getOrders(): OrderRecord[] {
    const stored = localStorage.getItem('lumina_orders')
    if (stored) {
      try {
        return JSON.parse(stored) as OrderRecord[]
      } catch {
        // ignore
      }
    }
    return this.seedOrders()
  },

  createOrder(order: OrderRecord): OrderRecord {
    const orders = this.getOrders()
    const updated = [order, ...orders]
    localStorage.setItem('lumina_orders', JSON.stringify(updated))
    return order
  },

  deleteOrder(orderId: string): OrderRecord[] {
    const orders = this.getOrders()
    const updated = orders.filter((o) => o.id !== orderId)
    localStorage.setItem('lumina_orders', JSON.stringify(updated))
    return updated
  },

  updateOrderStatus(orderId: string, status: 'pending' | 'completed' | 'canceled'): OrderRecord[] {
    const orders = this.getOrders()
    const updated = orders.map((o) => o.id === orderId ? { ...o, status } : o)
    localStorage.setItem('lumina_orders', JSON.stringify(updated))
    return updated
  },

  seedOrders(): OrderRecord[] {
    const products = [
      { id: 'p1', name: 'La Roche-Posay Hyalu B5 Serum', category: 'Serum', price: 390000, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80' },
      { id: 'p2', name: 'CeraVe Moisturising Cream', category: 'Moisturizer', price: 490000, image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=400&q=80' },
      { id: 'p3', name: 'Paula\'s Choice 2% BHA Liquid Exfoliant', category: 'Toner', price: 590000, image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=400&q=80' },
      { id: 'p4', name: 'Cetaphil Gentle Skin Cleanser', category: 'Cleanser', price: 290000, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80' },
    ]

    const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'Chris', 'Sarah', 'David', 'Jessica', 'Daniel']
    const middleNames = ['A.', 'B.', 'M.', 'E.', 'J.', 'L.', 'D.', 'S.', 'R.']
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez']

    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia']

    const orders: OrderRecord[] = []

    for (let i = 0; i < 24; i++) {
      const prod = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 2) + 1
      const price = prod.price
      const totalPrice = price * quantity
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const middleName = middleNames[Math.floor(Math.random() * middleNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const name = `${firstName} ${middleName} ${lastName}`
      const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`
      const address = `${Math.floor(Math.random() * 150) + 1} Main St, ${cities[Math.floor(Math.random() * cities.length)]}`
      
      const paymentMethods = ['cod', 'momo', 'visa', 'apple'] as const
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      
      const statuses = ['completed', 'completed', 'completed', 'pending', 'canceled'] as const
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      const daysAgo = Math.floor(Math.random() * 8)
      const date = new Date(Date.now() - daysAgo * 24 * 3600 * 1000 - Math.random() * 12 * 3600 * 1000)

      orders.push({
        id: `BG-${Math.floor(100000 + Math.random() * 900000)}`,
        productId: prod.id,
        productName: prod.name,
        productImage: prod.image,
        productCategory: prod.category,
        quantity,
        price,
        totalPrice,
        paymentMethod,
        shippingInfo: { name, phone, address },
        status,
        createdAt: date.toISOString(),
      })
    }

    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    localStorage.setItem('lumina_orders', JSON.stringify(orders))
    return orders
  },
}
