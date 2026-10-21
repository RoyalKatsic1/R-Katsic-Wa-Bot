/**
 * ROYAL KATSIC MD - Main Entry Point
 * CODE FIRST BEFORE QR - FIXED
 */
process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || '/tmp/puppeteer_cache_disabled';

const { initializeTempSystem } = require('./utils/tempManager');
const { startCleanup } = require('./utils/cleanup');
initializeTempSystem();
startCleanup();

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const forbiddenPatternsConsole = ['closing session','closing open session','sessionentry','prekey bundle','pendingprekey','_chains','registrationid','currentratchet','chainkey','ratchet','signal protocol','ephemeralkeypair','indexinfo','basekey'];

console.log = (...args) => {
  const message = args.map(a => typeof a === 'string' ? a : typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ').toLowerCase();
  if (!forbiddenPatternsConsole.some(pattern => message.includes(pattern))) originalConsoleLog.apply(console, args);
};
console.error = (...args) => {
  const message = args.map(a => typeof a === 'string' ? a : typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ').toLowerCase();
  if (!forbiddenPatternsConsole.some(pattern => message.includes(pattern))) originalConsoleError.apply(console, args);
};
console.warn = (...args) => {
  const message = args.map(a => typeof a === 'string' ? a : typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ').toLowerCase();
  if (!forbiddenPatternsConsole.some(pattern => message.includes(pattern))) originalConsoleWarn.apply(console, args);
};

const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const NodeCache = require('node-cache');
const config = require('./config');
const handler = require('./handler');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');

const msgRetryCounterCache = new NodeCache();

function cleanupPuppeteerCache() {
  try {
    const home = os.homedir();
    const cacheDir = path.join(home, '.cache', 'puppeteer');
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('✅ Puppeteer cache removed');
    }
  } catch (err) {}
}

const store = {
  messages: new Map(),
  maxPerChat: 20,
  bind: (ev) => {
    ev.on('messages.upsert', ({ messages }) => {
      for (const msg of messages) {
        if (!msg.key?.id) continue;
        const jid = msg.key.remoteJid;
        if (!store.messages.has(jid)) store.messages.set(jid, new Map());
        const chatMsgs = store.messages.get(jid);
        chatMsgs.set(msg.key.id, msg);
        if (chatMsgs.size > store.maxPerChat) {
          const oldestKey = chatMsgs.keys().next().value;
          chatMsgs.delete(oldestKey);
        }
      }
    });
  },
  loadMessage: async (jid, id) => {
    return store.messages.get(jid)?.get(id) || null;
  }
};

const processedMessages = new Set();
setInterval(() => { processedMessages.clear(); }, 5 * 60 * 1000);

const createSuppressedLogger = (level = 'silent') => {
  let logger;
  try {
    logger = pino({ level });
  } catch (err) { logger = pino({ level }); }
  logger.info = () => {};
  logger.debug = () => {};
  logger.trace = () => {};
  return logger;
};

async function startBot() {
  const sessionFolder = `./${config.sessionName}`;
  const sessionFile = path.join(sessionFolder, 'creds.json');

  if (config.sessionID && config.sessionID.startsWith('RoyalKatsic!')) {
    try {
      const [header, b64data] = config.sessionID.split('!');
      const cleanB64 = b64data.replace('...', '');
      const compressedData = Buffer.from(cleanB64, 'base64');
      const decompressedData = zlib.gunzipSync(compressedData);
      if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });
      fs.writeFileSync(sessionFile, decompressedData, 'utf8');
      console.log('📡 Session : 🔑 Retrieved from Royal Katsic Session');
    } catch (e) {
      console.error('📡 Session : ❌ Error processing Royal Katsic session:', e.message);
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();
  const suppressedLogger = createSuppressedLogger('silent');

  const sock = makeWASocket({
    version,
    logger: suppressedLogger,
    printQRInTerminal: false,
    browser: ['Royal Katsic MD', 'Chrome', '1.0'],
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, suppressedLogger) },
    msgRetryCounterCache,
    syncFullHistory: false,
    downloadHistory: false,
    markOnlineOnConnect: false,
    getMessage: async () => undefined
  });

  // === CODE FIRST - BEFORE ANY QR ===
  if(!state.creds.registered){
    const PHONE_NUMBER = '256754214612'; // CHANGE YOUR NUMBER HERE WITHOUT +
    console.log(`\n⏳ Generating Pairing Code FIRST for ${PHONE_NUMBER} in 3 sec...`);
    setTimeout(async()=>{
      try{
        if(!sock.authState.creds.registered){
          const code = await sock.requestPairingCode(PHONE_NUMBER);
          const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
          console.log(`\n*****************************`);
          console.log(`🔑 PAIRING CODE FIRST: ${formatted}`);
          console.log(`TYPE AS: ${code}`);
          console.log(`For: ${PHONE_NUMBER}`);
          console.log(`WhatsApp > Linked Devices > Link with phone number`);
          console.log(`*****************************\n`);
          console.log(`QR will show next as backup...\n`);
        }
      }catch(e){
        console.log('Pairing error (will retry on QR):', e.message);
      }
    },3000);
  }

  store.bind(sock.ev);
  let lastActivity = Date.now();
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
  sock.ev.on('messages.upsert', () => { lastActivity = Date.now(); });
  const watchdogInterval = setInterval(async () => {
    if (Date.now() - lastActivity > INACTIVITY_TIMEOUT && sock.ws.readyState === 1) {
      console.log('⚠️ No activity detected. Forcing reconnect...');
      await sock.end(undefined, undefined, { reason: 'inactive' });
      clearInterval(watchdogInterval);
      setTimeout(() => startBot(), 5000);
    }
  }, 5 * 60 * 1000);

  sock.ev.on('connection.update', (update) => {
    const { connection } = update;
    if (connection === 'open') lastActivity = Date.now();
    else if (connection === 'close') clearInterval(watchdogInterval);
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      // QR SECOND - AFTER CODE
      console.log('\n📱 QR CODE SECOND (backup):\n');
      qrcode.generate(qr, { small: true });
      try{
        await QRCode.toFile('./qr.png', qr, { width: 400 });
        await QRCode.toFile(path.join(sessionFolder, 'qr.png'), qr, { width: 400 });
        console.log('✅ QR saved to qr.png');
      }catch{}
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode === 515 || statusCode === 503 || statusCode === 408) console.log(`⚠️ Connection closed (${statusCode}). Reconnecting...`);
      else console.log('Connection closed, reconnecting:', shouldReconnect);
      if (shouldReconnect) setTimeout(() => startBot(), 3000);
    } else if (connection === 'open') {
      console.log('\n✅ Bot connected successfully!');
      console.log(`📱 Bot Number: ${sock.user.id.split(':')[0]}`);
      console.log(`🤖 Bot Name: ${config.botName}`);
      console.log(`⚡ Prefix: ${config.prefix}`);
      const ownerNames = Array.isArray(config.ownerName) ? config.ownerName.join(',') : config.ownerName;
      console.log(`👑 Owner: ${ownerNames}\n`);
      if (config.autoBio) await sock.updateProfileStatus(`${config.botName} | Active 24/7`);
      handler.initializeAntiCall(sock);
    }
  });

  sock.ev.on('creds.update', saveCreds);
  const isSystemJid = (jid) => { if (!jid) return true; return jid.includes('@broadcast') || jid.includes('status.broadcast') || jid.includes('@newsletter'); };
  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message || !msg.key?.id) continue;
      const from = msg.key.remoteJid; if (!from) continue; if (isSystemJid(from)) continue;
      const msgId = msg.key.id; if (processedMessages.has(msgId)) continue;
      if (msg.messageTimestamp) { if (Date.now() - (msg.messageTimestamp * 1000) > 5 * 60 * 1000) continue; }
      processedMessages.add(msgId);
      if (msg.key && msg.key.id) {
        if (!store.messages.has(from)) store.messages.set(from, new Map());
        const chatMsgs = store.messages.get(from); chatMsgs.set(msg.key.id, msg);
        if (chatMsgs.size > store.maxPerChat) {
          const sortedIds = Array.from(chatMsgs.entries()).sort((a, b) => (a[1].messageTimestamp || 0) - (b[1].messageTimestamp || 0)).map(([id]) => id);
          for (let i = 0; i < sortedIds.length - store.maxPerChat; i++) chatMsgs.delete(sortedIds[i]);
        }
      }
      handler.handleMessage(sock, msg).catch(err => { if (!err.message?.includes('rate-overlimit') && !err.message?.includes('not-authorized')) console.error('Error handling message:', err.message); });
    }
  });

  sock.ev.on('group-participants.update', async (update) => { await handler.handleGroupUpdate(sock, update); });
  sock.ev.on('error', (error) => { const statusCode = error?.output?.statusCode; if (statusCode === 515 || statusCode === 503 || statusCode === 408) return; });
  return sock;
}

console.log('🚀 Starting ROYAL KATSIC MD - CODE FIRST MODE...\n');
cleanupPuppeteerCache();
startBot().catch(err => { console.error('Error starting bot:', err); process.exit(1); });

process.on('uncaughtException', (err) => {
  if (err.code === 'ENOSPC' || err.message?.includes('no space left on device')) {
    const { cleanupOldFiles } = require('./utils/cleanup'); cleanupOldFiles(); return;
  }
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
  if (err.code === 'ENOSPC' || err.message?.includes('no space left on device')) {
    const { cleanupOldFiles } = require('./utils/cleanup'); cleanupOldFiles(); return;
  }
  if (err.message && err.message.includes('rate-overlimit')) return;
  console.error('Unhandled Rejection:', err);
});
module.exports = { store };
