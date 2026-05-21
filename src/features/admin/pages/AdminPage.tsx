import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Camera,
  CheckCircle2,
  Clock3,
  Database,
  LayoutGrid,
  ListChecks,
  Megaphone,
  PencilLine,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Users,
  Wrench,
  Activity,
  Wifi,
  PlusCircle,
  Search,
  Sliders,
  DollarSign,
  Package,
  RefreshCw,
  UserCheck,
  TrendingUp,
  ShoppingBag,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Loader } from '@/shared/components/ui/Loader'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { supabase } from '@/services/supabase/client'
import {
  databaseService,
  type AdminProductRecord,
  type AdminRecommendationRecord,
  type AdminScanRecord,
} from '@/services/supabase/database-service'
import { canAccessAdminSection, getAdminRoleLabel, type AdminSection, type AdminRole } from '@/shared/lib/admin'
import { parseProductTags, encodeProductTags } from '@/shared/lib/product-tags'
import { type ScanResult, type OrderRecord } from '@/shared/lib/types'

const sidebarSections: Array<{
  id: AdminSection
  label: string
  description: string
  icon: typeof LayoutGrid
}> = [
    { id: 'overview', label: 'Tổng quan', description: 'Tình trạng hệ thống và chỉ số', icon: LayoutGrid },
    { id: 'products', label: 'Sản phẩm', description: 'Quản lý danh mục và đồng bộ', icon: Store },
    { id: 'scans', label: 'Quét da', description: 'Xem lịch sử quét và mô phỏng', icon: Camera },
    { id: 'recommendations', label: 'Gợi ý', description: 'Quản lý sản phẩm phù hợp', icon: Sparkles },
    { id: 'access', label: 'Phân quyền', description: 'Vai trò và quyền hạn', icon: Users },
    { id: 'settings', label: 'Cài đặt', description: 'Nền tảng và môi trường', icon: Wrench },
    { id: 'revenue', label: 'Doanh thu', description: 'Đơn hàng và doanh số bán', icon: DollarSign },
  ]

type ProductFormState = {
  id: string
  name: string
  description: string
  imageUrl: string
  externalUrl: string
  tags: string
  category: string
  price: string
  originalPrice: string
  discount: string
  stock: string
}

type ScanFormState = {
  id: string
  score: string
  metricsJson: string
}

type RecommendationFormState = {
  id: string
  scanId: string
  productId: string
  reason: string
}

const emptyProductForm: ProductFormState = {
  id: '',
  name: '',
  description: '',
  imageUrl: '',
  externalUrl: '',
  tags: '',
  category: 'Serum',
  price: '',
  originalPrice: '',
  discount: '',
  stock: '',
}

const emptyScanForm: ScanFormState = {
  id: '',
  score: '',
  metricsJson: '{}',
}

const emptyRecommendationForm: RecommendationFormState = {
  id: '',
  scanId: '',
  productId: '',
  reason: '',
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTags(tags: string[]) {
  return tags.length > 0 ? tags.join(', ') : 'Không có thẻ'
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function mapProductForm(product: AdminProductRecord): ProductFormState {
  const parsed = parseProductTags(product)
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.image_url,
    externalUrl: product.external_url,
    tags: parsed.cleanTags.join(', '),
    category: parsed.category,
    price: parsed.price ?? '',
    originalPrice: parsed.originalPrice ?? '',
    discount: parsed.discount !== undefined ? String(parsed.discount) : '',
    stock: parsed.stock !== undefined ? String(parsed.stock) : '',
  }
}

function mapScanForm(scan: AdminScanRecord): ScanFormState {
  return {
    id: scan.id,
    score: String(scan.score),
    metricsJson: JSON.stringify(scan.metrics, null, 2),
  }
}

function mapRecommendationForm(recommendation: AdminRecommendationRecord): RecommendationFormState {
  return {
    id: recommendation.id,
    scanId: recommendation.scan_id,
    productId: recommendation.product_id,
    reason: recommendation.reason,
  }
}

function AdminSectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl text-slate-900">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

export default function AdminPage() {
  const { adminRole, signOut, user: currentAuthUser } = useAuth()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')

  // Forms
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)
  const [scanForm, setScanForm] = useState<ScanFormState>(emptyScanForm)
  const [recommendationForm, setRecommendationForm] = useState<RecommendationFormState>(emptyRecommendationForm)

  // Filters & Search
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('All')

  const [scanSearch, setScanSearch] = useState('')
  const [scanScoreFilter, setScanScoreFilter] = useState<[number, number]>([0, 100])

  const [recommendationSearch, setRecommendationSearch] = useState('')
  const [recommendationCategoryFilter, setRecommendationCategoryFilter] = useState('All')

  const [userSearch, setUserSearch] = useState('')

  // Revenue state
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All')

  // User Manager Form
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<AdminRole | 'user'>('analyst')

  // Scan Simulator State
  const [targetUserId, setTargetUserId] = useState('')
  const [simHydration, setSimHydration] = useState(70)
  const [simAcne, setSimAcne] = useState(30)
  const [simOiliness, setSimOiliness] = useState(40)
  const [simDarkCircles, setSimDarkCircles] = useState(25)

  // Ping Check
  const [pingTime, setPingTime] = useState<number | null>(null)
  const [pingStatus, setPingStatus] = useState<'idle' | 'pinging' | 'success' | 'failed'>('idle')

  const testPing = async () => {
    setPingStatus('pinging')
    const start = performance.now()
    try {
      await supabase.from('products').select('id').limit(1)
      setPingTime(Math.round(performance.now() - start))
      setPingStatus('success')
    } catch {
      setPingTime(-1)
      setPingStatus('failed')
    }
  }

  // Auto ping on mount
  useEffect(() => {
    void testPing()
  }, [])

  // Queries
  const productsQuery = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => databaseService.getAdminProducts(),
  })

  const scansQuery = useQuery({
    queryKey: ['admin', 'scans'],
    queryFn: () => databaseService.getAdminScans(),
  })

  const recommendationsQuery = useQuery({
    queryKey: ['admin', 'recommendations'],
    queryFn: () => databaseService.getAdminRecommendations(),
  })

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => databaseService.getUsersWithRoles(),
  })

  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => databaseService.getOrders(),
  })

  // Lookups & Filters
  const tabs = useMemo(
    () => sidebarSections.filter((section) => canAccessAdminSection(adminRole, section.id)),
    [adminRole],
  )

  useEffect(() => {
    if (tabs.length === 0) return
    if (!tabs.some((section) => section.id === activeSection)) {
      setActiveSection(tabs[0].id)
    }
  }, [activeSection, tabs])

  const productLookup = useMemo(() => {
    return new Map((productsQuery.data ?? []).map((product) => [product.id, product]))
  }, [productsQuery.data])

  const scanLookup = useMemo(() => {
    return new Map((scansQuery.data ?? []).map((scan) => [scan.id, scan]))
  }, [scansQuery.data])

  const filteredOrders = useMemo(() => {
    const list = ordersQuery.data ?? []
    return list.filter((order) => {
      const matchSearch =
        order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.productName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.shippingInfo.name.toLowerCase().includes(orderSearch.toLowerCase())
      
      const matchStatus = orderStatusFilter === 'All' || order.status === orderStatusFilter
      return matchSearch && matchStatus
    })
  }, [ordersQuery.data, orderSearch, orderStatusFilter])

  const revenueStats = useMemo(() => {
    const list = ordersQuery.data ?? []
    const completed = list.filter((o) => o.status === 'completed')
    const pending = list.filter((o) => o.status === 'pending')
    const canceled = list.filter((o) => o.status === 'canceled')

    const totalRevenue = completed.reduce((sum, o) => sum + o.totalPrice, 0)
    const pendingAmount = pending.reduce((sum, o) => sum + o.totalPrice, 0)
    
    // Category Breakdown
    const categoryMap = new Map<string, number>()
    completed.forEach((o) => {
      const cat = o.productCategory || 'Khác'
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + o.totalPrice)
    })
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))

    // Payment breakdown
    const paymentMap = new Map<string, number>()
    completed.forEach((o) => {
      const pm = o.paymentMethod.toUpperCase()
      paymentMap.set(pm, (paymentMap.get(pm) ?? 0) + o.totalPrice)
    })
    const paymentBreakdown = Array.from(paymentMap.entries()).map(([name, value]) => ({ name, value }))

    return {
      totalRevenue,
      pendingAmount,
      completedCount: completed.length,
      pendingCount: pending.length,
      canceledCount: canceled.length,
      totalCount: list.length,
      categoryBreakdown,
      paymentBreakdown,
    }
  }, [ordersQuery.data])

  // Aggregate statistics for Overview
  const scanStats = useMemo(() => {
    const list = scansQuery.data ?? []
    if (list.length === 0) {
      return {
        avgScore: 0,
        avgHydration: 0,
        avgAcne: 0,
        avgOiliness: 0,
        avgDarkCircles: 0,
        scoreRanges: [0, 0, 0, 0, 0], // <60, 60-70, 70-80, 80-90, 90-100
      }
    }

    let totalScore = 0
    let totalHydration = 0
    let totalAcne = 0
    let totalOiliness = 0
    let totalDarkCircles = 0
    const ranges = [0, 0, 0, 0, 0]

    list.forEach((scan) => {
      totalScore += scan.score
      if (scan.score < 60) ranges[0]++
      else if (scan.score < 70) ranges[1]++
      else if (scan.score < 80) ranges[2]++
      else if (scan.score < 90) ranges[3]++
      else ranges[4]++

      const metrics = scan.metrics
      if (metrics) {
        totalHydration += metrics.hydration?.value ?? 0
        totalAcne += metrics.acne?.value ?? 0
        totalOiliness += metrics.oiliness?.value ?? 0
        totalDarkCircles += metrics.darkCircles?.value ?? 0
      }
    })

    const n = list.length
    return {
      avgScore: Math.round(totalScore / n),
      avgHydration: Math.round(totalHydration / n),
      avgAcne: Math.round(totalAcne / n),
      avgOiliness: Math.round(totalOiliness / n),
      avgDarkCircles: Math.round(totalDarkCircles / n),
      scoreRanges: ranges,
    }
  }, [scansQuery.data])

  const maxRangeCount = useMemo(() => {
    return Math.max(...scanStats.scoreRanges, 1)
  }, [scanStats.scoreRanges])

  // Filtered lists
  const filteredProducts = useMemo(() => {
    const list = productsQuery.data ?? []
    return list.filter((p) => {
      const parsed = parseProductTags(p)
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(productSearch.toLowerCase()) ||
        parsed.cleanTags.some((t) => t.toLowerCase().includes(productSearch.toLowerCase()))

      const matchesCat =
        productCategoryFilter === 'All' ||
        parsed.category.toLowerCase() === productCategoryFilter.toLowerCase()
      return matchesSearch && matchesCat
    })
  }, [productsQuery.data, productSearch, productCategoryFilter])

  const filteredScans = useMemo(() => {
    const list = scansQuery.data ?? []
    return list.filter((s) => {
      const matchesSearch =
        s.id.toLowerCase().includes(scanSearch.toLowerCase()) ||
        s.user_id.toLowerCase().includes(scanSearch.toLowerCase())
      const matchesScore = s.score >= scanScoreFilter[0] && s.score <= scanScoreFilter[1]
      return matchesSearch && matchesScore
    })
  }, [scansQuery.data, scanSearch, scanScoreFilter])

  const filteredRecommendations = useMemo(() => {
    const list = recommendationsQuery.data ?? []
    return list.filter((r) => {
      const product = productLookup.get(r.product_id)
      const parsed = product ? parseProductTags(product) : null
      const prodName = product?.name ?? ''

      const matchesSearch =
        r.scan_id.toLowerCase().includes(recommendationSearch.toLowerCase()) ||
        r.product_id.toLowerCase().includes(recommendationSearch.toLowerCase()) ||
        prodName.toLowerCase().includes(recommendationSearch.toLowerCase()) ||
        r.reason.toLowerCase().includes(recommendationSearch.toLowerCase())

      const matchesCat =
        recommendationCategoryFilter === 'All' ||
        (parsed && parsed.category.toLowerCase() === recommendationCategoryFilter.toLowerCase())

      return matchesSearch && matchesCat
    })
  }, [recommendationsQuery.data, productLookup, recommendationSearch, recommendationCategoryFilter])

  const filteredUsers = useMemo(() => {
    const list = usersQuery.data ?? []
    return list.filter((u) => u.email.toLowerCase().includes(userSearch.toLowerCase()))
  }, [usersQuery.data, userSearch])

  // Overview Stats Setup
  const overviewCards = useMemo(
    () => [
      {
        label: 'Sản phẩm',
        value: productsQuery.data?.length ?? 0,
        hint: 'Số dòng danh mục đang hoạt động',
        icon: Store,
      },
      {
        label: 'Lượt quét',
        value: scansQuery.data?.length ?? 0,
        hint: 'Tổng lượt quét đã phân tích',
        icon: Camera,
      },
      {
        label: 'Gợi ý',
        value: recommendationsQuery.data?.length ?? 0,
        hint: 'Liên kết sản phẩm phù hợp',
        icon: Sparkles,
      },
      {
        label: 'Vai trò quản trị',
        value: getAdminRoleLabel(adminRole),
        hint: 'Ngữ cảnh bảo mật đang hoạt động',
        icon: ShieldCheck,
      },
    ],
    [adminRole, productsQuery.data?.length, scansQuery.data?.length, recommendationsQuery.data?.length],
  )

  // Mutations
  const saveProductMutation = useMutation({
    mutationFn: async () => {
      const cleanTagsList = parseTags(productForm.tags)
      const encodedTags = encodeProductTags({
        tags: cleanTagsList,
        category: productForm.category,
        price: productForm.price,
        originalPrice: productForm.originalPrice,
        discount: productForm.discount,
        stock: productForm.stock,
      })

      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        image_url: productForm.imageUrl.trim(),
        external_url: productForm.externalUrl.trim(),
        tags: encodedTags,
      }

      if (!payload.name || !payload.description || !payload.image_url || !payload.external_url) {
        throw new Error('Vui lòng điền đầy đủ thông tin sản phẩm trước khi lưu.')
      }

      if (productForm.id) {
        return databaseService.updateProduct(productForm.id, payload)
      }

      return databaseService.createProduct(payload)
    },
    onSuccess: async () => {
      setProductForm(emptyProductForm)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      await queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })
      await queryClient.invalidateQueries({ queryKey: ['landing', 'products'] })
    },
  })

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => databaseService.deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      await queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] })
      await queryClient.invalidateQueries({ queryKey: ['landing', 'products'] })
    },
  })

  const saveScanMutation = useMutation({
    mutationFn: async () => {
      if (!scanForm.id) throw new Error('Chọn một lượt quét để cập nhật.')
      const parsedMetrics = JSON.parse(scanForm.metricsJson)
      const score = Number(scanForm.score)

      if (Number.isNaN(score) || score < 0 || score > 100) {
        throw new Error('Điểm phải là số từ 0 đến 100.')
      }

      return databaseService.updateScan(scanForm.id, {
        score,
        metrics: parsedMetrics,
      })
    },
    onSuccess: async () => {
      setScanForm(emptyScanForm)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'scans'] })
      await queryClient.invalidateQueries({ queryKey: ['scan-history'] })
    },
  })

  const deleteScanMutation = useMutation({
    mutationFn: async (id: string) => databaseService.deleteScan(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'scans'] })
      await queryClient.invalidateQueries({ queryKey: ['scan-history'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'recommendations'] })
    },
  })

  const saveRecommendationMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        scanId: recommendationForm.scanId.trim(),
        productId: recommendationForm.productId.trim(),
        reason: recommendationForm.reason.trim(),
      }

      if (!payload.scanId || !payload.productId || !payload.reason) {
        throw new Error('Vui lòng điền ID quét, ID sản phẩm và lý do trước khi lưu.')
      }

      if (recommendationForm.id) {
        return databaseService.updateRecommendation(recommendationForm.id, payload)
      }

      return databaseService.createRecommendation(payload)
    },
    onSuccess: async () => {
      setRecommendationForm(emptyRecommendationForm)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'recommendations'] })
    },
  })

  const deleteRecommendationMutation = useMutation({
    mutationFn: async (id: string) => databaseService.deleteRecommendation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'recommendations'] })
    },
  })

  // User Manager Mutations
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return databaseService.updateUserRole(userId, role)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      await useAuthStore.getState().initialize()
    },
  })

  const createUserRoleMutation = useMutation({
    mutationFn: async () => {
      if (!newUserEmail || !newUserEmail.includes('@')) {
        throw new Error('Vui lòng nhập địa chỉ email hợp lệ.')
      }
      return databaseService.createUserWithRole(newUserEmail, newUserRole)
    },
    onSuccess: async () => {
      setNewUserEmail('')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const deleteUserRoleMutation = useMutation({
    mutationFn: async (userId: string) => {
      return databaseService.deleteUserRole(userId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      await useAuthStore.getState().initialize()
    },
  })

  // Scan Simulator Mutation
  const runSimulatorMutation = useMutation({
    mutationFn: async () => {
      const userId = targetUserId.trim() || currentAuthUser?.id || 'guest-user'

      const calculatedScore = Math.round(
        (simHydration + (100 - simAcne) + (100 - simOiliness) + (100 - simDarkCircles)) / 4,
      )

      const getStatus = (metric: string, val: number) => {
        if (metric === 'acne') {
          if (val >= 80) return 'great'
          if (val >= 20) return 'moderate'
          return 'attention'
        }
        if (val >= 75) return 'great'
        if (val >= 40) return 'moderate'
        return 'attention'
      }

      const scanResult: ScanResult = {
        skinScore: calculatedScore,
        hydration: { label: 'Độ ẩm', value: simHydration, status: getStatus('hydration', simHydration) },
        acne: { label: 'Mụn', value: simAcne, status: getStatus('acne', simAcne) },
        oiliness: { label: 'Độ dầu', value: simOiliness, status: getStatus('oiliness', simOiliness) },
        darkCircles: { label: 'Quầng thâm', value: simDarkCircles, status: getStatus('darkCircles', simDarkCircles) },
      }

      // Check if we can save to database
      if (userId === 'guest-user' || !currentAuthUser) {
        // Fallback to guest scans array in localStorage
        const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
        const id = makeId()
        const now = new Date().toISOString()
        const products = productsQuery.data || []
        const topProducts = products.slice(0, 3)

        const recommendations = topProducts.map((p, idx) => ({
          id: makeId(),
          productId: p.id,
          reason: `Gợi ý mô phỏng: phù hợp cho mục tiêu ${idx === 0 ? 'độ ẩm' : idx === 1 ? 'mụn' : 'quầng thâm'}`,
        }))

        const scan = { id, userId: null, result: scanResult, created_at: now, recommendations }
        const existing = JSON.parse(localStorage.getItem('guest_scans') || '[]')
        existing.unshift(scan)
        localStorage.setItem('guest_scans', JSON.stringify(existing))
        return id
      }

      // Real Supabase insert
      const products = productsQuery.data || []
      const topProducts = products.slice(0, 3)
      const scanId = await databaseService.saveScan(userId, scanResult)

      await databaseService.saveRecommendations(
        scanId,
        topProducts.map((product, idx) => ({
          productId: product.id,
          reason: `Kết quả mô phỏng cho mục tiêu ${idx === 0 ? 'độ ẩm' : idx === 1 ? 'mụn' : 'quầng thâm'}`,
        })),
      )
      return scanId
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'scans'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'recommendations'] })
    },
  })

  // Order & Revenue Mutations
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: 'pending' | 'completed' | 'canceled' }) => {
      return databaseService.updateOrderStatus(orderId, status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return databaseService.deleteOrder(orderId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })

  const simulateOrderMutation = useMutation({
    mutationFn: async () => {
      const products = productsQuery.data || []
      if (products.length === 0) throw new Error('Không có sản phẩm nào để giả lập đơn hàng.')
      const prod = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 2) + 1
      const price = 250000 + Math.floor(Math.random() * 8) * 50000 // Mock custom price
      
      const firstNames = ['Hoàng', 'Lê', 'Nguyễn', 'Trần', 'Phạm', 'Đỗ', 'Bùi', 'Vũ']
      const lastNames = ['Nam', 'Hà', 'Trang', 'Hùng', 'Oanh', 'Dũng', 'Phúc', 'Linh']
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
      const phone = `098${Math.floor(1000000 + Math.random() * 9000000)}`
      const address = `${Math.floor(Math.random() * 100) + 1} Đường Hoa Mai, TP. Hồ Chí Minh`
      
      const paymentMethods = ['cod', 'momo', 'visa', 'apple'] as const
      
      const newOrder: OrderRecord = {
        id: `BG-${Math.floor(100000 + Math.random() * 900000)}`,
        productId: prod.id,
        productName: prod.name,
        productImage: prod.image_url || 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=400&q=80',
        productCategory: parseProductTags(prod).category || 'Serum',
        quantity,
        price,
        totalPrice: price * quantity,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        shippingInfo: { name, phone, address },
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      return databaseService.createOrder(newOrder)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })

  // Simulated events for activity log
  const systemActivityLog = useMemo(() => {
    const logs: Array<{ id: string; user: string; event: string; time: string; type: 'success' | 'info' | 'warning' }> = []

    // Add real items if available
    const scans = scansQuery.data ?? []
    scans.slice(0, 4).forEach((scan) => {
      logs.push({
        id: `scan-${scan.id}`,
        user: `Người dùng ${scan.user_id.slice(0, 5)}...`,
        event: `Hoàn thành phân tích da với điểm số ${scan.score}`,
        time: formatDate(scan.created_at),
        type: scan.score > 80 ? 'success' : 'info',
      })
    })

    const prods = productsQuery.data ?? []
    prods.slice(0, 3).forEach((prod) => {
      logs.push({
        id: `prod-${prod.id}`,
        user: 'Quản trị danh mục',
        event: `Đã chỉnh sửa mục danh mục "${prod.name}"`,
        time: formatDate(prod.created_at),
        type: 'success',
      })
    })

    // Fallbacks
    if (logs.length === 0) {
      logs.push(
        { id: '1', user: 'Hệ thống', event: 'Kết nối cơ sở dữ liệu thành công.', time: 'Vừa xong', type: 'success' },
        { id: '2', user: 'Super Admin', event: 'Đăng nhập từ địa chỉ IP mới.', time: '10 phút trước', type: 'info' },
      )
    }

    return logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  }, [scansQuery.data, productsQuery.data])

  const isBusy =
    productsQuery.isLoading ||
    scansQuery.isLoading ||
    recommendationsQuery.isLoading ||
    usersQuery.isLoading

  if (isBusy && !productsQuery.data && !scansQuery.data && !recommendationsQuery.data) {
    return <Loader fullScreen label="Đang tải bảng điều khiển quản trị" />
  }

  return (
    <section className="section-shell pb-12 admin-shell">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar Nav */}
        <aside className="sticky top-[calc(var(--app-header-height)+1rem)] h-fit rounded-[2rem] border border-rose-100 bg-white/80 p-4 shadow-[0_24px_70px_rgba(168,112,134,0.12)] backdrop-blur-xl">
          <div className="rounded-[1.5rem] border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-rose-600">
              <ShieldCheck className="h-4 w-4" />
              {getAdminRoleLabel(adminRole)}
            </div>
            <h1 className="mt-3 font-display text-3xl text-rose-950">Bảng điều khiển</h1>
            <p className="mt-2 text-sm leading-6 text-mist">
              Quản lý dữ liệu sản phẩm, lịch sử quét da và quyền truy cập người dùng theo thời gian thực.
            </p>
          </div>

          <nav className="mt-4 space-y-2">
            {tabs.map((section) => {
              const Icon = section.icon
              const active = activeSection === section.id

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${active
                      ? 'border-rose-300 bg-rose-50 text-rose-950 shadow-sm'
                      : 'border-transparent bg-white text-mist hover:border-rose-100 hover:bg-rose-50/60 hover:text-rose-950'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-xl p-2 ${active ? 'bg-white text-rose-600' : 'bg-rose-50 text-rose-500'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{section.label}</p>
                      <p className="mt-0.5 text-xs leading-5 text-mist">{section.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>

          <div className="mt-4 space-y-2">
            <Button
              className="w-full justify-center"
              onClick={() => {
                void queryClient.invalidateQueries({ queryKey: ['admin'] })
                void testPing()
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới dữ liệu
            </Button>
            <Button variant="ghost" className="w-full justify-center" onClick={() => void signOut()}>
              Đăng xuất
            </Button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Dashboard Welcome Header */}
          <Card className="border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-0 overflow-hidden relative">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.9fr] lg:p-8 relative z-10">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">
                  <Database className="h-4 w-4" />
                  Kết nối nền tảng Supabase
                </div>
                <div className="space-y-3">
                  <h2 className="font-display text-4xl text-rose-950 md:text-5xl">
                    Vận hành toàn bộ nền tảng làm đẹp từ một nơi
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-mist md:text-base">
                    Kết nối Supabase theo thời gian thực đang hoạt động. Các thay đổi về danh mục, quét da và vai trò sẽ được đồng bộ ngay lập tức và phản ánh trên ứng dụng.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setActiveSection('products')}>
                    Quản lý sản phẩm
                    <PencilLine className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => setActiveSection('scans')}>
                    Quét da & Mô phỏng
                  </Button>
                  <Button variant="ghost" onClick={() => setActiveSection('access')}>
                    Chỉnh sửa quyền người dùng
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {overviewCards.map((card) => {
                  const Icon = card.icon

                  return (
                    <div key={card.label} className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-cyan">{card.label}</p>
                          <p className="mt-2 font-display text-3xl text-rose-950">{card.value}</p>
                          <p className="mt-1 text-xs text-mist">{card.hint}</p>
                        </div>
                        <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Background design accents */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle_at_bottom_right,rgba(254,200,210,0.45),transparent_70%)] pointer-events-none" />
          </Card>

          {/* OVERVIEW TAB */}
          {activeSection === 'overview' ? (
            <div className="space-y-6">
              {/* Row 1: System Health & Ping Status */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-rose-100 p-5 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs uppercase tracking-[0.2em] text-cyan">
                      <span>Kết nối Supabase</span>
                      <Wifi className="h-4 w-4 text-emerald-500 animate-pulse" />
                    </div>
                    <h3 className="mt-3 font-display text-2xl text-rose-950">Trực tuyến</h3>
                    <p className="mt-1 text-xs text-mist leading-relaxed">
                      API đang hoạt động và chấp nhận các thao tác CRUD.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-rose-50 flex items-center justify-between text-xs">
                    <span className="text-mist/70">Độ trễ CSDL:</span>
                    <span className="font-semibold text-emerald-600">
                      {pingStatus === 'pinging' ? '...' : pingTime && pingTime > 0 ? `${pingTime}ms` : 'Kiểm tra thất bại'}
                    </span>
                  </div>
                </Card>

                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan">Truy vấn CSDL</p>
                  <h3 className="mt-3 font-display text-2xl text-rose-950">
                    {scansQuery.data ? scansQuery.data.length + (productsQuery.data?.length ?? 0) : '0'} dòng
                  </h3>
                  <p className="mt-2 text-xs text-mist">
                    Sản phẩm, liên kết gợi ý và bản ghi.
                  </p>
                  <div className="mt-3 pt-3 border-t border-rose-50 text-right">
                    <button
                      onClick={testPing}
                      disabled={pingStatus === 'pinging'}
                      className="text-xs text-rose-600 hover:underline flex items-center justify-end gap-1 ml-auto"
                    >
                      <Activity className="h-3 w-3" />
                      {pingStatus === 'pinging' ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                    </button>
                  </div>
                </Card>

                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan">Mô phỏng CPU</p>
                  <h3 className="mt-3 font-display text-2xl text-rose-950">14% - 24%</h3>
                  <div className="w-full bg-rose-50 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-400 to-pink-500 h-full rounded-full w-[18%]" />
                  </div>
                  <p className="mt-2 text-[10px] text-mist/70">Mức sử dụng máy chủ trung bình</p>
                </Card>

                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan">Tải bộ nhớ</p>
                  <h3 className="mt-3 font-display text-2xl text-rose-950">512 MB</h3>
                  <div className="w-full bg-rose-50 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan to-teal-400 h-full rounded-full w-[50%]" />
                  </div>
                  <p className="mt-2 text-[10px] text-mist/70">Đã sử dụng 512MB trên tổng 1024MB được phân bổ</p>
                </Card>
              </div>

              {/* Row 2: SVG Graphs and Real statistics */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* SVG Graph: Skin Score Histogram */}
                <Card className="border border-rose-100 p-6 bg-white space-y-4">
                  <div>
                    <h3 className="font-display text-xl text-rose-950">Phân bố điểm da</h3>
                    <p className="text-xs text-mist">Tần suất điểm số từ các lượt quét lịch sử của khách hàng.</p>
                  </div>
                  <div className="h-44 flex items-end justify-between gap-2 border-b border-rose-100 pb-2">
                    {scanStats.scoreRanges.map((count, i) => {
                      const labels = ['<60', '60-70', '70-80', '80-90', '90+']
                      const heightPercent = maxRangeCount > 0 ? (count / maxRangeCount) * 100 : 0
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <span className="text-xs font-semibold text-rose-950">{count}</span>
                          <div className="w-full bg-rose-50 hover:bg-rose-100 rounded-lg overflow-hidden transition-all duration-300 relative" style={{ height: `${heightPercent * 0.7}%` }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-rose-400 via-pink-500 to-rose-300" />
                          </div>
                          <span className="text-[10px] text-mist font-medium">{labels[i]}</span>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {/* Aggregated Skin Metrics */}
                <Card className="border border-rose-100 p-6 bg-white space-y-4">
                  <div>
                    <h3 className="font-display text-xl text-rose-950">Chỉ số da trung bình</h3>
                    <p className="text-xs text-mist">Giá trị trung bình từ tất cả các bản ghi quét da.</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    {[
                      { name: 'Độ ẩm', val: scanStats.avgHydration, color: 'from-cyan to-blue-400', desc: 'Càng cao càng tốt' },
                      { name: 'Mức độ mụn', val: scanStats.avgAcne, color: 'from-rose-400 to-pink-500', desc: 'Càng thấp càng tốt' },
                      { name: 'Bã nhờn / Độ dầu', val: scanStats.avgOiliness, color: 'from-amber-400 to-yellow-500', desc: 'Cân bằng ở ~50' },
                      { name: 'Quầng thâm', val: scanStats.avgDarkCircles, color: 'from-purple-400 to-indigo-500', desc: 'Càng thấp càng tốt' },
                    ].map((metric) => (
                      <div key={metric.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-rose-950">
                          <span>{metric.name}</span>
                          <span>{metric.val}%</span>
                        </div>
                        <div className="w-full bg-rose-50 h-3 rounded-full overflow-hidden relative">
                          <div
                            className={`bg-gradient-to-r ${metric.color} h-full rounded-full`}
                            style={{ width: `${metric.val}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-mist/60 leading-none">{metric.desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Row 3: Live Audit Logs / Activity Log */}
              <Card className="border border-rose-100 p-6 bg-white space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-display text-xl text-rose-950">Hoạt động hệ thống</h3>
                    <p className="text-xs text-mist">Thông báo trực tiếp và nhật ký hoạt động.</p>
                  </div>
                  <span className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                    Nhật ký
                  </span>
                </div>
                <div className="divide-y divide-rose-50 max-h-60 overflow-y-auto pr-1">
                  {systemActivityLog.map((log) => (
                    <div key={log.id} className="py-3 flex justify-between items-start text-xs gap-3">
                      <div className="flex gap-2">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.type === 'success' ? 'bg-emerald-500' : log.type === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                        <div>
                          <p className="font-semibold text-rose-950">{log.user}</p>
                          <p className="text-mist/90">{log.event}</p>
                        </div>
                      </div>
                      <span className="text-mist/60 whitespace-nowrap">{log.time}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}

          {/* PRODUCTS TAB */}
          {activeSection === 'products' ? (
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              {/* Product Form */}
              <Card className="border border-rose-100 p-6 self-start bg-white shadow-sm">
                <AdminSectionTitle
                  eyebrow="Quản lý danh mục"
                  title={productForm.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                  description="Thêm hoặc chỉnh sửa sản phẩm. Giá cả, số lượng tồn kho và giảm giá sẽ được xử lý khi lưu."
                />
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Tên sản phẩm</label>
                    <Input
                      placeholder="Tên sản phẩm (ví dụ: Sữa rửa mặt)"
                      value={productForm.name}
                      onChange={(event) => setProductForm((state) => ({ ...state, name: event.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Mô tả</label>
                    <textarea
                      className="min-h-[90px] w-full rounded-2xl border border-rose-200/80 bg-white/80 px-4 py-3 text-sm text-pearl placeholder:text-mist/70 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/25"
                      placeholder="Nhập mô tả chi tiết về sản phẩm..."
                      value={productForm.description}
                      onChange={(event) => setProductForm((state) => ({ ...state, description: event.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Danh mục</label>
                      <select
                        className="w-full rounded-2xl border border-rose-200/80 bg-white/85 px-4 py-3 text-sm text-pearl focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/25"
                        value={productForm.category}
                        onChange={(event) => setProductForm((state) => ({ ...state, category: event.target.value }))}
                      >
                        <option value="Cleanser">Sữa rửa mặt</option>
                        <option value="Serum">Serum</option>
                        <option value="Moisturizer">Dưỡng ẩm</option>
                        <option value="Toner">Tôner</option>
                        <option value="Sunscreen">Kem chống nắng</option>
                        <option value="Treatment">Điều trị</option>
                        <option value="Essence">Tinh chất</option>
                        <option value="Mask">Mặt nạ</option>
                        <option value="Eye Care">Chăm sóc mắt</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Số lượng tồn</label>
                      <Input
                        placeholder="Tồn kho (ví dụ: 15)"
                        type="number"
                        value={productForm.stock}
                        onChange={(event) => setProductForm((state) => ({ ...state, stock: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Giá bán</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-mist/60" />
                        <Input
                          className="pl-8"
                          placeholder="42"
                          value={productForm.price.replace('$', '')}
                          onChange={(event) => setProductForm((state) => ({ ...state, price: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Giá gốc</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-mist/60" />
                        <Input
                          className="pl-8"
                          placeholder="56"
                          value={productForm.originalPrice.replace('$', '')}
                          onChange={(event) => setProductForm((state) => ({ ...state, originalPrice: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Giảm giá %</label>
                      <Input
                        placeholder="25"
                        type="number"
                        value={productForm.discount}
                        onChange={(event) => setProductForm((state) => ({ ...state, discount: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Đường dẫn hình ảnh</label>
                    <Input
                      placeholder="https://images.unsplash.com/photo-..."
                      value={productForm.imageUrl}
                      onChange={(event) => setProductForm((state) => ({ ...state, imageUrl: event.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Liên kết đối tác</label>
                    <Input
                      placeholder="https://example.com/partner-item"
                      value={productForm.externalUrl}
                      onChange={(event) => setProductForm((state) => ({ ...state, externalUrl: event.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Thẻ (cách nhau bằng dấu phẩy)</label>
                    <Input
                      placeholder="sensitive, barrier, peptide"
                      value={productForm.tags}
                      onChange={(event) => setProductForm((state) => ({ ...state, tags: event.target.value }))}
                    />
                  </div>

                  {saveProductMutation.error ? (
                    <p className="text-sm text-rose-500">{saveProductMutation.error.message}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button
                      onClick={() => saveProductMutation.mutate()}
                      disabled={saveProductMutation.isPending}
                    >
                      {saveProductMutation.isPending ? 'Đang lưu...' : productForm.id ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
                    </Button>
                    <Button variant="ghost" onClick={() => setProductForm(emptyProductForm)}>
                      Đặt lại
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Products List */}
              <div className="space-y-4">
                {/* Search & Filters */}
                <div className="bg-white border border-rose-100 rounded-3xl p-4 flex flex-wrap gap-3 items-center">
                  <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-mist" />
                    <input
                      type="text"
                      className="w-full rounded-full border border-rose-100 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-200"
                      placeholder="Tìm sản phẩm theo tên/mô tả..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="rounded-full border border-rose-100 px-3 py-2 text-sm text-pearl focus:outline-none"
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                  >
                    <option value="All">Tất cả danh mục</option>
                    <option value="Cleanser">Sữa rửa mặt</option>
                    <option value="Serum">Serum</option>
                    <option value="Moisturizer">Dưỡng ẩm</option>
                    <option value="Toner">Tôner</option>
                    <option value="Sunscreen">Kem chống nắng</option>
                    <option value="Treatment">Điều trị</option>
                    <option value="Essence">Tinh chất</option>
                    <option value="Mask">Mặt nạ</option>
                    <option value="Eye Care">Chăm sóc mắt</option>
                  </select>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-rose-100 rounded-3xl text-mist">
                    Không có sản phẩm khớp với tìm kiếm hoặc danh mục.
                  </div>
                ) : null}

                {filteredProducts.map((product) => {
                  const parsed = parseProductTags(product)
                  return (
                    <Card key={product.id} className="border border-rose-100 p-5 bg-white relative">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-24 w-24 rounded-2xl object-cover border border-rose-50"
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-display text-2xl text-rose-950 font-bold leading-tight">{product.name}</h3>
                              <p className="mt-1 text-xs text-mist line-clamp-2">{product.description}</p>
                            </div>
                            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600">
                              {parsed.category}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-rose-950/80 pt-1">
                            {parsed.price && (
                              <span className="flex items-center gap-1">
                                Price: <span className="text-rose-600 font-extrabold">{parsed.price}</span>
                                {parsed.originalPrice && <span className="text-mist/60 line-through text-[10px]">{parsed.originalPrice}</span>}
                              </span>
                            )}
                            {parsed.discount && (
                              <span className="text-rose-500 font-extrabold">-{parsed.discount}%</span>
                            )}
                            {parsed.stock !== undefined && (
                              <span className={`flex items-center gap-1 ${parsed.stock <= 5 ? 'text-amber-600 font-bold' : 'text-mist/75'}`}>
                                <Package className="h-3 w-3" />
                                {parsed.stock} tồn kho
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-mist/70 leading-none">
                            Thẻ: {formatTags(parsed.cleanTags)}
                          </p>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button size="sm" variant="ghost" onClick={() => setProductForm(mapProductForm(product))}>
                              Chỉnh sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Xóa ${product.name}?`)) {
                                  deleteProductMutation.mutate(product.id)
                                }
                              }}
                              disabled={deleteProductMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa sản phẩm
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* SCANS TAB WITH SCAN SIMULATOR */}
          {activeSection === 'scans' ? (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              {/* Scan Records list */}
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-white border border-rose-100 rounded-3xl p-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-mist" />
                    <input
                      type="text"
                      className="w-full rounded-full border border-rose-100 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-200"
                      placeholder="Tìm kiếm lượt quét bằng UUID người dùng hoặc Mã lượt quét..."
                      value={scanSearch}
                      onChange={(e) => setScanSearch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-rose-950 font-bold uppercase tracking-wider">
                      <span>Khoảng điểm:</span>
                      <span>{scanScoreFilter[0]} - {scanScoreFilter[1]}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        className="flex-1 accent-rose-500"
                        value={scanScoreFilter[0]}
                        onChange={(e) => setScanScoreFilter([Number(e.target.value), scanScoreFilter[1]])}
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        className="flex-1 accent-rose-500"
                        value={scanScoreFilter[1]}
                        onChange={(e) => setScanScoreFilter([scanScoreFilter[0], Number(e.target.value)])}
                      />
                    </div>
                  </div>
                </div>

                <Card className="border border-rose-100 p-6 bg-white">
                  <AdminSectionTitle
                    eyebrow="Bản ghi quét"
                    title="Lịch sử phân tích da"
                    description="Chọn một lượt quét để kiểm tra các chỉ số, thay đổi điểm số, hoặc xóa bản ghi lịch sử."
                  />
                  <div className="mt-5 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredScans.length === 0 ? (
                      <p className="text-center py-6 text-mist text-sm">Không có lượt quét nào khớp với bộ lọc.</p>
                    ) : null}

                    {filteredScans.map((scan) => (
                      <button
                        key={scan.id}
                        type="button"
                        onClick={() => setScanForm(mapScanForm(scan))}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${scanForm.id === scan.id
                            ? 'border-rose-300 bg-rose-50 text-rose-950'
                            : 'border-rose-100 bg-white hover:border-rose-200 hover:bg-rose-50/60'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-rose-950">Lượt quét {scan.id.slice(0, 8)}</p>
                            <p className="mt-0.5 text-xs text-mist truncate">Người dùng: {scan.user_id}</p>
                            <p className="mt-1 text-[10px] text-mist">{formatDate(scan.created_at)}</p>
                          </div>
                          <div className="rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-xs font-bold text-rose-600">
                            Điểm {scan.score}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Right Side: Scan Details + Scan Simulator */}
              <div className="space-y-6">
                {/* Selected Scan details/editor */}
                {scanForm.id ? (
                  <Card className="border border-rose-100 p-6 bg-white">
                    <AdminSectionTitle
                      eyebrow="Trình chỉnh sửa quét"
                      title={`Chi tiết lượt quét ${scanForm.id.slice(0, 8)}`}
                      description="Cập nhật điểm số hoặc ghi đè thủ công dữ liệu phân tích JSON đã lưu."
                    />
                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Điểm số</label>
                        <Input
                          placeholder="Điểm số"
                          type="number"
                          value={scanForm.score}
                          onChange={(event) => setScanForm((state) => ({ ...state, score: event.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Dữ liệu chỉ số JSON</label>
                        <textarea
                          className="min-h-[140px] w-full rounded-2xl border border-rose-200/80 bg-white/80 px-4 py-3 font-mono text-xs text-pearl placeholder:text-mist/70 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/25"
                          placeholder="Dữ liệu chỉ số JSON"
                          value={scanForm.metricsJson}
                          onChange={(event) => setScanForm((state) => ({ ...state, metricsJson: event.target.value }))}
                        />
                      </div>

                      {saveScanMutation.error ? (
                        <p className="text-sm text-rose-500">{saveScanMutation.error.message}</p>
                      ) : null}

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button onClick={() => saveScanMutation.mutate()} disabled={saveScanMutation.isPending}>
                          Lưu cập nhật
                        </Button>
                        <Button variant="ghost" onClick={() => setScanForm(emptyScanForm)}>
                          Hủy
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Xóa vĩnh viễn bản ghi quét này?')) {
                              deleteScanMutation.mutate(scanForm.id)
                            }
                          }}
                          disabled={deleteScanMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa lượt quét
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : null}

                {/* Scan Simulator Panel */}
                <Card className="border border-rose-200 bg-gradient-to-br from-rose-50/50 to-amber-50/30 p-6">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-rose-600 font-extrabold">
                    <Sliders className="h-4 w-4 text-rose-500 animate-pulse" />
                    <span>Phòng lập trình viên</span>
                  </div>
                  <h3 className="mt-2 font-display text-2xl text-rose-950">Trình giả lập quét da</h3>
                  <p className="mt-1 text-sm text-mist">
                    Kích hoạt kết quả giả lập và lưu trực tiếp vào Supabase để kiểm tra các bộ kích hoạt gợi ý.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">
                        Mã ID người dùng đích (Để trống để dùng admin hiện tại)
                      </label>
                      <Input
                        placeholder="UUID người dùng Supabase (ví dụ: 5d5a7d8...)"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      {/* Hydration Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-rose-950">
                          <span>Độ ẩm</span>
                          <span className="text-cyan-600 font-extrabold">{simHydration}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          className="w-full accent-cyan"
                          value={simHydration}
                          onChange={(e) => setSimHydration(Number(e.target.value))}
                        />
                      </div>

                      {/* Acne Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-rose-950">
                          <span>Mức độ mụn (giá trị thấp hơn thể hiện da sạch hơn)</span>
                          <span className="text-rose-600 font-extrabold">{simAcne}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          className="w-full accent-rose-500"
                          value={simAcne}
                          onChange={(e) => setSimAcne(Number(e.target.value))}
                        />
                      </div>

                      {/* Oiliness Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-rose-950">
                          <span>Bã nhờn / Độ dầu</span>
                          <span className="text-amber-600 font-extrabold">{simOiliness}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          className="w-full accent-amber-500"
                          value={simOiliness}
                          onChange={(e) => setSimOiliness(Number(e.target.value))}
                        />
                      </div>

                      {/* Dark Circles Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-rose-950">
                          <span>Độ mệt mỏi quầng thâm</span>
                          <span className="text-purple-600 font-extrabold">{simDarkCircles}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          className="w-full accent-purple-500"
                          value={simDarkCircles}
                          onChange={(e) => setSimDarkCircles(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="bg-white/80 p-3 rounded-2xl border border-rose-100 flex items-center justify-between text-xs">
                      <span className="text-mist font-semibold">Điểm da tính toán:</span>
                      <span className="text-lg font-bold text-rose-900">
                        {Math.round((simHydration + (100 - simAcne) + (100 - simOiliness) + (100 - simDarkCircles)) / 4)} / 100
                      </span>
                    </div>

                    {runSimulatorMutation.error ? (
                      <p className="text-xs text-rose-500">{runSimulatorMutation.error.message}</p>
                    ) : null}

                    {runSimulatorMutation.isSuccess ? (
                      <p className="text-xs text-emerald-600 font-bold">Đã chèn lượt quét giả lập thành công! ✓</p>
                    ) : null}

                    <Button
                      className="w-full justify-center"
                      onClick={() => runSimulatorMutation.mutate()}
                      disabled={runSimulatorMutation.isPending}
                    >
                      {runSimulatorMutation.isPending ? 'Đang chèn bản ghi...' : 'Giả lập quét da & Lưu'}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          ) : null}

          {/* RECOMMENDATIONS TAB */}
          {activeSection === 'recommendations' ? (
            <div className="space-y-4">
              {/* Creator Form */}
              <Card className="border border-rose-100 p-6 bg-white">
                <AdminSectionTitle
                  eyebrow="Quản lý gợi ý"
                  title={recommendationForm.id ? 'Chỉnh sửa gợi ý sản phẩm' : 'Tạo liên kết gợi ý sản phẩm'}
                  description="Liên kết một sản phẩm cụ thể với Mã lượt quét (Scan ID). Tùy chỉnh lý do phù hợp hiển thị trong dòng thời gian của khách hàng."
                />
                <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Mã lượt quét (Scan ID)</label>
                    <Input
                      placeholder="UUID lượt quét (ví dụ: 10f3f31d-...)"
                      value={recommendationForm.scanId}
                      onChange={(event) => setRecommendationForm((state) => ({ ...state, scanId: event.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Mã sản phẩm (Product ID)</label>
                    <Input
                      placeholder="UUID sản phẩm (ví dụ: ac95f484-...)"
                      value={recommendationForm.productId}
                      onChange={(event) => setRecommendationForm((state) => ({ ...state, productId: event.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Lý do phù hợp (Match Reason)</label>
                    <Input
                      placeholder="Lý do gợi ý (ví dụ: Phù hợp với da thiếu nước...)"
                      value={recommendationForm.reason}
                      onChange={(event) => setRecommendationForm((state) => ({ ...state, reason: event.target.value }))}
                    />
                  </div>
                </div>

                {saveRecommendationMutation.error ? (
                  <p className="mt-3 text-sm text-rose-500">{saveRecommendationMutation.error.message}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => saveRecommendationMutation.mutate()} disabled={saveRecommendationMutation.isPending}>
                    {saveRecommendationMutation.isPending ? 'Đang lưu...' : recommendationForm.id ? 'Cập nhật gợi ý' : 'Tạo gợi ý'}
                  </Button>
                  <Button variant="ghost" onClick={() => setRecommendationForm(emptyRecommendationForm)}>
                    Đặt lại
                  </Button>
                </div>
              </Card>

              {/* Search & Filter */}
              <div className="bg-white border border-rose-100 rounded-3xl p-4 flex flex-wrap gap-3 items-center">
                <div className="flex-1 relative min-w-[200px]">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-mist" />
                  <input
                    type="text"
                    className="w-full rounded-full border border-rose-100 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-200"
                    placeholder="Tìm kiếm theo từ khóa Lượt quét, Sản phẩm hoặc Lý do..."
                    value={recommendationSearch}
                    onChange={(e) => setRecommendationSearch(e.target.value)}
                  />
                </div>

                <select
                  className="rounded-full border border-rose-100 px-3 py-2 text-sm text-pearl focus:outline-none"
                  value={recommendationCategoryFilter}
                  onChange={(e) => setRecommendationCategoryFilter(e.target.value)}
                >
                  <option value="All">Tất cả danh mục</option>
                  <option value="Cleanser">Sữa rửa mặt</option>
                  <option value="Serum">Tinh chất / Serum</option>
                  <option value="Moisturizer">Kem dưỡng ẩm</option>
                  <option value="Toner">Nước hoa hồng / Toner</option>
                  <option value="Sunscreen">Kem chống nắng</option>
                  <option value="Treatment">Sản phẩm đặc trị</option>
                  <option value="Essence">Tinh chất dưỡng / Essence</option>
                  <option value="Mask">Mặt nạ</option>
                  <option value="Eye Care">Chăm sóc mắt</option>
                </select>
              </div>

              {filteredRecommendations.length === 0 ? (
                <div className="text-center py-12 bg-white border border-rose-100 rounded-3xl text-mist">
                  Không có bản ghi gợi ý nào khớp với tiêu chí tìm kiếm.
                </div>
              ) : null}

              {/* Recommendations grid */}
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredRecommendations.map((recommendation) => {
                  const product = productLookup.get(recommendation.product_id)
                  const scan = scanLookup.get(recommendation.scan_id)
                  const parsedProduct = product ? parseProductTags(product) : null

                  return (
                    <Card key={recommendation.id} className="border border-rose-100 p-5 bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan font-bold">Liên kết gợi ý</p>
                          <h3 className="mt-2 font-display text-2xl text-rose-950 font-bold truncate">
                            {product?.name ?? recommendation.product_id.slice(0, 8)}
                          </h3>
                          {parsedProduct && (
                            <span className="inline-block mt-1 text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-semibold">
                              {parsedProduct.category}
                            </span>
                          )}
                          <p className="mt-2.5 text-xs text-mist leading-relaxed font-medium bg-rose-50/20 border border-rose-100/50 p-2.5 rounded-xl">
                            {recommendation.reason}
                          </p>
                        </div>
                        <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-mist shrink-0 font-mono">
                          {formatDate(recommendation.created_at)}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2 rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-[11px] text-mist">
                        <p className="truncate"><span className="font-semibold text-rose-950">UUID Lượt quét:</span> {recommendation.scan_id} {scan && `(Điểm số: ${scan.score})`}</p>
                        <p className="truncate"><span className="font-semibold text-rose-950">UUID Sản phẩm:</span> {recommendation.product_id}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 pt-1">
                        <Button size="sm" variant="ghost" onClick={() => setRecommendationForm(mapRecommendationForm(recommendation))}>
                          Sửa chi tiết gợi ý
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Xóa liên kết gợi ý này?')) {
                              deleteRecommendationMutation.mutate(recommendation.id)
                            }
                          }}
                          disabled={deleteRecommendationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa gợi ý
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* ACCESS CONTROL MANAGER */}
          {activeSection === 'access' ? (
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              {/* Users list and Role Editor */}
              <Card className="border border-rose-100 p-6 bg-white shadow-sm space-y-5">
                <div>
                  <h3 className="font-display text-2xl text-rose-950">Phân quyền người dùng</h3>
                  <p className="text-xs text-mist mt-1">
                    Quản lý quyền hạn của người dùng thử nghiệm. Thiết lập một tài khoản thành "user" sẽ thu hồi quyền truy cập trang quản trị ngay lập tức.
                  </p>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-mist" />
                  <input
                    type="text"
                    className="w-full rounded-full border border-rose-100 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-200"
                    placeholder="Tìm kiếm người dùng bằng email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-rose-100 text-rose-950 font-bold uppercase tracking-wider">
                        <th className="pb-3 pr-2">Email</th>
                        <th className="pb-3 px-2">Quyền được gán</th>
                        <th className="pb-3 px-2">Ngày tạo</th>
                        <th className="pb-3 pl-2 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50">
                      {filteredUsers.map((item) => (
                        <tr key={item.id} className="hover:bg-rose-50/20 text-rose-950">
                          <td className="py-3 pr-2 font-medium truncate max-w-[150px]" title={item.email}>
                            {item.email}
                            {item.email.toLowerCase() === currentAuthUser?.email?.toLowerCase() && (
                              <span className="ml-1 text-[9px] bg-cyan/10 text-cyan-700 px-1 py-0.5 rounded font-extrabold">Bạn</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <select
                              className="rounded border border-rose-100 bg-white px-2 py-1 focus:outline-none text-[11px]"
                              value={item.role}
                              onChange={(e) => updateUserRoleMutation.mutate({ userId: item.id, role: e.target.value })}
                            >
                              <option value="superadmin">Quản trị viên cấp cao (Super Admin)</option>
                              <option value="catalog">Quản trị danh mục (Catalog Admin)</option>
                              <option value="operations">Quản trị vận hành (Operations Admin)</option>
                              <option value="content">Quản trị nội dung (Content Admin)</option>
                              <option value="analyst">Nhà phân tích (Analyst)</option>
                              <option value="user">Người dùng (Không có quyền Admin)</option>
                            </select>
                          </td>
                          <td className="py-3 px-2 text-mist">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 pl-2 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Gỡ bỏ quyền tùy chỉnh của ${item.email}?`)) {
                                  deleteUserRoleMutation.mutate(item.id)
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800"
                              disabled={deleteUserRoleMutation.isPending}
                            >
                              Đặt lại
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Add User Panel & Role Explanations */}
              <div className="space-y-4">
                {/* Add Custom User Form */}
                <Card className="border border-rose-100 p-6 bg-white shadow-sm space-y-4">
                  <h3 className="font-display text-xl text-rose-950 flex items-center gap-1.5">
                    <PlusCircle className="h-5 w-5 text-rose-500" />
                    Gán quyền cho người dùng
                  </h3>
                  <p className="text-xs text-mist leading-relaxed">
                    Cấp quyền truy cập các mô-đun cụ thể cho người dùng giả lập hoặc người dùng Supabase. Quyền hạn sẽ có hiệu lực ngay lập tức.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-rose-950 uppercase tracking-wide block mb-1">Email người dùng</label>
                      <Input
                        placeholder="Ví dụ: client@lumina.ai"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-rose-950 uppercase tracking-wide block mb-1">Mức độ truy cập</label>
                      <select
                        className="w-full rounded-2xl border border-rose-200/80 bg-white px-4 py-2.5 text-xs text-pearl focus:outline-none focus:ring-1 focus:ring-rose-300"
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                      >
                        <option value="superadmin">Quản trị viên cấp cao (Tất cả mô-đun)</option>
                        <option value="catalog">Quản trị danh mục (Sản phẩm & Gợi ý)</option>
                        <option value="operations">Quản trị vận hành (Sản phẩm & Lượt quét)</option>
                        <option value="content">Quản trị nội dung (Sản phẩm, Lý do gợi ý)</option>
                        <option value="analyst">Nhà phân tích (Lượt quét, Chỉ xem phân tích)</option>
                        <option value="user">Người dùng thông thường (Bị cấm truy cập Admin)</option>
                      </select>
                    </div>

                    {createUserRoleMutation.error ? (
                      <p className="text-xs text-rose-500">{createUserRoleMutation.error.message}</p>
                    ) : null}

                    <Button
                      className="w-full justify-center"
                      onClick={() => createUserRoleMutation.mutate()}
                      disabled={createUserRoleMutation.isPending}
                    >
                      {createUserRoleMutation.isPending ? 'Đang gán...' : 'Gán quyền người dùng'}
                    </Button>
                  </div>
                </Card>

                {/* Role Explanations */}
                <Card className="border border-rose-100 p-6 bg-white shadow-sm">
                  <AdminSectionTitle
                    eyebrow="Ma trận truy cập"
                    title="Phạm vi mô-đun của vai trò"
                    description="Danh sách hiển thị mô-đun dựa trên quy tắc ánh xạ vai trò."
                  />
                  <div className="mt-5 space-y-3 text-xs text-rose-950">
                    {[
                      { role: 'Quản trị viên cấp cao (Super Admin)', scope: 'Toàn quyền truy cập trên tất cả các phân đoạn bảng điều khiển và công cụ giả lập.' },
                      { role: 'Quản trị danh mục (Catalog Admin)', scope: 'Thêm sản phẩm vào danh mục, chi tiết giá và kết hợp gợi ý sản phẩm.' },
                      { role: 'Quản trị vận hành (Operations Admin)', scope: 'Xem danh sách danh mục, kiểm tra lịch sử quét và sử dụng các công cụ giả lập.' },
                      { role: 'Quản trị nội dung (Content Admin)', scope: 'Chỉnh sửa nội dung mô tả sản phẩm và chỉnh sửa lý do gợi ý phù hợp.' },
                      { role: 'Nhà phân tích (Analyst)', scope: 'Xem biểu đồ chỉ số ở chế độ chỉ đọc, kiểm tra nhật ký quét và kiểm tra kết nối.' },
                    ].map((item) => (
                      <div key={item.role} className="rounded-2xl border border-rose-50 bg-rose-50/20 px-3 py-2.5">
                        <p className="font-semibold flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-rose-500" />
                          {item.role}
                        </p>
                        <p className="mt-1 text-[11px] text-mist">{item.scope}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          ) : null}

          {/* SETTINGS TAB */}
          {activeSection === 'settings' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  title: 'Trạng thái nền tảng',
                  detail: 'Danh mục hỗ trợ bởi Supabase, nhật ký quét và quyền quản trị đang hoạt động trực tiếp.',
                  icon: CheckCircle2,
                },
                {
                  title: 'Công cụ đánh giá',
                  detail: 'Cấu hình điểm số quét, sửa đổi thẻ và tùy chỉnh mô tả lý do phù hợp.',
                  icon: ListChecks,
                },
                {
                  title: 'Quản trị quyền',
                  detail: 'Giới hạn quyền truy cập theo chức năng công việc thông qua các vai trò giả lập chi tiết cho nhà phát triển.',
                  icon: Clock3,
                },
                {
                  title: 'Công cụ giả lập',
                  detail: 'Tạo kết quả quét nhân tạo để xác minh danh mục sản phẩm và chu trình gợi ý.',
                  icon: Megaphone,
                },
                {
                  title: 'Đồng bộ dữ liệu',
                  detail: 'Các trang khách hàng thực tế truy xuất các mục từ cơ sở dữ liệu thay vì các tệp giả lập.',
                  icon: Database,
                },
                {
                  title: 'Chu kỳ tải lại',
                  detail: 'Nhấp tải lại hoặc xóa bộ nhớ đệm để xác thực lại các truy vấn sau khi cập nhật.',
                  icon: Rocket,
                },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <Card key={item.title} className="border border-rose-100 p-5 bg-white flex justify-between items-start gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan font-bold">{item.title}</p>
                      <p className="mt-2 text-xs text-mist leading-relaxed">{item.detail}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-2.5 text-rose-600 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : null}

          {/* REVENUE TAB */}
          {activeSection === 'revenue' ? (
            <div className="space-y-6">
              {/* Revenue header */}
              <Card className="border border-rose-100 p-6 bg-white">
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-2xl text-rose-950">Doanh thu & Đơn hàng</h3>
                  <Button
                    onClick={() => simulateOrderMutation.mutate()}
                    disabled={simulateOrderMutation.isPending}
                    className="flex items-center gap-1"
                  >
                    {simulateOrderMutation.isPending ? 'Đang mô phỏng...' : 'Mô phỏng đơn hàng'}
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {/* Metrics grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase text-cyan">Doanh thu tổng</p>
                  <h4 className="mt-2 font-display text-2xl text-rose-950">
                    {revenueStats.totalRevenue.toLocaleString('vi-VN')}₫
                  </h4>
                  <p className="mt-1 text-xs text-mist">Hoàn thành</p>
                </Card>
                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase text-cyan">Doanh thu chờ</p>
                  <h4 className="mt-2 font-display text-2xl text-rose-950">
                    {revenueStats.pendingAmount.toLocaleString('vi-VN')}₫
                  </h4>
                  <p className="mt-1 text-xs text-mist">Chưa xử lý</p>
                </Card>
                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase text-cyan">Số đơn</p>
                  <h4 className="mt-2 font-display text-2xl text-rose-950">{revenueStats.totalCount}</h4>
                  <p className="mt-1 text-xs text-mist">Tổng đơn</p>
                </Card>
                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase text-cyan">Giá trị đơn trung bình</p>
                  <h4 className="mt-2 font-display text-2xl text-rose-950">
                    {(revenueStats.completedCount ? (revenueStats.totalRevenue / revenueStats.completedCount).toFixed(0) : 0).toLocaleString('vi-VN')}₫
                  </h4>
                  <p className="mt-1 text-xs text-mist">AOV</p>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Tìm kiếm đơn hàng..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="flex-1"
                />
                <select
                  className="rounded border border-rose-100 px-3 py-1 text-sm"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="All">Tất cả</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="canceled">Đã hủy</option>
                </select>
              </div>

              {/* Orders table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="border-b border-rose-100 text-rose-950 font-bold uppercase">
                    <tr>
                      <th className="pb-3">Mã đơn</th>
                      <th className="pb-3">Sản phẩm</th>
                      <th className="pb-3">Giá</th>
                      <th className="pb-3">Trạng thái</th>
                      <th className="pb-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-rose-50/20 text-rose-950">
                        <td className="py-2 font-medium">{order.id}</td>
                        <td className="py-2">{order.productName}</td>
                        <td className="py-2">{order.totalPrice.toLocaleString('vi-VN')}₫</td>
                        <td className="py-2">
                          <select
                            className="rounded border border-rose-100 bg-white px-2 py-1 text-xs"
                            value={order.status}
                            onChange={(e) =>
                              updateOrderStatusMutation.mutate({
                                orderId: order.id,
                                status: e.target.value as any,
                              })
                            }
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            <option value="pending">Chờ</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="canceled">Hủy</option>
                          </select>
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Xóa đơn ${order.id}?`)) deleteOrderMutation.mutate(order.id);
                            }}
                            disabled={deleteOrderMutation.isPending}
                            className="text-rose-600 hover:text-rose-800 flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Category breakdown */}
              <Card className="border border-rose-100 p-5 bg-white">
                <h4 className="font-display text-lg text-rose-950 mb-2">Doanh thu theo danh mục</h4>
                <div className="space-y-2">
                  {revenueStats.categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="flex justify-between text-sm">
                      <span>{cat.name}</span>
                      <span>{cat.value.toLocaleString('vi-VN')}₫</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Payment breakdown */}
              <Card className="border border-rose-100 p-5 bg-white">
                <h4 className="font-display text-lg text-rose-950 mb-2">Doanh thu theo phương thức thanh toán</h4>
                <div className="space-y-2">
                  {revenueStats.paymentBreakdown.map((pay) => (
                    <div key={pay.name} className="flex justify-between text-sm">
                      <span>{pay.name}</span>
                      <span>{pay.value.toLocaleString('vi-VN')}₫</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
