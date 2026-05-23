#!/bin/bash
# Quick start guide for Face Detection feature

echo "🎬 Face Detection Feature - Quick Start Guide"
echo "=============================================="
echo ""

echo "✅ Installation Status:"
npm list face-api.js 2>/dev/null | grep face-api || echo "⚠️  Run: npm install face-api.js"
echo ""

echo "📁 Files Created:"
echo "   1. src/features/ai-scan/services/face-detection-service.ts"
echo "   2. src/features/ai-scan/hooks/useFaceValidation.ts"
echo ""

echo "📝 Files Modified:"
echo "   1. src/features/ai-scan/components/MakeupInputPanel.tsx"
echo "   2. package.json (added face-api.js dependency)"
echo ""

echo "🚀 To test the feature:"
echo "   1. npm run dev"
echo "   2. Go to AI Scan page"
echo "   3. Try uploading an image with a face"
echo "   4. Try uploading an image without a face (will show error)"
echo ""

echo "💡 Features:"
echo "   ✓ Automatically validates images when selected"
echo "   ✓ Shows 'Đang kiểm tra ảnh...' status"
echo "   ✓ Displays Vietnamese error messages"
echo "   ✓ Disables 'Start Processing' until image is valid"
echo "   ✓ Works with Upload, URL, and Sample image modes"
echo ""

echo "📖 Documentation:"
echo "   • FACE_DETECTION_IMPLEMENTATION.md - Full feature overview"
echo "   • FACE_DETECTION_TESTING.md - Testing guide"
echo "   • /memories/repo/face-detection-implementation.md - Technical notes"
echo ""

echo "✨ That's it! The feature is ready to use."
