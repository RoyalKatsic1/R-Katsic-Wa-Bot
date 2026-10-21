/**
 * Global Configuration for ROYAL KATSIC MD
 * Powered by Royal Katsic | Owner: 256754214612
 */

module.exports = {
    ownerNumber: ['256754214612'],
    ownerName: ['Royal Katsic'],
    
    botName: 'ROYAL KATSIC MD',
    prefix: '.',
    sessionName: 'session',
    sessionID: process.env.SESSION_ID || '',
    newsletterJid: '120363161513685998@newsletter',
    updateZipUrl: 'https://github.com/RoyalKatsic1/R-Katsic-Wa-Bot/archive/refs/heads/main.zip',
    
    packname: 'ROYAL KATSIC MD | 256754214612',
    
    selfMode: false,
    autoRead: false,
    autoTyping: false,
    autoBio: false,
    autoSticker: false,
    autoReact: false,
    autoReactMode: 'bot',
    autoDownload: false,
    
    defaultGroupSettings: {
      antilink: false,
      antilinkAction: 'delete',
      antitag: false,
      antitagAction: 'delete',
      antiall: false,
      antiviewonce: false,
      antibot: false,
      antibotAction: 'warn',
      anticall: false,
      antigroupmention: false,
      antigroupmentionAction: 'delete',
      antigroupstatus: false,
      antigroupstatusAction: 'delete',
      antisticker: false,
      antistickerAction: 'delete',
      antibadword: false,
      antibadwordAction: 'delete',
      welcome: false,
      welcomeMessage: '╭╼━≪• ROYAL KATSIC MD •≫━╾╮\n┃WELCOME: @user 👋\n┃Count: #memberCount\n┃TIME: time⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@user* Welcome to *@group*! 🎉\n\n> *Powered by ROYAL KATSIC MD*',
      goodbye: false,
      goodbyeMessage: 'Goodbye @user 👋',
      antiSpam: false,
      antidelete: false,
      nsfw: false,
      detect: false,
      chatbot: false,
      autosticker: false
    },
    
    apiKeys: { openai: '', deepai: '', remove_bg: '' },
    
    messages: {
      wait: '⏳ Please wait...',
      success: '✅ Success!',
      error: '❌ Error occurred!',
      ownerOnly: '👑 This command is only for Royal Katsic!',
      adminOnly: '🛡️ This command is only for group admins!',
      groupOnly: '👥 This command can only be used in groups!',
      privateOnly: '💬 This command can only be used in private chat!',
      botAdminNeeded: '🤖 Bot needs to be admin!',
      invalidCommand: '❓ Invalid command! Type .menu for help'
    },
    
    timezone: 'Africa/Kampala',
    maxWarnings: 3,
    
    social: {
      github: 'https://github.com/RoyalKatsic1/R-Katsic-Wa-Bot',
      whatsapp: 'https://wa.me/256754214612',
      channel: 'https://whatsapp.com/channel/0029Va...'
    }
};
