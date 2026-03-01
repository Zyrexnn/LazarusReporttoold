<script setup>
import { designState } from '../store'
import { Edit3, UploadCloud, Download, ExternalLink } from 'lucide-vue-next'

const handleLogoUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    designState.logoBase64 = event.target.result
  }
  reader.readAsDataURL(file)
}

const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return

  if (file.type.startsWith('video/')) {
    const url = URL.createObjectURL(file)
    designState.videoBgURL = url
    designState.imageURL = '' // Clear image if video is used
  } else {
    const reader = new FileReader()
    reader.onload = (event) => {
      designState.imageURL = event.target.result
      designState.videoBgURL = '' // Clear video if image is used
    }
    reader.readAsDataURL(file)
  }
}

const triggerDownload = () => {
  window.dispatchEvent(new CustomEvent('lazarus-download'))
}

const triggerVideoDownload = () => {
  window.dispatchEvent(new CustomEvent('lazarus-video-download'))
}

const triggerPreviewPlay = () => {
  window.dispatchEvent(new CustomEvent('lazarus-play-preview'))
}
</script>

<template>
  <div class="p-4 border-b border-zinc-800 shrink-0 flex items-center justify-between">
    <h2 class="text-xl font-bold flex items-center gap-2 text-white">
      <Edit3 class="w-5 h-5 text-blue-500" /> Editor
    </h2>
    <a 
      v-if="designState.articleUrl" 
      :href="designState.articleUrl" 
      target="_blank" 
      rel="noopener noreferrer"
      class="text-xs flex items-center gap-1.5 text-zinc-400 hover:text-blue-400 bg-zinc-900 hover:bg-zinc-800 px-2 py-1.5 rounded transition-colors border border-zinc-800 hover:border-zinc-700"
      title="Read original article"
    >
      <ExternalLink class="w-3 h-3" /> Read Original
    </a>
  </div>

  <div class="p-4 space-y-6 flex-1">
    <!-- Content Section -->
    <section class="space-y-4">
      <h3 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Content</h3>
      
      <div>
        <label class="block text-xs text-zinc-400 mb-1">Title</label>
        <textarea 
          v-model="designState.title" 
          rows="3"
          class="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none text-white"
        ></textarea>
        <div class="text-right text-xs text-zinc-500 mt-1">{{ designState.title.length }} chars</div>
      </div>

      <div>
        <label class="block text-xs text-zinc-400 mb-1">Description</label>
        <textarea 
          v-model="designState.description" 
          rows="4"
          class="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none text-white"
        ></textarea>
        <div class="text-right text-xs text-zinc-500 mt-1">{{ designState.description.length }} chars</div>
      </div>

      <div>
        <label class="block text-xs text-zinc-400 mb-1">Source Name</label>
        <input 
          v-model="designState.source" 
          type="text"
          class="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
        />
      </div>

      <div>
        <label class="block text-xs text-zinc-400 mb-1">Main Image</label>
        <div class="space-y-2">
          <input 
            v-model="designState.imageURL" 
            type="text"
            placeholder="Image URL"
            class="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
          />
          <div class="relative w-full h-9 bg-zinc-900 border border-zinc-700 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-zinc-800 transition-colors overflow-hidden">
            <UploadCloud class="w-4 h-4 text-zinc-400 mr-2" />
            <span class="text-xs text-zinc-400">Upload Media (Image / Video)</span>
            <input type="file" accept="image/*,video/mp4,video/webm" @change="handleImageUpload" class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>
        
        <div v-if="designState.imageURL || designState.videoBgURL || designState.imageBase64 /* Support previous state */" class="mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded space-y-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-medium text-zinc-300">Image Adjustments</span>
            <button @click="designState.imageSize=100; designState.imagePositionX=50; designState.imagePositionY=50; designState.imageOpacity=80; designState.imageBrightness=75; designState.imageContrast=125; designState.overlayOpacity=60; designState.overlayColor='#000000'" class="text-[10px] text-blue-400 hover:text-blue-300 transition-colors px-2 py-0.5 bg-blue-500/10 rounded">Reset</button>
          </div>
          
          <div>
            <label class="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Zoom</span>
              <span>{{ designState.imageSize }}%</span>
            </label>
            <input type="range" v-model="designState.imageSize" min="10" max="300" class="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-zinc-400 mb-1">Pan X</label>
              <input type="range" v-model="designState.imagePositionX" min="0" max="100" class="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
            <div>
              <label class="block text-xs text-zinc-400 mb-1">Pan Y</label>
              <input type="range" v-model="designState.imagePositionY" min="0" max="100" class="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
          </div>
          
          <div class="pt-2 mt-2 border-t border-zinc-800 space-y-3">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-zinc-300">Lighting & Shadows</span>
            </div>
            <div>
              <label class="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Image Opacity</span>
                <span>{{ designState.imageOpacity }}%</span>
              </label>
              <input type="range" v-model="designState.imageOpacity" min="0" max="100" class="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Brightness</span>
                  <span>{{ designState.imageBrightness }}%</span>
                </label>
                <input type="range" v-model="designState.imageBrightness" min="0" max="200" class="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
              <div>
                <label class="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Contrast</span>
                  <span>{{ designState.imageContrast }}%</span>
                </label>
                <input type="range" v-model="designState.imageContrast" min="0" max="200" class="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
            </div>
            
            <div class="pt-2 border-t border-zinc-800">
              <label class="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Shadow Overlay Intensity</span>
                <span>{{ designState.overlayOpacity }}%</span>
              </label>
              <input type="range" v-model="designState.overlayOpacity" min="0" max="100" class="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              
              <div class="mt-2 flex items-center justify-between">
                <span class="text-xs text-zinc-400">Shadow Color</span>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-zinc-500">{{ designState.overlayColor.toUpperCase() }}</span>
                  <input type="color" v-model="designState.overlayColor" class="w-6 h-6 rounded shrink-0 cursor-pointer bg-transparent border-0 p-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <hr class="border-zinc-800" />

    <!-- Branding Section -->
    <section class="space-y-4">
      <h3 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Branding & Style</h3>
      
      <div>
        <label class="block text-xs text-zinc-400 mb-1">Custom Logo</label>
        <div class="relative w-full h-10 bg-zinc-950 border border-zinc-700 rounded flex items-center px-3 cursor-pointer hover:border-blue-500 transition-colors overflow-hidden">
          <UploadCloud class="w-4 h-4 text-zinc-400 mr-2" />
          <span class="text-sm text-zinc-400 truncate">{{ designState.logoBase64 ? 'Logo Uploaded' : 'Choose Base64 Logo' }}</span>
          <input type="file" accept="image/*" @change="handleLogoUpload" class="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-xs text-zinc-400 mb-1">Logo Size: {{ designState.logoSize }}px <span class="text-zinc-500 italic lowercase ml-2">(Drag logo on preview to move)</span></label>
        <input type="range" v-model="designState.logoSize" min="50" max="400" class="w-full h-[38px] accent-blue-500 cursor-pointer" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-zinc-400 mb-1">Accent Color</label>
          <div class="flex items-center gap-2">
            <input type="color" v-model="designState.accentColor" class="w-8 h-8 rounded shrink-0 cursor-pointer bg-transparent border-0 p-0" />
            <span class="text-xs text-zinc-500">{{ designState.accentColor }}</span>
          </div>
        </div>
        
        <div>
          <label class="block text-xs text-zinc-400 mb-1">Title Size: {{ designState.fontSizeTitle }}px</label>
          <input type="range" v-model="designState.fontSizeTitle" min="20" max="100" class="w-full accent-blue-500" />
        </div>
        
        <div class="col-span-2">
          <label class="block text-xs text-zinc-400 mb-1">Desc Size: {{ designState.fontSizeDesc }}px</label>
          <input type="range" v-model="designState.fontSizeDesc" min="12" max="60" class="w-full accent-blue-500" />
        </div>
      </div>
    </section>
  </div>

  <div class="p-4 border-t border-zinc-800 shrink-0 space-y-3">
    
    <div class="flex items-center justify-between gap-3">
       <button @click="triggerPreviewPlay" class="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-white rounded px-3 py-2.5 font-bold flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-zinc-600 text-sm">
         <span class="w-3 h-3 bg-white ml-1 style-[clip-path:polygon(0_0,0_100%,100%_50%)] inline-block relative -top-[1px]"></span>
         Play
       </button>

       <button @click="triggerDownload" class="w-2/3 bg-zinc-800 hover:bg-zinc-700 text-white rounded px-4 py-2.5 font-bold flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-zinc-600 border border-zinc-700 hover:border-zinc-600 text-sm">
         <Download class="w-4 h-4" /> Image (PNG)
       </button>
    </div>

    <button @click="triggerVideoDownload" :disabled="designState.isExportingVideo" class="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded px-4 py-3 font-bold flex items-center justify-center gap-2 transition-colors focus:ring-4 focus:ring-red-900 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
      <Download class="w-5 h-5" /> Export Video (MP4)
    </button>
  </div>
</template>
