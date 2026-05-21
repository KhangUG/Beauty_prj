import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
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
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Loader } from '@/shared/components/ui/Loader'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { databaseService, type AdminProductRecord, type AdminRecommendationRecord, type AdminScanRecord } from '@/services/supabase/database-service'
import { canAccessAdminSection, getAdminRoleLabel, type AdminSection } from '@/shared/lib/admin'

const sidebarSections: Array<{
  id: AdminSection
  label: string
  description: string
  icon: typeof LayoutGrid
}> = [
  { id: 'overview', label: 'Overview', description: 'System health and action queue', icon: LayoutGrid },
  { id: 'products', label: 'Products', description: 'Catalog CRUD and live sync', icon: Store },
  { id: 'scans', label: 'Scans', description: 'Review and edit scan records', icon: Camera },
  { id: 'recommendations', label: 'Recommendations', description: 'Manage product matches', icon: Sparkles },
  { id: 'access', label: 'Access', description: 'Roles and permissions', icon: Users },
  { id: 'settings', label: 'Settings', description: 'Platform and environment', icon: Wrench },
]

type ProductFormState = {
  id: string
  name: string
  description: string
  imageUrl: string
  externalUrl: string
  tags: string
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
  return new Date(value).toLocaleString('en-US', {
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
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.image_url,
    externalUrl: product.external_url,
    tags: product.tags.join(', '),
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
      <p className="text-xs uppercase tracking-[0.24em] text-cyan">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl text-rose-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-mist">{description}</p>
    </div>
  )
}

export default function AdminPage() {
  const { adminRole, signOut } = useAuth()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)
  const [scanForm, setScanForm] = useState<ScanFormState>(emptyScanForm)
  const [recommendationForm, setRecommendationForm] = useState<RecommendationFormState>(emptyRecommendationForm)

  const tabs = useMemo(
    () => sidebarSections.filter((section) => canAccessAdminSection(adminRole, section.id)),
    [adminRole],
  )

  useEffect(() => {
    if (tabs.length === 0) {
      return
    }

    if (!tabs.some((section) => section.id === activeSection)) {
      setActiveSection(tabs[0].id)
    }
  }, [activeSection, tabs])

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

  const productLookup = useMemo(() => {
    return new Map((productsQuery.data ?? []).map((product) => [product.id, product]))
  }, [productsQuery.data])

  const scanLookup = useMemo(() => {
    return new Map((scansQuery.data ?? []).map((scan) => [scan.id, scan]))
  }, [scansQuery.data])

  const overviewCards = useMemo(
    () => [
      {
        label: 'Products',
        value: productsQuery.data?.length ?? 0,
        hint: 'Live catalog rows from Supabase',
        icon: Store,
      },
      {
        label: 'Scans',
        value: scansQuery.data?.length ?? 0,
        hint: 'Saved scan sessions',
        icon: Camera,
      },
      {
        label: 'Recommendations',
        value: recommendationsQuery.data?.length ?? 0,
        hint: 'Reasoned product matches',
        icon: Sparkles,
      },
      {
        label: 'Admin role',
        value: getAdminRoleLabel(adminRole),
        hint: 'Role-based access control',
        icon: ShieldCheck,
      },
    ],
    [adminRole, productsQuery.data?.length, scansQuery.data?.length, recommendationsQuery.data?.length],
  )

  const saveProductMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        image_url: productForm.imageUrl.trim(),
        external_url: productForm.externalUrl.trim(),
        tags: parseTags(productForm.tags),
      }

      if (!payload.name || !payload.description || !payload.image_url || !payload.external_url) {
        throw new Error('Fill all product fields before saving.')
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
      if (!scanForm.id) {
        throw new Error('Select a scan to update.')
      }

      const parsedMetrics = JSON.parse(scanForm.metricsJson)
      const score = Number(scanForm.score)

      if (Number.isNaN(score)) {
        throw new Error('Score must be a number.')
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
        throw new Error('Fill scan, product and reason before saving.')
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

  const isBusy = productsQuery.isLoading || scansQuery.isLoading || recommendationsQuery.isLoading

  if (isBusy && !productsQuery.data && !scansQuery.data && !recommendationsQuery.data) {
    return <Loader fullScreen label="Loading admin control room" />
  }

  return (
    <section className="section-shell pb-12">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="sticky top-[calc(var(--app-header-height)+1rem)] h-fit rounded-[2rem] border border-rose-100 bg-white/80 p-4 shadow-[0_24px_70px_rgba(168,112,134,0.12)] backdrop-blur-xl">
          <div className="rounded-[1.5rem] border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-rose-600">
              <ShieldCheck className="h-4 w-4" />
              {getAdminRoleLabel(adminRole)}
            </div>
            <h1 className="mt-3 font-display text-3xl text-rose-950">Admin Console</h1>
            <p className="mt-2 text-sm leading-6 text-mist">
              Manage product data, scan records, and recommendation rules from one control room.
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
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    active
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
            <Button className="w-full justify-center" onClick={() => void queryClient.invalidateQueries({ queryKey: ['admin'] })}>
              Refresh data
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-center" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </aside>

        <div className="space-y-6">
          <Card className="border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-0">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.9fr] lg:p-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">
                  <Database className="h-4 w-4" />
                  Supabase connected control center
                </div>
                <div className="space-y-3">
                  <h2 className="font-display text-4xl text-rose-950 md:text-5xl">Operate the whole beauty platform from one place</h2>
                  <p className="max-w-2xl text-sm leading-7 text-mist md:text-base">
                    The admin console now edits the real Supabase catalog, scan history, and recommendation rows.
                    Changes here propagate to the public product pages immediately.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setActiveSection('products')}>
                    Open product manager
                    <PencilLine className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => setActiveSection('scans')}>
                    Review scans
                  </Button>
                  <Button variant="ghost" onClick={() => setActiveSection('recommendations')}>
                    Edit recommendations
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
          </Card>

          {activeSection === 'overview' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { title: 'Catalog health', value: `${productsQuery.data?.length ?? 0} rows`, detail: 'Products are live from Supabase.' },
                { title: 'Scan queue', value: `${scansQuery.data?.length ?? 0} rows`, detail: 'Review and edit historical scans.' },
                { title: 'Recommendation engine', value: `${recommendationsQuery.data?.length ?? 0} rows`, detail: 'Match reasons are editable.' },
                { title: 'Access model', value: getAdminRoleLabel(adminRole), detail: 'Permissions are role-aware.' },
              ].map((item) => (
                <Card key={item.title} className="border border-rose-100 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan">{item.title}</p>
                  <h3 className="mt-3 font-display text-3xl text-rose-950">{item.value}</h3>
                  <p className="mt-2 text-sm text-mist">{item.detail}</p>
                </Card>
              ))}
            </div>
          ) : null}

          {activeSection === 'products' ? (
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <Card className="border border-rose-100 p-6">
                <AdminSectionTitle
                  eyebrow="Catalog CRUD"
                  title={productForm.id ? 'Edit product' : 'Add product'}
                  description="Create or update the products that power the public recommendation surface."
                />
                <div className="mt-5 space-y-3">
                  <Input
                    placeholder="Product name"
                    value={productForm.name}
                    onChange={(event) => setProductForm((state) => ({ ...state, name: event.target.value }))}
                  />
                  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-rose-200/80 bg-white/80 px-4 py-3 text-sm text-pearl placeholder:text-mist/70 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/25"
                    placeholder="Product description"
                    value={productForm.description}
                    onChange={(event) => setProductForm((state) => ({ ...state, description: event.target.value }))}
                  />
                  <Input
                    placeholder="Image URL"
                    value={productForm.imageUrl}
                    onChange={(event) => setProductForm((state) => ({ ...state, imageUrl: event.target.value }))}
                  />
                  <Input
                    placeholder="External URL"
                    value={productForm.externalUrl}
                    onChange={(event) => setProductForm((state) => ({ ...state, externalUrl: event.target.value }))}
                  />
                  <Input
                    placeholder="Tags, comma separated"
                    value={productForm.tags}
                    onChange={(event) => setProductForm((state) => ({ ...state, tags: event.target.value }))}
                  />
                  {saveProductMutation.error ? (
                    <p className="text-sm text-rose-500">{saveProductMutation.error.message}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => saveProductMutation.mutate()}
                      disabled={saveProductMutation.isPending}
                    >
                      {saveProductMutation.isPending ? 'Saving...' : productForm.id ? 'Update product' : 'Create product'}
                    </Button>
                    <Button variant="ghost" onClick={() => setProductForm(emptyProductForm)}>
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                {productsQuery.data?.map((product) => (
                  <Card key={product.id} className="border border-rose-100 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-28 w-28 rounded-2xl object-cover"
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-display text-2xl text-rose-950">{product.name}</h3>
                            <p className="mt-1 text-sm text-mist">{product.description}</p>
                          </div>
                          <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">
                            {formatDate(product.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-mist/70">Tags: {formatTags(product.tags)}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button size="sm" variant="ghost" onClick={() => setProductForm(mapProductForm(product))}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteProductMutation.mutate(product.id)}
                            disabled={deleteProductMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          {activeSection === 'scans' ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="border border-rose-100 p-6">
                <AdminSectionTitle
                  eyebrow="Scan records"
                  title="Review and update scans"
                  description="Select a scan to inspect the stored metrics JSON or adjust the score if a manual review changes the outcome."
                />
                <div className="mt-5 space-y-3">
                  {scansQuery.data?.map((scan) => (
                    <button
                      key={scan.id}
                      type="button"
                      onClick={() => setScanForm(mapScanForm(scan))}
                      className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-left transition hover:border-rose-200 hover:bg-rose-50/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-rose-950">Scan {scan.id.slice(0, 8)}</p>
                          <p className="mt-1 text-xs text-mist">User {scan.user_id.slice(0, 8)}</p>
                          <p className="mt-1 text-xs text-mist">{formatDate(scan.created_at)}</p>
                        </div>
                        <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">Score {scan.score}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="border border-rose-100 p-6">
                <AdminSectionTitle
                  eyebrow="Scan editor"
                  title={scanForm.id ? `Edit scan ${scanForm.id.slice(0, 8)}` : 'Select a scan'}
                  description="Update the stored score and metrics payload for a scan record."
                />
                <div className="mt-5 space-y-3">
                  <Input
                    placeholder="Score"
                    type="number"
                    value={scanForm.score}
                    onChange={(event) => setScanForm((state) => ({ ...state, score: event.target.value }))}
                  />
                  <textarea
                    className="min-h-[280px] w-full rounded-2xl border border-rose-200/80 bg-white/80 px-4 py-3 font-mono text-xs text-pearl placeholder:text-mist/70 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/25"
                    placeholder="Metrics JSON"
                    value={scanForm.metricsJson}
                    onChange={(event) => setScanForm((state) => ({ ...state, metricsJson: event.target.value }))}
                  />
                  {saveScanMutation.error ? (
                    <p className="text-sm text-rose-500">{saveScanMutation.error.message}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => saveScanMutation.mutate()}
                      disabled={saveScanMutation.isPending || !scanForm.id}
                    >
                      {saveScanMutation.isPending ? 'Saving...' : 'Save scan'}
                    </Button>
                    <Button variant="ghost" onClick={() => setScanForm(emptyScanForm)}>
                      Clear
                    </Button>
                    {scanForm.id ? (
                      <Button
                        variant="ghost"
                        onClick={() => deleteScanMutation.mutate(scanForm.id)}
                        disabled={deleteScanMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete scan
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </div>
          ) : null}

          {activeSection === 'recommendations' ? (
            <div className="space-y-4">
              <Card className="border border-rose-100 p-6">
                <AdminSectionTitle
                  eyebrow="Recommendation CRUD"
                  title={recommendationForm.id ? 'Edit recommendation' : 'Create recommendation'}
                  description="Tie a product to a scan and refine the reason text that appears in the customer experience."
                />
                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  <Input
                    placeholder="Scan ID"
                    value={recommendationForm.scanId}
                    onChange={(event) => setRecommendationForm((state) => ({ ...state, scanId: event.target.value }))}
                  />
                  <Input
                    placeholder="Product ID"
                    value={recommendationForm.productId}
                    onChange={(event) => setRecommendationForm((state) => ({ ...state, productId: event.target.value }))}
                  />
                  <Input
                    placeholder="Reason"
                    value={recommendationForm.reason}
                    onChange={(event) => setRecommendationForm((state) => ({ ...state, reason: event.target.value }))}
                  />
                </div>
                {saveRecommendationMutation.error ? (
                  <p className="mt-3 text-sm text-rose-500">{saveRecommendationMutation.error.message}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button onClick={() => saveRecommendationMutation.mutate()} disabled={saveRecommendationMutation.isPending}>
                    {saveRecommendationMutation.isPending ? 'Saving...' : recommendationForm.id ? 'Update recommendation' : 'Create recommendation'}
                  </Button>
                  <Button variant="ghost" onClick={() => setRecommendationForm(emptyRecommendationForm)}>
                    Reset
                  </Button>
                </div>
              </Card>

              <div className="grid gap-4 xl:grid-cols-2">
                {recommendationsQuery.data?.map((recommendation) => {
                  const product = productLookup.get(recommendation.product_id)
                  const scan = scanLookup.get(recommendation.scan_id)

                  return (
                    <Card key={recommendation.id} className="border border-rose-100 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-cyan">Recommendation</p>
                          <h3 className="mt-2 font-display text-2xl text-rose-950">
                            {product?.name ?? recommendation.product_id.slice(0, 8)}
                          </h3>
                          <p className="mt-2 text-sm text-mist">{recommendation.reason}</p>
                        </div>
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">
                          {formatDate(recommendation.created_at)}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2 rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-xs text-mist">
                        <p>Scan: {scan ? `${scan.id.slice(0, 8)} · score ${scan.score}` : recommendation.scan_id}</p>
                        <p>Product: {product?.name ?? recommendation.product_id}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setRecommendationForm(mapRecommendationForm(recommendation))}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteRecommendationMutation.mutate(recommendation.id)}
                          disabled={deleteRecommendationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : null}

          {activeSection === 'access' ? (
            <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <Card className="border border-rose-100 p-6">
                <AdminSectionTitle
                  eyebrow="Role matrix"
                  title="Permission-aware navigation"
                  description="Sidebar tabs are filtered by the active admin role. Super admin sees everything; other roles only see the modules they need."
                />
                <div className="mt-5 space-y-3 text-sm text-rose-950">
                  {[
                    { role: 'Super Admin', scope: 'Full access across products, scans, recommendations, access and settings.' },
                    { role: 'Catalog Admin', scope: 'Products, recommendation edits, and environment settings.' },
                    { role: 'Operations Admin', scope: 'Products, scans, and operational controls.' },
                    { role: 'Content Admin', scope: 'Products, recommendation copy, and publishing controls.' },
                    { role: 'Analyst', scope: 'Scan review, recommendation insights, and settings readouts.' },
                  ].map((item) => (
                    <div key={item.role} className="rounded-2xl border border-rose-100 bg-white px-4 py-3">
                      <p className="font-semibold">{item.role}</p>
                      <p className="mt-1 text-sm text-mist">{item.scope}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border border-rose-100 p-6">
                <AdminSectionTitle
                  eyebrow="How to grant admin"
                  title="Backend-ready role setup"
                  description="Use Supabase auth metadata for true backend enforcement. The frontend also supports VITE_ADMIN_EMAILS for quick access in development."
                />
                <div className="mt-5 space-y-3 text-sm text-mist">
                  <div className="rounded-2xl bg-rose-50/70 px-4 py-3">
                    Set <span className="font-semibold text-rose-950">user.app_metadata.role = admin</span> or <span className="font-semibold text-rose-950">superadmin</span> in Supabase.
                  </div>
                  <div className="rounded-2xl bg-rose-50/70 px-4 py-3">
                    Add dev overrides in <span className="font-semibold text-rose-950">VITE_ADMIN_EMAILS</span> for local testing.
                  </div>
                  <div className="rounded-2xl bg-rose-50/70 px-4 py-3">
                    RLS policies on products, scans, and recommendations now allow admin CRUD.
                  </div>
                </div>
              </Card>
            </div>
          ) : null}

          {activeSection === 'settings' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  title: 'Platform state',
                  detail: 'Supabase-backed catalog and admin CRUD are live.',
                  icon: CheckCircle2,
                },
                {
                  title: 'Review tools',
                  detail: 'Scan score, recommendation reason and product content can all be edited.',
                  icon: ListChecks,
                },
                {
                  title: 'Governance',
                  detail: 'Use roles to limit access by job function.',
                  icon: Clock3,
                },
                {
                  title: 'Growth tools',
                  detail: 'Campaign copy and urgency timers can be wired into the same admin shell.',
                  icon: Megaphone,
                },
                {
                  title: 'Data sync',
                  detail: 'Public catalog pages now read from Supabase instead of only mock data.',
                  icon: Database,
                },
                {
                  title: 'Refresh loop',
                  detail: 'Use the sidebar refresh button after bulk edits or imports.',
                  icon: Rocket,
                },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <Card key={item.title} className="border border-rose-100 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan">{item.title}</p>
                        <p className="mt-2 text-sm text-mist">{item.detail}</p>
                      </div>
                      <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
