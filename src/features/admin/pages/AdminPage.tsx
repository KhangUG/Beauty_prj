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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Loader } from '@/shared/components/ui/Loader'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { supabase, type Json } from '@/services/supabase/client'
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
    { id: 'overview', label: 'Overview', description: 'System status and metrics', icon: LayoutGrid },
    { id: 'products', label: 'Products', description: 'Manage goods and catalog', icon: Store },
    { id: 'categories', label: 'Categories', description: 'Manage product categories', icon: ListChecks },
    { id: 'product-configs', label: 'AI Configs', description: 'Manage AI product configurations', icon: Sparkles },
    { id: 'scans', label: 'Scans', description: 'View scan history and simulation', icon: Camera },
    { id: 'recommendations', label: 'Recommendations', description: 'Manage matched products', icon: Sparkles },
    { id: 'access', label: 'Access', description: 'Roles and permissions', icon: Users },
    { id: 'settings', label: 'Settings', description: 'Platform and environment', icon: Wrench },
    { id: 'revenue', label: 'Revenue', description: 'Orders and sales', icon: DollarSign },
  ]

type ProductFormState = {
  id: string
  name: string
  description: string
  imageUrl: string
  externalUrl: string
  tags: string
  category: string
  categoryId: string
  brand: string
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

type CategoryFormState = {
  id: string
  name: string
  apiCategoryKey: string
}

type ProductConfigFormState = {
  id: string
  productId: string
  hexColor: string
  texture: string
  colorIntensity: string
  patternName: string
  extraParams: string
}

const emptyProductForm: ProductFormState = {
  id: '',
  name: '',
  description: '',
  imageUrl: '',
  externalUrl: '',
  tags: '',
  category: 'Serum',
  categoryId: '',
  brand: '',
}

const emptyCategoryForm: CategoryFormState = {
  id: '',
  name: '',
  apiCategoryKey: '',
}

const emptyProductConfigForm: ProductConfigFormState = {
  id: '',
  productId: '',
  hexColor: '#ffffff',
  texture: 'Smooth',
  colorIntensity: 'Medium',
  patternName: '',
  extraParams: '{}',
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
  return tags.length > 0 ? tags.join(', ') : 'No tags'
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
    categoryId: product.category_id,
    brand: product.brand ?? '',
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
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm)
  const [productConfigForm, setProductConfigForm] = useState<ProductConfigFormState>(emptyProductConfigForm)

  // Filters & Search
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('All')
  const [productPage, setProductPage] = useState(1)
  const productItemsPerPage = 10

  const [scanSearch, setScanSearch] = useState('')
  const [scanScoreFilter, setScanScoreFilter] = useState<[number, number]>([0, 100])

  const [recommendationSearch, setRecommendationSearch] = useState('')
  const [recommendationCategoryFilter, setRecommendationCategoryFilter] = useState('All')

  const [userSearch, setUserSearch] = useState('')

  const [categoryPage, setCategoryPage] = useState(1)
  const categoryItemsPerPage = 10

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

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => databaseService.getAdminCategories(),
  })

  const productConfigsQuery = useQuery({
    queryKey: ['admin', 'product-configs'],
    queryFn: () => databaseService.getAdminProductConfigs(),
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
      const cat = o.productCategory || 'Other'
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

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((productPage - 1) * productItemsPerPage, productPage * productItemsPerPage)
  }, [filteredProducts, productPage])
  const totalProductPages = Math.ceil(filteredProducts.length / productItemsPerPage)

  const paginatedCategories = useMemo(() => {
    const list = categoriesQuery.data ?? []
    return list.slice((categoryPage - 1) * categoryItemsPerPage, categoryPage * categoryItemsPerPage)
  }, [categoriesQuery.data, categoryPage])
  const totalCategoryPages = Math.ceil((categoriesQuery.data?.length ?? 0) / categoryItemsPerPage)

  // Overview Stats Setup
  const overviewCards = useMemo(
    () => [
      {
        label: 'Products',
        value: productsQuery.data?.length ?? 0,
        hint: 'Active catalog items',
        icon: Store,
      },
      {
        label: 'Scans',
        value: scansQuery.data?.length ?? 0,
        hint: 'Total analyzed scans',
        icon: Camera,
      },
      {
        label: 'Recommendations',
        value: recommendationsQuery.data?.length ?? 0,
        hint: 'Matched product links',
        icon: Sparkles,
      },
      {
        label: 'Admin Role',
        value: getAdminRoleLabel(adminRole),
        hint: 'Active security context',
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
      })

      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        image_url: productForm.imageUrl.trim(),
        external_url: productForm.externalUrl.trim() || '',
        tags: encodedTags,
        brand: productForm.brand.trim() || null,
        category_id: productForm.categoryId,
      }

      if (!payload.name || !payload.description || !payload.image_url) {
        throw new Error('Please fill in all product details before saving.')
      }

      if (!payload.category_id) {
        throw new Error('Please select a category for the product.')
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

  const saveCategoryMutation = useMutation({
    mutationFn: async () => {
      const input = {
        name: categoryForm.name.trim(),
        api_category_key: categoryForm.apiCategoryKey.trim().toLowerCase(),
      }

      if (!input.name || !input.api_category_key) {
        throw new Error('Please fill in all category details.')
      }

      if (categoryForm.id) {
        return databaseService.updateCategory(categoryForm.id, input)
      }

      return databaseService.createCategory(input)
    },
    onSuccess: async () => {
      setCategoryForm(emptyCategoryForm)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => databaseService.deleteCategory(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
  })

  const saveProductConfigMutation = useMutation({
    mutationFn: async () => {
      let extraParams: Json | null = null
      if (productConfigForm.extraParams.trim()) {
        try {
          extraParams = JSON.parse(productConfigForm.extraParams) as Json
        } catch {
          throw new Error('Extra params must be valid JSON.')
        }
        if (extraParams !== null && typeof extraParams !== 'object') {
          throw new Error('Extra params must be a JSON object or array.')
        }
      }

      const payload = {
        product_id: productConfigForm.productId,
        hex_color: productConfigForm.hexColor.trim() || null,
        texture: productConfigForm.texture.trim() || null,
        color_intensity: productConfigForm.colorIntensity.trim() || null,
        pattern_name: productConfigForm.patternName.trim() || null,
        extra_params: extraParams,
      }

      if (!payload.product_id) {
        throw new Error('Select a product to attach AI config.')
      }

      if (productConfigForm.id) {
        return databaseService.updateProductConfig(productConfigForm.id, payload)
      }

      return databaseService.createProductConfig(payload)
    },
    onSuccess: async () => {
      setProductConfigForm(emptyProductConfigForm)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'product-configs'] })
    },
  })

  const deleteProductConfigMutation = useMutation({
    mutationFn: async (id: string) => databaseService.deleteProductConfig(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'product-configs'] })
    },
  })

  const saveScanMutation = useMutation({
    mutationFn: async () => {
      if (!scanForm.id) throw new Error('Select a scan to update.')
      const parsedMetrics = JSON.parse(scanForm.metricsJson)
      const score = Number(scanForm.score)

      if (Number.isNaN(score) || score < 0 || score > 100) {
        throw new Error('Score must be a number from 0 to 100.')
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
        throw new Error('Please provide Scan ID, Product ID, and Reason before saving.')
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
        throw new Error('Please enter a valid email address.')
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
        hydration: { label: 'Hydration', value: simHydration, status: getStatus('hydration', simHydration) },
        acne: { label: 'Acne', value: simAcne, status: getStatus('acne', simAcne) },
        oiliness: { label: 'Oiliness', value: simOiliness, status: getStatus('oiliness', simOiliness) },
        darkCircles: { label: 'Dark Circles', value: simDarkCircles, status: getStatus('darkCircles', simDarkCircles) },
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
          reason: `Simulated suggestion: suitable for ${idx === 0 ? 'hydration' : idx === 1 ? 'acne' : 'dark circles'} target`,
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
          reason: `Simulated result for ${idx === 0 ? 'hydration' : idx === 1 ? 'acne' : 'dark circles'} target`,
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
      if (products.length === 0) throw new Error('No products available to simulate order.')
      const prod = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 2) + 1
      const price = 250000 + Math.floor(Math.random() * 8) * 50000 // Mock custom price

      const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'Chris', 'Sarah', 'David', 'Jessica']
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
      const phone = `098${Math.floor(1000000 + Math.random() * 9000000)}`
      const address = `${Math.floor(Math.random() * 100) + 1} Main St, New York`

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
        user: `User ${scan.user_id.slice(0, 5)}...`,
        event: `Completed skin analysis with score ${scan.score}`,
        time: formatDate(scan.created_at),
        type: scan.score > 80 ? 'success' : 'info',
      })
    })

    const prods = productsQuery.data ?? []
    prods.slice(0, 3).forEach((prod) => {
      logs.push({
        id: `prod-${prod.id}`,
        user: 'Catalog Admin',
        event: `Edited category item "${prod.name}"`,
        time: formatDate(prod.created_at),
        type: 'success',
      })
    })

    // Fallbacks
    if (logs.length === 0) {
      logs.push(
        { id: '1', user: 'System', event: 'Database connection successful.', time: 'Just now', type: 'success' },
        { id: '2', user: 'Super Admin', event: 'Logged in from new IP address.', time: '10 mins ago', type: 'info' },
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
    return <Loader fullScreen label="Loading admin dashboard" />
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
            <h1 className="mt-3 font-display text-3xl text-rose-950">Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-mist">
              Manage product data, skin scan history, and user access roles in real-time.
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
              Refresh Data
            </Button>
            <Button variant="ghost" className="w-full justify-center" onClick={() => void signOut()}>
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Dashboard Welcome Header */}
          {activeSection === 'overview' && (
            <Card className="border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-0 overflow-hidden relative">
              <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.9fr] lg:p-8 relative z-10">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">
                    <Database className="h-4 w-4" />
                    Supabase Platform Connection
                  </div>
                  <div className="space-y-3">
                    <h2 className="font-display text-4xl text-rose-950 md:text-5xl">
                      Operate the entire beauty platform from one place
                    </h2>
                    <p className="max-w-2xl text-sm leading-7 text-mist md:text-base">
                      Real-time Supabase connection is active. Changes to categories, scans, and roles will sync immediately and reflect on the application.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => setActiveSection('products')}>
                      Manage Products
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setActiveSection('scans')}>
                      Scans & Simulation
                    </Button>
                    <Button variant="ghost" onClick={() => setActiveSection('access')}>
                      Edit User Roles
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
          )}

          {/* OVERVIEW TAB */}
          {activeSection === 'overview' ? (
            <div className="space-y-6">
              {/* Row 1: System Health & Ping Status */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-rose-100 p-5 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs uppercase tracking-[0.2em] text-cyan">
                      <span>Supabase Connection</span>
                      <Wifi className="h-4 w-4 text-emerald-500 animate-pulse" />
                    </div>
                    <h3 className="mt-3 font-display text-2xl text-rose-950">Online</h3>
                    <p className="mt-1 text-xs text-mist leading-relaxed">
                      API is active and accepting CRUD operations.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-rose-50 flex items-center justify-between text-xs">
                    <span className="text-mist/70">DB Latency:</span>
                    <span className="font-semibold text-emerald-600">
                      {pingStatus === 'pinging' ? '...' : pingTime && pingTime > 0 ? `${pingTime}ms` : 'Ping Failed'}
                    </span>
                  </div>
                </Card>

                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan">DB Queries</p>
                  <h3 className="mt-3 font-display text-2xl text-rose-950">
                    {scansQuery.data ? scansQuery.data.length + (productsQuery.data?.length ?? 0) : '0'} rows
                  </h3>
                  <p className="mt-2 text-xs text-mist">
                    Products, recommendations, and records.
                  </p>
                  <div className="mt-3 pt-3 border-t border-rose-50 text-right">
                    <button
                      onClick={testPing}
                      disabled={pingStatus === 'pinging'}
                      className="text-xs text-rose-600 hover:underline flex items-center justify-end gap-1 ml-auto"
                    >
                      <Activity className="h-3 w-3" />
                      {pingStatus === 'pinging' ? 'Checking...' : 'Check Connection'}
                    </button>
                  </div>
                </Card>

                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan">CPU Simulation</p>
                  <h3 className="mt-3 font-display text-2xl text-rose-950">14% - 24%</h3>
                  <div className="w-full bg-rose-50 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-400 to-pink-500 h-full rounded-full w-[18%]" />
                  </div>
                  <p className="mt-2 text-[10px] text-mist/70">Average server usage</p>
                </Card>

                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan">Memory Load</p>
                  <h3 className="mt-3 font-display text-2xl text-rose-950">512 MB</h3>
                  <div className="w-full bg-rose-50 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan to-teal-400 h-full rounded-full w-[50%]" />
                  </div>
                  <p className="mt-2 text-[10px] text-mist/70">Used 512MB out of 1024MB allocated</p>
                </Card>
              </div>

              {/* Row 2: SVG Graphs and Real statistics */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* SVG Graph: Skin Score Histogram */}
                <Card className="border border-rose-100 p-6 bg-white space-y-4">
                  <div>
                    <h3 className="font-display text-xl text-rose-950">Skin Score Distribution</h3>
                    <p className="text-xs text-mist">Frequency of scores from customer historical scans.</p>
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
                    <h3 className="font-display text-xl text-rose-950">Average Skin Metrics</h3>
                    <p className="text-xs text-mist">Averages across all skin scan records.</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    {[
                      { name: 'Hydration', val: scanStats.avgHydration, color: 'from-cyan to-blue-400', desc: 'Higher is better' },
                      { name: 'Acne Severity', val: scanStats.avgAcne, color: 'from-rose-400 to-pink-500', desc: 'Lower is better' },
                      { name: 'Sebum / Oiliness', val: scanStats.avgOiliness, color: 'from-amber-400 to-yellow-500', desc: 'Balanced at ~50' },
                      { name: 'Dark Circles', val: scanStats.avgDarkCircles, color: 'from-purple-400 to-indigo-500', desc: 'Lower is better' },
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
                    <h3 className="font-display text-xl text-rose-950">System Activity</h3>
                    <p className="text-xs text-mist">Live notifications and activity logs.</p>
                  </div>
                  <span className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                    Logs
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
            <div className="space-y-4">
              {/* Product Form */}
              <Card className="border border-rose-100 p-6 self-start bg-white shadow-sm">
                <AdminSectionTitle
                  eyebrow="Category Management"
                  title={productForm.id ? 'Edit Product' : 'Add New Product'}
                  description="Add or edit a product. Prices, inventory, and discounts will be handled upon save."
                />
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Product Name</label>
                    <Input
                      placeholder="Product name (e.g. Cleanser)"
                      value={productForm.name}
                      onChange={(event) => setProductForm((state) => ({ ...state, name: event.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Description</label>
                    <textarea
                      className="min-h-[90px] w-full rounded-2xl border border-rose-200/80 bg-white/80 px-4 py-3 text-sm text-pearl placeholder:text-mist/70 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/25"
                      placeholder="Enter detailed product description..."
                      value={productForm.description}
                      onChange={(event) => setProductForm((state) => ({ ...state, description: event.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Brand</label>
                      <Input
                        placeholder="e.g. L'Oréal"
                        value={productForm.brand}
                        onChange={(event) => setProductForm((state) => ({ ...state, brand: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Category *</label>
                      <select
                        className="w-full rounded-2xl border border-rose-200/80 bg-white/85 px-4 py-3 text-sm text-pearl focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/25"
                        value={productForm.categoryId}
                        onChange={(event) => {
                          const selectedCategory = categoriesQuery.data?.find((category) => category.id === event.target.value)
                          setProductForm((state) => ({
                            ...state,
                            categoryId: event.target.value,
                            category: selectedCategory?.name ?? event.target.value,
                          }))
                        }}
                      >
                        <option value="">Select Category</option>
                        {(categoriesQuery.data ?? []).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Image URL</label>
                    <Input
                      placeholder="https://images.unsplash.com/photo-..."
                      value={productForm.imageUrl}
                      onChange={(event) => setProductForm((state) => ({ ...state, imageUrl: event.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Partner URL (optional)</label>
                    <Input
                      placeholder="https://example.com/partner-item"
                      value={productForm.externalUrl}
                      onChange={(event) => setProductForm((state) => ({ ...state, externalUrl: event.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Tags (comma-separated)</label>
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
                      {saveProductMutation.isPending ? 'Saving...' : productForm.id ? 'Update Product' : 'Create Product'}
                    </Button>
                    <Button variant="ghost" onClick={() => setProductForm(emptyProductForm)}>
                      Reset
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
                      placeholder="Search products by name/description..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="rounded-full border border-rose-100 px-3 py-2 text-sm text-pearl focus:outline-none"
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    {(categoriesQuery.data ?? []).map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Card className="border border-rose-100 p-6 bg-white shadow-sm overflow-x-auto">
                  <AdminSectionTitle
                    eyebrow="Product List"
                    title="Catalog Detail Table"
                    description="View all products and their details."
                  />
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-rose-100 text-rose-950 font-bold uppercase tracking-wider">
                          <th className="pb-3 pr-3">Product</th>
                          <th className="pb-3 px-3">Category / Brand</th>
                          <th className="pb-3 px-3">Pricing / Stock</th>
                          <th className="pb-3 px-3">Tags</th>
                          <th className="pb-3 pl-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-50">
                        {paginatedProducts.map((product) => {
                          const parsed = parseProductTags(product)
                          return (
                            <tr key={product.id} className="hover:bg-rose-50/20 text-rose-950 align-top">
                              <td className="py-3 pr-3">
                                <div className="flex items-start gap-3">
                                  <img src={product.image_url} alt={product.name} className="h-12 w-12 rounded-lg object-cover border border-rose-50" />
                                  <div className="min-w-0 max-w-[200px]">
                                    <p className="font-bold text-sm leading-tight text-rose-950">{product.name}</p>
                                    <p className="mt-0.5 text-[10px] text-mist line-clamp-2">{product.description}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-mist">
                                <p className="font-semibold text-rose-600">{parsed.category}</p>
                                {product.brand && <p className="text-[10px] mt-0.5">{product.brand}</p>}
                              </td>
                              <td className="py-3 px-3">
                                {parsed.price ? (
                                  <div className="text-rose-950 font-bold">
                                    {parsed.price}
                                    {parsed.discount && <span className="text-rose-500 ml-1 text-[10px]">(-{parsed.discount}%)</span>}
                                  </div>
                                ) : (
                                  <div className="text-mist">—</div>
                                )}
                                {parsed.stock !== undefined && (
                                  <div className={`flex items-center gap-1 mt-0.5 text-[10px] ${parsed.stock <= 5 ? 'text-amber-600 font-bold' : 'text-mist'}`}>
                                    <Package className="h-3 w-3" />
                                    {parsed.stock} in stock
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-[10px] text-mist max-w-[150px] truncate">
                                {formatTags(parsed.cleanTags)}
                              </td>
                              <td className="py-3 pl-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => setProductForm(mapProductForm(product))}>
                                    <PencilLine className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${product.name}?`)) deleteProductMutation.mutate(product.id) }} disabled={deleteProductMutation.isPending}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {paginatedProducts.length === 0 && (
                      <div className="text-center py-12 text-mist text-sm">
                        No products match the search or category filter.
                      </div>
                    )}
                  </div>
                  {totalProductPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-4 mt-4 border-t border-rose-100">
                      <Button variant="ghost" size="sm" disabled={productPage === 1} onClick={() => setProductPage(p => Math.max(1, p - 1))}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                      </Button>
                      <span className="text-xs font-semibold text-pearl">Page {productPage} of {totalProductPages}</span>
                      <Button variant="ghost" size="sm" disabled={productPage === totalProductPages} onClick={() => setProductPage(p => Math.min(totalProductPages, p + 1))}>
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ) : null}

          {/* CATEGORIES TAB */}
          {activeSection === 'categories' ? (
            <div className="space-y-4">
              <Card className="border border-rose-100 p-6 bg-white shadow-sm">
                <AdminSectionTitle
                  eyebrow="Product Categories"
                  title={categoryForm.id ? 'Edit Category' : 'Add New Category'}
                  description="Manage top-level categories and API category keys for AI data sync."
                />
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Category Name</label>
                    <Input
                      placeholder="e.g. Lipstick"
                      value={categoryForm.name}
                      onChange={(event) => setCategoryForm((state) => ({ ...state, name: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">API Category Key</label>
                    <Input
                      placeholder="e.g. lip_color"
                      value={categoryForm.apiCategoryKey}
                      onChange={(event) => setCategoryForm((state) => ({ ...state, apiCategoryKey: event.target.value }))}
                    />
                  </div>
                  {saveCategoryMutation.error ? (
                    <p className="text-sm text-rose-500">{saveCategoryMutation.error.message}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button onClick={() => saveCategoryMutation.mutate()} disabled={saveCategoryMutation.isPending}>
                      {saveCategoryMutation.isPending ? 'Saving...' : categoryForm.id ? 'Update Category' : 'Create Category'}
                    </Button>
                    <Button variant="ghost" onClick={() => setCategoryForm(emptyCategoryForm)}>
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border border-rose-100 p-6 bg-white shadow-sm">
                <AdminSectionTitle
                  eyebrow="Category List"
                  title="Existing Categories"
                  description="Review, edit, or delete created categories to sync with products."
                />
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-rose-100 text-rose-950 font-bold uppercase tracking-wider">
                        <th className="pb-3 pr-3">Category Name</th>
                        <th className="pb-3 px-3">API Key</th>
                        <th className="pb-3 px-3">Created At</th>
                        <th className="pb-3 pl-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50">
                      {paginatedCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-rose-50/20 text-rose-950">
                          <td className="py-3 pr-3 font-medium">{category.name}</td>
                          <td className="py-3 px-3 text-mist">{category.api_category_key}</td>
                          <td className="py-3 px-3 text-mist">{formatDate(category.created_at)}</td>
                          <td className="py-3 pl-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setCategoryForm({ id: category.id, name: category.name, apiCategoryKey: category.api_category_key })}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm(`Delete category ${category.name}?`)) {
                                    deleteCategoryMutation.mutate(category.id)
                                  }
                                }}
                                disabled={deleteCategoryMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {paginatedCategories.length === 0 ? (
                    <p className="mt-4 text-sm text-mist text-center py-4">No categories available. Create a new category to get started.</p>
                  ) : null}
                </div>
                {totalCategoryPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4 mt-4 border-t border-rose-100">
                    <Button variant="ghost" size="sm" disabled={categoryPage === 1} onClick={() => setCategoryPage(p => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <span className="text-xs font-semibold text-pearl">Page {categoryPage} of {totalCategoryPages}</span>
                    <Button variant="ghost" size="sm" disabled={categoryPage === totalCategoryPages} onClick={() => setCategoryPage(p => Math.min(totalCategoryPages, p + 1))}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          ) : null}

          {/* PRODUCT CONFIGS TAB */}
          {activeSection === 'product-configs' ? (
            <div className="space-y-4">
              <Card className="border border-rose-100 p-6 bg-white shadow-sm">
                <AdminSectionTitle
                  eyebrow="AI Config"
                  title={productConfigForm.id ? 'Edit Product Config' : 'Create New Product Config'}
                  description="Link a product to AI parameters like color, texture, and pattern."
                />
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Product</label>
                    <select
                      className="w-full rounded-2xl border border-rose-200/80 bg-white/85 px-4 py-3 text-sm text-pearl focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/25"
                      value={productConfigForm.productId}
                      onChange={(event) => setProductConfigForm((state) => ({ ...state, productId: event.target.value }))}
                    >
                      <option value="">Select Product</option>
                      {(productsQuery.data ?? []).map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Color Code</label>
                      <Input
                        placeholder="#F3D6E8"
                        value={productConfigForm.hexColor}
                        onChange={(event) => setProductConfigForm((state) => ({ ...state, hexColor: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Texture</label>
                      <Input
                        placeholder="e.g. Smooth"
                        value={productConfigForm.texture}
                        onChange={(event) => setProductConfigForm((state) => ({ ...state, texture: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Color Intensity</label>
                      <Input
                        placeholder="Light / Medium / Intense"
                        value={productConfigForm.colorIntensity}
                        onChange={(event) => setProductConfigForm((state) => ({ ...state, colorIntensity: event.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Pattern Name</label>
                      <Input
                        placeholder="e.g. Satin Glow"
                        value={productConfigForm.patternName}
                        onChange={(event) => setProductConfigForm((state) => ({ ...state, patternName: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Extra params (JSON)</label>
                    <textarea
                      className="min-h-[90px] w-full rounded-2xl border border-rose-200/80 bg-white/80 px-4 py-3 text-sm text-pearl placeholder:text-mist/70 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/25"
                      value={productConfigForm.extraParams}
                      onChange={(event) => setProductConfigForm((state) => ({ ...state, extraParams: event.target.value }))}
                    />
                  </div>
                  {saveProductConfigMutation.error ? (
                    <p className="text-sm text-rose-500">{saveProductConfigMutation.error.message}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button onClick={() => saveProductConfigMutation.mutate()} disabled={saveProductConfigMutation.isPending}>
                      {saveProductConfigMutation.isPending ? 'Saving...' : productConfigForm.id ? 'Update Config' : 'Create Config'}
                    </Button>
                    <Button variant="ghost" onClick={() => setProductConfigForm(emptyProductConfigForm)}>
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="border border-rose-100 p-6 bg-white shadow-sm overflow-x-auto">
                <AdminSectionTitle
                  eyebrow="Config List"
                  title="AI Config Detail Table"
                  description="View all configs linked to products and edit parameters quickly."
                />
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-rose-100 text-rose-950 font-bold uppercase tracking-wider">
                        <th className="pb-3 pr-3">Product</th>
                        <th className="pb-3 px-3">Color Code</th>
                        <th className="pb-3 px-3">Texture</th>
                        <th className="pb-3 px-3">Intensity</th>
                        <th className="pb-3 px-3">Pattern</th>
                        <th className="pb-3 px-3">Extra params</th>
                        <th className="pb-3 pl-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50">
                      {(productConfigsQuery.data ?? []).map((config) => (
                        <tr key={config.id} className="hover:bg-rose-50/20 text-rose-950 align-top">
                          <td className="py-3 pr-3 font-medium">{productLookup.get(config.product_id)?.name ?? 'Unknown'}</td>
                          <td className="py-3 px-3 text-mist">{config.hex_color || '—'}</td>
                          <td className="py-3 px-3 text-mist">{config.texture || '—'}</td>
                          <td className="py-3 px-3 text-mist">{config.color_intensity || '—'}</td>
                          <td className="py-3 px-3 text-mist">{config.pattern_name || '—'}</td>
                          <td className="py-3 px-3 text-mist break-words max-w-[220px]">{config.extra_params ? JSON.stringify(config.extra_params) : '{}'}</td>
                          <td className="py-3 pl-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setProductConfigForm({
                                id: config.id,
                                productId: config.product_id,
                                hexColor: config.hex_color ?? '#ffffff',
                                texture: config.texture ?? 'Smooth',
                                colorIntensity: config.color_intensity ?? 'Medium',
                                patternName: config.pattern_name ?? '',
                                extraParams: config.extra_params ? JSON.stringify(config.extra_params, null, 2) : '{}',
                              })}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm('Delete this config?')) {
                                    deleteProductConfigMutation.mutate(config.id)
                                  }
                                }}
                                disabled={deleteProductConfigMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(productConfigsQuery.data?.length ?? 0) === 0 ? (
                    <p className="mt-4 text-sm text-mist">No AI configs yet. Create a new config to link with products.</p>
                  ) : null}
                </div>
              </Card>
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
                      placeholder="Search scans by User UUID or Scan ID..."
                      value={scanSearch}
                      onChange={(e) => setScanSearch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-rose-950 font-bold uppercase tracking-wider">
                      <span>Score Range:</span>
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
                    eyebrow="Scan Records"
                    title="Skin Analysis History"
                    description="Select a scan to review metrics, change score, or delete the record."
                  />
                  <div className="mt-5 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredScans.length === 0 ? (
                      <p className="text-center py-6 text-mist text-sm">No scans match the filter.</p>
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
                            <p className="font-semibold text-rose-950">Scan {scan.id.slice(0, 8)}</p>
                            <p className="mt-0.5 text-xs text-mist truncate">User: {scan.user_id}</p>
                            <p className="mt-1 text-[10px] text-mist">{formatDate(scan.created_at)}</p>
                          </div>
                          <div className="rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-xs font-bold text-rose-600">
                            Score {scan.score}
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
                      eyebrow="Scan Editor"
                      title={`Scan Details ${scanForm.id.slice(0, 8)}`}
                      description="Update score or manually override saved JSON analysis data."
                    />
                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Score</label>
                        <Input
                          placeholder="Score"
                          type="number"
                          value={scanForm.score}
                          onChange={(event) => setScanForm((state) => ({ ...state, score: event.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">JSON Metrics Data</label>
                        <textarea
                          className="min-h-[140px] w-full rounded-2xl border border-rose-200/80 bg-white/80 px-4 py-3 font-mono text-xs text-pearl placeholder:text-mist/70 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/25"
                          placeholder="JSON Metrics Data"
                          value={scanForm.metricsJson}
                          onChange={(event) => setScanForm((state) => ({ ...state, metricsJson: event.target.value }))}
                        />
                      </div>

                      {saveScanMutation.error ? (
                        <p className="text-sm text-rose-500">{saveScanMutation.error.message}</p>
                      ) : null}

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button onClick={() => saveScanMutation.mutate()} disabled={saveScanMutation.isPending}>
                          Save Updates
                        </Button>
                        <Button variant="ghost" onClick={() => setScanForm(emptyScanForm)}>
                          Cancel
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Permanently delete this scan record?')) {
                              deleteScanMutation.mutate(scanForm.id)
                            }
                          }}
                          disabled={deleteScanMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete scan
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : null}

                {/* Scan Simulator Panel */}
                <Card className="border border-rose-200 bg-gradient-to-br from-rose-50/50 to-amber-50/30 p-6">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-rose-600 font-extrabold">
                    <Sliders className="h-4 w-4 text-rose-500 animate-pulse" />
                    <span>Developer Lab</span>
                  </div>
                  <h3 className="mt-2 font-display text-2xl text-rose-950">Skin Scan Simulator</h3>
                  <p className="mt-1 text-sm text-mist">
                    Trigger simulated results and save directly to Supabase to test recommendation triggers.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">
                        Target User ID (Leave blank to use current admin)
                      </label>
                      <Input
                        placeholder="Supabase User UUID (e.g., 5d5a7d8...)"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      {/* Hydration Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-rose-950">
                          <span>Hydration</span>
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
                          <span>Acne Severity (lower value means clearer skin)</span>
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
                          <span>Sebum / Oiliness</span>
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
                          <span>Dark Circles Fatigue</span>
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
                      <span className="text-mist font-semibold">Calculated Skin Score:</span>
                      <span className="text-lg font-bold text-rose-900">
                        {Math.round((simHydration + (100 - simAcne) + (100 - simOiliness) + (100 - simDarkCircles)) / 4)} / 100
                      </span>
                    </div>

                    {runSimulatorMutation.error ? (
                      <p className="text-xs text-rose-500">{runSimulatorMutation.error.message}</p>
                    ) : null}

                    {runSimulatorMutation.isSuccess ? (
                      <p className="text-xs text-emerald-600 font-bold">Successfully inserted simulated scan! ✓</p>
                    ) : null}

                    <Button
                      className="w-full justify-center"
                      onClick={() => runSimulatorMutation.mutate()}
                      disabled={runSimulatorMutation.isPending}
                    >
                      {runSimulatorMutation.isPending ? 'Inserting record...' : 'Simulate Scan & Save'}
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
                  eyebrow="Manage Recommendations"
                  title={recommendationForm.id ? 'Edit Product Recommendation' : 'Create Product Recommendation Link'}
                  description="Link a specific product to a Scan ID. Customize the match reason displayed in the customer's timeline."
                />
                <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Scan ID</label>
                    <Input
                      placeholder="Scan UUID (e.g., 10f3f31d-...)"
                      value={recommendationForm.scanId}
                      onChange={(event) => setRecommendationForm((state) => ({ ...state, scanId: event.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Product ID</label>
                    <Input
                      placeholder="Product UUID (e.g., ac95f484-...)"
                      value={recommendationForm.productId}
                      onChange={(event) => setRecommendationForm((state) => ({ ...state, productId: event.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-rose-950 uppercase tracking-wide block mb-1">Match Reason</label>
                    <Input
                      placeholder="Recommendation reason (e.g., Suitable for dehydrated skin...)"
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
                    {saveRecommendationMutation.isPending ? 'Saving...' : recommendationForm.id ? 'Update recommendation' : 'Create recommendation'}
                  </Button>
                  <Button variant="ghost" onClick={() => setRecommendationForm(emptyRecommendationForm)}>
                    Reset
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
                    placeholder="Search by Scan, Product, or Reason..."
                    value={recommendationSearch}
                    onChange={(e) => setRecommendationSearch(e.target.value)}
                  />
                </div>

                <select
                  className="rounded-full border border-rose-100 px-3 py-2 text-sm text-pearl focus:outline-none"
                  value={recommendationCategoryFilter}
                  onChange={(e) => setRecommendationCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Cleanser">Cleanser</option>
                  <option value="Serum">Serum</option>
                  <option value="Moisturizer">Moisturizer</option>
                  <option value="Toner">Toner</option>
                  <option value="Sunscreen">Sunscreen</option>
                  <option value="Treatment">Treatment</option>
                  <option value="Essence">Essence</option>
                  <option value="Mask">Mask</option>
                  <option value="Eye Care">Eye Care</option>
                </select>
              </div>

              {filteredRecommendations.length === 0 ? (
                <div className="text-center py-12 bg-white border border-rose-100 rounded-3xl text-mist">
                  No recommendation records match the search criteria.
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
                          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan font-bold">Recommendation Link</p>
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
                        <p className="truncate"><span className="font-semibold text-rose-950">Scan UUID:</span> {recommendation.scan_id} {scan && `(Score: ${scan.score})`}</p>
                        <p className="truncate"><span className="font-semibold text-rose-950">Product UUID:</span> {recommendation.product_id}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 pt-1">
                        <Button size="sm" variant="ghost" onClick={() => setRecommendationForm(mapRecommendationForm(recommendation))}>
                          Edit recommendation details
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Delete this recommendation link?')) {
                              deleteRecommendationMutation.mutate(recommendation.id)
                            }
                          }}
                          disabled={deleteRecommendationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete recommendation
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
                  <h3 className="font-display text-2xl text-rose-950">User Access Control</h3>
                  <p className="text-xs text-mist mt-1">
                    Manage trial user permissions. Setting an account to "user" will instantly revoke admin access.
                  </p>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-mist" />
                  <input
                    type="text"
                    className="w-full rounded-full border border-rose-100 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-200"
                    placeholder="Search users by email..."
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
                        <th className="pb-3 px-2">Assigned Role</th>
                        <th className="pb-3 px-2">Created At</th>
                        <th className="pb-3 pl-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50">
                      {filteredUsers.map((item) => (
                        <tr key={item.id} className="hover:bg-rose-50/20 text-rose-950">
                          <td className="py-3 pr-2 font-medium truncate max-w-[150px]" title={item.email}>
                            {item.email}
                            {item.email.toLowerCase() === currentAuthUser?.email?.toLowerCase() && (
                              <span className="ml-1 text-[9px] bg-cyan/10 text-cyan-700 px-1 py-0.5 rounded font-extrabold">You</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <select
                              className="rounded border border-rose-100 bg-white px-2 py-1 focus:outline-none text-[11px]"
                              value={item.role}
                              onChange={(e) => updateUserRoleMutation.mutate({ userId: item.id, role: e.target.value })}
                            >
                              <option value="superadmin">Super Admin</option>
                              <option value="catalog">Catalog Admin</option>
                              <option value="operations">Operations Admin</option>
                              <option value="content">Content Admin</option>
                              <option value="analyst">Analyst</option>
                              <option value="user">User (No Admin Access)</option>
                            </select>
                          </td>
                          <td className="py-3 px-2 text-mist">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 pl-2 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Remove custom role of ${item.email}?`)) {
                                  deleteUserRoleMutation.mutate(item.id)
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800"
                              disabled={deleteUserRoleMutation.isPending}
                            >
                              Reset
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
                    Assign Role to User
                  </h3>
                  <p className="text-xs text-mist leading-relaxed">
                    Grant access to specific modules for test or Supabase users. Permissions take effect immediately.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-rose-950 uppercase tracking-wide block mb-1">User Email</label>
                      <Input
                        placeholder="e.g. client@lumina.ai"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-rose-950 uppercase tracking-wide block mb-1">Access Level</label>
                      <select
                        className="w-full rounded-2xl border border-rose-200/80 bg-white px-4 py-2.5 text-xs text-pearl focus:outline-none focus:ring-1 focus:ring-rose-300"
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                      >
                        <option value="superadmin">Super Admin (All modules)</option>
                        <option value="catalog">Catalog Admin (Products & Recommendations)</option>
                        <option value="operations">Operations Admin (Products & Scans)</option>
                        <option value="content">Content Admin (Products & Reasons)</option>
                        <option value="analyst">Analyst (Scans, Read-only)</option>
                        <option value="user">Standard User (Admin Access Denied)</option>
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
                      {createUserRoleMutation.isPending ? 'Assigning...' : 'Assign User Role'}
                    </Button>
                  </div>
                </Card>

                {/* Role Explanations */}
                <Card className="border border-rose-100 p-6 bg-white shadow-sm">
                  <AdminSectionTitle
                    eyebrow="Access Matrix"
                    title="Role Module Scopes"
                    description="List of visible modules based on role mapping rules."
                  />
                  <div className="mt-5 space-y-3 text-xs text-rose-950">
                    {[
                      { role: 'Super Admin', scope: 'Full access across all dashboard segments and simulator tools.' },
                      { role: 'Catalog Admin', scope: 'Add products to catalog, pricing details, and match recommendations.' },
                      { role: 'Operations Admin', scope: 'View catalog lists, check scan histories, and use simulators.' },
                      { role: 'Content Admin', scope: 'Edit product descriptions and tweak match reasons.' },
                      { role: 'Analyst', scope: 'View metric graphs in read-only mode, scan logs, and test connections.' },
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
                  title: 'Platform Status',
                  detail: 'Supabase-powered catalog, scan logs, and admin permissions are live.',
                  icon: CheckCircle2,
                },
                {
                  title: 'Evaluation Engine',
                  detail: 'Configure scan scores, modify tags, and customize match reason descriptions.',
                  icon: ListChecks,
                },
                {
                  title: 'Permission Admin',
                  detail: 'Limit access by job function through detailed simulated roles for developers.',
                  icon: Clock3,
                },
                {
                  title: 'Simulation Tools',
                  detail: 'Generate artificial scan results to verify product catalog and recommendation loops.',
                  icon: Megaphone,
                },
                {
                  title: 'Data Sync',
                  detail: 'Actual client pages fetch items from the database instead of simulated files.',
                  icon: Database,
                },
                {
                  title: 'Reload Cycle',
                  detail: 'Click reload or clear cache to revalidate queries after updating.',
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
                  <h3 className="font-display text-2xl text-rose-950">Revenue & Orders</h3>
                  <Button
                    onClick={() => simulateOrderMutation.mutate()}
                    disabled={simulateOrderMutation.isPending}
                    className="flex items-center gap-1"
                  >
                    {simulateOrderMutation.isPending ? 'Simulating...' : 'Simulate Order'}
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {/* Metrics grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase text-cyan">Total Revenue</p>
                  <h4 className="mt-2 font-display text-2xl text-rose-950">
                    {revenueStats.totalRevenue.toLocaleString('vi-VN')}₫
                  </h4>
                  <p className="mt-1 text-xs text-mist">Completed</p>
                </Card>
                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase text-cyan">Pending Revenue</p>
                  <h4 className="mt-2 font-display text-2xl text-rose-950">
                    {revenueStats.pendingAmount.toLocaleString('vi-VN')}₫
                  </h4>
                  <p className="mt-1 text-xs text-mist">Pending</p>
                </Card>
                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase text-cyan">Order Count</p>
                  <h4 className="mt-2 font-display text-2xl text-rose-950">{revenueStats.totalCount}</h4>
                  <p className="mt-1 text-xs text-mist">Total Orders</p>
                </Card>
                <Card className="border border-rose-100 p-5 bg-white">
                  <p className="text-xs uppercase text-cyan">Average Order Value</p>
                  <h4 className="mt-2 font-display text-2xl text-rose-950">
                    {(revenueStats.completedCount ? (revenueStats.totalRevenue / revenueStats.completedCount).toFixed(0) : 0).toLocaleString('vi-VN')}₫
                  </h4>
                  <p className="mt-1 text-xs text-mist">AOV</p>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search orders..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="flex-1"
                />
                <select
                  className="rounded border border-rose-100 px-3 py-1 text-sm"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>

              {/* Orders table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="border-b border-rose-100 text-rose-950 font-bold uppercase">
                    <tr>
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">Product</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
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
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                          </select>
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete order ${order.id}?`)) deleteOrderMutation.mutate(order.id);
                            }}
                            disabled={deleteOrderMutation.isPending}
                            className="text-rose-600 hover:text-rose-800 flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Category breakdown */}
              <Card className="border border-rose-100 p-5 bg-white">
                <h4 className="font-display text-lg text-rose-950 mb-2">Revenue by Category</h4>
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
                <h4 className="font-display text-lg text-rose-950 mb-2">Revenue by Payment Method</h4>
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
