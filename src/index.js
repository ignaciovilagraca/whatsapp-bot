require('dotenv').config();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs/promises');
const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { resolveGroupByInviteCode } = require('./groupResolver');
const { createMessageHandler } = require('./messageHandler');

const GROUP_INVITE_CODE = process.env.GROUP_INVITE_CODE;
if (!GROUP_INVITE_CODE) {
  console.error('GROUP_INVITE_CODE is required in .env');
  process.exit(1);
}

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function start() {
  const { version } = await fetchLatestWaWebVersion();
  logger.info({ version }, 'Using WA Web version');

  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.info(
        { statusCode, shouldReconnect },
        'Connection closed'
      );

      if (shouldReconnect) {
        start();
      } else {
        logger.warn('Logged out or session expired — clearing auth and restarting');
        const authDir = path.join(process.cwd(), 'auth_info');
        await fs.rm(authDir, { recursive: true, force: true });
        start();
      }
      return;
    }

    if (connection === 'open') {
      logger.info('Connected to WhatsApp');

      try {
        const group = await resolveGroupByInviteCode(sock, GROUP_INVITE_CODE);
        const groupJid = group.id;
        logger.info({ groupJid, groupName: group.subject }, 'Target group found');

        const handler = createMessageHandler(sock, groupJid, logger);
        await handler.refreshAdmins();

        sock.ev.on('messages.upsert', handler.handle);

        // Refresh admin list periodically (every 5 minutes)
        setInterval(() => handler.refreshAdmins(), 5 * 60 * 1000);
      } catch (err) {
        logger.fatal({ err }, 'Failed to initialize bot');
        process.exit(1);
      }
    }
  });
}

start().catch((err) => {
  logger.fatal({ err }, 'Unhandled error');
  process.exit(1);
});
