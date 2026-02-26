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
  const reader = new FileReader()
  reader.onload = (event) => {
    designState.imageURL = event.target.result
  }
  reader.readAsDataURL(file)
}

const triggerDownload = () => {
  window.dispatchEvent(new CustomEvent('lazarus-download'))
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
            <span class="text-xs text-zinc-400">Upload Local Image</span>
            <input type="file" accept="image/*" @change="handleImageUpload" class="absolute inset-0 opacity-0 cursor-pointer" />
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

  <div class="p-4 border-t border-zinc-800 shrink-0">
    <button @click="triggerDownload" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-3 font-bold flex items-center justify-center gap-2 transition-colors focus:ring-4 focus:ring-emerald-900">
      <Download class="w-5 h-5" /> Download Design (PNG)
    </button>
  </div>
</template>
