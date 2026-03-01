import { reactive, watch } from 'vue';

const defaultState = {
  // text
  title: '',
  description: '',
  // imagery
  source: '',
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
  // app state
  apiKey: import.meta.env.VITE_NEWS_API_KEY || '',
  // video export state
  videoDuration: 5,
  videoFPS: 30,
  isExportingVideo: false
};



// initialize from localStorage for persistent fields
const savedApiKey = localStorage.getItem('lazarus_api_key') || import.meta.env.VITE_NEWS_API_KEY || '';
const savedLogo = localStorage.getItem('lazarus_logo') || '';

export const designState = reactive({
  ...defaultState,
  apiKey: savedApiKey,
  logoBase64: savedLogo
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
