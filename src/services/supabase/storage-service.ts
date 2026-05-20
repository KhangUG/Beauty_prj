import { supabase } from '@/services/supabase/client'

const SCAN_BUCKET = 'scan-images'

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
}
