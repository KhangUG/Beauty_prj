import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, Minus, Plus, ShoppingBag, CreditCard, Wallet, Truck, User, Phone, MapPin, Sparkles, Award } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { type ProductRecommendation } from '@/shared/lib/types'

type CheckoutModalProps = {
  open: boolean
  onClose: () => void
  product: ProductRecommendation
}

export function CheckoutModal({ open, onClose, product }: CheckoutModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'momo' | 'visa' | 'apple'>('cod')
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: '',
  })
  const [phase, setPhase] = useState<'form' | 'processing' | 'success'>('form')
  const [orderId, setOrderId] = useState('')

  // Calculate dynamic mock price based on product ID (between 390k and 690k VND)
  const price = (() => {
    const num = product.id.replace(/\D/g, '')
    const base = num ? parseInt(num) : product.name.charCodeAt(0) || 1
    return ((base % 4) * 100000) + 390000
  })()

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  // Generate random order ID on success
  useEffect(() => {
    if (phase === 'success') {
      const rand = Math.floor(100000 + Math.random() * 900000)
      setOrderId(`BG-${rand}`)
    }
  }, [phase])

  // Reset states when modal is closed
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setQuantity(1)
        setPaymentMethod('cod')
        setShippingInfo({ name: '', phone: '', address: '' })
        setPhase('form')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleInputChange = (field: keyof typeof shippingInfo, value: string) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = shippingInfo.name.trim() !== '' && 
                      shippingInfo.phone.trim() !== '' && 
                      shippingInfo.address.trim() !== ''

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    setPhase('processing')
    
    // Simulate transaction delay
    setTimeout(() => {
      setPhase('success')
    }, 1800)
  }

  return (
    <Modal open={open} title="Thanh Toán Nhanh" onClose={onClose}>
      <AnimatePresence mode="wait">
        {phase === 'form' && (
          <motion.form 
            key="form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            onSubmit={handleConfirmOrder}
            className="space-y-6 pt-1 text-night"
          >
            {/* Product Summary Row - Redesigned to look like a premium luxury tag */}
            <div className="relative overflow-hidden rounded-2xl border border-rose-300/40 bg-gradient-to-br from-rose-50/70 to-white/80 p-4 shadow-sm backdrop-blur-md">
              <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-r from-rose-500 to-pink-500 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white flex items-center gap-1 shadow-sm">
                <Sparkles className="h-3 w-3" />
                Đề Xuất AI
              </div>
              <div className="flex gap-4">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="h-20 w-20 rounded-xl object-cover border border-rose-200/60 shadow-inner shadow-black/5"
                />
                <div className="flex-1 min-w-0 pr-16 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-rose-500 font-extrabold flex items-center gap-1">
                    <Award className="h-3 w-3 text-rose-400" />
                    {product.category}
                  </span>
                  <h4 className="font-display text-base font-extrabold text-rose-950 truncate mt-0.5">{product.name}</h4>
                  <p className="text-sm font-extrabold text-cyan-600 mt-1">{formattedPrice(price)}</p>
                </div>
              </div>
            </div>

            {/* Quantity Selector - Luxury counter feel */}
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-white/60 to-rose-50/20 p-4 border border-rose-200/30 shadow-[0_4px_20px_rgba(216,94,128,0.02)]">
              <div>
                <p className="text-sm font-extrabold text-rose-950">Số lượng</p>
                <p className="text-xs text-mist">Chọn số lượng sản phẩm</p>
              </div>
              <div className="flex items-center gap-4 bg-white/80 rounded-xl border border-rose-200/50 p-1 shadow-sm">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100/80 transition active:scale-95 border border-rose-100"
                >
                  <Minus className="h-4 w-4" />
                </motion.button>
                <span className="w-8 text-center font-display text-base font-extrabold text-rose-900">{quantity}</span>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100/80 transition active:scale-95 border border-rose-100"
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            {/* Shipping Info fields - Premium input design with icons */}
            <div className="space-y-3.5">
              <p className="text-sm font-extrabold text-rose-950 flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-rose-500" />
                Thông tin nhận hàng
              </p>
              
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-rose-400/80">
                  <User className="h-4 w-4" />
                </span>
                <Input 
                  type="text" 
                  placeholder="Họ và tên của bạn" 
                  value={shippingInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-11 border-rose-200/60 bg-white/70 shadow-sm focus:bg-white transition-all duration-300"
                  required
                />
              </div>

              <div className="relative">
                <span className="absolute left-4 top-3.5 text-rose-400/80">
                  <Phone className="h-4 w-4" />
                </span>
                <Input 
                  type="tel" 
                  placeholder="Số điện thoại nhận hàng" 
                  value={shippingInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-11 border-rose-200/60 bg-white/70 shadow-sm focus:bg-white transition-all duration-300"
                  required
                />
              </div>

              <div className="relative">
                <span className="absolute left-4 top-3.5 text-rose-400/80">
                  <MapPin className="h-4 w-4" />
                </span>
                <Input 
                  type="text" 
                  placeholder="Địa chỉ giao hàng (Số nhà, Đường, Quận, TP)" 
                  value={shippingInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="pl-11 border-rose-200/60 bg-white/70 shadow-sm focus:bg-white transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Payment Method Grid - Outstanding active card highlight */}
            <div className="space-y-3">
              <p className="text-sm font-extrabold text-rose-950">Phương thức thanh toán</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'cod', name: 'COD (Tiền mặt)', icon: Truck },
                  { id: 'momo', name: 'Ví MoMo', icon: Wallet },
                  { id: 'visa', name: 'Thẻ Visa/Master', icon: CreditCard },
                  { id: 'apple', name: 'Apple Pay', icon: ShoppingBag }
                ].map((method) => {
                  const Icon = method.icon
                  const active = paymentMethod === method.id
                  return (
                    <motion.button
                      key={method.id}
                      type="button"
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-300 relative overflow-hidden ${
                        active 
                          ? 'border-cyan-500 bg-gradient-to-r from-cyan-500/10 to-teal-500/5 text-cyan-950 font-bold shadow-[0_4px_18px_rgba(6,182,212,0.12)]' 
                          : 'border-rose-200/50 bg-white/60 text-rose-900/80 hover:border-rose-300 hover:bg-white'
                      }`}
                    >
                      {active && (
                        <div className="absolute right-0 top-0 h-3 w-3 bg-cyan bg-gradient-to-tr from-cyan-500 to-teal-400 rounded-bl-md flex items-center justify-center">
                          <Check className="h-2 w-2 text-white stroke-[3px]" />
                        </div>
                      )}
                      <Icon className={`h-5 w-5 ${active ? 'text-cyan-500' : 'text-rose-400'}`} />
                      <span className="text-xs tracking-wide">{method.name}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Total price and Confirm Button - Ultra luxury shine gradient */}
            <div className="pt-4 border-t border-rose-200/40">
              <div className="flex justify-between items-center mb-4.5 px-1">
                <span className="text-sm text-rose-900/70 font-extrabold uppercase tracking-wider">Tổng thanh toán:</span>
                <span className="text-2xl font-display font-black text-cyan-600 tracking-wide">{formattedPrice(price * quantity)}</span>
              </div>
              <motion.button 
                type="submit" 
                whileHover={isFormValid ? { scale: 1.01, brightness: 1.05 } : {}}
                whileTap={isFormValid ? { scale: 0.99 } : {}}
                className={`w-full py-4 px-6 rounded-2xl font-display font-extrabold uppercase tracking-widest text-sm text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  isFormValid 
                    ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 shadow-rose-500/20 hover:brightness-105 active:scale-[0.98]' 
                    : 'bg-rose-200 text-white cursor-not-allowed opacity-50 shadow-none'
                }`}
                disabled={!isFormValid}
              >
                Xác nhận đặt hàng
              </motion.button>
            </div>
          </motion.form>
        )}

        {phase === 'processing' && (
          <motion.div 
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center space-y-5"
          >
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-2 border-cyan-500/10 flex items-center justify-center bg-gradient-to-tr from-cyan-50/50 to-teal-50/50 shadow-inner">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
              </div>
              <div className="absolute -inset-2 rounded-full bg-cyan-400/10 blur-xl animate-pulse" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-display text-xl font-black text-rose-950">Đang kết nối cổng thanh toán</h4>
              <p className="text-xs text-mist leading-relaxed px-4">Hệ thống đang mã hóa giao dịch và tạo đơn hàng an toàn. Vui lòng không tắt trình duyệt...</p>
            </div>
          </motion.div>
        )}

        {phase === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-6 text-center space-y-6"
          >
            {/* Animated Tick Icon - Stunning Emerald glowing ring */}
            <div className="relative">
              <motion.div 
                className="h-24 w-24 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/25 border border-emerald-300/40"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.12, 1] }}
                transition={{ duration: 0.6, type: 'spring' }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  <Check className="h-12 w-12 text-white stroke-[3.5px]" />
                </motion.div>
              </motion.div>
              <div className="absolute -inset-2 rounded-full bg-emerald-400/20 blur-xl animate-pulse -z-10" />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-display text-2xl font-black text-emerald-500 tracking-wide">Đặt hàng thành công!</h4>
              <p className="text-xs text-mist leading-relaxed px-2">Cảm ơn bạn đã lựa chọn chăm sóc da cùng Beauty AI. Đơn hàng của bạn đã được kiểm duyệt và chuẩn bị giao hàng.</p>
            </div>

            {/* Receipt Summary Card - High-end Voucher styling */}
            <div className="w-full text-left rounded-2xl border border-rose-200/50 bg-gradient-to-br from-rose-50/40 to-white/80 p-5 space-y-3.5 text-xs text-rose-950 shadow-sm backdrop-blur-md relative overflow-hidden">
              <div className="absolute -right-4 -top-4 h-16 w-16 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 rounded-full" />
              <div className="flex justify-between border-b border-rose-200/30 pb-2.5">
                <span className="text-rose-900/60 font-extrabold uppercase tracking-wider">Mã đơn hàng:</span>
                <span className="font-mono font-black text-cyan-600 text-sm tracking-wider">{orderId}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-rose-900/60 font-semibold">Sản phẩm:</span>
                  <span className="font-extrabold max-w-[200px] truncate text-right text-rose-950">{product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-900/60 font-semibold">Số lượng:</span>
                  <span className="font-extrabold text-rose-950">{quantity} sản phẩm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-900/60 font-semibold">Phương thức:</span>
                  <span className="uppercase font-extrabold text-rose-900">{paymentMethod === 'cod' ? 'COD (Tiền mặt)' : paymentMethod}</span>
                </div>
              </div>
              <div className="flex justify-between border-t border-rose-200/30 pt-3.5 font-semibold items-center">
                <span className="text-rose-950 font-black text-xs uppercase tracking-wider">Tổng số tiền:</span>
                <span className="text-lg font-display font-black text-cyan-600 tracking-wide">{formattedPrice(price * quantity)}</span>
              </div>
              <div className="text-[10px] text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 mt-3 shadow-inner">
                <Truck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="font-medium">Hàng chuẩn bị được chuyển tới bưu cục vận chuyển. Dự kiến giao hàng trong 2 - 3 ngày làm việc.</span>
              </div>
            </div>

            <Button onClick={onClose} className="w-full justify-center mt-2 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-extrabold tracking-widest shadow-md">
              Đóng và tiếp tục
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
