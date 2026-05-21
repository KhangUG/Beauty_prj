import { useState } from 'react'
import { motion } from 'framer-motion'

export default function AIScanner() {
  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setPreview(URL.createObjectURL(f))
  }

  const runScan = async () => {
    setScanning(true)
    await new Promise((r) => setTimeout(r, 2200))
    setScanning(false)
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <div className="p-6 rounded-2xl bg-white/60 border border-white/40 shadow-md backdrop-blur-md">
        <h3 className="font-display text-2xl font-bold">AI Skin Scanner</h3>
        <p className="text-sm text-rose-700/80 mt-2">Upload a selfie to begin a cinematic scan. Our AI analyzes texture, hydration, and tone.</p>

        <div className="mt-4">
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
            <div className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold">Upload Selfie</div>
          </label>
          <button onClick={runScan} disabled={!preview || scanning} className="ml-3 px-4 py-2 rounded-lg bg-white/90 border font-semibold">{scanning ? 'Scanning...' : 'Run Scan'}</button>
        </div>

        <div className="mt-4">
          <div className="w-full h-56 rounded-xl overflow-hidden bg-gradient-to-tr from-pink-50 to-ivory-50 flex items-center justify-center">
            {preview ? <img src={preview} alt="preview" className="h-full w-full object-cover" /> : <div className="text-sm text-rose-400">No image yet</div>}
            {scanning ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-gradient-to-t from-black/10" /> : null}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white/30 border border-white/30 shadow-sm backdrop-blur-sm">
        <h4 className="font-semibold">Live Scan Preview</h4>
        <div className="mt-3 h-40 rounded-xl bg-gradient-to-br from-white/30 to-rose-50 flex items-center justify-center">
          <div className="text-sm text-rose-700/60">AI processing animation will appear here.</div>
        </div>
      </div>
    </div>
  )
}
