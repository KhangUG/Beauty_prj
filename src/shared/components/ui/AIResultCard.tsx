import { Card } from '@/shared/components/ui/Card'
import { cn } from '@/shared/lib/cn'

type AIResultCardProps = {
  metric: string
  score: number
  status: 'great' | 'moderate' | 'attention'
  insight: string
}

const statusColorMap = {
  great: 'text-cyan',
  moderate: 'text-amber',
  attention: 'text-rose-300',
}

export function AIResultCard({ metric, score, status, insight }: AIResultCardProps) {
  return (
    <Card className="space-y-3 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-mist">{metric}</p>
      <p className={cn('font-display text-3xl font-semibold', statusColorMap[status])}>{score}</p>
      <p className="text-sm text-mist">{insight}</p>
    </Card>
  )
}
