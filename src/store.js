import { reactive, watch } from 'vue';

const defaultState = {
  // text
  title: 'BREAKING NEWS TITLE GOES HERE. IMPACTFUL AND DIRECT.',
  description: 'This provides more context about the news article. It is highly legible against the ultra-dark gradient background, using a tight typographic hierarchy to ensure professional presentation.',
  // imagery
  source: 'BREAKING',
  imageURL: '',
  videoBgURL: '', // New property for video background
  articleUrl: '',
  imageSize: 100,
  imagePositionX: 50,
  imagePositionY: 50,
  imageOpacity: 80,
  imageBrightness: 75,
  imageContrast: 125,
  overlayColor: '#000000',
  overlayOpacity: 60,
  logoBase64: '',
  logoX: 864, // Default near top right: 1080 - 150(logo default size) - 64(padding)
  logoY: 140, // Default top padding
  logoSize: 300, // default max-height in pixels
  // style
  accentColor: '#c5a32b', // Custom requested color
  fontSizeTitle: 55,
  fontSizeDesc: 25,
  canvasWidth: 1080,
  canvasHeight: 1350,
  canvasRatio: '4:5',
  apiKey: import.meta.env.VITE_NEWS_API_KEY || '',
  apiProvider: 'newsapi', // 'newsapi' or 'gnews'
  newsCategory: 'general',
  // video export state
  videoDuration: 5,
  videoFPS: 30,
  isExportingVideo: false
};

// initialize from localStorage for persistent fields
const getInitialApiKey = () => {
  const saved = localStorage.getItem('lazarus_api_key');
  if (saved && saved.trim() !== '') return saved;
  return import.meta.env.VITE_NEWS_API_KEY || '';
};

const savedApiKey = getInitialApiKey();
const savedLogo = localStorage.getItem('lazarus_logo') || '';
const savedApiProvider = localStorage.getItem('lazarus_api_provider') || 'newsapi';
const savedNewsCategory = localStorage.getItem('lazarus_news_category') || 'general';

export const designState = reactive({
  ...defaultState,
  apiKey: savedApiKey,
  logoBase64: savedLogo,
  apiProvider: savedApiProvider,
  newsCategory: savedNewsCategory
});

// Watch persistent fields
watch(
  () => designState.apiKey,
  (newVal) => {
    localStorage.setItem('lazarus_api_key', newVal);
  }
);
watch(
  () => designState.logoBase64,
  (newVal) => {
    localStorage.setItem('lazarus_logo', newVal);
  }
);
watch(
  () => designState.apiProvider,
  (newVal) => {
    localStorage.setItem('lazarus_api_provider', newVal);
  }
);
watch(
  () => designState.newsCategory,
  (newVal) => {
    localStorage.setItem('lazarus_news_category', newVal);
  }
);
