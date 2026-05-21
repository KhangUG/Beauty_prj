import { Suspense, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import SceneCanvas from '@/features/landing/components/SceneCanvas'
import AIScanner from '@/features/landing/components/AIScanner'
import ProductRecommendations from '@/features/landing/components/ProductRecommendations'
import DashboardPreview from '@/features/landing/components/DashboardPreview'
import Testimonials from '@/features/landing/components/Testimonials'
import MobileAccordion from '@/shared/components/ui/MobileAccordion'

export default function LandingPage() {
  const pageRef = useRef<HTMLElement | null>(null)
  const MotionLink = motion.create(Link)
  const heroLines = [
    { text: 'WE’RE', accent: false },
    { text: 'REBUILDING', accent: false },
    { text: 'IT FOR', accent: false },
    { text: 'CLARITY.', accent: true },
  ]

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })

    const raf = (time: number) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    const ctx = gsap.context(() => {
      gsap.from('[data-hero-reveal]', {
        opacity: 0,
        y: 24,
        filter: 'blur(10px)',
        duration: 1.1,
        stagger: 0.08,
        ease: 'power3.out',
      })

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((section, index) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 28, filter: 'blur(14px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 82%',
              end: 'top 30%',
              toggleActions: 'play none none reverse',
            },
            delay: index * 0.03,
          },
        )
      })

      gsap.to('[data-parallax-orb]', {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: pageRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        },
      })
    }, pageRef)

    return () => {
      ctx.revert()
      lenis.destroy()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
    <main ref={pageRef} className="min-h-screen overflow-x-hidden bg-[#fbf6f2] text-rose-950">
      <section className="relative overflow-hidden border-b border-black/5 bg-[linear-gradient(180deg,#fff7f4_0%,#fbf6f2_100%)]">
        <div data-parallax-orb className="absolute inset-0 -z-20 opacity-80 blur-3xl">
          <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,174,201,0.55),rgba(255,174,201,0.05)_70%,transparent_72%)]" />
          <div className="absolute left-[10%] top-[48%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,236,242,0.95),rgba(255,236,242,0.06)_68%,transparent_72%)]" />
        </div>

        <div className="absolute inset-0 -z-10 opacity-70">
          <Suspense fallback={null}>
            <SceneCanvas />
          </Suspense>
        </div>

        <div className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-[1720px] grid-cols-1 gap-3 px-3 py-2 lg:grid-cols-[1.08fr,0.92fr] lg:px-4 lg:py-3 xl:px-5">
          <motion.div
            className="relative flex min-h-[36rem] flex-col justify-between rounded-[1.75rem] border border-black/5 bg-white/65 p-4 sm:p-5 shadow-[0_30px_80px_rgba(163,93,107,0.08)] backdrop-blur-xl lg:p-7 xl:p-9"
            initial={{ opacity: 0, y: 24, scale: 0.985, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.05, ease: 'easeOut' }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.25),transparent_45%)] opacity-80" />
            <div className="relative z-10" data-hero-reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-500">THE DIGITAL BEAUTY WORLD WAS BUILT FOR NOISE.</p>
              <h1 className="mt-5 max-w-4xl font-display text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-6xl md:text-7xl xl:text-[7rem]">
                {heroLines.map((line, lineIndex) => (
                  <motion.span
                    key={line.text}
                    className={`relative block overflow-hidden ${line.accent ? 'text-rose-500' : 'text-rose-950'}`}
                    initial={{ opacity: 0, y: 26, scale: 0.98, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    transition={{
                      duration: 1.1,
                      ease: 'easeOut',
                      delay: 0.26 + lineIndex * 0.14,
                    }}
                  >
                    <motion.span
                      aria-hidden="true"
                      className={`absolute inset-0 block select-none ${line.accent ? 'text-rose-400' : 'text-rose-900'} opacity-10 blur-[0.5px]`}
                      animate={{ opacity: [0.05, 0.1, 0.05], y: [0, -0.25, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {line.text}
                    </motion.span>
                    <span className="relative">{line.text}</span>
                  </motion.span>
                ))}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-rose-700 lg:text-xl">
                A premium AI beauty experience with cinematic motion, luxury product curation, and blocks that read like an editorial homepage.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <MotionLink
                to="/scan"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-full bg-rose-600 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110"
              >
                Start AI Scan
              </MotionLink>
              <MotionLink
                to="/recommendations"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-full border border-rose-200 bg-white/80 px-6 py-3 font-semibold text-rose-800"
              >
                View Our Work
              </MotionLink>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ['Skin Score', '86'],
                ['Hydration', 'High'],
                ['Match', '98%'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-black/5 bg-white/80 p-4 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-rose-500">{label}</p>
                  <p className="mt-2 text-3xl font-black text-rose-950">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="grid gap-3 self-stretch"
            initial={{ opacity: 0, y: 28, scale: 0.985, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.15, ease: 'easeOut', delay: 0.12 }}
          >
            <div className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-white/75 shadow-[0_30px_80px_rgba(163,93,107,0.08)] backdrop-blur-xl">
                <div className="border-b border-black/5 px-6 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-500">LIVE FEATURE</p>
                </div>
              <img src="/luxury-demo.svg" alt="Luxury beauty product" className="h-[min(22rem,30vh)] sm:h-[min(30rem,40vh)] w-full object-cover" />
              <div className="border-t border-black/5 p-5 lg:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Featured Product</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-3xl font-semibold text-rose-950">Rose Quartz Serum</h2>
                    <p className="mt-1 max-w-xl text-sm text-rose-700">Hydrate, glow, and smooth with a luminous finish.</p>
                  </div>
                  <p className="text-right text-lg font-semibold text-rose-900">$68</p>
                </div>
              </div>
            </div>

            <MobileAccordion title="Our work">
              <div className="rounded-[1.75rem] border border-black/5 bg-[linear-gradient(135deg,rgba(255,255,255,0.75),rgba(255,243,246,0.85))] p-5 shadow-[0_24px_60px_rgba(163,93,107,0.08)] backdrop-blur-xl lg:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-500">OUR WORK</p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-rose-700">
                  A modular layout inspired by editorial tech pages: bold statements, large image blocks, and clear sections that feel premium instead of busy.
                </p>
              </div>
            </MobileAccordion>
          </motion.div>
        </div>
      </section>

      <motion.section
        data-reveal
        className="mx-auto w-full max-w-[1720px] border-b border-black/5 px-3 py-6 lg:px-4 xl:px-5"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7 }}
      >
        <div className="grid gap-4 lg:grid-cols-[0.85fr,1.15fr]">
          <div className="rounded-[1.75rem] border border-black/5 bg-white/80 p-5 shadow-[0_24px_60px_rgba(163,93,107,0.08)] backdrop-blur-xl lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">AI SKIN SCANNER</p>
            <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.04em] text-rose-950 lg:text-5xl">Upload. Analyze. Recommend.</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-rose-700">
              A single full-width block gives the scanner room to breathe, like the big editorial panels you see on premium brand sites.
            </p>
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
              Scroll through the sections below to see the product blocks, dashboard block, and social proof block.
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-black/5 bg-white/75 p-3 shadow-[0_24px_60px_rgba(163,93,107,0.08)] backdrop-blur-xl lg:p-5">
            <AIScanner />
          </div>
        </div>
      </motion.section>

      <motion.section
        data-reveal
        className="mx-auto w-full max-w-[1720px] border-b border-black/5 px-3 py-6 lg:px-4 xl:px-5"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7, delay: 0.05 }}
      >
        <div className="rounded-[1.75rem] border border-black/5 bg-white/80 p-5 shadow-[0_24px_60px_rgba(163,93,107,0.08)] backdrop-blur-xl lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">OUR WORK</p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-4xl font-black tracking-[-0.04em] text-rose-950 lg:text-6xl">Smart product recommendations</h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-rose-700">
                This block now behaves like a major editorial section: one strong heading, one supporting line, then the product wall.
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-black/5 bg-rose-50/70 p-3 lg:p-4">
            <ProductRecommendations />
          </div>
        </div>
      </motion.section>

      <motion.section
        data-reveal
        className="mx-auto w-full max-w-[1720px] border-b border-black/5 px-3 py-6 lg:px-4 xl:px-5"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr,0.8fr]">
          <div className="rounded-[1.75rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,245,248,0.82))] p-5 shadow-[0_24px_60px_rgba(163,93,107,0.08)] backdrop-blur-xl lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">TECHNOLOGY MADE YOU THE PRODUCT.</p>
            <h2 className="mt-4 max-w-4xl font-display text-5xl font-black leading-[0.94] tracking-[-0.05em] text-rose-950 lg:text-7xl">
              LET’S MAKE YOU THE OWNER.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-rose-700">
              The dashboard block stays intentionally wide and calm, like the best startup websites: a statement, then proof.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-black/5 bg-white/75 p-3 shadow-[0_24px_60px_rgba(163,93,107,0.08)] backdrop-blur-xl lg:p-5">
            <DashboardPreview />
          </div>
        </div>
      </motion.section>

      <motion.section
        data-reveal
        className="mx-auto w-full max-w-[1720px] border-b border-black/5 px-3 py-6 lg:px-4 xl:px-5"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        <div className="rounded-[1.75rem] border border-black/5 bg-white/80 p-5 shadow-[0_24px_60px_rgba(163,93,107,0.08)] backdrop-blur-xl lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">THE TEAM</p>
          <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.04em] text-rose-950 lg:text-6xl">Loved by product teams and beauty creators</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-rose-700">
            This section now reads like a wide editorial block with soft social proof, not a row of same-sized cards.
          </p>
          <div className="mt-6 rounded-[1.5rem] border border-black/5 bg-rose-50/70 p-3 lg:p-4">
            <Testimonials />
          </div>
        </div>
      </motion.section>

      <section className="mx-auto w-full max-w-[1720px] px-3 py-6 lg:px-4 xl:px-5">
        <div className="rounded-[1.75rem] border border-black/5 bg-rose-600 px-5 py-7 text-white shadow-[0_24px_60px_rgba(163,93,107,0.18)] lg:px-10 lg:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">JOIN US</p>
          <h2 className="mt-4 max-w-4xl font-display text-4xl font-black leading-[0.94] tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            Turn one selfie into a complete AI skincare routine.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <MotionLink
              to="/scan"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full bg-white px-6 py-3 font-semibold text-rose-900"
            >
              Launch Scan
            </MotionLink>
            <MotionLink
              to="/auth"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm"
            >
              Create Account
            </MotionLink>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-[1720px] px-3 pb-8 pt-2 lg:px-4 xl:px-5 lg:pb-10">
        <div className="rounded-[1.75rem] border border-black/5 bg-white/75 px-5 py-6 shadow-[0_24px_60px_rgba(163,93,107,0.08)] backdrop-blur-xl lg:px-8 lg:py-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">LUMINA AI</p>
              <p className="mt-3 text-sm leading-relaxed text-rose-700">
                Luxury AI beauty experience for scans, recommendations, and skincare discovery.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {[
                ['Explore', ['Home', 'AI Scan', 'Recommendations']],
                ['Company', ['About', 'Careers', 'Contact']],
                ['Resources', ['Products', 'Dashboard', 'Support']],
                ['Follow', ['Instagram', 'Pinterest', 'TikTok']],
              ].map(([title, items]) => (
                <div key={title as string}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-500">{title as string}</p>
                  <ul className="mt-3 space-y-2 text-sm text-rose-700">
                    {(items as string[]).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-black/5 pt-5 text-xs text-rose-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Lumina AI. All rights reserved.</p>
            <p>Designed for a full-screen luxury storefront feel.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
