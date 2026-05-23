# Face Detection Testing Guide

## Testing the Implementation

### Manual Testing Steps

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to AI Scan page** and test the following scenarios:

### Test Case 1: Valid Image (Face Detected) ✓
- Upload/select an image with a clear face
- Expected behavior:
  - Shows "Đang kiểm tra ảnh..." (Checking image...)
  - After 1-2 seconds: status disappears
  - "Start Processing" button becomes enabled
  - Image preview displays

### Test Case 2: Invalid Image (No Face) ✗
- Upload/select an image without a face (landscape, object, etc.)
- Expected behavior:
  - Shows "Đang kiểm tra ảnh..." (Checking image...)
  - After 1-2 seconds: error message appears
  - Error text: "Không tìm thấy khuôn mặt, vui lòng chụp lại rõ hơn"
  - "Start Processing" button remains disabled
  - User can select another image

### Test Case 3: Multiple Faces
- Upload/select image with multiple faces
- Expected behavior:
  - Should pass validation (detects at least 1 face)
  - Proceeding should work normally

### Test Case 4: Invalid Image URL
- Enter invalid/broken image URL
- Expected behavior:
  - Error message after validation
  - "Start Processing" remains disabled

### Test Case 5: Sample Images
- Click on the pre-loaded sample selfies
- Expected behavior:
  - Validation should pass (pre-vetted images)
  - "Start Processing" should be enabled

## Debugging

### Check Console Logs
```javascript
// In browser console, you should see:
// "Face detection models loaded successfully"
// "Detected 1 face" (when validation passes)
```

### Common Issues

1. **Models won't load**
   - Check browser console for CORS errors
   - Verify CDN is accessible: cdn.jsdelivr.net
   - Try refreshing the page

2. **Validation takes too long**
   - Face detection usually takes 1-2 seconds
   - Large images may take slightly longer
   - This is expected behavior

3. **False negatives (Face not detected)**
   - Ensure face is clearly visible
   - Good lighting helps with detection
   - Try a different angle/position

## Performance Metrics to Monitor

- **Model loading time**: First use (cached after)
- **Validation time per image**: 1-2 seconds typical
- **Memory usage**: ~50-100MB (reasonable for face detection)

## Future Improvements

1. **Caching**: Cache models after first load (current: done via localStorage)
2. **Multiple models**: Add fallback to full FaceLandmarks detection
3. **User feedback**: Show face detection progress (bounding box)
4. **Batch processing**: Validate multiple images at once
5. **Offline mode**: Pre-download models with app

## Testing with Different Image Sources

```typescript
// Test URL-based image
https://example.com/selfie.jpg

// Test uploaded file
File dialog → select image

// Test sample images
Click on 6 pre-loaded samples

// Test with problematic images
- Very small faces
- Multiple faces
- Side profile faces
- Partially visible faces
- Low quality/pixelated
```

## Automated Testing (Optional)

To add automated tests:

```typescript
// In tests/face-detection.test.ts
import { validateImage } from '@/features/ai-scan/services/face-detection-service'

describe('Face Detection', () => {
  it('should detect faces in valid images', async () => {
    const result = await validateImage('path/to/valid/image.jpg')
    expect(result.isValid).toBe(true)
  })

  it('should reject images without faces', async () => {
    const result = await validateImage('path/to/landscape.jpg')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('Không tìm thấy')
  })
})
```

## Browser DevTools Tips

1. **Disable Cache** during testing to force fresh model loading
2. **Throttle Network** to 3G to test with slower connections
3. **Check Memory** in Performance tab for memory usage
4. **Monitor Network** tab to see CDN requests
