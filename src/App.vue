<script setup>
import { ref } from 'vue'
import NewsFeed from './components/NewsFeed.vue'
import EditorPanel from './components/EditorPanel.vue'
import LivePreview from './components/LivePreview.vue'
import { LayoutTemplate, Edit3, Image as ImageIcon, X, Download } from 'lucide-vue-next'

const activeTab = ref('preview') // 'news', 'editor', 'preview'

const toggleTab = (tab) => {
  if (activeTab.value === tab && tab !== 'preview') {
    activeTab.value = 'preview'
  } else {
    activeTab.value = tab
  }
}

const triggerDownload = () => {
  window.dispatchEvent(new CustomEvent('lazarus-download'))
}
</script>

<template>
  <div class="h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col md:flex-row relative">
    
    <!-- DESKTOP: Col 1 News Feed -->
    <!-- MOBILE: Bottom Sheet -->
    <div 
      class="fixed md:relative inset-x-0 bottom-0 md:inset-auto z-40 md:z-auto transition-transform duration-300 w-full md:w-1/4 h-[80vh] md:h-screen border-t md:border-t-0 border-r-0 md:border-r border-zinc-800 bg-zinc-900 flex flex-col rounded-t-2xl md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none"
      :class="[
        activeTab === 'news' ? 'translate-y-0' : 'translate-y-full md:translate-y-0',
        'md:flex'
      ]"
    >
      <!-- Mobile Drag Handle -->
      <div class="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0 cursor-pointer" @click="activeTab='preview'">
        <span class="font-bold text-zinc-200">Browse News</span>
        <div class="p-1 rounded-full bg-zinc-800 text-zinc-400"><X class="w-4 h-4" /></div>
      </div>
      
      <div class="flex-1 overflow-y-auto w-full flex flex-col">
        <NewsFeed />
      </div>
    </div>

    <!-- MAIN PREVIEW (Always visible in bg on mobile, Col 2 on desktop) -->
    <div 
      class="flex-1 h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden relative z-10 w-full order-first md:order-none transition-all duration-300"
      :class="[
        activeTab === 'editor' ? 'pb-[55vh] md:pb-4' : (activeTab === 'news' ? 'pb-[80vh] md:pb-4' : 'pb-[80px] md:pb-4')
      ]"
      >
      <LivePreview />
      
      <!-- Mobile Floating Download Button -->
      <button 
        v-if="activeTab === 'preview'"
        @click="triggerDownload" 
        class="md:hidden absolute top-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-[0_4px_24px_rgba(16,185,129,0.5)] flex items-center justify-center transition-transform active:scale-90"
      >
        <Download class="w-6 h-6" />
      </button>
    </div>

    <!-- DESKTOP: Col 3 Editor Panel -->
    <!-- MOBILE: Bottom Sheet -->
    <div 
      class="fixed md:relative inset-x-0 bottom-0 md:inset-auto z-40 md:z-auto transition-transform duration-300 w-full md:w-1/3 h-[55vh] md:h-screen border-t md:border-t-0 border-l-0 md:border-l border-zinc-800 bg-zinc-900 flex flex-col rounded-t-2xl md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none"
      :class="[
        activeTab === 'editor' ? 'translate-y-0' : 'translate-y-full md:translate-y-0',
        'md:flex'
      ]"
    >
      <!-- Mobile Drag Handle -->
      <div class="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0 cursor-pointer" @click="activeTab='preview'">
        <span class="font-bold text-zinc-200">Edit Design</span>
        <div class="p-1 rounded-full bg-zinc-800 text-zinc-400"><X class="w-4 h-4" /></div>
      </div>

      <div class="flex-1 overflow-y-auto w-full flex flex-col">
        <EditorPanel />
      </div>
    </div>

    <!-- MOBILE BOTTOM NAVIGATION -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 z-50 flex items-center justify-around px-2 pb-safe pt-1 h-[68px]">
      <button @click="toggleTab('news')" class="flex flex-col items-center justify-center gap-1 p-2 w-20 rounded-xl transition-colors z-10" :class="activeTab === 'news' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-500 hover:text-zinc-300'">
        <LayoutTemplate class="w-6 h-6" />
        <span class="text-[10px] font-semibold">News</span>
      </button>
      
      <button @click="toggleTab('preview')" class="flex flex-col items-center justify-center gap-1 p-2 w-20 rounded-xl transition-colors relative z-20" :class="activeTab === 'preview' ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-300'">
        <div class="absolute -top-6 bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-full shadow-lg shadow-blue-500/30 text-white transform hover:scale-105 active:scale-95 transition-transform">
          <ImageIcon class="w-6 h-6" />
        </div>
        <span class="text-[10px] font-semibold mt-7" :class="activeTab === 'preview' ? 'text-blue-500' : 'text-zinc-500'">Preview</span>
      </button>

      <button @click="toggleTab('editor')" class="flex flex-col items-center justify-center gap-1 p-2 w-20 rounded-xl transition-colors z-10" :class="activeTab === 'editor' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-500 hover:text-zinc-300'">
        <Edit3 class="w-6 h-6" />
        <span class="text-[10px] font-semibold">Edit</span>
      </button>
    </div>

    <!-- Backdrop for bottom sheets on mobile -->
    <div 
      v-if="activeTab !== 'preview'"
      @click="activeTab = 'preview'"
      class="md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity backdrop-blur-sm"
    ></div>

  </div>
</template>
