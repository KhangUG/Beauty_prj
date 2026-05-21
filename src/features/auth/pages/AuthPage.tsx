import { useMutation } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '@/features/auth/services/auth-service'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { MailCheck } from 'lucide-react'
type AuthMode = 'signin' | 'signup' | 'forgot_password' | 'forgot_password_success'
export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const [mode, setMode] = useState<AuthMode>('signin')
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const authMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'signin') {
        await authService.signIn(email, password)
      } else if (mode === 'signup') {
        if (password !== confirmPassword) throw new Error('Passwords do not match')
        await authService.signUp(email, password, firstName, lastName)
      } else if (mode === 'forgot_password') {
        await authService.resetPasswordForEmail(email)
      }
    },
    onSuccess: () => {
      if (mode === 'signin') {
        navigate(from, { replace: true })
      } else if (mode === 'signup') {
        navigate('/auth/verify')
      } else if (mode === 'forgot_password') {
        setMode('forgot_password_success')
      }
    },
  })

  const googleMutation = useMutation({
    mutationFn: () => authService.signInWithGoogle()
  })


  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    authMutation.mutate()
  }

  if (mode === 'forgot_password_success') {
    return (
      <section className="section-shell pb-12">
        <Card className="mx-auto max-w-md space-y-4 p-8 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-cyan/10 p-4">
              <MailCheck className="h-8 w-8 text-cyan" />
            </div>
          </div>
          <h1 className="font-display text-2xl text-pearl">Check your email</h1>
          <p className="text-sand/80 text-sm">
            We've sent password reset instructions to {email}.
          </p>
          <Button className="w-full mt-4" onClick={() => setMode('signin')}>
            Back to Sign In
          </Button>
        </Card>
      </section>
    )
  }

  return (
    <section className="section-shell pb-12">
      <Card className="mx-auto max-w-md space-y-6 p-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan">Authentication</p>
          <h1 className="font-display text-3xl text-pearl">
            {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          {mode === 'forgot_password' && (
            <p className="text-sm text-sand/80">Enter your email and we'll send you a link to reset your password.</p>
          )}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="First Name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
              <Input
                placeholder="Last Name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </div>
          )}
          <Input
            placeholder="Email Address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {mode !== 'forgot_password' && (
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          )}
          {mode === 'signup' && (
            <Input
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
            />
          )}
          {authMutation.error ? (
            <p className="text-sm text-rose-400 text-center">{authMutation.error.message}</p>
          ) : null}
          <Button className="w-full" disabled={authMutation.isPending}>
            {authMutation.isPending
              ? 'Processing...'
              : mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                  ? 'Create Account'
                  : 'Send Reset Link'}
          </Button>
        </form>
        {mode === 'signin' && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-sand/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-night px-2 text-sand/50">Or continue with</span>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={() => googleMutation.mutate()}
              disabled={googleMutation.isPending}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
            <div className="flex flex-col gap-2 pt-2 text-center text-sm items-center">
              <button
                type="button"
                onClick={() => setMode('forgot_password')}
                className="text-cyan hover:bg-cyan/10 px-3 py-2 rounded-md transition-all"
              >
                Forgot your password?
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-sand/70 hover:text-cyan hover:bg-cyan/10 px-3 py-2 rounded-md transition-all"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </>
        )}
        {mode === 'signup' && (
          <div className="pt-2 text-center text-sm">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="text-sand/70 hover:text-cyan hover:bg-cyan/10 px-3 py-2 rounded-md transition-all"
            >
              Already have an account? Sign in
            </button>
          </div>
        )}
        {mode === 'forgot_password' && (
          <div className="pt-2 text-center text-sm">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="text-sand/70 hover:text-cyan hover:bg-cyan/10 px-3 py-2 rounded-md transition-all"
            >
              Remember your password? Sign in
            </button>
          </div>
        )}
      </Card>
    </section>
  )
}
