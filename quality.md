# Web3 Wallet Chat App – Features & Commands Guide

A complete guide to quality-of-life features, anonymous messaging modes, and `#`-based command implementation for your decentralized wallet-to-wallet and NFT-gated group chat application.

---

## Part 1: Quality-of-Life Features

These features improve user experience, retention, and engagement in your chat app.

### 1. User Presence & Status

**Features:**
- Online/Offline status (green dot for online, gray for offline)
- Custom status messages: "Trading", "In a game", "Do not disturb", "Away"
- Last seen timestamp
- Typing indicator: "User is typing..." in real-time

**Implementation:**
```ts
// Frontend: Update presence on connection
useEffect(() => {
  setUserStatus('online')
  const timer = setInterval(() => updatePresence(), 30000) // Every 30s
  return () => {
    clearInterval(timer)
    setUserStatus('offline')
  }
}, [])

// Backend: Track via Redis/DB
updateUserPresence(wallet, {
  status: 'online' | 'away' | 'dnd',
  customStatus: 'Trading BTC',
  lastSeen: Date.now()
})
```

**UI (Tailwind):**
```jsx
<div className="flex items-center gap-2">
  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
  <span>{userName}</span>
  {customStatus && <span className="text-xs text-gray-500">({customStatus})</span>}
</div>
```

---

### 2. Read Receipts & Message Status

**States:**
- ✓ Sent
- ✓✓ Delivered
- ✓✓ Read (with timestamp)

**Implementation:**
```ts
// Track message delivery
enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

// On recipient fetch message
markMessageAsDelivered(messageId)
markMessageAsRead(messageId) // When user opens chat

// Emit event to sender via WebSocket
socket.emit('message:read', { messageId, readAt })
```

---

### 3. Disappearing/Burn Messages (Ephemeral)

**Features:**
- Auto-delete after N seconds or first read
- Options: 30s, 5m, 1h, 24h, or custom
- Visual countdown timer

**Implementation:**
```ts
// Client: Set expiry on send
const sendMessage = (content, ttl = 300) => {
  const expiresAt = Date.now() + ttl * 1000
  
  const msg = {
    content,
    expiresAt,
    isEphemeral: true
  }
  
  sendToBackend(msg)
  
  // Local cleanup timer
  setTimeout(() => deleteMessageFromUI(msg.id), ttl * 1000)
}

// Backend: Auto-delete from DB after TTL
schedule(() => {
  deleteExpiredMessages()
}, 'every-minute')
```

**UI:**
```jsx
<div className="relative">
  <p>{message.content}</p>
  {message.isEphemeral && (
    <div className="text-xs text-red-500">
      🔥 Expires in {Math.ceil(message.expiresAt / 1000)}s
    </div>
  )}
</div>
```

---

### 4. Message Reactions & Emojis

**Features:**
- React to messages with emoji (👍, ❤️, 😂, etc.)
- Count aggregation (5 people liked this)
- Quick emoji picker

**Implementation:**
```ts
// Schema
Table: `message_reactions`
- message_id
- reactor_wallet
- emoji
- created_at

// API
POST /messages/:id/reactions
Body: { emoji: '👍' }

// Fetch
GET /messages/:id/reactions
Response: {
  '👍': 5,
  '❤️': 3,
  '😂': 1,
  reactedBy: { '👍': ['wallet1', 'wallet2', ...] }
}
```

---

### 5. Reply/Quote Messages

**Features:**
- Quote previous message
- Show context in thread
- Visual threading/indentation

**Implementation:**
```ts
// Schema
Table: `messages`
- id
- conversation_id
- sender_wallet
- ciphertext
- **reply_to_id** (nullable, foreign key to message)
- **reply_to_sender** (cached for UI)

// Send reply
sendMessage({
  content: 'Yes, agreed!',
  replyToId: 'msg-123',
  replyToSender: 'wallet_A',
  replyPreview: 'First message content...'
})
```

**UI:**
```jsx
{message.replyToId && (
  <div className="bg-gray-100 p-2 rounded mb-2 text-sm border-l-4 border-blue-500">
    <p className="font-semibold text-xs">{message.replyToSender}</p>
    <p className="text-gray-700 truncate">{message.replyPreview}</p>
  </div>
)}
<p>{message.content}</p>
```

---

### 6. Message Search & Pinned Messages

**Features:**
- Full-text search in conversation
- Pin important messages to top
- Search history

**Implementation:**
```ts
// Schema
Table: `messages`
- id
- **is_pinned**: boolean
- indexed for FTS (Full Text Search)

// API
GET /conversations/:id/messages?search=bitcoin
GET /conversations/:id/pinned-messages

// Pin message
POST /messages/:id/pin
```

**UI:**
```jsx
<button onClick={() => pinMessage(msg.id)}>
  {msg.isPinned ? '📌 Pinned' : '📍 Pin'}
</button>
```

---

### 7. Block / Report / Mute Users

**Features:**
- Block wallet addresses (no DMs allowed)
- Mute group members (hide their messages temporarily)
- Report user/message to admin

**Implementation:**
```ts
// Schema
Table: `user_blocks`
- blocker_wallet
- blocked_wallet

Table: `user_reports`
- reporter_wallet
- reported_wallet / message_id
- reason
- status: 'pending' | 'reviewed' | 'dismissed' | 'actioned'

// API
POST /users/:wallet/block
POST /users/:wallet/mute
POST /users/:wallet/unblock
POST /messages/:id/report
Body: { reason: 'Spam' | 'Harassment' | 'NSFW' | 'Other', details: '' }
```

---

### 8. Notifications & Sound Alerts

**Features:**
- Push notifications for new messages
- Sound/vibration on receipt
- Mute notifications by conversation
- Badge count on app icon

**Implementation:**
```ts
// Frontend: Request permission & setup
if ('Notification' in window) {
  Notification.requestPermission()
}

// On new message (WebSocket)
socket.on('message:new', (msg) => {
  if (!isConvMuted(msg.conversationId)) {
    playNotificationSound()
    new Notification(`New message from ${sender}`, {
      body: msg.preview,
      icon: userAvatar
    })
  }
})

// Mute conversation
POST /conversations/:id/mute
```

---

### 9. User Profiles & Avatars

**Features:**
- Optional profile (nickname, bio, avatar URL)
- Solana ENS resolution
- Custom color theme
- Verification badge (verified contract holder)

**Implementation:**
```ts
// Schema
Table: `user_profiles`
- wallet_address (PK)
- nickname (optional)
- bio (optional)
- avatar_url (optional, IPFS)
- ens_name (optional, resolved)
- verified (boolean, if holds certain NFT/token)

// API
GET /users/:wallet/profile
PUT /users/me/profile
Body: { nickname, bio, avatarUrl }
```

---

### 10. Group Management UI

**Features:**
- Group info panel (members, rules, description)
- Member list with roles (owner, admin, member)
- Member activity (who's active, last message count)
- Group settings (notifications, leave/delete)

**Implementation:**
```ts
// Schema
Table: `group_members`
- group_id
- member_wallet
- role: 'owner' | 'admin' | 'member'
- joined_at
- last_message_at

// API
GET /groups/:id/info
GET /groups/:id/members
POST /groups/:id/members/:wallet/kick
POST /groups/:id/members/:wallet/promote
```

---

### 11. Message Forwarding

**Features:**
- Forward message to another user/group
- Forwarded by tag (shows original sender)

**Implementation:**
```ts
// Schema
Table: `messages`
- id
- forwarded_from_message_id (nullable)
- forwarded_from_sender (cached)
- forwarded_by_sender (wallet)

// API
POST /messages/:id/forward
Body: { targetConversationId }
```

---

### 12. Typing Indicators (Real-time)

**Features:**
- Show "User is typing..." in real-time
- Debounced updates (send every 1s)

**Implementation:**
```ts
// Frontend: Debounce typing event
const handleInputChange = debounce((text) => {
  socket.emit('user:typing', {
    conversationId,
    isTyping: text.length > 0
  })
}, 1000)

// Backend: Broadcast to group
socket.on('user:typing', (data) => {
  io.to(`conv:${data.conversationId}`).emit('typing:indicator', {
    wallet: user.wallet,
    isTyping: data.isTyping
  })
})

// UI
{typingUsers.length > 0 && (
  <p className="text-sm text-gray-500">
    {typingUsers.map(w => w.slice(0, 6)).join(', ')} typing...
  </p>
)}
```

---

## Part 2: Anonymous Communication Modes

### Anonymous Mode 1: Pseudonymous Wallet Chat (Default)

- Users show only wallet address (or custom name) in DM/group
- No phone, email, or personal data required
- Identity = wallet address

---

### Anonymous Mode 2: One-Time Ephemeral Conversations

- Create a "burner" conversation that expires
- All messages auto-delete after session ends
- No persistent chat record

---

### Anonymous Mode 3: Group Topic Channels (Like Nostr Relays)

- Public groups by topic (e.g., "#trading", "#gaming", "#nft-drops")
- Users post pseudonymously to relay
- No personal DM between members

---

### Anonymous Mode 4: Relay-Routed Messages (Advanced)

- Messages route through relay nodes
- Recipient only sees relay wallet, not original sender
- Similar to Tor/mixing concept

---

### Anonymous Mode 5: Token-Gated Anonymous Rooms

- Join group if holding token/NFT
- Participate without personal profile
- Group = pure wallet addresses

---

## Part 3: `#`-Based Command System

Instead of `/`, use `#` for commands. This feels more Web3 native (like hashtags).

### Command Parser (Frontend)

```ts
// commandParser.ts
export interface Command {
  name: string
  args: string[]
  rawInput: string
}

export function parseCommand(text: string): Command | null {
  if (!text.startsWith('#')) return null
  
  const parts = text.slice(1).split(' ')
  const name = parts[0].toLowerCase()
  const args = parts.slice(1)
  
  return { name, args, rawInput: text }
}

// Usage
const input = '#send 0x123 5 SOL'
const cmd = parseCommand(input)
// cmd = { name: 'send', args: ['0x123', '5', 'SOL'], rawInput: '...' }
```

### Command Handler (Frontend)

```ts
// commandHandler.ts
export async function handleCommand(
  cmd: Command,
  conversationId: string,
  currentWallet: string
): Promise<{success: boolean; message: string}> {
  
  switch(cmd.name) {
    case 'send':
      return handleSendPayment(cmd.args, conversationId, currentWallet)
    case 'tip':
      return handleTip(cmd.args, conversationId)
    case 'remind':
      return handleReminder(cmd.args)
    case 'pin':
      return handlePin(cmd.args[0], conversationId)
    case 'poll':
      return handlePoll(cmd.args, conversationId)
    case 'translate':
      return handleTranslate(cmd.args)
    // ... more commands
    default:
      return { success: false, message: `Unknown command: #${cmd.name}` }
  }
}
```

### Recommended `#` Commands

#### 1. **#send** – Send payment/transfer

```
Usage: #send <recipient_wallet> <amount> <token>
Example: #send 0x123...789 5 SOL
Effect: Creates a payment popup to send 5 SOL to recipient
```

**Implementation:**
```ts
async function handleSendPayment(args: string[], convId: string, sender: string) {
  const [recipient, amount, token] = args
  
  if (!recipient || !amount || !token) {
    return { success: false, message: '#send <wallet> <amount> <token>' }
  }
  
  // Validate wallet address
  if (!isValidWalletAddress(recipient)) {
    return { success: false, message: 'Invalid wallet address' }
  }
  
  // Show payment confirmation modal
  showPaymentModal({
    from: sender,
    to: recipient,
    amount: parseFloat(amount),
    token,
    onConfirm: async () => {
      const txHash = await executeTransfer(sender, recipient, amount, token)
      
      // Send confirmation message to conversation
      await sendMessage(convId, {
        type: 'payment',
        content: `Sent ${amount} ${token} to ${recipient}`,
        txHash,
        status: 'confirmed'
      })
      
      return { success: true, message: `Sent ${amount} ${token}` }
    }
  })
}
```

---

#### 2. **#tip** – Send quick tip

```
Usage: #tip <amount> <token>
Example: #tip 0.5 SOL
Effect: Send quick tip to message author (with confirmation)
Context: Reply to a message, then use command
```

**Implementation:**
```ts
function handleTip(args: string[], convId: string, replyToSender: string) {
  const [amount, token] = args
  
  if (!replyToSender) {
    return { success: false, message: 'Use #tip as a reply to tip the user' }
  }
  
  // Validate
  if (!amount || !token) {
    return { success: false, message: '#tip <amount> <token>' }
  }
  
  // Show quick confirm
  showTipConfirm({
    recipient: replyToSender,
    amount,
    token,
    message: 'Great insight!'
  })
}
```

---

#### 3. **#remind** – Set reminder in conversation

```
Usage: #remind <time> <message>
Example: #remind 30m Check Bitcoin price
Example: #remind 1h Sync with team
Effect: Backend schedules notification, sends at specified time
```

**Implementation:**
```ts
async function handleReminder(args: string[], convId: string, wallet: string) {
  const timeStr = args[0]
  const message = args.slice(1).join(' ')
  
  const seconds = parseTimeString(timeStr) // "30m" → 1800
  
  if (!seconds || !message) {
    return { success: false, message: '#remind <time> <message>' }
  }
  
  const remindAt = Date.now() + seconds * 1000
  
  // Schedule reminder
  await scheduleReminder({
    wallet,
    conversationId: convId,
    remindAt,
    message,
    type: 'group' // or 'dm'
  })
  
  return {
    success: true,
    message: `Reminder set for ${formatTime(seconds)}`
  }
}
```

---

#### 4. **#pin** – Pin message

```
Usage: #pin <message_id>
Example: #pin msg-12345
Effect: Pin message to group/conversation top
Shortcut: React to message with 📌 emoji
```

**Implementation:**
```ts
async function handlePin(messageId: string, convId: string, wallet: string) {
  // Check if user is admin/owner
  const isAdmin = await checkUserRole(convId, wallet)
  
  if (!isAdmin) {
    return { success: false, message: 'Only admins can pin messages' }
  }
  
  await pinMessage(messageId)
  
  // Notify group
  await sendSystemMessage(convId, {
    type: 'action',
    content: `${wallet} pinned a message`
  })
  
  return { success: true, message: 'Message pinned' }
}
```

---

#### 5. **#poll** – Create quick poll

```
Usage: #poll <question>|<option1>|<option2>|...
Example: #poll Should we launch on Base?|Yes|No|Maybe
Effect: Create interactive poll in group
```

**Implementation:**
```ts
async function handlePoll(args: string[], convId: string) {
  const input = args.join(' ')
  const [question, ...options] = input.split('|').map(s => s.trim())
  
  if (!question || options.length < 2) {
    return { success: false, message: '#poll <q>|<opt1>|<opt2>|...' }
  }
  
  const pollId = generateId()
  
  const pollMessage = {
    type: 'poll',
    pollId,
    question,
    options: options.map((text, idx) => ({
      id: idx,
      text,
      votes: 0,
      voters: []
    })),
    createdAt: Date.now(),
    endsAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  }
  
  await sendMessage(convId, pollMessage)
  
  return { success: true, message: 'Poll created' }
}
```

**UI for Poll:**
```jsx
<div className="bg-blue-50 p-4 rounded">
  <p className="font-bold mb-2">{poll.question}</p>
  {poll.options.map(opt => (
    <button
      key={opt.id}
      onClick={() => votePoll(poll.pollId, opt.id)}
      className="w-full text-left mb-2 p-2 bg-white rounded hover:bg-gray-100"
    >
      {opt.text} ({opt.votes} votes)
      <div className="bg-gray-300 h-1 mt-1" style={{ width: `${(opt.votes / totalVotes) * 100}%` }} />
    </button>
  ))}
</div>
```

---

#### 6. **#translate** – Translate message to language

```
Usage: #translate <language>
Example: #translate Spanish
Context: Reply to message, use #translate
Effect: Show translated message in conversation
```

**Implementation:**
```ts
async function handleTranslate(args: string[], convId: string, replyToMsg: Message) {
  const language = args.join(' ')
  
  if (!language || !replyToMsg) {
    return { success: false, message: '#translate <language>' }
  }
  
  // Use Google Translate or similar
  const translated = await translateText(replyToMsg.content, language)
  
  await sendMessage(convId, {
    type: 'translation',
    original: replyToMsg.content,
    translated,
    language,
    translatedBy: replyToMsg.senderWallet
  })
  
  return { success: true, message: `Translated to ${language}` }
}
```

---

#### 7. **#mute** – Mute conversation/user

```
Usage: #mute <duration>
Example: #mute 1h
Example: #mute off
Effect: Stop notifications from group for duration
```

**Implementation:**
```ts
async function handleMute(args: string[], convId: string, wallet: string) {
  const duration = args[0]
  
  if (duration === 'off') {
    await unmuteConversation(wallet, convId)
    return { success: true, message: 'Notifications enabled' }
  }
  
  const seconds = parseTimeString(duration)
  if (!seconds) {
    return { success: false, message: '#mute <duration> or #mute off' }
  }
  
  const unmuteAt = Date.now() + seconds * 1000
  
  await muteConversation(wallet, convId, unmuteAt)
  
  return { success: true, message: `Muted for ${duration}` }
}
```

---

#### 8. **#nft-check** – Check NFT gating for group

```
Usage: #nft-check
Effect: Show current group's NFT gating requirements
Response: Displays NFT contract, minimum holdings, verified status
```

**Implementation:**
```ts
async function handleNFTCheck(args: string[], convId: string) {
  const group = await getGroupById(convId)
  
  if (group.type !== 'group' || !group.nftContract) {
    return { success: false, message: 'This is not an NFT-gated group' }
  }
  
  const info = {
    contract: group.nftContract,
    chain: group.chain,
    criteria: group.nftCriteria,
    memberCount: await countGroupMembers(convId)
  }
  
  await sendSystemMessage(convId, {
    type: 'nft-info',
    content: `NFT Gate: ${info.contract}`,
    metadata: info
  })
  
  return { success: true, message: 'NFT info displayed' }
}
```

---

#### 9. **#help** – Show available commands

```
Usage: #help
Usage: #help <command>
Example: #help send
Effect: Show list of all commands or details for one
```

**Implementation:**
```ts
const COMMANDS_INFO = {
  send: {
    desc: 'Send payment to wallet',
    usage: '#send <wallet> <amount> <token>',
    example: '#send 0x123 5 SOL'
  },
  tip: {
    desc: 'Quick tip to message author',
    usage: '#tip <amount> <token>',
    example: '#tip 0.5 SOL'
  },
  remind: {
    desc: 'Set reminder in conversation',
    usage: '#remind <time> <msg>',
    example: '#remind 30m Check price'
  },
  pin: {
    desc: 'Pin message (admin only)',
    usage: '#pin <msg_id>',
    example: '#pin msg-123'
  },
  poll: {
    desc: 'Create poll',
    usage: '#poll <q>|<opt1>|<opt2>',
    example: '#poll Launch?|Yes|No'
  },
  translate: {
    desc: 'Translate message',
    usage: '#translate <lang>',
    example: '#translate Spanish'
  },
  mute: {
    desc: 'Mute notifications',
    usage: '#mute <duration>',
    example: '#mute 1h'
  },
  'nft-check': {
    desc: 'Show NFT gating info',
    usage: '#nft-check',
    example: '#nft-check'
  }
}

async function handleHelp(args: string[]) {
  const cmd = args[0]
  
  if (cmd) {
    const info = COMMANDS_INFO[cmd]
    if (!info) {
      return { success: false, message: `Command not found: #${cmd}` }
    }
    return {
      success: true,
      message: `${info.desc}\n${info.usage}\nExample: ${info.example}`
    }
  }
  
  // Show all commands
  const allCommands = Object.entries(COMMANDS_INFO)
    .map(([name, info]) => `#${name}: ${info.desc}`)
    .join('\n')
  
  return { success: true, message: `Available commands:\n${allCommands}` }
}
```

**UI for Help:**
```jsx
<div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
  <h3 className="font-bold mb-2">Available Commands</h3>
  {Object.entries(COMMANDS_INFO).map(([name, info]) => (
    <div key={name} className="mb-3 pb-2 border-b">
      <code className="bg-gray-800 text-white px-2 py-1 rounded text-sm">#{name}</code>
      <p className="text-sm text-gray-700 mt-1">{info.desc}</p>
      <p className="text-xs text-gray-500 font-mono">{info.usage}</p>
    </div>
  ))}
</div>
```

---

#### 10. **#airdrop** – Announce airdrop (admin)

```
Usage: #airdrop <amount> <token> <recipients_count>
Example: #airdrop 10 RASEI 50
Effect: Schedule airdrop to N random group members
```

---

#### 11. **#burn** – Burn message (yourself only)

```
Usage: #burn <message_id>
Effect: Delete message from conversation permanently
```

**Implementation:**
```ts
async function handleBurn(args: string[], wallet: string, convId: string) {
  const messageId = args[0]
  
  if (!messageId) {
    return { success: false, message: '#burn <message_id>' }
  }
  
  const msg = await getMessage(messageId)
  
  if (msg.senderWallet !== wallet) {
    return { success: false, message: 'Can only delete your own messages' }
  }
  
  await deleteMessage(messageId)
  
  return { success: true, message: 'Message deleted' }
}
```

---

#### 12. **#links** – Get all links shared in group

```
Usage: #links
Effect: Show all URLs shared in conversation (for security check)
```

---

#### 13. **#swap** – Inline token swap (if integrated with DEX)

```
Usage: #swap <amount> <from_token> <to_token>
Example: #swap 1 SOL USDC
Effect: Show swap quote, execute in modal
```

---

### Command Auto-suggestion UI

```jsx
// CommandSuggestions.tsx
import { parseCommand } from './commandParser'

export function CommandSuggestions({ input, onSelect }) {
  const cmd = parseCommand(input)
  
  if (!cmd) return null
  
  const matching = Object.keys(COMMANDS_INFO)
    .filter(name => name.startsWith(cmd.name))
  
  if (matching.length === 0) return null
  
  return (
    <div className="bg-white border rounded shadow-lg p-2 mt-1">
      {matching.map(name => (
        <button
          key={name}
          onClick={() => onSelect(`#${name}`)}
          className="block w-full text-left p-2 hover:bg-gray-100 rounded text-sm"
        >
          <code className="font-bold">#{name}</code>
          <p className="text-xs text-gray-600">{COMMANDS_INFO[name].desc}</p>
        </button>
      ))}
    </div>
  )
}
```

---

### Command Integration in Message Composer

```jsx
// MessageComposer.tsx
const [input, setInput] = useState('')
const [suggestions, setSuggestions] = useState([])

const handleInputChange = (text) => {
  setInput(text)
  
  if (text.startsWith('#')) {
    const cmd = parseCommand(text)
    if (cmd) {
      const matching = Object.keys(COMMANDS_INFO)
        .filter(name => name.startsWith(cmd.name))
      setSuggestions(matching)
    }
  } else {
    setSuggestions([])
  }
}

const handleSend = async () => {
  const cmd = parseCommand(input)
  
  if (cmd) {
    // Execute command
    const result = await handleCommand(cmd, currentConversation, currentWallet)
    
    if (result.success) {
      showNotification(result.message, 'success')
    } else {
      showNotification(result.message, 'error')
    }
    
    setInput('')
  } else {
    // Send regular message
    await sendMessage(currentConversation, {
      content: input,
      type: 'text'
    })
    setInput('')
  }
}

return (
  <div>
    <div className="relative">
      <input
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Message or start with #"
        className="w-full p-3 border rounded"
      />
      {suggestions.length > 0 && (
        <CommandSuggestions 
          suggestions={suggestions}
          onSelect={(cmd) => {
            setInput(cmd + ' ')
            setSuggestions([])
          }}
        />
      )}
    </div>
    <button
      onClick={handleSend}
      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
    >
      Send
    </button>
  </div>
)
```

---

## Part 4: Backend Implementation for Commands

### Command Registry & Dispatcher

```ts
// commandRegistry.ts
type CommandHandler = (
  args: string[],
  context: CommandContext
) => Promise<{ success: boolean; message: string }>

interface CommandContext {
  conversationId: string
  senderWallet: string
  replyToMessageId?: string
  groupId?: string
  authorizedFor?: string[] // ['admin', 'owner']
}

const commandRegistry: Map<string, CommandHandler> = new Map()

export function registerCommand(name: string, handler: CommandHandler) {
  commandRegistry.set(name, handler)
}

export async function executeCommand(
  cmd: Command,
  context: CommandContext
): Promise<{ success: boolean; message: string }> {
  const handler = commandRegistry.get(cmd.name)
  
  if (!handler) {
    return { success: false, message: `Unknown command: #${cmd.name}` }
  }
  
  try {
    return await handler(cmd.args, context)
  } catch (err) {
    console.error(`Command ${cmd.name} failed:`, err)
    return { success: false, message: 'Command execution failed' }
  }
}

// Register all commands
registerCommand('send', handleSendPayment)
registerCommand('tip', handleTip)
registerCommand('remind', handleReminder)
registerCommand('pin', handlePin)
registerCommand('poll', handlePoll)
registerCommand('translate', handleTranslate)
registerCommand('mute', handleMute)
registerCommand('nft-check', handleNFTCheck)
registerCommand('help', handleHelp)
registerCommand('burn', handleBurn)
registerCommand('links', handleLinks)
```

### API Endpoint for Commands

```ts
// routes/commands.ts
app.post('/messages/command', authMiddleware, async (req, res) => {
  const { conversationId, command } = req.body
  const wallet = req.user.wallet
  
  const cmd = parseCommand(command)
  if (!cmd) {
    return res.status(400).json({ error: 'Invalid command format' })
  }
  
  const context: CommandContext = {
    conversationId,
    senderWallet: wallet,
    groupId: await getGroupId(conversationId)
  }
  
  const result = await executeCommand(cmd, context)
  
  // Log command execution
  await logCommandExecution({
    command: cmd.name,
    wallet,
    conversationId,
    success: result.success,
    executedAt: new Date()
  })
  
  res.json(result)
})
```

---

## Part 5: Security & Rate Limiting

### Rate Limit Commands

```ts
// Rate limit to prevent spam
const RATE_LIMITS = {
  'send': { max: 5, window: 60 * 60 }, // 5 per hour
  'tip': { max: 20, window: 60 * 60 },
  'remind': { max: 10, window: 60 * 60 },
  'poll': { max: 5, window: 60 * 60 * 24 }, // 5 per day
  'pin': { max: 10, window: 60 * 60 }, // admin only
}

async function checkRateLimit(
  wallet: string,
  command: string
): Promise<boolean> {
  const limit = RATE_LIMITS[command]
  if (!limit) return true // No limit
  
  const key = `ratelimit:${wallet}:${command}`
  const count = await redis.incr(key)
  
  if (count === 1) {
    await redis.expire(key, limit.window)
  }
  
  return count <= limit.max
}

// Use in command handler
if (!(await checkRateLimit(context.senderWallet, cmd.name))) {
  return { success: false, message: 'Rate limit exceeded' }
}
```

---

## Part 6: Testing Commands

```ts
// commands.test.ts
describe('Commands', () => {
  describe('#send', () => {
    it('should send payment', async () => {
      const result = await handleSendPayment(
        ['0x123', '5', 'SOL'],
        'conv-1',
        'wallet-a'
      )
      expect(result.success).toBe(true)
    })
    
    it('should reject invalid wallet', async () => {
      const result = await handleSendPayment(
        ['invalid', '5', 'SOL'],
        'conv-1',
        'wallet-a'
      )
      expect(result.success).toBe(false)
    })
  })
  
  describe('#poll', () => {
    it('should create poll with options', async () => {
      const result = await handlePoll(
        ['Yes|No|Maybe'],
        'conv-1'
      )
      expect(result.success).toBe(true)
    })
  })
})
```

---

## Conclusion

Your Web3 chat app now has:

✅ **10+ Quality-of-Life Features** for smooth UX
✅ **Multiple Anonymous Modes** for privacy
✅ **13+ `#`-based Commands** for productivity
✅ **Command Auto-suggestion** for discoverability
✅ **Rate Limiting & Security** for stability
✅ **Extensible Architecture** for adding more commands

This README covers implementation from frontend UI to backend API and rate limiting. Your agent can use this directly to build out the system.

---

## Next Steps

1. Prioritize top 5 features and 5 commands for MVP
2. Implement command parser and auto-suggestion
3. Build command handlers on frontend and backend
4. Add WebSocket events for real-time command responses
5. Test extensively with multiple wallets
6. Deploy and gather user feedback

*This guide provides a complete blueprint for a modern, privacy-first Web3 messaging app with powerful, extensible commands that feel native to crypto communities.*
