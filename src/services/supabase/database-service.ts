import { supabase, type Json } from '@/services/supabase/client'
import { type ScanResult, type OrderRecord } from '@/shared/lib/types'

type SaveRecommendationInput = {
  productId: string
  reason: string
}

export type AdminProductRecord = {
  id: string
  name: string
  description: string
  image_url: string
  external_url: string
  tags: string[]
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
  color_intensity: string | null
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

export const databaseService = {
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
        return JSON.parse(stored) as Array<{ id: string; email: string; role: string; created_at: string }>
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
    return defaultUsers
  },

  updateUserRole(userId: string, role: string) {
    const users = this.getUsersWithRoles()
    const updated = users.map((u: any) => u.id === userId ? { ...u, role } : u)
    localStorage.setItem('lumina_user_roles', JSON.stringify(updated))
    return updated
  },

  createUserWithRole(email: string, role: string) {
    const users = this.getUsersWithRoles()
    const newUser = {
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      email,
      role,
      created_at: new Date().toISOString(),
    }
    const updated = [...users, newUser]
    localStorage.setItem('lumina_user_roles', JSON.stringify(updated))
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
      { id: 'p1', name: 'Serum B5 La Roche-Posay Hyalu B5', category: 'Serum', price: 390000, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80' },
      { id: 'p2', name: 'Kem Dưỡng Ẩm CeraVe Moisturising Cream', category: 'Kem dưỡng ẩm', price: 490000, image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=400&q=80' },
      { id: 'p3', name: 'Nước Hoa Hồng Paula\'s Choice BHA Salicylic Acid 2%', category: 'Toner', price: 590000, image: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=400&q=80' },
      { id: 'p4', name: 'Sữa Rửa Mặt Cetaphil Gentle Skin Cleanser', category: 'Sữa rửa mặt', price: 290000, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80' },
    ]

    const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi']
    const middleNames = ['Văn', 'Thị', 'Minh', 'Anh', 'Ngọc', 'Khánh', 'Hoàng', 'Đức', 'Phương']
    const lastNames = ['Hùng', 'Hương', 'Hải', 'Trang', 'Tú', 'Linh', 'Dương', 'Phúc', 'Yến']

    const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Nha Trang']

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
      const address = `${Math.floor(Math.random() * 150) + 1} Đường Lê Lợi, ${cities[Math.floor(Math.random() * cities.length)]}`
      
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
