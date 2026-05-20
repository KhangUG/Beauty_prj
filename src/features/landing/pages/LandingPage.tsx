import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fadeInUp, staggerContainer } from '@/animations/motion'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { RecommendationGrid } from '@/shared/components/ui/RecommendationGrid'
import { mockProducts } from '@/shared/data/mock-products'

const features = [
  {
    title: 'Deep Skin Analytics',
    description: 'Instant metric extraction for acne, hydration, oiliness, and dark circles.',
  },
  {
    title: 'AI-Native Recommendations',
    description: 'Every product suggestion includes confidence-backed reasoning for your skin profile.',
  },
  {
    title: 'Supabase-Ready Platform',
    description: 'Architecture prepared for auth, image storage, scan history, and product catalogs.',
  },
]

const testimonials = [
  { name: 'Mina, Product Designer', text: 'Feels like Apple Health for skin with a Banuba-level wow moment.' },
  { name: 'Ravi, Growth Lead', text: 'The scan-to-recommendation path is smooth, cinematic, and trust-building.' },
  { name: 'Julia, Founder', text: 'Luxury interface, startup speed, and clear AI explanations in one product.' },
]

function SectionHeader({ eyebrow, title, caption }: { eyebrow: string; title: string; caption: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold text-pearl md:text-4xl">{title}</h2>
      <p className="mt-3 text-mist">{caption}</p>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="space-y-24 pb-16">
      <section className="section-shell pt-10 md:pt-16">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <motion.div variants={fadeInUp} className="space-y-6">
            <p className="text-xs uppercase tracking-[0.32em] text-cyan">Cinematic AI Skin Studio</p>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-pearl md:text-7xl">
              Your Luxury <span className="text-cyan">Beauty Intelligence</span> Layer
            </h1>
            <p className="max-w-xl text-lg text-mist">
              Upload a selfie, run an AI skin scan, and receive precision skincare recommendations in under a minute.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/scan">
                <Button size="lg">Start AI Scan</Button>
              </Link>
              <Link to="/recommendations">
                <Button variant="ghost" size="lg">
                  See Recommendations
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} className="glass-panel rounded-[2rem] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan">Live AI Demo</p>
            <div className="mt-5 overflow-hidden rounded-3xl border border-white/15">
              <img
                src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=80"
                alt="AI beauty demo"
                className="h-72 w-full object-cover"
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <Card className="p-4">
                <p className="text-mist">Skin Score</p>
                <p className="mt-1 font-display text-3xl text-cyan">86</p>
              </Card>
              <Card className="p-4">
                <p className="text-mist">AI Confidence</p>
                <p className="mt-1 font-display text-3xl text-amber">97%</p>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="section-shell">
        <SectionHeader
          eyebrow="AI Demo"
          title="Upload. Analyze. Recommend."
          caption="A smooth intelligence pipeline that translates visual skin cues into clear action plans."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {['Upload Selfie', 'AI Skin Scan', 'Personalized Products'].map((step, index) => (
            <Card key={step} className="relative overflow-hidden p-6">
              <p className="font-display text-4xl text-white/20">0{index + 1}</p>
              <h3 className="mt-4 font-display text-xl text-pearl">{step}</h3>
              <p className="mt-2 text-sm text-mist">Engineered with motion-forward interactions and startup-grade clarity.</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <SectionHeader
          eyebrow="Features"
          title="Built Like a Real AI Startup Product"
          caption="Modular frontend architecture with premium visuals and scalable service boundaries."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6">
              <h3 className="font-display text-xl text-pearl">{feature.title}</h3>
              <p className="mt-3 text-sm text-mist">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <SectionHeader
          eyebrow="Showcase"
          title="Smart Product Recommendations"
          caption="Every suggestion includes why it matches your current skin profile."
        />
        <RecommendationGrid products={mockProducts.slice(0, 3)} />
      </section>

      <section className="section-shell">
        <SectionHeader
          eyebrow="Testimonials"
          title="Loved by Product Teams and Beauty Creators"
          caption="Early teams use LUMINA AI to speed up personalization and user trust."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.name} className="p-6">
              <p className="text-sm text-pearl">"{item.text}"</p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-cyan">{item.name}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <Card className="rounded-[2rem] p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.26em] text-cyan">Start Building Glow Intelligence</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-bold text-pearl md:text-5xl">
            Turn one selfie into a complete AI skincare routine.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/scan">
              <Button size="lg">Launch Scan</Button>
            </Link>
            <Link to="/auth">
              <Button variant="accent" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      <footer className="section-shell text-sm text-mist">
        <div className="glass-panel rounded-3xl p-6">
          <p className="font-display text-pearl">LUMINA AI Beauty Platform</p>
          <p className="mt-2">Built for cinematic personalization with React, Framer Motion, Supabase, Zustand, and TanStack Query.</p>
        </div>
      </footer>
    </div>
  )
}
