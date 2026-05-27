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
    { text: 'TRY ON', accent: false },
    { text: 'EVERY', accent: false },
    { text: 'LOOK,', accent: false },
    { text: 'INSTANTLY.', accent: true },
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
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-500">YOUR FACE. YOUR CANVAS. NO COMMITMENT.</p>
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
                See exactly how any lipstick, eyeshadow, or foundation looks on your face — powered by real-time AI. No guessing, no returns, no regrets.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <MotionLink
                to="/scan"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-full bg-rose-600 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110"
              >
                Try On Now — It's Free
              </MotionLink>
              <MotionLink
                to="/recommendations"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-full border border-rose-200 bg-white/80 px-6 py-3 font-semibold text-rose-800"
              >
                Browse Looks
              </MotionLink>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ['Looks Tried', '2.4M+'],
                ['Accuracy', '98.7%'],
                ['Shades', '5,000+'],
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
              <img src="/luxury-demo.svg" alt="AI Makeup Virtual Try-On demo" className="h-[min(22rem,30vh)] sm:h-[min(30rem,40vh)] w-full object-cover" />
              <div className="border-t border-black/5 p-5 lg:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Trending Look</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-3xl font-semibold text-rose-950">Velvet Nude Collection</h2>
                    <p className="mt-1 max-w-xl text-sm text-rose-700">Try 12 nude lip shades on your face in seconds. Find your perfect match.</p>
                  </div>
                  <p className="text-right text-lg font-semibold text-rose-900">Try Free</p>
                </div>
              </div>
            </div>

            <MobileAccordion title="How it works">
              <div className="rounded-[1.75rem] border border-black/5 bg-[linear-gradient(135deg,rgba(255,255,255,0.75),rgba(255,243,246,0.85))] p-5 shadow-[0_24px_60px_rgba(163,93,107,0.08)] backdrop-blur-xl lg:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-500">HOW IT WORKS</p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-rose-700">
                  Upload a selfie or use your live camera. Our AI maps your face in milliseconds — then lets you swipe through thousands of shades, finishes, and full makeup looks.
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
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">AI FACE MAPPING</p>
            <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.04em] text-rose-950 lg:text-5xl">Snap. Map. Transform.</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-rose-700">
              Our AI detects 468 facial landmarks in real time — lip contour, eye shape, skin tone — to place makeup with pixel-perfect precision on your face.
            </p>
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
              ✨ Works with selfies, live camera, and uploaded photos. No app download needed.
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
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">CURATED FOR YOU</p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-4xl font-black tracking-[-0.04em] text-rose-950 lg:text-6xl">Makeup picks matched to your skin</h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-rose-700">
                After your virtual try-on, our AI recommends products from top brands that complement your unique skin tone, undertone, and style preferences.
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
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">YOUR BEAUTY. YOUR RULES.</p>
            <h2 className="mt-4 max-w-4xl font-display text-5xl font-black leading-[0.94] tracking-[-0.05em] text-rose-950 lg:text-7xl">
              SEE IT ON YOU BEFORE YOU BUY.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-rose-700">
              Track your saved looks, revisit your try-on history, and get personalized restocks — all from one beautiful dashboard.
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
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">REAL PEOPLE. REAL LOOKS.</p>
          <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.04em] text-rose-950 lg:text-6xl">Loved by beauty enthusiasts worldwide</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-rose-700">
            From first-time makeup buyers to professional artists — everyone uses our virtual try-on to discover looks they'd never have dared to try in store.
          </p>
          <div className="mt-6 rounded-[1.5rem] border border-black/5 bg-rose-50/70 p-3 lg:p-4">
            <Testimonials />
          </div>
        </div>
      </motion.section>

      <section className="mx-auto w-full max-w-[1720px] px-3 py-6 lg:px-4 xl:px-5">
        <div className="rounded-[1.75rem] border border-black/5 bg-rose-600 px-5 py-7 text-white shadow-[0_24px_60px_rgba(163,93,107,0.18)] lg:px-10 lg:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">START FOR FREE</p>
          <h2 className="mt-4 max-w-4xl font-display text-4xl font-black leading-[0.94] tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            One selfie. Thousands of looks. Zero commitment.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <MotionLink
              to="/scan"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full bg-white px-6 py-3 font-semibold text-rose-900"
            >
              Try On Now
            </MotionLink>
            <MotionLink
              to="/auth"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm"
            >
              Create Free Account
            </MotionLink>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-[1720px] px-3 pb-8 pt-2 lg:px-4 xl:px-5 lg:pb-10">
        <div className="rounded-[1.75rem] border border-black/5 bg-white/75 px-5 py-6 shadow-[0_24px_60px_rgba(163,93,107,0.08)] backdrop-blur-xl lg:px-8 lg:py-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">BEAUTY AI</p>
              <p className="mt-3 text-sm leading-relaxed text-rose-700">
                AI-powered virtual makeup try-on — see any look on your face in real time before you buy.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {[
                ['Explore', ['Try On', 'Recommendations', 'Trending Looks']],
                ['Company', ['About Us', 'Careers', 'Press']],
                ['Support', ['Help Center', 'Privacy Policy', 'Contact']],
                ['Follow', ['Instagram', 'TikTok', 'Pinterest']],
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
            <p>© 2026 Beauty AI. All rights reserved.</p>
            <p>AI Makeup Virtual Try-On — powered by real-time face mapping.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
