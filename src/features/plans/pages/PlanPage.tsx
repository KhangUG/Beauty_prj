import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { authService } from '@/features/auth/services/auth-service'
import { useToast } from '@/shared/hooks/useToast'
import { usePlans } from '@/features/plans/hooks/usePlans'

// Helper: format giá hiển thị
function formatPrice(price: number, interval: string): string {
  if (price === 0) return '$0'
  return `$${price.toFixed(2)}/${interval === 'year' ? 'yr' : 'mo'}`
}

// Helper: format scan limit hiển thị
function formatScans(limit: number): string {
  return `${limit.toLocaleString()} scans / month`
}

// Highlight slug cố định — hoặc thêm cột is_highlighted vào DB
const HIGHLIGHT_SLUG = 'premium'

export default function PlanPage() {
  const { user, subscriptionTier, refreshProfile } = useAuth()
  const toast = useToast()
  const { plans, loading, error } = usePlans()

  const activePlan = subscriptionTier?.toLowerCase() || 'free'

  const handleSelectPlan = async (planSlug: string) => {
    if (!user?.id) {
      toast.error('Please sign in to change your plan.')
      return
    }
    try {
      await authService.updateProfile(user.id, { subscription_tier: planSlug })
      await refreshProfile()
      toast.success(`Plan updated: ${planSlug}`)
    } catch (err) {
      toast.error((err as Error).message || 'Could not update plan. Please try again.')
    }
  }

  return (
    <section className="section-shell pb-16 pt-6">
      <div className="relative mx-auto max-w-6xl space-y-10">
        <div className="absolute inset-0 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(14,116,144,0.08),transparent_45%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.98))]" />

        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white/90 px-7 py-9 text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">Pricing</p>
          <h1 className="mt-3 font-display text-4xl text-slate-900 md:text-5xl">
            Choose a scan plan for your AI journey
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-600">
            Flexible options for individuals and teams with more scans, deeper insights, and longer history.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-[2rem] border border-slate-200/80 bg-slate-100"
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">
            Could not load plans. Please refresh the page.
          </div>
        )}

        {/* Plans grid */}
        {!loading && !error && (
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {plans.map((plan) => {
              const isHighlight = plan.slug === HIGHLIGHT_SLUG
              const isActive = activePlan === plan.slug

              return (
                <div
                  key={plan.id}
                  className={`group relative flex flex-col rounded-[2rem] border border-slate-200/80 bg-white p-6 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)] ${
                    isHighlight ? 'ring-2 ring-rose-400/60' : ''
                  }`}
                >
                  {isHighlight && (
                    <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-rose-300/40 bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(255,235,243,0.55))]" />
                  )}

                  <div className="flex items-center justify-between">
                    {plan.badge && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                        {plan.badge}
                      </span>
                    )}
                    {isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                        Current
                      </span>
                    ) : isHighlight ? (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-700">
                        Best value
                      </span>
                    ) : null}
                  </div>

                  <div className="relative">
                    <h2 className="mt-5 font-display text-3xl text-slate-900">{plan.name}</h2>
                    {isHighlight && (
                      <div className="absolute -right-1 -top-6 h-12 w-12 rounded-full bg-rose-200/60 blur-2xl" />
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatPrice(plan.price, plan.billing_interval)}
                    </p>
                    <p className="text-xs text-slate-500">{formatScans(plan.scan_limit)}</p>
                  </div>

                  {plan.description && (
                    <p className="mt-4 text-sm text-slate-600">{plan.description}</p>
                  )}

                  <div className="mt-6 flex-1 space-y-2 text-sm text-slate-600">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <span className="mt-0.5 rounded-full border border-slate-200 bg-slate-50 p-1">
                          <Check className="h-3 w-3 text-slate-500" />
                        </span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`mt-6 w-full !rounded-full !px-6 !py-3 text-sm font-semibold ${
                      isHighlight
                        ? '!bg-rose-500 !text-white hover:!bg-rose-400 shadow-[0_16px_40px_rgba(244,63,94,0.25)]'
                        : '!bg-slate-900 !text-white hover:!bg-slate-800'
                    }`}
                    onClick={() => handleSelectPlan(plan.slug)}
                    disabled={isActive}
                  >
                    {isActive ? 'Selected' : `Get ${plan.name}`}
                  </Button>

                  <button className="mt-4 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700">
                    View plan details
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200">+</span>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link to="/scan">
            <Button className="!rounded-full !bg-slate-900 !text-white hover:!bg-slate-800">Back to scan</Button>
          </Link>
          <Link to="/products">
            <Button className="!rounded-full !bg-white !text-slate-900 hover:!bg-slate-100">Browse products</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}