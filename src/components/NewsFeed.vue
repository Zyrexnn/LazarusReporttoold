<script setup>
import { ref } from 'vue'
import { designState } from '../store'
import { Search, Loader2, Key, Newspaper, Clock, ArrowUpRight } from 'lucide-vue-next'

const loading = ref(false)
const error = ref('')
const articles = ref([])
const searchQuery = ref('') // New ref for topic searching

const fetchNews = async () => {
  if (!designState.apiKey) {
    error.value = 'API Key is required'
    return
  }
  loading.value = true
  error.value = ''
  try {
    // If user searches for a topic, use 'everything' sorted by newest.
    // Otherwise, default to 'top-headlines'.
    const url = searchQuery.value.trim()
      ? `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery.value.trim())}&sortBy=publishedAt&language=en&apiKey=${designState.apiKey}`
      : `https://newsapi.org/v2/top-headlines?language=en&apiKey=${designState.apiKey}`

    const res = await fetch(url)
    const data = await res.json()
    if (data.status === 'error') {
      throw new Error(data.message)
    }
    articles.value = data.articles || []
  } catch (err) {
    error.value = err.message || 'Failed to fetch news'
  } finally {
    loading.value = false
  }
}

const selectArticle = (article) => {
  designState.title = article.title
  designState.description = article.description || ''
  designState.source = article.source?.name || ''
  designState.imageURL = article.urlToImage || ''
  designState.articleUrl = article.url || ''
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}
</script>

<template>
  <div class="p-5 border-b border-zinc-800 shrink-0 bg-zinc-900/50 backdrop-blur-sm relative z-10">
    <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-white/90">
      <div class="p-1.5 bg-blue-500/10 rounded-md">
        <Search class="w-5 h-5 text-blue-400" />
      </div>
      News Source
    </h2>
    <div class="space-y-4">
      <!-- Search Topic Input -->
      <div>
        <label class="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider font-semibold">Search Topic <span class="text-[10px] text-zinc-500 normal-case font-normal">(Optional)</span></label>
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-4 w-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input 
            v-model="searchQuery" 
            @keyup.enter="fetchNews"
            type="text" 
            placeholder="e.g. Technology, Apple, Politics"
            class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
          />
        </div>
      </div>
      
      <!-- API Key Input -->
      <div>
        <label class="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider font-semibold">NewsAPI Key</label>
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Key class="h-4 w-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input 
            v-model="designState.apiKey" 
            type="password" 
            placeholder="Enter your API Key"
            class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
          />
        </div>
      </div>
      <button 
        @click="fetchNews"
        :disabled="loading"
        class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg px-4 py-2.5 font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_0_rgba(79,70,229,0)] hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed transform active:scale-[0.98]"
      >
        <Loader2 v-if="loading" class="w-4 h-4 animate-spin text-white/90" />
        <span>{{ loading ? 'Fetching News...' : 'Fetch Latest News' }}</span>
      </button>
      <div v-if="error" class="text-red-400 text-xs mt-2 flex items-center gap-1.5 bg-red-400/10 p-2 rounded border border-red-400/20">
        <div class="w-1 h-1 rounded-full bg-red-400 animate-pulse"></div>
        {{ error }}
      </div>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
    
    <!-- Loading Skeleton -->
    <template v-if="loading">
      <div v-for="i in 5" :key="'skel-' + i" class="bg-zinc-800/40 rounded-xl overflow-hidden animate-pulse border border-white/5">
        <div class="h-32 bg-zinc-700/50 w-full mb-3"></div>
        <div class="p-4 pt-0">
          <div class="h-4 bg-zinc-700/50 rounded w-1/4 mb-3"></div>
          <div class="h-5 bg-zinc-700/50 rounded w-full mb-2"></div>
          <div class="h-5 bg-zinc-700/50 rounded w-4/5"></div>
        </div>
      </div>
    </template>

    <!-- Articles Feed -->
    <template v-else-if="articles.length > 0">
      <div v-for="(article, index) in articles" :key="index"
           @click="selectArticle(article)"
           class="bg-zinc-800/40 border border-white/5 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:bg-zinc-800/60 transition-all duration-300 group flex flex-col">
        
        <div class="h-40 bg-zinc-900 relative overflow-hidden shrink-0">
          <img v-if="article.urlToImage" :src="'https://wsrv.nl/?url=' + encodeURIComponent(article.urlToImage)" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" crossorigin="anonymous" />
          <div v-else class="w-full h-full flex items-center justify-center bg-zinc-800">
            <Newspaper class="w-8 h-8 text-zinc-600" />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
        </div>
        
        <div class="p-4 flex flex-col flex-1 relative">
          <!-- Floating action icon -->
          <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <div class="p-1.5 bg-blue-500 rounded-full text-white shadow-lg">
              <ArrowUpRight class="w-3 h-3" />
            </div>
          </div>

          <div class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {{ article.source?.name || 'Unknown' }}
            </span>
          </div>
          
          <h3 class="text-[14px] font-semibold line-clamp-3 leading-snug text-zinc-100 group-hover:text-white mb-2 flex-1">
            {{ article.title }}
          </h3>
          
          <div v-if="article.publishedAt" class="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-2" style="padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);">
            <Clock class="w-3 h-3" />
            <span class="truncate">{{ formatDate(article.publishedAt) }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div v-if="!articles.length && !loading && !error" class="h-full flex flex-col items-center justify-center text-center px-4 py-12">
      <div class="w-16 h-16 mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-600 border border-zinc-700/50">
        <Newspaper class="w-8 h-8" />
      </div>
      <h3 class="text-zinc-300 font-medium mb-1">No articles yet</h3>
      <p class="text-zinc-500 text-sm max-w-[200px]">Enter your API key and fetch the latest news to get started.</p>
    </div>
    
  </div>
</template>

<style scoped>
/* Custom scrollbar for webkit */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
  border-radius: 20px;
}
.scrollbar-thin:hover::-webkit-scrollbar-thumb {
  background-color: #52525b;
}
</style>
