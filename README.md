# WhatsApp Anti-Spam Bot

A WhatsApp bot built with [Baileys](https://github.com/WhiskeySockets/Baileys) that monitors a group for crypto/trading spam. When spam is detected, the bot deletes the message and removes the sender from the group.

## Requirements

- Node.js 17+
- A WhatsApp account that is **admin** of the target group

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your group's invite code (the part after `https://chat.whatsapp.com/`):

```
GROUP_INVITE_CODE=YourInviteCodeHere
```

## Usage

```bash
npm start
```

On the first run, a QR code will be displayed in the terminal. Scan it with your WhatsApp app (Settings > Linked Devices > Link a Device). The session is saved in `auth_info/` so you only need to scan once.

## How It Works

1. Connects to WhatsApp and resolves the target group from the invite code
2. Caches the group's admin list (refreshed every 5 minutes)
3. Listens for incoming messages in the target group
4. Checks message text (including image/video captions) against a keyword list
5. If spam is detected and the sender is not an admin:
   - Deletes the message
   - Removes the sender from the group
   - Logs the action with matched keywords

## Spam Keywords

The bot detects messages containing terms like `crypto`, `bitcoin`, `ethereum`, `trading`, `forex`, `binance`, `rug pull`, `staking`, `yield farming`, and more. Keywords use word-boundary matching to avoid false positives (e.g. "cryptography" won't match).

The full list can be edited in `src/spamDetector.js`.

## Project Structure

```
src/
  index.js           - Entry point: auth, connection, reconnection
  groupResolver.js   - Resolves group JID from invite code
  spamDetector.js    - Keyword-based spam detection
  messageHandler.js  - Orchestrates detect -> delete -> kick
```
