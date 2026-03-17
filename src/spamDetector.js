const SPAM_KEYWORDS = [
  'crypto',
  'bitcoin',
  'ethereum',
  'trading',
  'forex',
  'binance',
  'coinbase',
  'shitcoin',
  'altcoin',
  'token sale',
  'leverage trading',
  'margin trading',
  'rug pull',
  'yield farming',
  'liquidity pool',
];

function buildPattern(keywords) {
  const escaped = keywords.map((kw) =>
    kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  return new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'i');
}

const spamPattern = buildPattern(SPAM_KEYWORDS);

function extractText(message) {
  if (!message) return '';

  const parts = [
    message.conversation,
    message.extendedTextMessage?.text,
    message.imageMessage?.caption,
    message.videoMessage?.caption,
    message.documentMessage?.caption,
  ];

  return parts.filter(Boolean).join(' ');
}

function detect(message) {
  const text = extractText(message);
  if (!text) return { isSpam: false, matchedKeywords: [] };

  const matchedKeywords = SPAM_KEYWORDS.filter((kw) =>
    new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(
      text
    )
  );

  return {
    isSpam: matchedKeywords.length > 0,
    matchedKeywords,
  };
}

module.exports = { detect, extractText, SPAM_KEYWORDS };
