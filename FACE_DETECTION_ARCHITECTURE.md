# Face Detection Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MakeupInputPanel Component               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Upload / URL / Sample Selection                        │ │
│  └────────────────────┬─────────────────────────────────┘ │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ handleImageSelection()                                 │ │
│  │   1. Reset validation state                            │ │
│  │   2. Call validateAndSetImage()                        │ │
│  └────────────────────┬─────────────────────────────────┘ │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │ useFaceValidation Hook       │
         │                              │
         │  validationState: checking   │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────────────────────────┐
         │ face-detection-service.validateImage()           │
         │                                                  │
         │  1. Load TinyFaceDetector model (CDN)           │
         │  2. Create Image element                         │
         │  3. Run detectFaces()                            │
         │  4. Analyze detection results                    │
         │  5. Return { isValid, message? }                │
         └──────────┬─────────────────────────────────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
      ▼             ▼             ▼
   ✅ Valid     ❌ No Face    ⚠️ Error
      │             │             │
      │   Error msg:|   Error msg:|
      │   None      │   "Không tìm" │   "Failed to load"
      │             │             │
      └─────────────┼─────────────┘
                    │
                    ▼
         ┌──────────────────────────────┐
         │ useFaceValidation Updates    │
         │  - validationState           │
         │  - validationError           │
         │  - isValidated flag          │
         └──────────┬───────────────────┘
                    │
                    ▼
         ┌──────────────────────────────┐
         │ MakeupInputPanel Updates UI  │
         │                              │
         │ If Valid:                    │
         │  ✓ Show image preview        │
         │  ✓ Enable "Start Processing" │
         │  ✓ Call onImageChange()      │
         │                              │
         │ If Invalid:                  │
         │  ✗ Show error message        │
         │  ✗ Keep button disabled      │
         │  ✗ Allow user to retry       │
         └──────────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AIScanPage                              │
│  (passes onImageChange callback)                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ onImageChange
                         │ onEffectsChange
                         │ onProcess
                         ▼
     ┌───────────────────────────────────────┐
     │     MakeupInputPanel                  │
     │                                       │
     │  State:                               │
     │  • mode (upload/url/sample)           │
     │  • imageSource                        │
     │  • isValidated ← NEW                  │
     │  • urlInput                           │
     │  • openCategory                       │
     │                                       │
     │  Hooks:                               │
     │  • useFaceValidation() ← NEW          │
     │  • useMemo                            │
     │  • useState                           │
     └──────────────┬────────────────────────┘
                    │
                    ├─ Uses hook for validation
                    │
                    ▼
     ┌──────────────────────────────────┐
     │ useFaceValidation Hook           │
     │                                  │
     │ State:                           │
     │ • validationState                │
     │ • validationError                │
     │                                  │
     │ Functions:                       │
     │ • validateAndSetImage()          │
     │ • resetValidation()              │
     └──────────────┬───────────────────┘
                    │
                    ▼
     ┌──────────────────────────────────────┐
     │ face-detection-service               │
     │                                      │
     │ • detectFaces(imageSource)           │
     │ • validateImage(imageSource)         │
     │ • loadModels()                       │
     │                                      │
     │ Dependencies:                        │
     │ • face-api.js (TinyFaceDetector)    │
     │ • CDN: cdn.jsdelivr.net              │
     └──────────────────────────────────────┘
```

## Data Flow

```
INPUT:
  imageSource: string (URL or data URL)

VALIDATION PROCESS:
  1. imageSource → detectFaces()
  2. Fetch image, load model
  3. Run TinyFaceDetector
  4. Count detected faces
  5. Return { hasFace, detections, error? }

OUTPUT:
  {
    isValid: boolean,
    message?: string  // Error message if invalid
  }

THEN:
  - Update validationState (idle→checking→valid/invalid)
  - Update validationError (if any)
  - Set isValidated flag (true if valid)
  - Trigger UI update
  - Call onImageChange() (if valid)
```

## State Machine Diagram

```
               ┌─────────┐
               │ idle    │  (initial state)
               └────┬────┘
                    │
                    │ handleImageSelection()
                    ▼
               ┌──────────┐
               │ checking │  (validating image)
               └────┬─────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
    ┌──────┐              ┌────────┐
    │valid │              │invalid │
    └──┬───┘              └───┬────┘
       │                      │
       │ onImageChange()      │ validationError shown
       │ isValidated = true   │ isValidated = false
       │                      │
       └──────────┬───────────┘
                  │
                  │ resetValidation() or new image
                  │ (user selects different image)
                  │
                  ▼
               ┌─────────┐
               │idle/new │  (ready for next image)
               └─────────┘
```

## UI Feedback Timeline

```
Timeline                 UI State                    User Feedback
─────────────────────────────────────────────────────────────────────

T=0s
│ User selects image
│                        Show: "Đang kiểm tra..."   Loading...
│

T=1-2s
│ Model loaded & running
│                        Show: Spinner icon         Please wait...
│

T=2s
├─ Face detected ──────> Hide checking, show image  ✓ Ready!
│                        Button: ENABLED            Click to process
│
├─ Face NOT detected ──> Hide checking, show error  ⚠️ Error!
│                        "Không tìm thấy..."        Try again
│                        Button: DISABLED
│
└─ Error occurred ─────> Hide checking, show error  ❌ Failed
                         Technical error message     Retry
                         Button: DISABLED
```

## Integration Points

```
AIScanPage
   ↓
   └── MakeupInputPanel
        ├── useFaceValidation Hook
        │    └── face-detection-service
        │         └── face-api.js (TinyFaceDetector)
        │              └── CDN Model Download
        │
        ├── UI Components
        │    ├── Loader icon (during checking)
        │    ├── AlertCircle icon (on error)
        │    ├── Status message (Vietnamese)
        │    └── Disabled button state
        │
        └── Event Handlers
             ├── handleImageSelection()
             ├── handleFile() - file upload
             └── URL button click
```

## Performance Timeline

```
User Action                 Time        What's Happening
──────────────────────────────────────────────────────────

Select image (first time)    0ms        Check validation state
                            300ms       Fetch model from CDN
                           1200ms       Model downloaded, analysis starts
                           2000ms       Detection complete, UI updates

Select image (next time)     0ms        Check validation state
                           1000ms       Model cached, analysis starts
                           2000ms       Detection complete, UI updates

Select sample image         1000ms       Instant validation (pre-approved)
                           1100ms       UI updates
```

## Security Considerations

```
Image Validation Process:
  1. Image loaded on client-side only
  2. No image data sent until validation passes
  3. Model inference happens locally (JavaScript)
  4. Only validated imageSource passed to parent
  5. No network requests until user confirms
```
