<script setup>
import { ref, onMounted, watch } from 'vue'
import { designState } from '../store'
import { Search, Loader2, Key, Newspaper, Clock, ArrowUpRight, Globe, Filter } from 'lucide-vue-next'

const loading = ref(false)
const error = ref('')
const articles = ref([])

onMounted(() => {
  fetchNews()
})

watch(() => designState.apiProvider, () => {
  fetchNews()
})

watch(() => designState.newsCategory, () => {
  fetchNews()
})

const providers = [
  { value: 'newsapi', label: 'NewsAPI.org (Default)' },
  { value: 'gnews', label: 'GNews.io (Geopolitics/World)' }
];

const categories = [
  { value: 'general', label: 'General' },
  { value: 'world', label: 'World / Geopolitics (GNews)' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sports', label: 'Sports' },
  { value: 'science', label: 'Science' },
  { value: 'health', label: 'Health' }
];

const fetchNews = async () => {
  if (!designState.apiKey) {
    error.value = 'API Key is required from .env file (VITE_NEWS_API_KEY)'
    return
  }
  loading.value = true
  error.value = ''
  try {
    let url = ''
    const cb = `t=${Date.now()}` // Cache-busting parameter
    if (designState.apiProvider === 'gnews') {
      const cat = designState.newsCategory || 'general'
      url = `https://gnews.io/api/v4/top-headlines?category=${cat}&lang=en&apikey=${designState.apiKey}&${cb}`
    } else {
      // NewsAPI
      const catParam = designState.newsCategory && designState.newsCategory !== 'world' ? `&category=${designState.newsCategory}` : ''
      url = `https://newsapi.org/v2/top-headlines?language=en${catParam}&apiKey=${designState.apiKey}&${cb}`
    }

    const res = await fetch(url)
    const data = await res.json()
    
    if (!res.ok || data.status === 'error' || data.errors) {
      throw new Error(data.message || (data.errors && data.errors[0]) || 'Failed to fetch news')
    }
    
    let fetchedArticles = []
    if (designState.apiProvider === 'gnews') {
      fetchedArticles = (data.articles || []).map(a => ({
        ...a,
        urlToImage: a.image, // GNews uses 'image'
        source: { name: a.source.name }
      }))
    } else {
      fetchedArticles = data.articles || []
    }

    // Sort by latest published date to explicitly fulfill 'data terbaru' request
    fetchedArticles.sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt))

    articles.value = fetchedArticles
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

const resetApiKey = () => {
  localStorage.removeItem('lazarus_api_key')
  window.location.reload()
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
      
      <!-- API Provider Source Input -->
      <div>
        <label class="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider font-semibold">News Provider</label>
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe class="h-4 w-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <select 
            v-model="designState.apiProvider" 
            class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-9 pr-8 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
          >
            <option v-for="provider in providers" :key="provider.value" :value="provider.value">{{ provider.label }}</option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-zinc-500">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" fill-rule="evenodd"></path></svg>
          </div>
        </div>
      </div>

      <!-- Category Filter Input -->
      <div>
        <label class="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider font-semibold">Category <span class="text-[10px] text-zinc-500 normal-case font-normal">(Affects Headlines)</span></label>
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter class="h-4 w-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <select 
            v-model="designState.newsCategory" 
            class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-9 pr-8 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
          >
            <option v-for="category in categories" :key="category.value" :value="category.value">{{ category.label }}</option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-zinc-500">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" fill-rule="evenodd"></path></svg>
          </div>
        </div>
      </div>
      <!-- API Key Reset (Hidden but accessible if error occurs) -->
      <div v-if="error.includes('Key')" class="mt-2 text-center">
        <button 
          @click="resetApiKey" 
          class="text-[10px] text-zinc-500 hover:text-blue-400 underline decoration-dotted transition-colors"
        >
          Reset to Config Key
        </button>
      </div>
      <!-- API Key and Search Inputs Removed -->
      <button 
        @click="fetchNews"
        :disabled="loading"
        class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg px-4 py-2.5 font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_0_rgba(79,70,229,0)] hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed transform active:scale-[0.98]"
      >
        <Loader2 v-if="loading" class="w-4 h-4 animate-spin text-white/90" />
        <span>{{ loading ? 'Updating News...' : 'Refresh News' }}</span>
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
          <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 z-20">
            <a :href="article.url" target="_blank" @click.stop 
               class="p-2 bg-blue-500 hover:bg-blue-400 rounded-full text-white shadow-lg transition-colors flex items-center justify-center"
               title="Open Source">
              <ArrowUpRight class="w-4 h-4" />
            </a>
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
      <p class="text-zinc-500 text-sm max-w-[200px]">Ensure your API Key is set in the <code>.env</code> file (<code>VITE_NEWS_API_KEY</code>).</p>
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
