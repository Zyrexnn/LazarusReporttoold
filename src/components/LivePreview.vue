<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { designState } from '../store'
import * as htmlToImage from 'html-to-image'
import * as Mp4Muxer from 'mp4-muxer'

const exportArea = ref(null)
const previewScaler = ref(null)
const bgVideoElement = ref(null) // New ref for video sync
const scaleFactor = ref(1)
const previewImageBase64 = ref('')

// Video export state
const videoProgress = ref(1)
const isExportVideoProcess = ref(false)
const exportProgressText = ref('')

const updateScale = () => {
  if (previewScaler.value && previewScaler.value.parentElement) {
    const parentWidth = previewScaler.value.parentElement.clientWidth
    const parentHeight = previewScaler.value.parentElement.clientHeight
    
    const targetRatio = 4 / 5
    const availableWidth = parentWidth - 32
    const availableHeight = parentHeight - 32
    
    let finalWidth = availableWidth
    let finalHeight = finalWidth / targetRatio
    
    if (finalHeight > availableHeight) {
      finalHeight = availableHeight
      finalWidth = finalHeight * targetRatio
    }
    
    previewScaler.value.style.width = `${finalWidth}px`
    previewScaler.value.style.height = `${finalHeight}px`
    
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

const getAnimatedStyle = (type) => {
  const t = videoProgress.value;
  const MathMax = Math.max;
  
  // Easing out cubic
  const easeOut = (val) => 1 - Math.pow(1 - val, 3);
  
  switch(type) {
    case 'bgImage':
      const initialScale = designState.imageSize / 100;
      return {
        objectPosition: `${designState.imagePositionX}% ${designState.imagePositionY}%`,
        transform: `scale(${initialScale + (t * 0.15)})`, // Ken Burns (linear slow zoom)
        opacity: designState.imageOpacity / 100,
        filter: `brightness(${designState.imageBrightness}%) contrast(${designState.imageContrast}%)`
      }
    case 'logo':
      const logoT = MathMax(0, (t - 0.1) / 0.9);
      const logoE = easeOut(logoT);
      const scaleStr = `scale(${0.8 + (0.2 * logoE)})`;
      const transStr = `translateY(${20 * (1 - logoE)}px)`;
      return {
         opacity: logoE,
         transform: isDragging.value ? 'none' : `${scaleStr} ${transStr}`,
         left: `${designState.logoX}px`, 
         top: `${designState.logoY}px`,
         // We let Vue inline styles handle it directly since state changes linearly
      }
    case 'badge':
      const badgeT = MathMax(0, (t - 0.2) / 0.8);
      const badgeE = easeOut(badgeT);
      return {
         opacity: badgeE,
         transform: `translateY(${30 * (1 - badgeE)}px)`,
         backgroundColor: designState.accentColor
      }
    case 'title':
      const titleT = MathMax(0, (t - 0.3) / 0.7);
      const titleE = easeOut(titleT);
      return {
         opacity: titleE,
         transform: `translateY(${40 * (1 - titleE)}px)`,
         fontSize: `${designState.fontSizeTitle}px`, 
         fontFamily: 'Inter, Roboto, sans-serif'
      }
    case 'line':
      const lineT = MathMax(0, (t - 0.4) / 0.6);
      const lineE = Math.pow(lineT, 2); 
      return {
         transform: `scaleX(${lineE})`,
         transformOrigin: 'left',
         opacity: lineT > 0 ? 1 : 0,
         backgroundColor: designState.accentColor
      }
    case 'desc':
      const descT = MathMax(0, (t - 0.5) / 0.5);
      const descE = easeOut(descT);
      return {
         opacity: descE,
         transform: `translateY(${20 * (1 - descE)}px)`,
         fontSize: `${designState.fontSizeDesc}px`, 
         fontFamily: 'Inter, Roboto, sans-serif'
      }
  }
}

const handleDownload = async () => {
  if (!exportArea.value) return
  if (isExportVideoProcess.value) return
  
  try {
    const originalTransform = exportArea.value.style.transform;
    exportArea.value.style.transform = 'none';
    videoProgress.value = 1; // Ensure full layout
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const blob = await htmlToImage.toBlob(exportArea.value, {
      quality: 0.95,
      cacheBust: true,
      pixelRatio: 2
    })
    
    exportArea.value.style.transform = originalTransform;
    const fileName = `LazarusReport-${Date.now()}.png`
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = objectUrl
    link.click()
    
    setTimeout(() => { URL.revokeObjectURL(objectUrl) }, 1000)
  } catch (err) {
    console.error('Export failed', err)
    if (exportArea.value) {
      exportArea.value.style.transform = `scale(${scaleFactor.value})`;
    }
    alert('Failed to export image.')
  }
}

const handleVideoDownload = async () => {
  if (!exportArea.value) return;
  if (isExportVideoProcess.value) return;
  
  try {
    isExportVideoProcess.value = true;
    designState.isExportingVideo = true;

    // Give Vue time to remove the scale factor from the template bindings
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (typeof VideoEncoder === 'undefined') {
       throw new Error("VideoEncoder API not supported by your browser. Please use Chrome/Edge/Brave.");
    }

    exportProgressText.value = 'Preparing Audio...';
    // Audio Extraction
    let audioBuffer = null;
    if (designState.videoBgURL) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
            const res = await fetch(designState.videoBgURL);
            const arrayBuf = await res.arrayBuffer();
            audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
        } catch (e) {
            console.warn("Could not decode audio:", e);
        }
    }

    let muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width: 1080,
        height: 1350,
      },
      audio: audioBuffer ? {
        codec: 'aac',
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate
      } : undefined,
      fastStart: 'in-memory',
    });
    
    let videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: e => console.error("VideoEncoder Error:", e)
    });
    
    videoEncoder.configure({
        codec: 'avc1.640028',
        width: 1080,
        height: 1350,
        bitrate: 5_000_000,
        framerate: designState.videoFPS
    });

    let audioEncoder = null;
    if (audioBuffer) {
        audioEncoder = new AudioEncoder({
            output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
            error: e => console.error("AudioEncoder Error:", e)
        });
        audioEncoder.configure({
            codec: 'mp4a.40.2',
            numberOfChannels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
            bitrate: 128000
        });
    }

    const totalFrames = designState.videoDuration * designState.videoFPS;
    
    // Render loop
    for (let frame = 0; frame <= totalFrames; frame++) {
        videoProgress.value = frame / totalFrames;
        exportProgressText.value = `Rendering Frame ${frame}/${totalFrames} (${Math.round((frame/totalFrames)*100)}%)`;
        
        // Sync video if it exists
        if (designState.videoBgURL && bgVideoElement.value) {
            bgVideoElement.value.currentTime = (frame / designState.videoFPS);
        }

        await new Promise(resolve => requestAnimationFrame(resolve)); // Wait for Vue to apply styles
        await new Promise(resolve => setTimeout(resolve, 30)); // Delay for dom layout stabilization

        const canvas = await htmlToImage.toCanvas(exportArea.value, {
            quality: 0.9,
            cacheBust: true,
            pixelRatio: 1 // Optimize to 1 for high performance video frames
        });
        
        const videoFrame = new VideoFrame(canvas, { timestamp: (frame / designState.videoFPS) * 1_000_000 });
        const keyFrame = (frame % (designState.videoFPS * 2) === 0);
        videoEncoder.encode(videoFrame, { keyFrame });
        videoFrame.close();
    }
    
    // Process Audio Encoding
    if (audioEncoder && audioBuffer) {
        exportProgressText.value = 'Muxing Original Audio...';
        const CHUNK_FRAMES = 1024;
        const totalAudioFrames = audioBuffer.length;
        const requiredAudioFrames = Math.min(totalAudioFrames, Math.floor(designState.videoDuration * audioBuffer.sampleRate));
        
        for (let offset = 0; offset < requiredAudioFrames; offset += CHUNK_FRAMES) {
            const framesToCopy = Math.min(CHUNK_FRAMES, requiredAudioFrames - offset);
            const data = new Float32Array(framesToCopy * audioBuffer.numberOfChannels);
            
            for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
                const channelData = audioBuffer.getChannelData(c).subarray(offset, offset + framesToCopy);
                data.set(channelData, c * framesToCopy);
            }
            
            const audioData = new AudioData({
                format: 'f32-planar',
                sampleRate: audioBuffer.sampleRate,
                numberOfFrames: framesToCopy,
                numberOfChannels: audioBuffer.numberOfChannels,
                timestamp: (offset / audioBuffer.sampleRate) * 1_000_000,
                data: data
            });
            
            audioEncoder.encode(audioData);
            audioData.close();
        }
        await audioEncoder.flush();
    }

    exportProgressText.value = 'Finalizing Video File...';
    await videoEncoder.flush();
    muxer.finalize();
    
    let buffer = muxer.target.buffer;
    let outBlob = new Blob([buffer], { type: 'video/mp4' });
    let url = window.URL.createObjectURL(outBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `LazarusNews-Video-${Date.now()}.mp4`;
    link.click();
    setTimeout(() => { window.URL.revokeObjectURL(url) }, 5000)

  } catch (err) {
    console.error(err);
    alert('Failed to export video: ' + err.message);
  } finally {
    exportArea.value.style.transform = `scale(${scaleFactor.value})`;
    videoProgress.value = 1;
    isExportVideoProcess.value = false;
    designState.isExportingVideo = false;
    exportProgressText.value = '';
  }
}

const playPreview = () => {
    if(isExportVideoProcess.value) return;
    videoProgress.value = 0;
    
    if (designState.videoBgURL && bgVideoElement.value) {
        bgVideoElement.value.currentTime = 0;
        bgVideoElement.value.play();
    }

    const duration = designState.videoDuration * 1000;
    const start = performance.now();
    
    const animate = (time) => {
        if(isExportVideoProcess.value) {
            if (bgVideoElement.value) bgVideoElement.value.pause();
            return; 
        }
        const elapsed = time - start;
        videoProgress.value = Math.min(elapsed / duration, 1);
        if(videoProgress.value < 1) {
            requestAnimationFrame(animate);
        } else {
            if (bgVideoElement.value) bgVideoElement.value.pause();
        }
    }
    requestAnimationFrame(animate);
}

onMounted(() => {
  window.addEventListener('lazarus-download', handleDownload)
  window.addEventListener('lazarus-video-download', handleVideoDownload)
  window.addEventListener('lazarus-play-preview', playPreview)
  
  if (previewScaler.value) {
    resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(previewScaler.value)
    updateScale()
  }
})

onUnmounted(() => {
  window.removeEventListener('lazarus-download', handleDownload)
  window.removeEventListener('lazarus-video-download', handleVideoDownload)
  window.removeEventListener('lazarus-play-preview', playPreview)
  if (resizeObserver) resizeObserver.disconnect()
})

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const startDrag = (e) => {
  if (designState.isExportingVideo) return; // Prevent drag during export
  if (videoProgress.value < 1) return; // Prevent drag during animation

  if (e.type === 'mousedown') { e.preventDefault() }
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
  if (e.cancelable) e.preventDefault()
  
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  const dx = clientX - dragStart.value.x
  const dy = clientY - dragStart.value.y
  
  const newX = dragStart.value.initLogoX + (dx / scaleFactor.value)
  const newY = dragStart.value.initLogoY + (dy / scaleFactor.value)
  
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
  <div class="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative">
    
    <!-- Video Export Overlay -->
    <div v-if="isExportVideoProcess" class="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none">
       <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
       <h2 class="text-xl font-bold text-white mb-2">Generating Video</h2>
       <p class="text-zinc-400 font-medium">{{ exportProgressText }}</p>
       <p class="text-xs text-zinc-500 mt-4 max-w-sm text-center">Please do not close this tab or change the screen. Video rendering uses your client's hardware.</p>
    </div>

    <!-- Scaler container -->
    <div 
      ref="previewScaler"
      class="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden bg-zinc-900 border border-zinc-800 rounded-sm shrink-0"
    >
      
      <!-- Actual 1080x1350 export area -->
      <div 
        ref="exportArea"
        id="export-area"
        class="absolute top-0 left-0 bg-zinc-900 overflow-hidden"
        :style="{ 
          width: '1080px', 
          height: '1350px', 
          transform: isExportVideoProcess ? 'none' : `scale(${scaleFactor})`, 
          transformOrigin: 'top left' 
        }"
      >
        <div class="absolute inset-0" :style="{ backgroundColor: designState.overlayColor }">
          
          <video 
            v-if="designState.videoBgURL"
            ref="bgVideoElement"
            :src="designState.videoBgURL"
            class="w-full h-full object-cover mix-blend-luminosity"
            loop
            playsinline
            :style="getAnimatedStyle('bgImage')"
          ></video>
          
          <img 
            v-else-if="previewImageBase64" 
            :src="previewImageBase64" 
            class="w-full h-full object-cover mix-blend-luminosity" 
            :style="getAnimatedStyle('bgImage')"
          />
          <div v-else class="w-full h-full bg-zinc-900 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-black" :style="{ opacity: designState.imageOpacity / 100 }"></div>
          
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" :style="{ opacity: designState.overlayOpacity / 100, height: '70%', top: 'auto', bottom: 0 }"></div>
          <div class="absolute inset-x-0 bottom-[140px] h-[600px] bg-gradient-to-t" :style="{ opacity: designState.overlayOpacity / 100, backgroundImage: `linear-gradient(to top, ${designState.overlayColor}99, transparent)` }"></div>
        </div>

        <div 
          v-if="designState.logoBase64" 
          class="absolute z-30 cursor-move group" 
          :style="getAnimatedStyle('logo')"
          @mousedown="startDrag"
          @touchstart="startDrag"
        >
          <div class="absolute inset-[-10px] border-2 border-blue-500/0 group-hover:border-blue-500/50 rounded-lg transition-colors pointer-events-none"></div>
          <img 
            :src="designState.logoBase64" 
            :style="{ maxHeight: `${designState.logoSize}px` }" 
            class="object-contain drop-shadow-2xl pointer-events-none select-none" 
            draggable="false"
          />
        </div>

        <div class="absolute inset-0 px-16 pt-12 flex flex-col justify-end z-10 pb-[175px]">
          
          <div v-if="designState.source" class="mb-6 inline-flex overflow-hidden pb-2" style="padding-bottom:12px;">
            <span 
              class="px-5 py-2 rounded-full text-white font-black tracking-[0.2em] uppercase text-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-sm"
              :style="getAnimatedStyle('badge')"
            >
              {{ designState.source }}
            </span>
          </div>
          
          <div class="overflow-hidden pb-4">
            <h1 
              class="font-black text-white uppercase leading-[1.05] tracking-tight mb-6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] origin-bottom" 
              :style="getAnimatedStyle('title')"
            >
              {{ designState.title || 'BREAKING NEWS TITLE GOES HERE. IMPACTFUL AND DIRECT.' }}
            </h1>
          </div>
          
          <div class="w-24 h-1.5 rounded-full mb-6 shadow-lg shadow-black/50" :style="getAnimatedStyle('line')"></div>
          
          <div class="overflow-hidden">
             <p 
               class="text-zinc-200 font-medium leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] max-w-[95%]"
               :style="getAnimatedStyle('desc')"
             >
               {{ designState.description || 'This provides more context about the news article. It is highly legible against the ultra-dark gradient background, using a tight typographic hierarchy to ensure professional presentation.' }}
             </p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
