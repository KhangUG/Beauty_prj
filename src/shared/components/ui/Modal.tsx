import { AnimatePresence, motion } from 'framer-motion'
import { type PropsWithChildren } from 'react'
import { Button } from '@/shared/components/ui/Button'

type ModalProps = PropsWithChildren<{
  open: boolean
  title: string
  onClose: () => void
}>

export function Modal({ open, title, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-panel w-full max-w-lg rounded-3xl p-6 max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-rose-200/50 scrollbar-track-transparent"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(244, 63, 94, 0.2) transparent'
            }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-pearl">{title}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
