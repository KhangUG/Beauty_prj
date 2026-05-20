import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'

export default function AdminPage() {
  return (
    <section className="section-shell space-y-4 pb-12">
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan">Admin Console</p>
        <h1 className="font-display text-3xl text-pearl">Product and Scan Operations</h1>
        <p className="text-sm text-mist">Manage product inventory, recommendation rules, and scan quality from one modular panel.</p>
        <div className="flex gap-3">
          <Button>Manage Products</Button>
          <Button variant="ghost">Review Scan Logs</Button>
        </div>
      </Card>
    </section>
  )
}
