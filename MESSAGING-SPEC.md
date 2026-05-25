# Onbeex Messaging System — Production Design Specification

> **Status:** v1.0 · **Priority:** High · **Audience:** Engineering & Design

---

## Table of Contents

1. [Messaging Architecture](#1-messaging-architecture)
2. [Sender vs Recipient UX](#2-sender-vs-recipient-ux)
3. [Reply & Threading System](#3-reply--threading-system)
4. [Group Messaging Experience](#4-group-messaging-experience)
5. [Attachments & Rich Content](#5-attachments--rich-content)
6. [Invoice & Financial Messaging UX](#6-invoice--financial-messaging-ux)
7. [Message Composer & Input Area](#7-message-composer--input-area)
8. [Search, Navigation & Organization](#8-search-navigation--organization)
9. [Notifications & Attention System](#9-notifications--attention-system)
10. [States & Edge Cases](#10-states--edge-cases)
11. [Accessibility & Usability](#11-accessibility--usability)
12. [Performance & Scalability](#12-performance--scalability)
13. [Security & Permissions](#13-security--permissions)
14. [Visual Direction](#14-visual-direction)
15. [Implementation Roadmap](#15-implementation-roadmap)

---

## 1. Messaging Architecture

### 1.1 Conversation Types

| Type | Participants | Use Case | Persistence |
|------|-------------|----------|-------------|
| **1:1 Direct** | 2 users | Employee ↔ employee, manager ↔ staff | Permanent until archived |
| **Group** | 3+ users | Team discussions, department channels | Permanent |
| **Business→Customer** | Business user + customer(s) | Support, order updates | Tied to customer lifecycle |
| **Transactional** | System + user(s) | Automated receipts, payment confirmations | Read-only history |
| **Invoice/Payment** | Business + customer + system | Billing disputes, payment negotiations | Linked to invoice record |

### 1.2 Message Hierarchy

```
Conversation (Channel/Thread List Item)
├── Message (atomic unit)
│   ├── Text content
│   ├── Rich content (attachments, invoices, embeds)
│   ├── Reply reference (parent message ID)
│   └── Metadata (sender, timestamp, status, edit history)
├── Thread Reply (branch from a message)
│   └── Nested replies (max depth: 1 level for simplicity)
└── System Event (join, leave, payment, invoice)
```

### 1.3 Conversation Flow

```
User selects conversation
  → Load last N messages (pagination)
  → Real-time connection (WebSocket)
  → New messages arrive via push
  → User sends message → optimistic UI → server confirm → status update
  → Inactivity → session persists, unread badge increments
```

### 1.4 Chat Session Behavior

- **Active session:** Real-time via WebSocket with auto-reconnect (exponential backoff: 1s, 2s, 4s, 8s, max 30s)
- **Idle detection:** After 5 min of user inactivity, show "Away" status
- **Background tab:** Disconnect after 30 min, use push notifications
- **Session resume:** On tab focus, reconnect and fetch missed messages via `last_read_message_id`

### 1.5 Thread Structure

```json
{
  "id": "msg_abc123",
  "conversation_id": "conv_456",
  "sender_id": "user_789",
  "type": "text | attachment | invoice | system",
  "content": { "text": "..." },
  "reply_to": null | "msg_parent_id",
  "thread_replies_count": 0,
  "created_at": "ISO8601",
  "edited_at": null,
  "deleted_at": null,
  "status": "sending | sent | delivered | read | failed"
}
```

### 1.6 Reply Mechanics

- Inline reply: `reply_to` references parent message UUID
- Quoted reply: Show excerpt of parent + "Replying to [Name]"
- Thread view: Click reply count → open right-side thread panel
- Max nesting: 1 level (thread reply cannot be replied to again)

### 1.7 Scalability Considerations

- **Database:** Shard conversations by `conversation_id` hash; index on `(conversation_id, created_at)`
- **Caching:** Cache last 50 messages per conversation in Redis; warm cache on first load
- **Pagination:** Keyset pagination (`WHERE created_at < cursor`) — avoid `OFFSET`
- **WebSocket:** One persistent connection per tab; multiplex all conversations
- **File storage:** Uploads go directly to S3/R2 via presigned URLs (avoid server proxy)
- **CDN:** Serve all attachment thumbnails and avatars via CDN with cache-control headers
- **Rate limits:** 30 messages/min per user; 10 attachments/min per user

---

## 2. Sender vs Recipient UX

### 2.1 Layout Rules

| Message Type | Alignment | Bubble Color | Avatar | Tail |
|-------------|-----------|-------------|--------|------|
| **Sender (You)** | Right | Brand primary (`#006254`) | Hidden (show only if grouped) | Right-side tail |
| **Recipient** | Left | Card background (`#FFFFFF`/`#181A22`) | Always shown | Left-side tail |
| **System** | Center | Transparent | None | None |

### 2.2 Message Status Indicators

```
Sent:        [✓]   (single gray check)
Delivered:   [✓✓]  (double gray check)
Read:        [✓✓]  (double blue/primary check)
Failed:      [⚠]   (red warning) + "Tap to retry"
Sending:     [⟳]   (spinner, max 10s before fail)
```

### 2.3 Timestamps

- **Same day:** `2:07 PM`
- **Yesterday:** `Yesterday 2:07 PM`
- **This week:** `Mon 2:07 PM`
- **Older:** `Nov 15 2:07 PM`
- **Hover all:** Show full ISO timestamp in tooltip

### 2.4 Bubble Sizing

- **Max width:** 70% of container (sender), 75% (recipient)
- **Min width:** 60px (even for short messages)
- **Padding:** `12px 16px` (comfortable touch target)
- **Long words:** `overflow-wrap: break-word; word-break: break-word`
- **Empty messages:** Not allowed; validate on client + server

### 2.5 Hover Actions

Hovering any message reveals:

```
[Reply] [React] [More ⋮]
                 ├── Edit (within 5 min, sender only)
                 ├── Delete for me
                 ├── Delete for everyone (within 15 min, sender only)
                 ├── Copy text
                 ├── Forward
                 ├── Pin (admin only)
                 └── Report (recipient only)
```

### 2.6 Contextual Menu

Right-click (or long-press mobile) opens same actions as hover menu. On mobile, use `overflow: visible` bottom sheet instead.

### 2.7 Edited Messages

- Show `(edited)` in muted text next to timestamp
- On hover, show "Edited at [time]"
- Store edit history (last 5 versions) for audit
- Max edit window: 5 minutes after sending

### 2.8 Deleted/Revoked Messages

- **Deleted for me:** Remove from local view only
- **Deleted for everyone:** Replace with `[Message deleted]` in italic muted text
- **Revoked invoice:** Replace with `[Invoice #1234 revoked]` in orange with reason

### 2.9 Message Grouping

- Messages from the same sender within 5 minutes → group together
- Grouped messages: only show avatar on the last message, bubble connects with 2px gap
- Timestamp shown only on last message in group
- Sender name shown only on first message in group (in group chats)

### 2.10 Responsive Adaptation

| Breakpoint | Behavior |
|-----------|----------|
| >1024px | Full layout: sidebar + list + chat |
| 768–1024px | Sidebar collapses to icons; list + chat visible |
| <768px | Single view: navigate between list and chat with back button |
| <480px | Minimal — hide sender names, reduce padding to 12px |

---

## 3. Reply & Threading System

### 3.1 Inline Reply

```
┌─────────────────────────────────┐
│ Replying to Esther              │ ← pill above composer
│ "Can you check invoice #234?"   │   with X to dismiss
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Type a message...]        [→]  │
└─────────────────────────────────┘
```

### 3.2 Quoted Reply in Feed

```
┌──────────────────────┐ ←─── Recipient message (left)
│ ┌──────────────────┐ │
│ │ Esther:          │ │ ←─── Quoted excerpt
│ │ "Can you check   │ │       (max 3 lines, ellipsis)
│ │ invoice #234?"   │ │
│ │ ─────────────── │ │
│ │ Sure, let me     │ │ ←─── Actual reply
│ │ look now.        │ │
│ └──────────────────┘ │
│ 12:30 PM              │
└──────────────────────┘
```

### 3.3 Thread Panel (Sidebar)

- Click reply count (e.g., "3 replies") on any message
- Opens a right-side thread panel (overlay on mobile)
- Panel shows: parent message + all thread replies chronologically
- Panel has its own composer (not the main one)
- Closing panel returns to main feed

### 3.4 Jump-to-Original

- Click "View original message" on a reply in a thread
- Scrolls main feed to parent message and highlights it briefly (2s yellow fade)
- Works even if parent is outside current visible window

### 3.5 Reply Content Types

| Content Type | Reply Preview |
|-------------|---------------|
| Text | Show first 80 chars |
| Image | Show thumbnail 40×40 |
| Video | Show video icon + filename |
| PDF/File | Show file icon + filename |
| Invoice | Show invoice card mini |
| Payment Ref | Show amount + status badge |
| Voice Note | Show mic icon + duration |

---

## 4. Group Messaging Experience

### 4.1 Group Header

```
[Avatar Stack: A+B+C]  Sales Team  (12 members)
                       ● 3 online
```

- Avatar stack shows up to 3 faces, +N overflow
- Click header → group info panel (member list, settings)

### 4.2 Message Layout

```
┌──────────────────────────────────────────┐
│ [A] ┌──────────────────────────────────┐ │
│     │ Alex Johnson                      │ │ ←── Sender name (shown once, first msg)
│     │ "Hey team, the quarterly report"  │ │
│     │ "is ready for review."            │ │ ←── Continuation (no name)
│     │ 2:30 PM                           │ │
│     └──────────────────────────────────┘ │
│                                          │
│ [B] ┌──────────────────────────────────┐ │
│     │ Bianca                           │ │ ←── Different sender → show name
│     │ "Great, I'll take a look."       │ │
│     │ 2:32 PM                     ✓✓  │ │
│     └──────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### 4.3 Avatar Visibility Logic

| Condition | Avatar Shown |
|-----------|-------------|
| First message by sender | Yes |
| Consecutive message (≤5 min gap) | No (grouped) |
| New message after another sender | Yes |
| Message has reaction | Yes |
| Message is pinned | Yes |

### 4.4 Mentions (@)

- Type `@` → autocomplete user list (max 10 suggestions)
- Mentioned user gets highlighted in blue within message
- Mentioned user receives push notification regardless of mute settings
- `@all` / `@everyone` — restricted to admins, shows confirmation dialog

### 4.5 Role Labels

- Show role badge below name in first message of group: `Admin`, `Owner`, `Member`
- Badge style: small pill, 10px font, muted background
- In hover tooltip: full role title

### 4.6 Typing Indicators

- Show `Bianca is typing...` in the chat header area
- Multi-user: `Bianca and Alex are typing...`
- 3+ users: `Bianca, Alex and 2 others are typing...`
- Animated dots (3 bouncing dots)
- Timeout: hide after 5s of no input

### 4.7 Unread Separators

```
─── New ───
[New messages since your last visit]
```

- Shown after pagination load
- Click "Jump to first unread" button at bottom
- Sticky separator as new messages arrive

### 4.8 Reactions

- Hover message → `+` reaction button
- Common reactions: 👍 ❤️ 😂 😮 😢 🙏
- Click existing reaction to toggle
- Show reaction count + who reacted in tooltip
- Max 20 unique reactions per message

---

## 5. Attachments & Rich Content

### 5.1 Attachment Types

| Type | Max Size | Preview | Thumbnail |
|------|---------|---------|-----------|
| Image (jpg, png, webp) | 20MB | Lightbox gallery | 200px, lazy loaded |
| Video (mp4, webm) | 100MB | Player with poster frame | 200px with play overlay |
| PDF | 50MB | Native PDF viewer | First page thumbnail |
| Spreadsheet (xlsx, csv) | 20MB | Table preview (first 10 rows) | Icon |
| Document (docx, txt) | 20MB | Text excerpt (first 500 chars) | Icon |
| Audio (mp3, wav) | 30MB | Waveform visualizer | Audio wave icon |

### 5.2 Upload Flow

```
User selects file
  → Show thumbnail immediately (optimistic)
  → Upload via presigned URL (direct to S3)
  → Progress bar (linear determinate)
  → On success: replace thumbnail with permanent URL
  → On failure: show retry button, keep in compose area
```

### 5.3 Attachment Grid

```
Single: ┌──────────────┐
        │   Image      │
        └──────────────┘

Two:    ┌──────┬──────┐
        │  A   │  B   │
        └──────┴──────┘

Three:  ┌────────┬─────┐
        │   A     │  B  │
        ├────────┴─────┤
        │     C        │
        └──────────────┘

Four+:  ┌──────┬──────┐
        │  A   │  B   │
        ├──────┼──────┤
        │  C   │ D+N  │  ←── +N overlay
        └──────┴──────┘
```

### 5.4 File Metadata

- Show below filename: `2.4 MB · PDF · Uploaded Nov 15`
- In chat bubble: compact file card with icon, name, size, download button

### 5.5 Unsupported Files

- Show generic file icon
- Message: `File type not supported for preview. Download to view.`
- Download button always available

### 5.6 Link Previews

- Automatically fetch OG metadata for URLs
- Show: thumbnail (if available) + title + description + domain
- Cache preview data for 24 hours
- Allow user to remove preview before sending

---

## 6. Invoice & Financial Messaging UX

### 6.1 Invoice Card (in Message Feed)

```
┌──────────────────────────────────────┐
│ [Receipt Icon]  INVOICE  #INV-2024-0042 │
│                                      │
│  Customer:  Acme Corp                │
│  Amount:    ₦2,450,000.00            │
│  Due:       Dec 15, 2024             │
│  Status:    ● Pending                │
│                                      │
│  ┌──────────┐  ┌──────────┐         │
│  │ View     │  │ Pay Now  │         │
│  └──────────┘  └──────────┘         │
└──────────────────────────────────────┘
```

### 6.2 Invoice Status Badges

| Status | Color | Icon | Description |
|--------|-------|------|-------------|
| Draft | Gray | 📄 | Not yet sent |
| Pending | Amber | ⏳ | Awaiting payment |
| Paid | Green | ✅ | Payment confirmed |
| Overdue | Red | ⚠️ | Past due date |
| Cancelled | Gray | 🚫 | Revoked by sender |
| Disputed | Orange | ⚖️ | Under dispute |
| Partial | Blue | 💰 | Partially paid |

### 6.3 Payment Confirmation Card

```
┌──────────────────────────────────────┐
│ [Checkmark]  PAYMENT CONFIRMED        │
│                                      │
│  Invoice:   INV-2024-0042            │
│  Amount:    ₦2,450,000.00            │
│  Method:    Bank Transfer             │
│  Ref:       OBNX-PAY-A7F3            │
│  Date:      Dec 1, 2024 14:30        │
│                                      │
│  ┌──────────────────────────┐        │
│  │ Download Receipt         │        │
│  └──────────────────────────┘        │
└──────────────────────────────────────┘
```

### 6.4 Fraud/Security Indicators

- **Verified badge:** Blue checkmark on sender name if identity is confirmed
- **Trust score:** Shield icon + score (1–100) for first-time transactors
- **Suspicious:** Orange border + warning text if payment details mismatch
- **Flagged:** Red badge + "This transaction is under review" banner

### 6.5 CTA Actions

| Action | Behavior |
|--------|----------|
| View Invoice | Opens invoice detail modal/PDF |
| Download | Downloads PDF copy |
| Pay Now | Opens payment modal (integrated payment gateway) |
| Verify Payment | Triggers reconciliation check |
| Mark as Paid | Manual confirmation (requires reason + proof) |
| Dispute Transaction | Opens dispute form with reason codes |
| Request Extension | Sends due-date extension proposal |

### 6.6 Expired Invoice

```
┌──────────────────────────────────────┐
│ [Clock]  INVOICE EXPIRED              │
│                                      │
│  INV-2024-0042 expired on            │
│  Dec 15, 2024                        │
│                                      │
│  ┌──────────┐  ┌──────────┐         │
│  │ View     │  │ Re-issue │         │
│  └──────────┘  └──────────┘         │
└──────────────────────────────────────┘
```

---

## 7. Message Composer & Input Area

### 7.1 Desktop Composer

```
┌────────────────────────────────────────────────────────┐
│ [+] [@] [😊]  [Type a message...]            [🎤] [📎] │
│                                                       │
│ [📄 Reference: INV-2024-0042]                    [→ Send] │
└────────────────────────────────────────────────────────┘
```

**Toolbar order (left to right):**
1. Attach files (📎) — opens file picker
2. Mention (@) — inserts @ into text
3. Emoji (😊) — opens emoji picker grid
4. Text area (expandable, 1–6 rows)
5. Voice note (🎤) — hold to record (desktop: click to start/stop)
6. Quick actions — invoice, template, payment request
7. Send button (→)

### 7.2 Composer States

| State | Behavior |
|-------|----------|
| Empty | Placeholder text, send button disabled |
| Typing | Send button active, auto-resize textarea |
| Attachments | Show attachment chips above text area |
| Replying | "Replying to [Name]" pill above textarea |
| Voice recording | Pulsing red dot, waveform, cancel + send |
| Mention active | Dropdown list filtered by input |
| Maximized | Textarea expands to 6 rows, shows all toolbar options |
| Drag over | Blue dashed border overlay, "Drop files here" |

### 7.3 Mobile Composer

```
┌──────────────────────────────────────┐
│ [😊] [Type a message...]    [📎] [→] │
└──────────────────────────────────────┘
```

- Single row with `+` to expand toolbar
- Voice button integrated into expanded toolbar
- Emoji picker: bottom sheet, searchable
- Attach: system share sheet (iOS/Android native)
- Quick reply from notification

### 7.4 Drag-and-Drop Upload

- Drag files over composer area → overlay with "Drop to attach" + blue border
- Accepts: images, PDFs, documents (validate on drop)
- Reject: unsupported types (show brief error toast)
- Multiple files: upload in parallel (max 10 at once)

### 7.5 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Ctrl+B` | Bold (future rich text) |
| `Ctrl+I` | Italic (future rich text) |
| `Ctrl+Shift+M` | Mention picker |
| `Ctrl+Shift+I` | Attach invoice |
| `Esc` | Close reply/emoji/mention |
| `Ctrl+K` | Search conversations |
| `Ctrl+Shift+F` | Search in current chat |

---

## 8. Search, Navigation & Organization

### 8.1 Conversation Search

- Search bar at top of conversation list
- Search by: contact name, message content, invoice number
- Results grouped by conversation
- Debounce: 300ms
- Minimum query length: 2 characters
- Highlight matched terms in results

### 8.2 In-Chat Search

```
┌──────────────────────────────────────┐
│ [🔍] [Search in conversation...] [✕]│
└──────────────────────────────────────┘
   ▲ Matches: 3 of 1,245 messages
   ▲ "invoice" — 3 matches
   ┌──────────────────────────────────┐
   │ ...check the *invoice* #234       │ ←── highlight + scroll to
   │ ...sent the *invoice* yesterday   │
   │ ...*invoice* was paid             │
   └──────────────────────────────────┘
```

- Up/down arrows to navigate between matches
- Current match highlighted with primary color border
- Match count: "3 of 1,245 messages"

### 8.3 Filter & Organization

| Filter | Description |
|--------|-------------|
| All | All conversations |
| Unread | Only conversations with unread messages |
| Invoices | Conversations with invoice attachments |
| Attachments | Conversations with file attachments |
| Starred | Manually starred conversations |
| Archived | Hidden from main list |
| Pinned | Always on top of list (max 5) |

### 8.4 Recent Activity

- Show recent activity in sidebar (last 10 actions)
- Types: sent message, received payment, viewed invoice, etc.
- Click → jump to relevant conversation + message

### 8.5 Jump-to-Message

- From search result: click → scroll to exact message
- From notification: click → open conversation → scroll to message
- From thread reply: click "View original" → scroll to parent
- Auto-highlight target message for 2 seconds

---

## 9. Notifications & Attention System

### 9.1 Notification Types

| Type | Priority | Sound | Push | In-app |
|------|----------|-------|------|--------|
| Direct message | High | Yes | Yes | Toast |
| Mention (@) | High | Yes | Yes | Toast + badge |
| Invoice received | High | Yes | Yes | Toast + badge |
| Payment received | High | Yes | Yes | Toast |
| Group message | Normal | Optional | Configurable | Badge only |
| System/transactional | Low | No | No | Subtle badge |

### 9.2 Unread Badges

- **Conversation list:** Badge dot + count (max 99+)
- **Sidebar icon:** Badge dot on Messages icon
- **Browser tab:** Update document title: `(3) Onbeex Messages`
- **Mobile:** Native badge count on app icon

### 9.3 Interruption Management

- **Do Not Disturb:** Mute all sounds 10PM–7AM (configurable)
- **Focus mode:** Only mentions and invoice notifications
- **Per-conversation mute:** Mute for 1h, 8h, 24h, or forever
- **Quiet hours:** Configurable per user profile

### 9.4 Push Notification Logic

```
Message received
  → Check DND mode
  → Check conversation mute
  → If user is active on web: send in-app only (no push)
  → If user inactive for >5min: send push via WebPush/FCM
  → Group similar notifications within 60s
```

### 9.5 Typing & Presence

- Typing indicator broadcast: 3s debounce
- Presence: online, away (5min idle), offline
- Presence check: heartbeat every 30s via WebSocket
- Show last seen: "Last seen 2h ago" (privacy setting: everyone, contacts, nobody)

---

## 10. States & Edge Cases

### 10.1 Empty State

```
┌──────────────────────────────────────┐
│                                      │
│         [Chat bubble icon]           │
│                                      │
│      No messages yet                 │
│  Start a conversation by sending     │
│  a message or sharing an invoice.    │
│                                      │
│  ┌──────────────────────────┐        │
│  │  Send first message      │        │
│  └──────────────────────────┘        │
│                                      │
└──────────────────────────────────────┘
```

### 10.2 Loading State

- Skeleton loader: 3–5 placeholder message bubbles with shimmer animation
- Conversation list: 5 skeleton rows (avatar + 2 text lines)
- Show after 300ms (avoid flash on fast connections)
- Max 10s then show error state with retry

### 10.3 Offline Mode

- Banner at top: "You're offline. Messages will send when reconnected."
- Messages queued locally with "sending" status
- Sender can still compose and attach files (queued locally)
- Reconnect → flush queue in order
- Failed flush → mark individual messages as failed

### 10.4 Reconnecting State

- Banner: "Reconnecting..." with animated dots
- After 10s: "Still reconnecting..." with retry button
- After 30s: "Connection lost" — show full-page retry

### 10.5 Failed Message States

```
┌──────────────────────────────────┐
│ [⚠] Failed to send. [Retry] [✕] │ ←── inline with message
└──────────────────────────────────┘
```

- Red error icon + "Failed to send" text
- "Tap to retry" or dismiss
- Long-press → "Resend" option
- Auto-retry once on reconnect

### 10.6 Failed Uploads

- Show failed thumbnail with error overlay
- "Upload failed. Tap to retry."
- Max 3 retries, then permanent failure state
- Remove from compose or retry

### 10.7 Blocked Users

- One-way block: blocked user cannot send messages
- Blocked conversation: show "You blocked [Name]"
- Option to unblock
- Existing messages remain visible (configurable)

### 10.8 Archived Chats

- Moved from main list to "Archived" section
- No push notifications from archived conversations
- Unarchiving restores to main list
- Auto-archive after 90 days of inactivity (configurable)

### 10.9 Deleted/Deactivated Accounts

- Show "[User] left" system message in group chats
- 1:1 chat: show "Account deactivated" in header
- Sent messages remain visible (sender becomes "Unknown User")

---

## 11. Accessibility & Usability

### 11.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate through interactive elements |
| `Ctrl+K` | Focus conversation search |
| `Esc` | Close modals, dropdowns, search |
| `Arrow Up/Down` | Navigate conversation list |
| `Enter` | Select conversation / send |
| `/` | Focus composer |

### 11.2 Screen Reader Support (WCAG 2.1 AA)

- **Landmarks:** `role="complementary"` on sidebar, `role="main"` on chat area, `role="search"` on search
- **Live regions:** `aria-live="polite"` on message feed for new messages
- **Buttons:** All icon buttons have `aria-label`
- **Status:** `aria-live="assertive"` for delivery/error states
- **Announcements:** "Message sent", "New message from [Name]"
- **Focus management:** Auto-focus composer after sending; focus first message when opening thread
- **Skip link:** "Skip to content" at top of page

### 11.3 Touch Optimization

- **Tap targets:** Minimum 44×44px for all interactive elements
- **Swipes:**
  - Swipe left on conversation → Archive
  - Swipe right → Mark as read/unread
  - Long press message → Context menu (bottom sheet on mobile)
- **Input:** Native `inputmode` values for mobile keyboards
- **Zoom:** `maximum-scale=1` to prevent accidental zoom on double-tap

### 11.4 Motion Guidelines

- **Duration:**
  - Micro-interactions: 150ms (buttons, toggles)
  - Transitions: 250ms (panels, modals)
  - Page navigation: 300ms
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` — standard Material curve
- **Reduced motion:** Respect `prefers-reduced-motion` — disable animations, fade instead of slide
- **No parallax, no auto-scrolling animations, no parallax effects**

### 11.5 High Contrast

- All text meets WCAG AA (4.5:1) against backgrounds
- Focus indicators: 2px solid outline with 2px offset
- Status colors have text labels (not color-only)
- Dark mode: all colors adjusted for contrast on dark backgrounds

---

## 12. Performance & Scalability

### 12.1 Lazy Loading Strategy

- **Conversation list:** Load first 20, then 20 more on scroll (`IntersectionObserver`)
- **Message feed:** Load first 50 messages, paginate up with "Load earlier messages" at top
- **Avatars:** Lazy load with blur placeholder (20px tiny image → full)
- **Message search:** Index messages in-memory for current view, search server-side for full history

### 12.2 Virtualization

- Use `react-virtual` / `@tanstack/virtual` for message list
- Only render messages in current viewport + 200px overscan
- Fixed row height for simple text messages, variable for attachments
- Estimate row height based on content type (text: 60px, image: 300px, invoice: 200px)

### 12.3 Media Optimization

- **Images:** Upload → resize to 3 sizes (thumbnail 200px, preview 1200px, original)
- **Videos:** Generate thumbnail poster frame server-side
- **PDFs:** Generate first-page thumbnail server-side
- **All uploads:** Compress with WebP for images, H.264 for videos
- **CDN:** Cloudflare/CloudFront with 1-year cache for static assets
- **Progressive loading:** Load thumbnails first, full-quality on click

### 12.4 Long Chat Optimization

- Archive messages older than 6 months to cold storage
- Show "Jump to date" date picker for old chats
- Pagination count: max 500 messages loaded at once in memory
- Periodic cleanup: remove deleted messages >30 days

---

## 13. Security & Permissions

### 13.1 Role-Based Permissions

| Role | Send | Delete Any | Pin | Manage Members | View Invoices | Export |
|------|------|-----------|-----|---------------|--------------|--------|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manager | ✓ | Own only | ✓ | — | ✓ | ✓ |
| Staff | ✓ | Own only | — | — | Assigned only | — |
| Customer | ✓ | Own only | — | — | Own only | — |

### 13.2 Invoice Visibility

- Invoices visible only to participants in the conversation
- Role-based: only finance role sees amounts, others see status only
- Export requires 2FA for sensitive invoices
- Audit log: every invoice view/download is logged

### 13.3 Attachment Permissions

- **View:** All conversation participants
- **Download:** Controlled by role (customers can download receipts only)
- **Delete:** Sender (within 15 min) or admin
- **Expiry:** Auto-expire shared documents after 30 days (configurable per org)

### 13.4 Fraud & Security Indicators

- **New device login:** Show banner "[User] logged in from new device"
- **Large payments:** Double confirmation dialog for amounts >₦500,000
- **Suspicious links:** Client-side scan + warn before opening
- **Rate limiting:** Block sender after 50 messages in 1 minute (30-min cooldown)
- **Encryption:** TLS in transit, AES-256 at rest for messages and attachments

---

## 14. Visual Direction

### 14.1 Design Principles

- **Modern but grounded:** Clean whitespace, subtle shadows, no skeuomorphism
- **Enterprise-grade:** Structured, predictable, reliable
- **Invoice-forward:** Financial data is first-class content, not an afterthought
- **Scalable:** Design system with consistent tokens (already in `styles.css`)

### 14.2 Reference Pattern Adaptations

| Pattern | Source | Adaptation for Onbeex |
|---------|--------|----------------------|
| Conversation list threading | Slack | Add invoice status badges |
| Message reactions | Discord | Limit to business-appropriate emojis |
| Composer with toolbar | Linear | Add invoice/payment quick actions |
| Thread panel | Notion Chat | Show financial context in threads |
| Inline replies | WhatsApp | Add invoice reference preview |
| Customer context sidebar | Intercom | Show customer transaction history |

### 14.3 Spacing System

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
```

All spacing follows multiples of 4px. Use for margins, padding, and gaps.

### 14.4 Typography

- **UI:** `DM Sans` (already loaded) — 400, 550, 600, 700, 800 weights
- **Numbers:** `Fraunces` with `font-variant-numeric: tabular-nums` (already loaded)
- **Scale:** 11px, 12px, 13px, 14px, 16px, 20px, 24px
- **Line height:** `1.5` for body, `1.2` for headings

### 14.5 Color System (Already Defined)

The current CSS custom properties provide a complete light/dark palette. The brand teal (`#006254`) should be maintained consistently.

---

## 15. Implementation Roadmap

### Phase 1 — Foundation (Week 1–2)
- [x] Basic message send/receive (current state)
- [x] Sender vs recipient styling (current state)
- [ ] Real-time WebSocket integration
- [ ] Message status indicators (sent/delivered/read)
- [ ] Database schema + API endpoints

### Phase 2 — Rich Messaging (Week 3–4)
- [ ] File upload with progress
- [ ] Image gallery + lightbox
- [ ] Link previews
- [ ] Emoji reactions
- [ ] Message reply (inline)
- [ ] Edit and delete messages

### Phase 3 — Financial Features (Week 5–6)
- [ ] Invoice card component
- [ ] Payment confirmation card
- [ ] Pay Now / Mark as Paid actions
- [ ] Invoice status lifecycle
- [ ] Transaction references in composer

### Phase 4 — Group & Threads (Week 7–8)
- [ ] Group conversation creation
- [ ] Mentions + autocomplete
- [ ] Thread panel
- [ ] Pinned messages
- [ ] Role labels and admin controls

### Phase 5 — Search & Navigation (Week 9–10)
- [ ] Full conversation search
- [ ] In-chat search with highlights
- [ ] Filters (invoices, attachments, unread)
- [ ] Star/unstar, archive
- [ ] Jump-to-message

### Phase 6 — Polish (Week 11–12)
- [ ] Performance optimization + virtualization
- [ ] Accessibility audit and fixes
- [ ] Offline support
- [ ] Push notifications
- [ ] Mobile responsive polish

---

*This specification is a living document. Update as implementation reveals new requirements.*
