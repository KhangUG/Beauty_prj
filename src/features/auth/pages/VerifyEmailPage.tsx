import { Link } from 'react-router-dom'
import { Card } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { MailCheck } from 'lucide-react'
export default function VerifyEmailPage() {
  return (
    <section className="section-shell pb-12">
      <Card className="mx-auto max-w-md space-y-6 p-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-cyan/10 p-4">
            <MailCheck className="h-12 w-12 text-cyan" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-pearl">Check your email</h1>
          <p className="text-sand/80">
            We've sent you a verification link. Please check your email and click the link to activate your account.
          </p>
        </div>
        <div className="pt-4">
          <Button asChild variant="outline" className="w-full">
            <Link to="/auth">Return to login</Link>
          </Button>
        </div>
      </Card>
    </section>
  )
}