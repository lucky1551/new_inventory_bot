const { useMultiFileAuthState, makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');
const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

class WhatsAppAuth {
  constructor() {
    this.firestore = new Firestore();
    this.authPath = './baileys_auth';
  }

  async getAuthState() {
    // Ensure auth directory exists
    if (!fs.existsSync(this.authPath)) {
      fs.mkdirSync(this.authPath);
    }

    const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

    return {
      state,
      saveCreds: async (creds) => {
        try {
          // Save credentials to Firestore
          await this.firestore.collection('auth').doc('wa_credentials').set(
            { credentials: JSON.stringify(creds) }, 
            { merge: true }
          );
          
          // Also save to local file state
          await saveCreds(creds);
        } catch (error) {
          console.error('Error saving credentials:', error);
        }
      }
    };
  }

  async initializeSocket() {
    const { state, saveCreds } = await this.getAuthState();

    const sock = makeWASocket({
      printQRInTerminal: true,
      auth: state,
      browser: ['Inventory Bot', 'Chrome', '20.0'],
      generateHighQualityLinkPreview: false,
      qrTimeout: 60000, // 1 minute timeout for QR code
      connectTimeoutMs: 60000 // 1 minute connection timeout
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, qr, lastDisconnect } = update;
      
      if (qr) {
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const shouldReconnect = 
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log('Connection closed. Reconnect:', shouldReconnect);
        console.log('Last Disconnect Reason:', lastDisconnect?.error);
      } else if (connection === 'open') {
        console.log('WhatsApp connection established');
      }
    });

    sock.ev.on('creds.update', saveCreds);

    return sock;
  }
}

module.exports = WhatsAppAuth;