// PlanPage.tsx
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useToast } from '@/shared/hooks/useToast'
import { usePlans } from '@/features/plans/hooks/usePlans'
import type { Plan } from '../services/plans-service'
import { CheckoutModal } from './CheckoutModal'
import { useActiveSubscription } from '../hooks/useActiveSubscription'

function formatPrice(price: number, interval: string): string {
  if (price === 0) return '$0'
  return `$${price.toFixed(2)}/${interval === 'year' ? 'yr' : 'mo'}`
}

function formatScans(limit: number): string {
  return `${limit.toLocaleString()} scans / month`
}

export default function PlanPage() {
  const toast = useToast()
  const { plans, loading, error } = usePlans()
  const { subscription } = useActiveSubscription()
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null)
  const { refreshProfile, subscriptionTier } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const isPaidUser = subscriptionTier !== 'free' && subscriptionTier !== 'guest'

  const expiryDate = subscription?.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated! 🎉')
      refreshProfile()
      setSearchParams({})
    }
    if (searchParams.get('cancelled') === 'true') {
      toast.error('Payment cancelled.')
      setSearchParams({})
    }
  }, [])

  return (
    <section className="section-shell pb-16 pt-6">
      <div className="relative mx-auto max-w-6xl space-y-10">
        <div className="absolute inset-0 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(14,116,144,0.08),transparent_45%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.98))]" />

        {/* Header */}
        <div className="rounded-[2.5rem] border border-slate-200/80 bg-white/90 px-7 py-9 text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">Pricing</p>
          <h1 className="mt-3 font-display text-4xl text-slate-900 md:text-5xl">
            Choose a scan plan for your AI journey
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-600">
            Flexible options for individuals and teams with more scans, deeper insights, and longer history.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-[2rem] border border-slate-200/80 bg-slate-100" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">
            Could not load plans. Please refresh the page.
          </div>
        )}

        {/* Plan grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {plans.map((plan) => {
              const isActive = plan.slug === subscriptionTier
              const isDisabled = isPaidUser && plan.price === 0

              return (
                <div
                  key={plan.id}
                  className={`group relative flex w-full flex-col rounded-[2rem] border border-slate-200/80 bg-white p-6 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)] ${
                    isActive ? 'ring-2 ring-emerald-400/20' : ''
                  }`}
                >
                  {/* Card tint — active only */}
                  {isActive && (
                    <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-emerald-300/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.95),rgba(236,253,245,0.2))]" />
                  )}

                  {/* Content wrapper — sits above tint */}
                  <div className="relative z-10 flex flex-1 flex-col">
                    {/* Badges row */}
                    <div className="flex items-center justify-between">
                      {plan.badge && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                          {plan.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                          Current
                        </span>
                      )}
                    </div>

                    {/* Plan name */}
                    <h2 className="mt-5 font-display text-3xl text-slate-900">{plan.name}</h2>

                    {/* Price */}
                    <div className="mt-3 space-y-1">
                      <p className="text-2xl font-semibold text-slate-900">
                        {formatPrice(plan.price, plan.billing_interval)}
                      </p>
                      <p className="text-xs text-slate-500">{formatScans(plan.scan_limit)}</p>
                    </div>

                    {/* Renewal date — only on the active paid card */}
                    {isActive && expiryDate && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Renews on <span className="font-semibold text-slate-800">{expiryDate}</span>
                      </div>
                    )}

                    {plan.description && (
                      <p className="mt-4 text-sm text-slate-600">{plan.description}</p>
                    )}

                    {/* Features */}
                    <div className="mt-6 flex-1 space-y-2 text-sm text-slate-600">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className={`mt-0.5 rounded-full border p-1 ${isActive ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                            <Check className={`h-3 w-3 ${isActive ? 'text-emerald-500' : 'text-slate-500'}`} />
                          </span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA button — hidden on active card */}
                    {!isActive && (
                      <Button
                        disabled={isDisabled}
                        className={`mt-6 w-full !rounded-full !px-6 !py-3 text-sm font-semibold ${
                          isDisabled
                            ? '!bg-slate-100 !text-slate-400 cursor-not-allowed'
                            : '!bg-slate-900 !text-white hover:!bg-slate-800'
                        }`}
                        onClick={() => !isDisabled && setCheckoutPlan(plan)}
                      >
                        {isDisabled
                          ? 'Not available'
                          : isPaidUser
                            ? `Upgrade to ${plan.name}`
                            : `Get ${plan.name}`}
                      </Button>
                    )}
                  </div>
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

      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={async () => {
            setCheckoutPlan(null)
            await refreshProfile()
            toast.success('Subscription activated!')
          }}
        />
      )}
    </section>
  )
}