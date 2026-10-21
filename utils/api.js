/**
 * API Integration Utilities — Royal Katsic MD
 * Optimized & DRY
 */

const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const api = axios.create({
  timeout: 30000,
  headers: { 'User-Agent': UA, 'Accept': 'application/json, text/plain, */*' }
});

const AXIOS_60 = {
  timeout: 60000,
  headers: { 'User-Agent': UA, 'Accept': 'application/json, text/plain, */*' }
};

// Generic retry wrapper
const tryRequest = async (getter, attempts = 3) => {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await getter();
    } catch (err) {
      lastError = err;
      if (i < attempts) await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
  throw lastError;
};

// Helpers
const safeGet = async (url, params = {}, opts = {}) => {
  const res = await api.get(url, { params, ...opts });
  return res.data;
};

const APIs = {
  // Image Generation
  generateImage: async (prompt) => {
    const data = await safeGet('https://api.siputzx.my.id/api/ai/stablediffusion', { prompt });
    return data;
  },

  // AI Chat
  chatAI: async (text) => {
    const data = await safeGet(`https://api.shizo.top/ai/gpt`, { apikey: 'shizo', query: text });
    return data.msg ? { msg: data.msg } : data;
  },

  // Generic Downloaders (Siputzx)
  ytDownload: async (url) => safeGet('https://api.siputzx.my.id/api/d/ytmp3', { url }),
  igDownload: async (url) => safeGet('https://api.siputzx.my.id/api/d/igdl', { url }),
  tiktokDownload: async (url) => safeGet('https://api.siputzx.my.id/api/d/tiktok', { url }),
  translate: async (text, to = 'en') => safeGet('https://api.siputzx.my.id/api/tools/translate', { text, to }),
  getWeather: async (city) => safeGet('https://api.siputzx.my.id/api/tools/weather', { city }),

  // Simple Public APIs
  getMeme: async () => (await api.get('https://meme-api.com/gimme')).data,
  getQuote: async () => (await api.get('https://api.quotable.io/random')).data,
  getJoke: async () => (await api.get('https://official-joke-api.appspot.com/random_joke')).data,
  shortenUrl: async (url) => (await api.get('https://tinyurl.com/api-create.php', { params: { url } })).data,
  wikiSearch: async (query) => (await api.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)).data,

  // YouTube Downloaders - Song (with retry)
  getIzumiDownloadByUrl: async (youtubeUrl) => {
    const url = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
    const res = await tryRequest(() => axios.get(url, AXIOS_60));
    if (res?.data?.result?.download) return res.data.result;
    throw new Error('Izumi youtube?url returned no download');
  },

  getIzumiDownloadByQuery: async (query) => {
    const url = `https://izumiiiiiiii.dpdns.org/downloader/youtube-play?query=${encodeURIComponent(query)}`;
    const res = await tryRequest(() => axios.get(url, AXIOS_60));
    if (res?.data?.result?.download) return res.data.result;
    throw new Error('Izumi youtube-play returned no download');
  },

  getYupraDownloadByUrl: async (youtubeUrl) => {
    const url = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(url, AXIOS_60));
    if (res?.data?.success && res?.data?.data?.download_url) {
      return { download: res.data.data.download_url, title: res.data.data.title, thumbnail: res.data.data.thumbnail };
    }
    throw new Error('Yupra returned no download');
  },

  getOkatsuDownloadByUrl: async (youtubeUrl) => {
    const url = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(url, AXIOS_60));
    if (res?.data?.dl) return { download: res.data.dl, title: res.data.title, thumbnail: res.data.thumb };
    throw new Error('Okatsu ytmp3 returned no download');
  },

  getEliteProTechDownloadByUrl: async (youtubeUrl) => {
    const url = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
    const res = await tryRequest(() => axios.get(url, AXIOS_60));
    if (res?.data?.success && res?.data?.downloadURL) return { download: res.data.downloadURL, title: res.data.title };
    throw new Error('EliteProTech ytdown returned no download');
  },

  getEliteProTechVideoByUrl: async (youtubeUrl) => {
    const url = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp4`;
    const res = await tryRequest(() => axios.get(url, AXIOS_60));
    if (res?.data?.success && res?.data?.downloadURL) return { download: res.data.downloadURL, title: res.data.title };
    throw new Error('EliteProTech ytdown video returned no download');
  },

  getYupraVideoByUrl: async (youtubeUrl) => {
    const url = `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(url, AXIOS_60));
    if (res?.data?.success && res?.data?.data?.download_url) {
      return { download: res.data.data.download_url, title: res.data.data.title, thumbnail: res.data.data.thumbnail };
    }
    throw new Error('Yupra video returned no download');
  },

  getOkatsuVideoByUrl: async (youtubeUrl) => {
    const url = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(url, AXIOS_60));
    if (res?.data?.result?.mp4) return { download: res.data.result.mp4, title: res.data.result.title };
    throw new Error('Okatsu ytmp4 returned no mp4');
  },

  // TikTok Download
  getTikTokDownload: async (url) => {
    const apiUrl = `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`;
    const res = await axios.get(apiUrl, { timeout: 15000, headers: { 'User-Agent': UA } });
    if (res.data?.status && res.data?.data) {
      const d = res.data.data;
      const videoUrl = d.urls?.[0] || d.video_url || d.url || d.download_url || null;
      return { videoUrl, title: d.metadata?.title || 'TikTok Video' };
    }
    throw new Error('TikTok download failed');
  },

  // Screenshot Website
  screenshotWebsite: async (url) => {
    const apiUrl = `https://eliteprotech-apis.zone.id/ssweb?url=${encodeURIComponent(url)}`;
    const res = await axios.get(apiUrl, { timeout: 30000, responseType: 'arraybuffer', headers: { 'User-Agent': UA } });
    if (res.headers['content-type']?.includes('image')) return Buffer.from(res.data);
    try {
      const json = JSON.parse(Buffer.from(res.data).toString());
      return json.url || json.data?.url || json.image || apiUrl;
    } catch {
      return Buffer.from(res.data);
    }
  },

  // Text to Speech
  textToSpeech: async (text) => {
    const url = `https://www.laurine.site/api/tts/tts-nova?text=${encodeURIComponent(text)}`;
    const res = await axios.get(url, { timeout: 30000, headers: { 'User-Agent': UA } });
    const data = res.data;

    if (typeof data === 'string' && data.startsWith('http')) return data;
    if (data?.data?.URL) return data.data.URL;
    if (data?.data?.url) return data.data.url;
    if (data?.data?.MP3) return `https://ttsmp3.com/created_mp3_ai/${data.data.MP3}`;
    if (data?.data?.mp3) return `https://ttsmp3.com/created_mp3_ai/${data.data.mp3
