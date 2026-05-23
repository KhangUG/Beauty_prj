import * as faceapi from 'face-api.js'

let modelsLoaded = false

export type FaceDetectionResult = {
  hasFace: boolean
  detections: number
  error?: string
}

/**
 * Load face detection models
 * These models are relatively small and can be loaded on demand
 */
async function loadModels(): Promise<void> {
  if (modelsLoaded) return

  try {
    // Try multiple sources for model weights
    // GitHub raw is most reliable, jsdelivr is CDN cached version
    const modelUrls = [
      'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/',
      'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/',
    ]
    
    let lastError: Error | null = null
    
    for (const MODEL_URL of modelUrls) {
      try {
        console.log(`[FaceDetection] Attempting to load models from: ${MODEL_URL}`)
        
        // Add a timeout to prevent hanging on unresponsive servers
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Load timeout for ${MODEL_URL}`)), 20000)
        )
        
        await Promise.race([
          Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          ]),
          timeoutPromise,
        ])
        
        modelsLoaded = true
        console.log('[FaceDetection] Models loaded successfully from:', MODEL_URL)
        return
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`[FaceDetection] Failed to load from ${MODEL_URL}:`, lastError.message)
        continue
      }
    }
    
    // If all sources fail, provide detailed error
    const errorMsg = `Unable to load face detection models from any source. ${lastError?.message || 'Network error'} Please check your internet connection and try again.`
    console.error('[FaceDetection]', errorMsg)
    throw new Error(errorMsg)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error during model loading'
    console.error('[FaceDetection] Fatal error:', msg)
    throw new Error('Unable to load face detection models. Please refresh and try again.')
  }
}

/**
 * Detect faces in an image
 * @param imageSource - Image URL or data URL
 * @returns Face detection result
 */
export async function detectFaces(imageSource: string): Promise<FaceDetectionResult> {
  try {
    // Load models if not already loaded
    await loadModels()

    // Create image element
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          // Run face detection
          const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
          
          resolve({
            hasFace: detections.length > 0,
            detections: detections.length,
          })
        } catch (error) {
          console.error('Face detection error:', error)
          reject(new Error('Failed to analyze image. Please try a different image.'))
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image. Please check the image URL or try uploading again.'))
      }
      
      img.src = imageSource
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during face detection'
    return {
      hasFace: false,
      detections: 0,
      error: message,
    }
  }
}

/**
 * Validate image before processing
 * Checks if image contains at least one face
 */
export async function validateImage(imageSource: string): Promise<{ isValid: boolean; message?: string }> {
  const result = await detectFaces(imageSource)
  
  if (result.error) {
    return {
      isValid: false,
      message: result.error,
    }
  }
  
  if (!result.hasFace) {
    return {
      isValid: false,
      message: 'Không tìm thấy khuôn mặt, vui lòng chụp lại rõ hơn',
    }
  }
  
  return {
    isValid: true,
  }
}
