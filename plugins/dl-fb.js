import axios from "axios";
import { cmd } from "../command.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// 🔑 AhmadXMD Facebook API
const API_BASE = 'https://api-ahmadxmd.vercel.app/fb';
const API_KEY = 'EXTRA';
const TIMEOUT = 60000;

// ============ HELPERS ============
async function fetchFacebook(url) {
  const apiUrl = `${API_BASE}?url=${encodeURIComponent(url)}&key=${API_KEY}`;
  const { data } = await axios.get(apiUrl, {
    timeout: TIMEOUT,
    validateStatus: () => true,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  return data;
}

function pickVideoUrl(data) {
  if (!data) return null;

  // If response itself is a string URL
  if (typeof data === 'string' && data.startsWith('http')) return data;

  // Flat string keys
  const flatKeys = [
    'downloadUrl', 'videoUrl', 'video', 'url', 'play', 'hd', 'sd',
    'nowm', 'wm', 'noWatermark', 'watermark', 'download', 'link'
  ];
  for (const k of flatKeys) {
    if (typeof data[k] === 'string' && data[k].startsWith('http')) return data[k];
  }

  // Nested result / data / video objects
  const nested = [data.result, data.data, data.video, data.videos, data.media];
  for (const obj of nested) {
    if (!obj) continue;
    if (typeof obj === 'string' && obj.startsWith('http')) return obj;

    for (const k of flatKeys) {
      if (typeof obj[k] === 'string' && obj[k].startsWith('http')) return obj[k];
    }

    // Arrays of { url, quality } or plain string
    const arr = obj.urls || obj.links || obj.downloads || obj.medias || (Array.isArray(obj) ? obj : null);
    if (Array.isArray(arr) && arr.length) {
      // Prefer HD
      const hd = arr.find(v => (v?.quality || v?.label || '').toString().toLowerCase().includes('hd'));
      const first = hd ||
        arr.find(v => typeof v === 'string' && v.startsWith('http')) ||
        arr.find(v => v && typeof v.url === 'string');
      if (typeof first === 'string') return first;
      if (first?.url) return first.url;
    }
  }

  // Last resort: scan one level of objects for any http string
  for (const key of Object.keys(data)) {
    const v = data[key];
    if (typeof v === 'string' && v.startsWith('http')) return v;
    if (v && typeof v === 'object') {
      for (const k2 of Object.keys(v)) {
        if (typeof v[k2] === 'string' && v[k2].startsWith('http') && /mp4|video|fbcdn/i.test(v[k2])) {
          return v[k2];
        }
      }
    }
  }

  return null;
}

function pickQuality(data) {
  const nested = [data.result, data.data, data.video, data.videos, data.media];
  for (const obj of nested) {
    if (!obj || typeof obj !== 'object') continue;
    const arr = obj.urls || obj.links || obj.downloads || obj.medias || (Array.isArray(obj) ? obj : null);
    if (Array.isArray(arr) && arr.length) {
      const hd = arr.find(v => (v?.quality || v?.label || '').toString().toLowerCase().includes('hd'));
      const chosen = hd || arr[0];
      return chosen?.quality || chosen?.label || (hd ? 'HD' : 'SD');
    }
    if (obj.quality) return obj.quality;
  }
  return data.quality || 'HD';
}

// ============ FACEBOOK COMMAND ============
cmd({
  pattern: "fb",
  alias: ["facebook", "fbdl"],
  react: '📥',
  desc: "Download videos from Facebook",
  category: "download",
  use: ".fb <Facebook video URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
  try {
    const fbUrl = args[0];
    if (!fbUrl || !fbUrl.includes("facebook.com")) {
      return reply('❌ Please provide a valid Facebook video URL.\n\nExample:\n.fb https://facebook.com/...');
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    let data;
    try {
      data = await fetchFacebook(fbUrl);
    } catch (err) {
      await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
      return reply(`❌ API error: ${err?.message || err}`);
    }

    if (data?.status === false) {
      await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
      return reply(`❌ ${data?.error || data?.message || 'API returned error'}`);
    }

    const videoUrl = pickVideoUrl(data);
    if (!videoUrl) {
      await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
      return reply(`❌ No video URL in API response.\n\n\`\`\`\n${JSON.stringify(data, null, 2).slice(0, 800)}\n\`\`\``);
    }

    const quality = pickQuality(data);

    await reply('⏬ Downloading video, please wait...');

    // Try buffer first, fallback to URL stream
    let sent = false;
    try {
      const file = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: 200 * 1024 * 1024,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*'
        }
      });
      const buffer = Buffer.from(file.data);
      if (buffer.length > 1000) {
        await conn.sendMessage(from, {
          video: buffer,
          mimetype: 'video/mp4',
          fileName: `facebook_${Date.now()}.mp4`,
          caption: `🎥 *Facebook Video Downloader*\n\n> Quality: ${quality}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙌𝙐𝙀𝙀𝙉-𝗠𝗗`
        }, { quoted: mek });
        sent = true;
      }
    } catch (_) {}

    if (!sent) {
      await conn.sendMessage(from, {
        video: { url: videoUrl },
        mimetype: 'video/mp4',
        caption: `🎥 *Facebook Video Downloader*\n\n> Quality: ${quality}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙌𝙐𝙀𝙀𝙉-𝗠𝗗`
      }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
  } catch (error) {
    console.error('FB Error:', error);
    reply('❌ Failed to download the video. Please try again later.');
    try { await conn.sendMessage(from, { react: { text: '❌', key: m.key } }); } catch (_) {}
  }
});
