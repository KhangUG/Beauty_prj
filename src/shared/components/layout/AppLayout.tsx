import { motion } from 'framer-motion'
import { Outlet } from 'react-router-dom'
import { AnimatedNavbar } from '@/shared/components/layout/AnimatedNavbar'
import { pageTransition } from '@/animations/motion'

export function AppLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-hero-gradient pb-16">
      <div className="ambient-orb left-[-10rem] top-8 h-72 w-72 bg-cyan/30" />
      <div className="ambient-orb right-[-7rem] top-40 h-64 w-64 bg-amber/20" />
      <AnimatedNavbar />
      <motion.main className="pt-8" {...pageTransition}>
        <Outlet />
      </motion.main>
    </div>
  )
}
