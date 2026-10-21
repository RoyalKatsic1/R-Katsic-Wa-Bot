// utils/autoReact.js - Royal Katsic MD

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../config.js');

function load() {
  try {
    delete require.cache[require.resolve(CONFIG_PATH)];
    const { autoReact, autoReactMode } = require(CONFIG_PATH);
    return {
      enabled: !!autoReact,
      mode: ['bot', 'all', 'owner'].includes(autoReactMode) ? autoReactMode : 'bot'
    };
  } catch {
    return { enabled: false, mode: 'bot' };
  }
}

function save({ enabled, mode }) {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return false;

    let content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const safeMode = ['bot', 'all', 'owner'].includes(mode) ? mode : 'bot';
    const isEnabled = !!enabled;

    // Update or insert autoReact
    if (/autoReact\s*:/.test(content)) {
      content = content.replace(/autoReact\s*:\s*(true|false)/, `autoReact: ${isEnabled}`);
    } else {
      content = content.replace(/(module\.exports\s*=\s*\{|config\s*=\s*\{)/, `$1\n  autoReact: ${isEnabled},`);
    }

    // Update or insert autoReactMode
    if (/autoReactMode\s*:/.test(content)) {
      content = content.replace(/autoReactMode\s*:\s*['"]\w+['"]/, `autoReactMode: '${safeMode}'`);
    } else {
      content = content.replace(/autoReact\s*:\s*(?:true|false),?/, (m) => `${m}\n  autoReactMode: '${safeMode}',`);
    }

    fs.writeFileSync(CONFIG_PATH, content, 'utf8');
    delete require.cache[require.resolve(CONFIG_PATH)];
    return true;
  } catch (err) {
    console.error('[autoReact] save error:', err.message);
    return false;
  }
}

module.exports = { load, save };
