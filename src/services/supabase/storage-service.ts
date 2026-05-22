import { supabase } from '@/services/supabase/client'

const SCAN_BUCKET = 'scan-images'
const AVATAR_BUCKET = 'avatars'

function toStorageError(error: { message?: string; statusCode?: string }, fallback: string) {
  const message = error.message ?? fallback
  if (message.includes('Bucket not found') || error.statusCode === '404') {
    throw new Error(
      'Bucket "avatars" chưa tồn tại trên Supabase. Vào Supabase → SQL Editor, chạy file supabase/sql/004_avatars_storage.sql (hoặc tạo bucket "avatars" public trong Storage).',
    )
  }
  throw new Error(message)
}

export const storageService = {
  async uploadScanImage(file: File, fileName: string) {
    const { data, error } = await supabase.storage.from(SCAN_BUCKET).upload(fileName, file, {
      upsert: true,
    })

    if (error) throw error
    return data
  },

  getPublicImageUrl(path: string) {
    return supabase.storage.from(SCAN_BUCKET).getPublicUrl(path).data.publicUrl
  },

  async uploadAvatar(userId: string, file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg'
    const path = `${userId}/avatar.${safeExtension === 'jpeg' ? 'jpg' : safeExtension}`

    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type,
    })

    if (error) toStorageError(error, 'Could not upload avatar')
    return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
  },
}
