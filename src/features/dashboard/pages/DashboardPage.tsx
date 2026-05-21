import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getAdminRoleLabel } from '@/shared/lib/admin'

export default function DashboardPage() {
  const { isAdmin, adminRole } = useAuth()

  return (
    <section className="section-shell space-y-6 pb-12">
      <Card className="border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan">Dashboard</p>
            <h1 className="font-display text-4xl text-rose-950 md:text-5xl">Your beauty control hub</h1>
            <p className="text-sm leading-7 text-mist md:text-base">
              Track scan activity, routine performance, and admin access from one place.
            </p>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan">Admin status</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-rose-950">
              <ShieldCheck className="h-4 w-4 text-rose-500" />
              {isAdmin ? getAdminRoleLabel(adminRole) : 'Standard user'}
            </div>
            <p className="mt-1 text-xs text-mist">
              {isAdmin
                ? 'You can open the full admin console now.'
                : 'Admin console is hidden until Supabase role or admin email is set.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center rounded-2xl bg-rose-500/95 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(216,94,128,0.18)] transition hover:brightness-105"
                >
                  Open admin console
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : null}
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-2xl border border-rose-100 bg-white/60 px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-white/70"
              >
                Check access
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan">Recent Scans</p>
          <h2 className="mt-3 font-display text-3xl text-pearl">12</h2>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan">Avg Skin Score</p>
          <h2 className="mt-3 font-display text-3xl text-pearl">84</h2>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan">Saved Routines</p>
          <h2 className="mt-3 font-display text-3xl text-pearl">5</h2>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {[
          {
            title: 'Admin-ready modules',
            detail: 'Products, scans, recommendations, access, and settings now live in the admin console.',
            icon: Sparkles,
          },
          {
            title: 'Role-based visibility',
            detail: 'Only permitted roles can see admin tabs and edit live Supabase data.',
            icon: ShieldCheck,
          },
          {
            title: 'Team workflow',
            detail: 'Use the dashboard for fast checks, then jump into admin when your role allows it.',
            icon: Users,
          },
        ].map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.title} className="border border-rose-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-mist">{item.detail}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {!isAdmin ? (
        <Card className="border border-dashed border-rose-200 bg-rose-50/40 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-600">Why admin is hidden</p>
          <p className="mt-2 text-sm leading-7 text-rose-900">
            Your current Supabase session is not recognized as an admin. Set <span className="font-semibold">app_metadata.role = admin</span>
            or <span className="font-semibold">superadmin</span>, or add your email to <span className="font-semibold">VITE_ADMIN_EMAILS</span>, then log in again.
          </p>
        </Card>
      ) : null}
    </section>
  )
}
