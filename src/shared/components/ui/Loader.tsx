import { motion } from 'framer-motion'

type LoaderProps = {
  label?: string
  fullScreen?: boolean
}

export function Loader({ label = 'Preparing insight engine...', fullScreen = false }: LoaderProps) {
  return (
    <div className={fullScreen ? 'flex min-h-screen items-center justify-center bg-night px-6' : 'flex items-center justify-center py-12'}>
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="h-14 w-14 rounded-full border-2 border-cyan/30 border-t-cyan"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
        />
        <p className="text-sm text-mist">{label}</p>
      </div>
    </div>
  )
}
