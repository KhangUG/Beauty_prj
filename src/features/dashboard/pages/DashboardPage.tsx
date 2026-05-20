import { Card } from '@/shared/components/ui/Card'

export default function DashboardPage() {
  return (
    <section className="section-shell grid gap-4 pb-12 md:grid-cols-3">
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
    </section>
  )
}
