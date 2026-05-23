import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import type { MakeupVtoTaskStatus } from '@/features/ai-scan/types/makeup-vto'

type MakeupResultPanelProps = {
  imageSource: string
  resultUrl: string | null
  downloadUrl: string | null
  status: MakeupVtoTaskStatus
  isDemo: boolean
  errorMessage: string | null
}

export function MakeupResultPanel({
  imageSource,
  resultUrl,
  downloadUrl,
  status,
  isDemo,
  errorMessage,
}: MakeupResultPanelProps) {
  const isProcessing = status === 'running' || status === 'queued' || status === 'processing'

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-rose-100/60 bg-white/90 shadow-sm">
      <div className="shrink-0 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <label className="flex flex-col gap-1 text-xl font-semibold text-rose-950">
            <span className="inline-flex items-center gap-1">Result</span>
            <span className="text-xs font-normal text-mist">Preview the processed makeup result on the selected image.</span>
          </label>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {downloadUrl && status === 'success' ? (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-cyan/20 bg-cyan/5 px-3 py-2">
            <p className="truncate font-mono text-[10px] text-cyan-800">{downloadUrl.split('/').pop()}</p>
            <a href={downloadUrl} target="_blank" rel="noreferrer" download>
              <Button size="sm" variant="ghost" className="gap-1">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </a>
          </div>
        ) : null}

        <div className="flex min-h-[280px] items-center justify-center">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3 text-sm text-mist">
              <Loader2 className="h-8 w-8 animate-spin text-cyan" />
              <p>Analyzing face and applying makeup...</p>
            </div>
          ) : errorMessage ? (
            <div className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
          ) : resultUrl ? (
            <img src={resultUrl} alt="Processed makeup result" className="w-full rounded-2xl object-contain" />
          ) : (
            <p className="text-sm text-mist">Select an image and start processing.</p>
          )}
        </div>
      </div>
    </div>
  )
}
