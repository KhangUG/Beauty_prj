import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useToast } from '@/shared/hooks/useToast'
import { supabase } from '@/services/supabase/client'

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  
  // State cho ảnh đại diện
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url ?? null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setPreviewUrl(URL.createObjectURL(file)) // Hiển thị preview tức thì
    }
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    
    try {
      let finalAvatarUrl = profile?.avatar_url

      // 1. Nếu có file mới thì upload lên Storage
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
        finalAvatarUrl = data.publicUrl
      }

      // 2. Cập nhật thông tin vào bảng profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section-shell pb-16">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border border-rose-100/60 bg-white/85">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-600">Profile</p>
          <h1 className="mt-2 font-display text-3xl text-pearl">Account & Subscription</h1>
        </Card>

        <div className="grid gap-4 md:grid-cols-[1.1fr,0.9fr]">
          <Card className="border border-rose-100/60 bg-white/85">
            <h2 className="font-display text-2xl text-pearl">Profile details</h2>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-rose-600">Email</label>
                <Input className="mt-2 bg-gray-50 cursor-not-allowed" value={user?.email ?? ''} disabled />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>

              {/* Upload Avatar Area */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-rose-600">Avatar</label>
                <div className="mt-2 flex items-center gap-4">
                  <img 
                    src={previewUrl || '/default-avatar.png'} 
                    alt="Avatar" 
                    className="h-16 w-16 rounded-full object-cover border border-rose-200"
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange} 
                    accept="image/*"
                    className="text-sm text-mist file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={loading} className="mt-2">
                {loading ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </Card>

          {/* Cột Subscription */}
          <Card className="border border-rose-100/60 bg-white/85">
            <h2 className="font-display text-2xl text-pearl">Subscription</h2>
            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-mist">Current Plan</span>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-bold uppercase text-rose-700">
                  {profile?.subscription_tier ?? 'free'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-mist">Credits</span>
                  <span className="font-bold text-pearl">{profile?.try_on_credits ?? 0}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-rose-100/50">
                  <div 
                    className="h-full bg-cyan transition-all duration-500" 
                    style={{ width: `${Math.min((profile?.try_on_credits ?? 0) * 10, 100)}%` }} 
                  />
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/checkout"><Button className="w-full">Manage plan</Button></Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

