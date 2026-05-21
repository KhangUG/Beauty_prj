import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'

const planCards = [
  {
    id: 'free',
    badge: 'New features',
    name: 'Glow Free',
    price: '0đ',
    scans: '2 scans / month',
    description: 'Start your AI scan journey with core metrics and short history.',
    features: ['2 scans / month', 'Basic product suggestions', '7-day scan history', 'Email support'],
    cta: 'Get Free',
    accent: 'from-slate-700/40 via-slate-800/20 to-slate-900/20',
  },
  {
    id: 'premium',
    badge: 'Most popular',
    name: 'Glow Premium',
    price: '199.000đ/mo',
    scans: '10 scans / month',
    description: 'Unlock more scans, deeper history, and advanced recommendations.',
    features: ['10 scans / month', 'Advanced matched insights', '90-day scan history', 'Priority support'],
    cta: 'Get Premium',
    accent: 'from-blue-600/30 via-slate-900/10 to-cyan-500/20',
    highlight: true,
  },
  {
    id: 'pro',
    badge: 'Team ready',
    name: 'Glow Pro',
    price: '399.000đ/mo',
    scans: '25 scans / month',
    description: 'Built for studios and teams managing multiple client profiles.',
    features: ['25 scans / month', 'Trend reports', '365-day scan history', 'Premium support'],
    cta: 'Get Pro',
    accent: 'from-indigo-500/25 via-slate-900/10 to-fuchsia-500/20',
  },
]

export default function CheckoutPage() {
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

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {planCards.map((plan) => (
            <div
              key={plan.id}
              className={`group relative rounded-[2rem] border border-slate-200/80 bg-white p-6 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)] ${
                plan.highlight ? 'ring-2 ring-rose-400/60' : ''
              }`}
            >
              {plan.highlight ? (
                <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-rose-300/40 bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(255,235,243,0.55))]" />
              ) : null}
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                  {plan.badge}
                </span>
                {plan.highlight ? (
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-700">
                    Best value
                  </span>
                ) : null}
              </div>

              <div className="relative">
                <h2 className="mt-5 font-display text-3xl text-slate-900">{plan.name}</h2>
                {plan.highlight ? (
                  <div className="absolute -right-1 -top-6 h-12 w-12 rounded-full bg-rose-200/60 blur-2xl" />
                ) : null}
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-2xl font-semibold text-slate-900">{plan.price}</p>
                <p className="text-xs text-slate-500">{plan.scans}</p>
              </div>
              <p className="mt-4 text-sm text-slate-600">{plan.description}</p>

              <div className="mt-6 space-y-2 text-sm text-slate-600">
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
                  plan.highlight
                    ? '!bg-rose-500 !text-white hover:!bg-rose-400 shadow-[0_16px_40px_rgba(244,63,94,0.25)]'
                    : '!bg-slate-900 !text-white hover:!bg-slate-800'
                }`}
              >
                {plan.cta}
              </Button>

              <button className="mt-4 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700">
                View plan details
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200">+</span>
              </button>
            </div>
          ))}
        </div>

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
