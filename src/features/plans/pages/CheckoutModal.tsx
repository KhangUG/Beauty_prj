import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { supabase } from '@/services/supabase/client'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Plan } from '../services/plans-service'

interface Props {
  plan: Plan
  onClose: () => void
  onSuccess: () => void
}

type Step = 'confirm' | 'processing' | 'error'

export function CheckoutModal({ plan, onClose, onSuccess }: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('confirm')
  const [error, setError] = useState<string | null>(null)

  const handleFreePlan = async () => {
    setStep('processing')
    try {
      const now = new Date()

      // Hủy subscription cũ
      await (supabase.from('subscriptions') as any)
        .update({ status: 'cancelled', cancelled_at: now.toISOString() })
        .eq('user_id', user!.id)
        .eq('status', 'active')

      // Tạo subscription free
      const { error: insertError } = await (supabase.from('subscriptions') as any)
        .insert({
          user_id: user!.id,
          plan_id: plan.id,
          status: 'active',
          started_at: now.toISOString(),
          expires_at: null,
        })

      if (insertError) throw insertError
      onSuccess()
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
      setStep('error')
    }
  }

  const handleStripePlan = async () => {
    setStep('processing')
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Chưa đăng nhập')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ planId: plan.id }),
        }
      )

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Redirect sang Stripe Checkout
      window.location.href = data.url
    } catch (err) {
      setError((err as Error).message || 'Có lỗi xảy ra. Vui lòng thử lại.')
      setStep('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">

        {/* Xác nhận */}
        {step === 'confirm' && (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Xác nhận đăng ký
            </p>
            <h2 className="mt-2 font-display text-2xl text-slate-900">{plan.name}</h2>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {plan.price === 0 ? (
                'Miễn phí'
              ) : (
                <>
                  ${plan.price.toFixed(2)}
                  <span className="text-sm font-normal text-slate-500">/tháng</span>
                </>
              )}
            </p>

            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> {f}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1 !rounded-full !bg-slate-100 !text-slate-700"
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 !rounded-full !bg-rose-500 !text-white hover:!bg-rose-400"
                onClick={plan.price === 0 ? handleFreePlan : handleStripePlan}
              >
                {plan.price === 0 ? 'Dùng miễn phí' : `Thanh toán $${plan.price.toFixed(2)}`}
              </Button>
            </div>
          </>
        )}

        {/* Đang xử lý */}
        {step === 'processing' && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-rose-500" />
            <p className="mt-4 text-sm text-slate-600">
              {plan.price === 0 ? 'Đang xử lý...' : 'Đang chuyển sang trang thanh toán...'}
            </p>
          </div>
        )}

        {/* Lỗi */}
        {step === 'error' && (
          <div className="text-center">
            <p className="text-sm text-red-500">{error}</p>
            <Button
              className="mt-4 !rounded-full !bg-slate-900 !text-white"
              onClick={() => setStep('confirm')}
            >
              Thử lại
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}