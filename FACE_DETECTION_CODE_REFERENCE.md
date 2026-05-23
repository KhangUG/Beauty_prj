# 📖 Quick Reference - Code Snippets

## Face Detection Service

### Localização
```
src/features/ai-scan/services/face-detection-service.ts
```

### Uso Básico
```typescript
import { validateImage } from '@/features/ai-scan/services/face-detection-service'

// Validar uma imagem
const result = await validateImage(imageUrl)
if (result.isValid) {
  // Prosseguir com processamento
} else {
  // Mostrar erro: result.message
}
```

### Resultado
```typescript
{
  isValid: boolean,
  message?: string  // Mensagem de erro se inválido
}
```

---

## Face Validation Hook

### Localização
```
src/features/ai-scan/hooks/useFaceValidation.ts
```

### Uso no Componente
```typescript
import { useFaceValidation } from '@/features/ai-scan/hooks/useFaceValidation'

export function MeuComponente() {
  const { 
    validationState,      // 'idle' | 'checking' | 'valid' | 'invalid'
    validationError,      // string | null
    validateAndSetImage,  // função
    resetValidation       // função
  } = useFaceValidation()

  const handleImageChange = async (imageUrl: string) => {
    const isValid = await validateAndSetImage(imageUrl)
    if (isValid) {
      // Fazer algo
    }
  }

  return (
    <div>
      {validationState === 'checking' && <p>Checking...</p>}
      {validationError && <p className="error">{validationError}</p>}
    </div>
  )
}
```

---

## MakeupInputPanel Integration

### Localização
```
src/features/ai-scan/components/MakeupInputPanel.tsx
```

### Estados Adicionados
```typescript
const [isValidated, setIsValidated] = useState(false)
const { validationState, validationError, validateAndSetImage, resetValidation } = useFaceValidation()
```

### Handler de Seleção de Imagem
```typescript
const handleImageSelection = async (imageUrl: string) => {
  setIsValidated(false)
  resetValidation()
  
  const isValid = await validateAndSetImage(imageUrl)
  if (isValid) {
    setIsValidated(true)
    onImageChange(imageUrl)  // Callback original
  }
}
```

### Condição do Botão
```typescript
<Button 
  disabled={!imageSource || !isValidated || isProcessing || validationState === 'checking'}
>
  {validationState === 'checking' ? 'Đang kiểm tra...' : isProcessing ? 'Processing...' : 'Start Processing'}
</Button>
```

### Mensagens de Status
```typescript
{validationState === 'checking' && (
  <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 py-3 text-sm text-blue-700">
    <Loader className="h-4 w-4 animate-spin" />
    Đang kiểm tra ảnh...
  </div>
)}

{validationError && (
  <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
    <div>
      <p className="font-medium">Không thể sử dụng ảnh này</p>
      <p className="mt-1 text-red-600">{validationError}</p>
    </div>
  </div>
)}
```

---

## Configurações & Customização

### Mudar Mensagem de Erro
**Em**: `src/features/ai-scan/services/face-detection-service.ts` (linha 58-62)
```typescript
if (!result.hasFace) {
  return {
    isValid: false,
    message: 'Sua mensagem personalizada aqui',  // ← Mudar isto
  }
}
```

### Ajustar URL do CDN (se necessário)
**Em**: `src/features/ai-scan/services/face-detection-service.ts` (linha 22)
```typescript
const MODEL_URL = 'https://seu-cdn.com/modelo-weights'  // ← URL customizado
```

### Desabilitar Validação para Certos Casos
**Em**: `src/features/ai-scan/components/MakeupInputPanel.tsx`
```typescript
const handleImageSelection = async (imageUrl: string) => {
  // Exemplo: pular validação para amostras
  if (isFromSample) {
    setIsValidated(true)
    onImageChange(imageUrl)
    return
  }
  
  // Validação normal para o resto
  setIsValidated(false)
  resetValidation()
  const isValid = await validateAndSetImage(imageUrl)
  if (isValid) {
    setIsValidated(true)
    onImageChange(imageUrl)
  }
}
```

---

## Estados e Tipos

### ImageValidationState
```typescript
type ImageValidationState = 'idle' | 'checking' | 'valid' | 'invalid'
```

### FaceDetectionResult
```typescript
type FaceDetectionResult = {
  hasFace: boolean
  detections: number
  error?: string
}
```

### ValidationResult
```typescript
type ValidationResult = {
  isValid: boolean
  message?: string  // Erro em vietnamita
}
```

---

## Fluxo de Dados

### Entrada
```
imageSource: string  // URL ou data URL de imagem
```

### Processamento
```typescript
// No service
1. Carregar modelo face-api.js
2. Criar elemento Image
3. Executar detectFaces()
4. Contar detecções
5. Retornar { isValid, message? }

// No hook
1. Receber resultado do service
2. Atualizar validationState
3. Retornar para componente

// No componente
1. Mostrar UI feedback (loader, erro, etc)
2. Habilitar/desabilitar botão
3. Chamar callback se válido
```

### Saída
```typescript
{
  isValid: true | false,
  message?: "Não há rosto..." // Se inválido
}
```

---

## Imports Necessários

### Service
```typescript
import * as faceapi from 'face-api.js'
```

### Hook
```typescript
import { useCallback, useState } from 'react'
import { validateImage } from '@/features/ai-scan/services/face-detection-service'
```

### Component
```typescript
import { useFaceValidation } from '@/features/ai-scan/hooks/useFaceValidation'
import { Loader, AlertCircle } from 'lucide-react'
```

---

## Console Debugging

### Ver informações de detecção
```javascript
// No console do browser
localStorage.setItem('DEBUG_FACE_DETECTION', 'true')

// Depois, no service:
if (localStorage.getItem('DEBUG_FACE_DETECTION')) {
  console.log('Faces detected:', detections.length)
}
```

### Verificar se modelo carregou
```javascript
// No console
typeof faceapi !== 'undefined' ? 'Carregado ✓' : 'Não carregado ✗'
```

### Ver requisições do CDN
```
1. Abrir DevTools (F12)
2. Ir para aba "Network"
3. Selecionar uma imagem
4. Ver requisições para cdn.jsdelivr.net
```

---

## Casos de Uso Comuns

### 1. Validar múltiplas imagens em sequência
```typescript
const images = [url1, url2, url3]

for (const imageUrl of images) {
  const isValid = await validateAndSetImage(imageUrl)
  if (isValid) {
    processImage(imageUrl)
  }
}
```

### 2. Validação com timeout
```typescript
const validateWithTimeout = async (imageUrl: string, timeoutMs = 5000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  )
  
  return Promise.race([
    validateAndSetImage(imageUrl),
    timeoutPromise
  ])
}
```

### 3. Revalidar imagem
```typescript
const revalidateImage = async () => {
  resetValidation()
  const isValid = await validateAndSetImage(currentImage)
  setIsValidated(isValid)
}
```

### 4. Batch validation com progress
```typescript
const validateBatch = async (images: string[]) => {
  const results: boolean[] = []
  
  for (let i = 0; i < images.length; i++) {
    const isValid = await validateAndSetImage(images[i])
    results.push(isValid)
    
    // Progress callback
    onProgress((i + 1) / images.length)
  }
  
  return results
}
```

---

## Tratamento de Erros

### Try-Catch Pattern
```typescript
try {
  const isValid = await validateAndSetImage(imageUrl)
  if (isValid) {
    // Success path
  }
} catch (error) {
  console.error('Validation error:', error)
  showErrorMessage('Falha ao validar imagem')
}
```

### Error Messages em Vietnamita
```typescript
const errorMessages: Record<string, string> = {
  'no_face': 'Không tìm thấy khuôn mặt, vui lòng chụp lại rõ hơn',
  'model_error': 'Không thể tải mô hình AI',
  'image_error': 'Không thể tải ảnh, vui lòng kiểm tra URL',
  'network_error': 'Lỗi kết nối mạng',
}
```

---

## Performance Tips

### Cache do Modelo
```typescript
// Automaticamente cached no localStorage após primeiro carregamento
// Para limpar:
localStorage.clear()

// Para verificar:
localStorage.getItem('face-api-models-loaded') // true/false
```

### Lazy Loading
```typescript
// Modelo carrega só quando necessário (primeira seleção de imagem)
// Não afeta initial page load
```

### Memory Management
```typescript
// Se trabalhar com muitas imagens:
const { resetValidation } = useFaceValidation()

useEffect(() => {
  return () => {
    resetValidation()  // Limpeza ao desmontar
  }
}, [resetValidation])
```

---

## Atalhos de Teclado (Convenções)

```typescript
// Para adicionar suporte a teclado no futuro:
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    if (isValidated && !isProcessing) {
      onProcess()
    }
  }
  
  if (e.key === 'Escape') {
    resetValidation()
    setIsValidated(false)
  }
}
```

---

## Checklist para Usar em Outro Componente

- [ ] Importar `useFaceValidation` hook
- [ ] Chamar hook no componente
- [ ] Desestruturar as funções/estados necessários
- [ ] Chamar `validateAndSetImage()` ao selecionar imagem
- [ ] Verificar `isValid` antes de processar
- [ ] Mostrar `validationError` se houver
- [ ] Mostrar `validationState` para feedback visual
- [ ] Chamar `resetValidation()` ao limpar

---

**Última atualização**: 2024
**Versão**: 1.0.0
