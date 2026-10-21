/**
 * AFK (Away From Keyboard) — Royal Katsic MD
 * Stored in database/afk.json
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database');
const AFK_FILE = path.join(DB_PATH, 'afk.json');

const notifiedUsers = new Set();

const DEFAULT_MESSAGE = '🔴 *AFK Mode ON*\n\nMy owner is currently offline. Please try again later.';

function loadState() {
  try {
    if (fs.existsSync(AFK_FILE)) {
      const d = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'));
      return {
        enabled: !!d.enabled,
        message: d.message?.trim() || DEFAULT_MESSAGE,
        enabledAt: d.enabledAt || null
      };
    }
  } catch {}
  return { enabled: false, message: DEFAULT_MESSAGE, enabledAt: null };
}

function saveState(state) {
  try {
    if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH, { recursive: true });
    fs.writeFileSync(AFK_FILE, JSON.stringify(state, null, 2));
    return true;
  } catch { return false; }
}

const notifyKey = (chatId, senderId) => `${chatId}|${senderId}`;

const isEnabled = () => loadState().enabled;
const getMessage = () => loadState().message;

function setEnabled(enabled, customMessage) {
  notifiedUsers.clear();
  const on = enabled === true;
  return saveState({
    enabled: on,
    message: on && customMessage?.trim() ? customMessage.trim() : DEFAULT_MESSAGE,
    enabledAt: on ? Date.now() : null
  });
}

function shouldNotify(chatId, senderId) {
  if (!chatId || !senderId) return false;
  return !notifiedUsers.has(notifyKey(chatId, senderId));
}

function markNotified(chatId, senderId) {
  if (!chatId || !senderId) return;
  notifiedUsers.add(notifyKey(chatId, senderId));
}

module.exports = {
  isEnabled,
  getMessage,
  setEnabled,
  shouldNotify,
  markNotified,
  DEFAULT_MESSAGE
};
