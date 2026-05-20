import { useMutation } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '@/features/auth/services/auth-service'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const authMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'signin') {
        await authService.signIn(email, password)
      } else {
        await authService.signUp(email, password)
      }
    },
    onSuccess: () => {
      navigate(from, { replace: true })
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    authMutation.mutate()
  }

  return (
    <section className="section-shell pb-12">
      <Card className="mx-auto max-w-md space-y-4 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan">Authentication</p>
        <h1 className="font-display text-3xl text-pearl">
          {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
        </h1>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
          {authMutation.error ? (
            <p className="text-sm text-rose-300">{authMutation.error.message}</p>
          ) : null}
          <Button className="w-full" disabled={authMutation.isPending}>
            {authMutation.isPending
              ? 'Authenticating...'
              : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
          </Button>
        </form>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </Button>
      </Card>
    </section>
  )
}
