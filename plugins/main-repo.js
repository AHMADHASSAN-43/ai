// QUEEN Tech

import config from '../config.js';
import { cmd, commands } from '../command.js';
import os from "os";
import { runtime, sleep } from '../lib/functions.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- RANDOM NEWSLETTER CHANNELS ---
const NEWSLETTER_CHANNELS = [
    { jid: '120363426472060176@newsletter', name: 'AHMAD-MD TECH' },
    { jid: '120363427280163261@newsletter', name: 'AHMAD-MD TECH' }
];

const getRandomNewsletter = () => {
    return NEWSLETTER_CHANNELS[Math.floor(Math.random() * NEWSLETTER_CHANNELS.length)];
};

cmd({
    pattern: "repo",
    alias: ["sc", "script", "repository", "deploy"],
    desc: "Get QUEEN-MD deploy link and information",
    react: "📂",
    category: "main",
    filename: __filename,
},
async (conn, mek, m, { from, reply, userConfig }) => {
    try {
        const BOT_NAME = userConfig?.BOT_NAME || config.BOT_NAME || 'QUEEN-MD';
        const OWNER_NAME = userConfig?.OWNER_NAME || config.OWNER_NAME || 'QUEEN-MD';
        
        const deployLink = 'https://kweentech.vercel.app/';

        // --- REQUESTED STYLE ---
        const formattedInfo = `𝙌𝙐𝙀𝙀𝙉-𝗠𝗗

━━━〔 ✦ ʀᴇᴘᴏ ✦ 〕━━━

│ ⚡ ᴏᴡɴᴇʀ : *${OWNER_NAME}*
│ ⚡ ᴠᴇʀsɪᴏɴ : *1.0.0 (Latest)*
│ ⚡ ᴇɴɢɪɴᴇ : *Node.js / Baileys*
│ ⚡ ʀᴜɴᴛɪᴍᴇ : *${runtime(process.uptime())}*
│ ⚡ ᴘᴀɪʀɪɴɢ : *${deployLink}*

───────────────

> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙌𝙐𝙀𝙀𝙉-𝗠𝗗*`;

        // Pehle lib/menu.jpg (menu wali local pic), na mile to catbox wali pic
        let imageToSend = { url: "https://files.catbox.moe/33a8lk.jpg" };

        // 🔀 RANDOM NEWSLETTER PICK (har repo call par different)
        const newsletter = getRandomNewsletter();

        await conn.sendMessage(from, {
            image: imageToSend,
            caption: formattedInfo,
            contextInfo: { 
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: newsletter.jid,
                    newsletterName: newsletter.name,
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("Error in repo command:", error);
        reply("❌ Error: Script fetch nahi ho saki.");
    }
});
