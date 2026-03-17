const { detect } = require('./spamDetector');

function createMessageHandler(sock, targetGroupJid, logger) {
  const groupAdmins = new Set();

  async function refreshAdmins() {
    try {
      const metadata = await sock.groupMetadata(targetGroupJid);
      groupAdmins.clear();
      for (const p of metadata.participants) {
        if (p.admin === 'admin' || p.admin === 'superadmin') {
          groupAdmins.add(p.id);
        }
      }
      logger.info(`Cached ${groupAdmins.size} group admins`);
    } catch (err) {
      logger.error({ err }, 'Failed to refresh admin list');
    }
  }

  async function handle({ messages, type }) {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (msg.key.remoteJid !== targetGroupJid) continue;

      const sender = msg.key.participant;
      if (!sender) continue;
      if (groupAdmins.has(sender)) continue;

      const result = detect(msg.message);
      if (!result.isSpam) continue;

      logger.warn(
        { sender, keywords: result.matchedKeywords },
        'Spam detected — deleting message and removing sender'
      );

      try {
        await sock.sendMessage(targetGroupJid, { delete: msg.key });
      } catch (err) {
        logger.error({ err, sender }, 'Failed to delete message');
      }

      try {
        await sock.groupParticipantsUpdate(
          targetGroupJid,
          [sender],
          'remove'
        );
        logger.info({ sender }, 'Removed sender from group');
      } catch (err) {
        logger.error({ err, sender }, 'Failed to remove sender');
      }
    }
  }

  return { handle, refreshAdmins };
}

module.exports = { createMessageHandler };
