<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { designState } from '../store'
import * as htmlToImage from 'html-to-image'

const exportArea = ref(null)
const previewScaler = ref(null)
const scaleFactor = ref(1)
const previewImageBase64 = ref('')

const updateScale = () => {
  if (previewScaler.value && previewScaler.value.parentElement) {
    const parentWidth = previewScaler.value.parentElement.clientWidth
    const parentHeight = previewScaler.value.parentElement.clientHeight
    
    // We want a 4:5 aspect ratio (width:height)
    // 1080 / 1350 = 0.8
    const targetRatio = 4 / 5
    
    // Calculate max dimensions applying padding/margins (32px padding from parent)
    const availableWidth = parentWidth - 32
    const availableHeight = parentHeight - 32
    
    let finalWidth = availableWidth
    let finalHeight = finalWidth / targetRatio
    
    // If the height exceeds available space, constrain by height instead
    if (finalHeight > availableHeight) {
      finalHeight = availableHeight
      finalWidth = finalHeight * targetRatio
    }
    
    // Explicitly set the wrapper size to prevent CSS flexbox fighting the scale
    previewScaler.value.style.width = `${finalWidth}px`
    previewScaler.value.style.height = `${finalHeight}px`
    
    // Set scale factor for the 1080px export canvas to fit exactly inside
    scaleFactor.value = finalWidth / 1080
  }
}

let resizeObserver = null

const loadBase64Image = async (url) => {
  if (!url) {
    previewImageBase64.value = ''
    return
  }
  
  if (url.startsWith('data:image')) {
    previewImageBase64.value = url
    return
  }
  
  try {
    const proxyUrl = 'https://wsrv.nl/?url=' + encodeURIComponent(url)
    const response = await fetch(proxyUrl)
    const blob = await response.blob()
    const reader = new FileReader()
    reader.onloadend = () => {
      previewImageBase64.value = reader.result
    }
    reader.readAsDataURL(blob)
  } catch (err) {
    console.error('Failed to load base64 image', err)
    previewImageBase64.value = ''
  }
}

watch(() => designState.imageURL, (newUrl) => {
  loadBase64Image(newUrl)
}, { immediate: true })

const handleDownload = async () => {
  if (!exportArea.value) return
  
  try {
    // 1. Save original transform
    const originalTransform = exportArea.value.style.transform;
    
    // 2. Temporarily set transform to none to fix html-to-image clipping bug
    exportArea.value.style.transform = 'none';
    
    // Give the DOM a tiny fraction of a second to recalculate before capturing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const blob = await htmlToImage.toBlob(exportArea.value, {
      quality: 0.95,
      cacheBust: true,
      pixelRatio: 2 // Force 2x resolution for HD export
    })
    
    // 3. Immediatley restore the original scale transform
    exportArea.value.style.transform = originalTransform;
    
    const fileName = `LazarusReport-${Date.now()}.png`
    
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = objectUrl
    link.click()
    
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 1000)
  } catch (err) {
    console.error('Export failed', err)
    
    // Ensure we restore transform even if it fails
    if (exportArea.value) {
      exportArea.value.style.transform = `scale(${scaleFactor.value})`;
    }
    
    alert('Failed to export image. Make sure images allow CORS.')
  }
}

onMounted(() => {
  window.addEventListener('lazarus-download', handleDownload)
  
  if (previewScaler.value) {
    resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(previewScaler.value)
    updateScale()
  }
})

onUnmounted(() => {
  window.removeEventListener('lazarus-download', handleDownload)
  if (resizeObserver) resizeObserver.disconnect()
})

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const startDrag = (e) => {
  // Prevent default to stop image ghost dragging
  if (e.type === 'mousedown') {
    e.preventDefault()
  }
  isDragging.value = true
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  dragStart.value = {
    x: clientX,
    y: clientY,
    initLogoX: designState.logoX,
    initLogoY: designState.logoY
  }
  
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', endDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('touchend', endDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  
  // Prevent scrolling while dragging on touch
  if (e.cancelable) e.preventDefault()
  
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  const dx = clientX - dragStart.value.x
  const dy = clientY - dragStart.value.y
  
  // Apply movement to the logo, scaled reversely by the preview scaleFactor 
  // so that the mouse pointer sticks exactly to the logo while dragging.
  const newX = dragStart.value.initLogoX + (dx / scaleFactor.value)
  const newY = dragStart.value.initLogoY + (dy / scaleFactor.value)
  
  // Keep within bounds of 1080x1350 canvas
  const maxX = 1080 - 20
  const maxY = 1350 - 20
  
  designState.logoX = Math.max(0, Math.min(newX, maxX))
  designState.logoY = Math.max(0, Math.min(newY, maxY))
}

const endDrag = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', endDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', endDrag)
}

</script>

<template>
  <div class="w-full h-full flex items-center justify-center p-4 md:p-8 overflow-hidden">
    <!-- Scaler container using pure Javascript ResizeObserver -->
    <div 
      ref="previewScaler"
      class="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden bg-zinc-900 border border-zinc-800 rounded-sm shrink-0"
    >
      
      <!-- Actual 1080x1350 export area -->
      <div 
        ref="exportArea"
        id="export-area"
        class="absolute top-0 left-0 bg-zinc-900 overflow-hidden"
        :style="{ width: '1080px', height: '1350px', transform: `scale(${scaleFactor})`, transformOrigin: 'top left' }"
      >
        <div class="absolute inset-0" :style="{ backgroundColor: designState.overlayColor }">
          <img 
            v-if="previewImageBase64" 
            :src="previewImageBase64" 
            class="w-full h-full object-cover mix-blend-luminosity" 
            :style="{
              objectPosition: `${designState.imagePositionX}% ${designState.imagePositionY}%`,
              transform: `scale(${designState.imageSize / 100})`,
              opacity: designState.imageOpacity / 100,
              filter: `brightness(${designState.imageBrightness}%) contrast(${designState.imageContrast}%)`
            }"
          />
          <div v-else class="w-full h-full bg-zinc-900 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-black" :style="{ opacity: designState.imageOpacity / 100 }"></div>
          
          <!-- Ultra smooth premium gradient overlay: double layered for maximum text legibility without ruining image -->
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" :style="{ opacity: designState.overlayOpacity / 100, height: '70%', top: 'auto', bottom: 0 }"></div>
          <div class="absolute inset-x-0 bottom-[140px] h-[600px] bg-gradient-to-t" :style="{ opacity: designState.overlayOpacity / 100, backgroundImage: `linear-gradient(to top, ${designState.overlayColor}99, transparent)` }"></div>
        </div>

        <!-- Custom Draggable Logo -->
        <div 
          v-if="designState.logoBase64" 
          class="absolute z-30 cursor-move group" 
          :style="{ 
            left: `${designState.logoX}px`, 
            top: `${designState.logoY}px`,
            transition: isDragging ? 'none' : 'all 0.1s ease-out'
          }"
          @mousedown="startDrag"
          @touchstart="startDrag"
        >
          <!-- Hover indicator outline to show it's draggable -->
          <div class="absolute inset-[-10px] border-2 border-blue-500/0 group-hover:border-blue-500/50 rounded-lg transition-colors pointer-events-none"></div>
          
          <img 
            :src="designState.logoBase64" 
            :style="{ maxHeight: `${designState.logoSize}px` }" 
            class="object-contain drop-shadow-2xl pointer-events-none select-none" 
            draggable="false"
          />
        </div>

        <!-- Text Content Area: pb-[175px] strictly enforces the 1:1 safe zone bottom -->
        <div class="absolute inset-0 px-16 pt-12 flex flex-col justify-end z-10 pb-[175px]">
          
          <div v-if="designState.source" class="mb-6 inline-flex">
            <!-- Modern Premium Pill Badge -->
            <span 
              class="px-5 py-2 rounded-full text-white font-black tracking-[0.2em] uppercase text-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-sm"
              :style="{ backgroundColor: designState.accentColor }"
            >
              {{ designState.source }}
            </span>
          </div>
          
          <h1 
            class="font-black text-white uppercase leading-[1.05] tracking-tight mb-6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]" 
            :style="{ fontSize: `${designState.fontSizeTitle}px`, fontFamily: 'Inter, Roboto, sans-serif' }"
          >
            {{ designState.title || 'BREAKING NEWS TITLE GOES HERE. IMPACTFUL AND DIRECT.' }}
          </h1>
          
          <!-- Decorative separating line to add a professional touch -->
          <div class="w-24 h-1.5 rounded-full mb-6 shadow-lg shadow-black/50" :style="{ backgroundColor: designState.accentColor }"></div>
          
          <p 
            class="text-zinc-200 font-medium leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] max-w-[95%]"
            :style="{ fontSize: `${designState.fontSizeDesc}px`, fontFamily: 'Inter, Roboto, sans-serif' }"
          >
            {{ designState.description || 'This provides more context about the news article. It is highly legible against the ultra-dark gradient background, using a tight typographic hierarchy to ensure professional presentation.' }}
          </p>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
