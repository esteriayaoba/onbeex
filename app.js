document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();

    // ===== DATA =====
    const EMOJIS = ['👍','❤️','😂','😮','😢','🙏','🔥','🎉','💯','⭐'];
    const CHAT_USERS = {
        warehouse: { name: 'Warehouse Team', avatarLetter: 'W', role: 'Logistics' },
        ifeoluwa: { name: 'Ifeoluwa', avatarLetter: 'I', role: 'Manager' },
        sales: { name: 'Sales Team', avatarLetter: 'S', role: 'Group', isGroup: true }
    };
    const RECIPIENT_RESPONSES = {
        warehouse: ["Got it, checking the inventory now.","I'll update the stock levels.","Can you send me the product ID?","All confirmed on my end.","Let me verify with the team.","We have 24 units in stock.","I'll process the order right away."],
        ifeoluwa: ["Thanks for the update!","I'll look into it right away.","Sounds good, let me know if anything changes.","Can we discuss this in the next meeting?","Perfect, thanks for letting me know.","I've reviewed the numbers."],
        sales: ["Got it!","I'll take care of that.","Noted, thanks."]
    };
    const MENTION_USERS = [
        { name: 'Esther Babatunde', avatarLetter: 'E', role: 'Owner' },
        { name: 'Ifeoluwa', avatarLetter: 'I', role: 'Manager' },
        { name: 'Warehouse Team', avatarLetter: 'W', role: 'Logistics' },
        { name: 'Bolanle', avatarLetter: 'B', role: 'Staff' },
        { name: 'Chidi', avatarLetter: 'C', role: 'Accountant' }
    ];
    const GROUP_MEMBERS = ['Ifeoluwa','Bolanle','Chidi','Esther'];

    const chatData = {
        warehouse: {
            name: 'Warehouse Team', avatarLetter: 'W', role: 'Logistics',
            messages: [
                { id: 'w1', sender: 'You', time: '2:07 PM', text: 'am on a product', status: 'read' },
                { id: 'w2', sender: 'Warehouse Team', time: '2:08 PM', text: "Got it, checking the inventory now. Which product ID?", status: 'read' },
                { id: 'w3', sender: 'You', time: '2:10 PM', text: 'PRD-2024-0892. Need to confirm stock levels before the order goes through.', status: 'read' },
                { id: 'w4', sender: 'Warehouse Team', time: '2:12 PM', text: "We have 24 units in stock. That should cover the order. I'll reserve them now.", status: 'read' },
                { id: 'w5', sender: 'You', time: '2:15 PM', text: 'Perfect. Also send me the updated inventory sheet when you get a chance.', status: 'delivered' }
            ]
        },
        ifeoluwa: {
            name: 'Ifeoluwa', avatarLetter: 'I', role: 'Manager',
            messages: [
                { id: 'i1', sender: 'Ifeoluwa', time: '11:30 AM', text: 'Hey, can you review the Q4 financial report before I submit it?', status: 'read' },
                { id: 'i2', sender: 'You', time: '11:45 AM', text: 'Sure, send it over. I\'ll take a look this afternoon.', status: 'read' },
                { id: 'i3', sender: 'Ifeoluwa', time: '11:46 AM', text: "Great, I've shared it via drive. The revenue section needs your input.", status: 'read' },
                { id: 'i4', sender: 'You', time: '1:00 PM', text: 'Just reviewed it. Revenue numbers look solid. I added some notes on the expenses page.', status: 'delivered' }
            ]
        },
        sales: {
            name: 'Sales Team', avatarLetter: 'S', role: 'Group', isGroup: true,
            messages: [
                { id: 's1', sender: 'Ifeoluwa', time: '10:00 AM', text: 'Team, we closed the Acme Corp deal! 🎉 Invoice INV-2024-0042 has been sent.', status: 'read' },
                { id: 's2', sender: 'Bolanle', time: '10:05 AM', text: 'Amazing! That was a tough negotiation. Great work everyone!', status: 'read' },
                { id: 's3', sender: 'You', time: '10:10 AM', text: 'Well done team! Let me process the commission payouts by end of week.', status: 'read' },
                { id: 's4', sender: 'Chidi', time: '10:15 AM', text: 'Payment has been confirmed from their side. Funds should reflect in 2-3 business days.', status: 'read' },
                { id: 's5', sender: 'You', time: '10:20 AM', text: 'Invoice INV-2024-0042', type: 'invoice', invoice: { number: 'INV-2024-0042', customer: 'Acme Corp', amount: '₦2,450,000.00', due: 'Dec 15, 2024', status: 'pending' } },
                { id: 's6', sender: 'Ifeoluwa', time: '10:22 AM', text: 'That\'s the one. Let me follow up with their finance team on the payment timeline.', status: 'read' }
            ]
        }
    };

    let activeChatId = 'warehouse';
    let replyToId = null;
    let editingId = null;
    let searchMatches = [];
    let searchIndex = -1;
    let isRecording = false;
    let isDark = false;

    // ===== DOM REFS =====
    const $ = id => document.getElementById(id);
    const threadItems = () => document.querySelectorAll('.thread-item');
    const messageFeed = $('message-feed');
    const messageTextarea = $('message-textarea');
    const btnSend = $('btn-send-message');
    const activeChatAvatar = $('active-chat-avatar');
    const activeChatName = $('active-chat-name');
    const activeChatStatus = $('active-chat-status');
    const themeToggleBtn = $('theme-toggle-btn');
    const themeIcon = $('theme-icon');
    const btnNewChat = $('btn-new-chat');
    const btnConversationSearch = $('btn-conversation-search');
    const conversationSearchBar = $('conversation-search-bar');
    const conversationSearchInput = $('conversation-search-input');
    const conversationSearchClose = $('conversation-search-close');
    const searchMatchCount = $('search-match-count');
    const searchPrev = $('search-prev');
    const searchNext = $('search-next');
    const btnMoreOptions = $('btn-more-options');
    const dropdownMenu = $('dropdown-menu');
    const replyPreview = $('reply-preview');
    const replyPreviewName = $('reply-preview-name');
    const replyPreviewText = $('reply-preview-text');
    const replyPreviewClose = $('reply-preview-close');
    const btnEmoji = $('btn-emoji');
    const emojiPicker = $('emoji-picker');
    const emojiPickerGrid = $('emoji-picker-grid');
    const btnAttach = $('btn-attach');
    const attachMenu = $('attach-menu');
    const btnInvoice = $('btn-invoice');
    const btnVoice = $('btn-voice');
    const referenceTypeSelect = $('reference-type-select');
    const referenceIdWrapper = $('reference-id-wrapper');
    const referenceIdInput = $('reference-id-input');
    const threadPanel = $('thread-panel');
    const threadPanelParent = $('thread-panel-parent');
    const threadPanelReplies = $('thread-panel-replies');
    const threadPanelTextarea = $('thread-panel-textarea');
    const threadPanelSend = $('thread-panel-send');
    const threadPanelClose = $('thread-panel-close');
    const lightbox = $('lightbox');
    const lightboxImage = $('lightbox-image');
    const lightboxClose = $('lightbox-close');
    const lightboxPrev = $('lightbox-prev');
    const lightboxNext = $('lightbox-next');
    const lightboxInfo = $('lightbox-info');
    const offlineBanner = $('offline-banner');
    const dropOverlay = $('drop-overlay');
    const mentionDropdown = $('mention-dropdown');
    const toastContainer = $('toast-container');
    const chatThreadsContainer = $('chat-threads-container');
    const filterAll = $('filter-all');
    const filterUnread = $('filter-unread');
    const filterInvoices = $('filter-invoices');

    // ===== UTILITY =====
    function escapeHTML(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function scrollToBottom() { requestAnimationFrame(() => { messageFeed.scrollTop = messageFeed.scrollHeight; }); }
    function formatTime(date) {
        const h = date.getHours(), m = date.getMinutes().toString().padStart(2,'0');
        return `${((h+11)%12+1)}:${m} ${h>=12?'PM':'AM'}`;
    }
    function generateId() { return 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }

    function showToast(msg, type = 'info') {
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = msg;
        toastContainer.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
    }

    // ===== SKELETON LOADING =====
    function showSkeleton(count = 3) {
        messageFeed.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const s = document.createElement('div');
            s.className = 'skeleton-message';
            s.innerHTML = `<div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line"></div><div class="skeleton-line"></div></div>`;
            if (i % 2 === 1) s.style.justifyContent = 'flex-end';
            messageFeed.appendChild(s);
        }
    }

    // ===== RENDER MESSAGE =====
    function renderMessage(msg, isThread = false) {
        const isMe = msg.sender === 'You';
        const chat = chatData[activeChatId];
        const isGroup = chat && chat.isGroup;
        const avatarLetter = isMe ? 'Y' : (chat ? chat.avatarLetter : msg.sender.charAt(0).toUpperCase());
        const senderName = isMe ? 'You' : msg.sender;
        const showSender = isGroup && !isMe;

        const group = document.createElement('div');
        group.className = `message-group ${msg.type === 'system' ? 'system' : (isMe ? 'me' : 'them')}`;
        group.dataset.messageId = msg.id;

        let content = '';

        if (msg.deleted) {
            content = `<div class="message-content-wrapper"><div class="message-bubble message-deleted">[Message deleted]</div></div>`;
        } else if (msg.type === 'invoice' && msg.invoice) {
            content = `<div class="message-content-wrapper">
                ${showSender ? `<div class="message-meta"><span class="message-sender">${escapeHTML(senderName)}</span></div>` : ''}
                <div class="invoice-card">
                    <div class="invoice-card-header"><span class="invoice-card-title">INVOICE</span><span class="invoice-card-number">${escapeHTML(msg.invoice.number)}</span></div>
                    <div class="invoice-card-body">
                        <div class="invoice-card-row"><span class="invoice-card-label">Customer</span><span class="invoice-card-value">${escapeHTML(msg.invoice.customer)}</span></div>
                        <div class="invoice-card-row"><span class="invoice-card-amount">${escapeHTML(msg.invoice.amount)}</span><span class="invoice-card-status ${msg.invoice.status}">${msg.invoice.status === 'paid' ? '✅' : msg.invoice.status === 'pending' ? '⏳' : msg.invoice.status === 'overdue' ? '⚠️' : ''} ${msg.invoice.status.charAt(0).toUpperCase() + msg.invoice.status.slice(1)}</span></div>
                        <div class="invoice-card-row"><span class="invoice-card-label">Due</span><span class="invoice-card-value">${escapeHTML(msg.invoice.due)}</span></div>
                    </div>
                    <div class="invoice-card-actions">
                        <button class="invoice-card-btn" onclick="alert('Viewing invoice: ${escapeHTML(msg.invoice.number)}')">View</button>
                        <button class="invoice-card-btn" onclick="alert('Downloading invoice: ${escapeHTML(msg.invoice.number)}')">Download</button>
                        <button class="invoice-card-btn primary" onclick="alert('Processing payment for ${escapeHTML(msg.invoice.number)}')">Pay Now</button>
                    </div>
                </div>
                ${renderStatus(msg)}
            </div>`;
        } else if (msg.attachment) {
            const att = msg.attachment;
            content = `<div class="message-content-wrapper">
                ${showSender ? `<div class="message-meta"><span class="message-sender">${escapeHTML(senderName)}</span><span class="message-time fraunces-num">${msg.time}</span></div>` : ''}
                ${renderAttachmentGrid(att)}
                ${msg.text ? `<div class="message-bubble" style="${!att ? '' : 'margin-top: 4px;'}">${escapeHTML(msg.text)}</div>` : ''}
                ${renderStatus(msg)}
            </div>`;
        } else {
            content = `<div class="message-content-wrapper">
                ${showSender ? `<div class="message-meta"><span class="message-sender">${escapeHTML(senderName)}</span><span class="message-time fraunces-num">${msg.time}</span></div>` : ''}
                <div class="message-bubble">${escapeHTML(msg.text)}${msg.edited ? ' <span class="message-edited">(edited)</span>' : ''}</div>
                ${renderStatus(msg)}
            </div>`;
        }

        group.innerHTML = content;

        // Actions bar
        if (!msg.deleted && msg.type !== 'system') {
            const actions = document.createElement('div');
            actions.className = 'message-actions';
            actions.innerHTML = `
                <button class="message-action-btn" title="Reply" data-action="reply"><i aria-hidden="true" data-lucide="reply" style="width: 14px;height:14px;"></i></button>
                <button class="message-action-btn" title="React" data-action="react"><i aria-hidden="true" data-lucide="smile-plus" style="width: 14px;height:14px;"></i></button>
                ${isMe ? `<button class="message-action-btn" title="Edit" data-action="edit"><i aria-hidden="true" data-lucide="pencil" style="width: 14px;height:14px;"></i></button>` : ''}
                ${isMe ? `<button class="message-action-btn" title="Delete" data-action="delete"><i aria-hidden="true" data-lucide="trash-2" style="width: 14px;height:14px;"></i></button>` : ''}
                <button class="message-action-btn" title="Copy" data-action="copy"><i aria-hidden="true" data-lucide="clipboard" style="width: 14px;height:14px;"></i></button>
                <button class="message-action-btn" title="Pin" data-action="pin"><i aria-hidden="true" data-lucide="pin" style="width: 14px;height:14px;"></i></button>
                <button class="message-action-btn" title="Thread" data-action="thread"><i aria-hidden="true" data-lucide="message-circle" style="width: 14px;height:14px;"></i></button>
            `;
            group.appendChild(actions);

            // Reactions
            if (msg.reactions && msg.reactions.length > 0) {
                const rDiv = document.createElement('div');
                rDiv.className = 'message-reactions';
                msg.reactions.forEach(r => {
                    const b = document.createElement('span');
                    b.className = `reaction-badge ${r.users.includes('You') ? 'active' : ''}`;
                    b.textContent = `${r.emoji} ${r.count}`;
                    b.onclick = () => toggleReaction(msg.id, r.emoji);
                    rDiv.appendChild(b);
                });
                group.appendChild(rDiv);
            }

            // Reaction picker (quick)
            const rp = document.createElement('div');
            rp.className = 'reaction-picker';
            EMOJIS.slice(0, 6).forEach(e => {
                const btn = document.createElement('button');
                btn.className = 'reaction-option';
                btn.textContent = e;
                btn.onclick = (ev) => { ev.stopPropagation(); toggleReaction(msg.id, e); };
                rp.appendChild(btn);
            });
            group.appendChild(rp);
        }

        // Avatars
        if (!isThread && !isMe && !showSender) {
            const av = document.createElement('div');
            av.className = 'message-avatar';
            av.textContent = avatarLetter;
            group.insertBefore(av, group.firstChild);
        }

        if (!msg.deleted && msg.type !== 'system') {
            const meta = group.querySelector('.message-meta');
            if (meta) {
                const timeSpan = document.createElement('span');
                timeSpan.className = 'message-time fraunces-num';
                timeSpan.textContent = msg.time;
                meta.appendChild(timeSpan);
            }
        }

        return group;
    }

    function renderStatus(msg) {
        if (msg.sender !== 'You' || msg.type === 'system' || msg.deleted) return '';
        const icons = { sending: '⟳', sent: '✓', delivered: '✓✓', read: '✓✓' };
        const cls = msg.status || 'sent';
        return `<div class="message-status ${cls}">${icons[cls] || '✓'}</div>`;
    }

    function renderAttachmentGrid(att) {
        if (!att) return '';
        if (att.type === 'image') {
            const images = att.urls || [att.url];
            const count = images.length;
            let grid = `<div class="attachment-grid attachment-grid-${Math.min(count,4)}">`;
            images.slice(0, 4).forEach((url, i) => {
                grid += `<div class="attachment-item" onclick="openLightbox(${i}, ${JSON.stringify(images).replace(/"/g,"'")})">
                    <img src="${url}" alt="Attachment" onerror="this.style.display='none'">
                    ${i === 3 && count > 4 ? `<div class="attachment-overlay">+${count-4}</div>` : ''}
                </div>`;
            });
            grid += '</div>';
            return grid;
        }
        const icons = { pdf: 'file-text', spreadsheet: 'grid', document: 'file-text' };
        const icon = icons[att.type] || 'file';
        return `<div class="attachment-file" onclick="alert('Opening: ${escapeHTML(att.name || 'file')}')">
            <div class="attachment-file-icon"><i aria-hidden="true" data-lucide="${icon}" style="width:18px;height:18px;"></i></div>
            <div class="attachment-file-info">
                <div class="attachment-file-name">${escapeHTML(att.name || 'document')}</div>
                <div class="attachment-file-meta">${escapeHTML(att.size || '')}</div>
            </div>
            <div class="attachment-file-download"><i aria-hidden="true" data-lucide="download" style="width:16px;height:16px;"></i></div>
        </div>`;
    }

    // ===== RENDER FEED =====
    function renderFeed(chatId) {
        const chat = chatData[chatId];
        if (!chat) return;

        showSkeleton(3);
        setTimeout(() => {
            messageFeed.innerHTML = `<div class="date-divider"><div class="date-divider-line"></div><span class="date-divider-text">Today</span></div>`;

            if (chat.messages.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'text-align:center;color:var(--text-muted);font-size:14px;margin:auto;padding:40px 0;';
                empty.innerHTML = '<p style="font-size:32px;margin-bottom:12px;">💬</p><p>No messages yet. Start a conversation!</p>';
                messageFeed.appendChild(empty);
                return;
            }

            chat.messages.forEach((msg, i, arr) => {
                if (i > 0 && msg.type !== 'system') {
                    const prev = arr[i-1];
                    if (prev.sender !== msg.sender && prev.type !== 'system' && msg.type !== 'system') {
                        const sep = document.createElement('div');
                        sep.className = 'unread-separator';
                        sep.innerHTML = '<div class="unread-separator-line"></div><span class="unread-separator-text">New messages</span><div class="unread-separator-line"></div>';
                        messageFeed.appendChild(sep);
                    }
                }
                const el = renderMessage(msg);
                messageFeed.appendChild(el);
            });

            setTimeout(scrollToBottom, 50);
            if (window.lucide) lucide.createIcons();
        }, 400);
    }

    function appendMessageAnimated(msg) {
        const chat = chatData[activeChatId];
        chat.messages.push(msg);
        const el = renderMessage(msg);
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        messageFeed.appendChild(el);
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
        updateThreadPreview(activeChatId, msg.text || (msg.type === 'invoice' ? '📄 Invoice: ' + msg.invoice.number : ''));
        scrollToBottom();
        if (window.lucide) lucide.createIcons();
        saveState();
    }

    function updateThreadPreview(chatId, text) {
        const el = document.getElementById(`preview-${chatId}`);
        if (el) el.textContent = text || 'No messages yet';
        updateConversationList();
    }

    // ===== UPDATE CONVERSATION LIST =====
    function updateConversationList(filter = 'all') {
        chatThreadsContainer.innerHTML = '';
        Object.entries(chatData).forEach(([id, chat]) => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            const hasUnread = chat.messages.some(m => m.sender !== 'You' && m.status === 'delivered');
            const hasInvoice = chat.messages.some(m => m.type === 'invoice');

            if (filter === 'unread' && !hasUnread) return;
            if (filter === 'invoices' && !hasInvoice) return;

            const item = document.createElement('div');
            item.className = `thread-item ${id === activeChatId ? 'active' : ''}`;
            item.dataset.chatId = id;
            item.innerHTML = `
                <div class="thread-avatar">${chat.avatarLetter}</div>
                <div class="thread-details">
                    <div class="thread-meta">
                        <span class="thread-name">${escapeHTML(chat.name)}</span>
                        <span class="thread-time fraunces-num">${lastMsg ? lastMsg.time : ''}</span>
                    </div>
                    <div class="thread-preview" id="preview-${id}">${lastMsg ? (escapeHTML(lastMsg.text || (lastMsg.type === 'invoice' ? '📄 Invoice' : ''))) : 'No messages yet'}</div>
                </div>
                ${hasUnread ? '<div class="thread-unread">1</div>' : ''}
                ${chat.isGroup ? '<span class="thread-pinned">👥</span>' : ''}
            `;
            item.addEventListener('click', () => switchChat(id));
            chatThreadsContainer.appendChild(item);
        });
    }

    // ===== SWITCH CHAT =====
    function switchChat(chatId) {
        if (chatId === activeChatId) return;
        if (chatData[chatId]) {
            activeChatId = chatId;
            const chat = chatData[chatId];
            activeChatAvatar.textContent = chat.avatarLetter;
            activeChatName.textContent = chat.name;
            activeChatStatus.innerHTML = chat.isGroup
                ? '<span style="font-size:12px;color:var(--text-muted)">3 members</span>'
                : '<span class="status-dot"></span><span>Active Now</span>';
            renderFeed(chatId);
            document.querySelectorAll('.thread-item').forEach(i => i.classList.toggle('active', i.dataset.chatId === chatId));
            messageTextarea.value = '';
            autoResizeTextarea();
            closeSearch();
            closeDropdown();
            closeReply();
            editingId = null;
        }
    }

    // ===== SEND MESSAGE =====
    function sendMessage() {
        if (editingId) { saveEdit(); return; }
        const text = messageTextarea.value.trim();
        if (!text) return;

        const timeStr = formatTime(new Date());
        const refType = referenceTypeSelect.value;
        const refId = referenceIdInput.value.trim();
        const reference = refType !== 'none' && refId ? `${refType}: ${refId}` : null;

        const newMsg = { id: generateId(), sender: 'You', time: timeStr, text, status: 'sending', reference };
        chatData[activeChatId].messages.push(newMsg);

        const el = renderMessage(newMsg);
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        messageFeed.appendChild(el);
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
        updateThreadPreview(activeChatId, text);
        scrollToBottom();
        if (window.lucide) lucide.createIcons();

        messageTextarea.value = '';
        autoResizeTextarea();
        referenceTypeSelect.value = 'none';
        referenceIdWrapper.classList.remove('visible');
        referenceIdInput.value = '';

        // Simulate sent → delivered
        saveState();
        setTimeout(() => { newMsg.status = 'sent'; refreshStatus(); }, 500);
        setTimeout(() => { newMsg.status = 'delivered'; refreshStatus(); }, 1000);
        triggerAutoReply();
    }

    function refreshStatus() {
        messageFeed.querySelectorAll('.message-status').forEach(el => {
            const group = el.closest('.message-group');
            if (!group) return;
            const id = group.dataset.messageId;
            const chat = chatData[activeChatId];
            const msg = chat.messages.find(m => m.id === id);
            if (msg) {
                const icons = { sending: '⟳', sent: '✓', delivered: '✓✓', read: '✓✓' };
                el.className = `message-status ${msg.status}`;
                el.textContent = icons[msg.status] || '✓';
            }
        });
    }

    function saveEdit() {
        const text = messageTextarea.value.trim();
        if (!text) return;
        const chat = chatData[activeChatId];
        const msg = chat.messages.find(m => m.id === editingId);
        if (msg) {
            msg.text = text;
            msg.edited = true;
            renderFeed(activeChatId);
        }
        editingId = null;
        messageTextarea.value = '';
        autoResizeTextarea();
        btnSend.querySelector('span').textContent = 'Send';
    }

    btnSend.addEventListener('click', sendMessage);
    messageTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
        if (e.key === 'Escape') { closeReply(); closeMention(); editingId = null; messageTextarea.value = ''; btnSend.querySelector('span').textContent = 'Send'; }
    });

    // ===== AUTO REPLY =====
    function triggerAutoReply() {
        const chat = chatData[activeChatId];
        const responses = RECIPIENT_RESPONSES[activeChatId] || ["Got it!","Thanks!"];
        const response = responses[Math.floor(Math.random() * responses.length)];
        const delay = 1200 + Math.random() * 1800;
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            const timeStr = formatTime(new Date());
            const sender = chat.isGroup ? GROUP_MEMBERS[Math.floor(Math.random() * GROUP_MEMBERS.length)] : chat.name;
            const reply = { id: generateId(), sender, time: timeStr, text: response, status: 'read' };
            chat.messages.push(reply);
            const el = renderMessage(reply);
            el.style.opacity = '0';
            messageFeed.appendChild(el);
            requestAnimationFrame(() => { el.style.transition = 'opacity 0.2s ease'; el.style.opacity = '1'; });
            updateThreadPreview(activeChatId, response);
            scrollToBottom();
            saveState();
            if (window.lucide) lucide.createIcons();
        }, delay);
    }

    // ===== TYPING INDICATOR =====
    let typingEl = null;
    function showTypingIndicator() {
        if (typingEl) return;
        const chat = chatData[activeChatId];
        typingEl = document.createElement('div');
        typingEl.className = 'message-group them';
        typingEl.innerHTML = `<div class="message-avatar">${chat.avatarLetter}</div>
            <div class="message-content-wrapper"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
        messageFeed.appendChild(typingEl);
        scrollToBottom();
    }
    function hideTypingIndicator() { if (typingEl) { typingEl.remove(); typingEl = null; } }

    // ===== AUTO RESIZE =====
    function autoResizeTextarea() {
        messageTextarea.style.height = 'auto';
        messageTextarea.style.height = Math.min(messageTextarea.scrollHeight, 150) + 'px';
    }
    messageTextarea.addEventListener('input', autoResizeTextarea);

    // ===== REACTIONS =====
    function toggleReaction(msgId, emoji) {
        const chat = chatData[activeChatId];
        const msg = chat.messages.find(m => m.id === msgId);
        if (!msg) return;
        if (!msg.reactions) msg.reactions = [];
        const existing = msg.reactions.find(r => r.emoji === emoji);
        if (existing) {
            if (existing.users.includes('You')) {
                existing.users = existing.users.filter(u => u !== 'You');
                existing.count--;
                if (existing.count <= 0) msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
            } else {
                existing.users.push('You');
                existing.count++;
            }
        } else {
            msg.reactions.push({ emoji, count: 1, users: ['You'] });
        }
        renderFeed(activeChatId);
        saveState();
    }

    // ===== MESSAGE ACTIONS (delegated) =====
    messageFeed.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('.message-action-btn');
        if (!actionBtn) return;
        const group = actionBtn.closest('.message-group');
        const msgId = group.dataset.messageId;
        const chat = chatData[activeChatId];
        const msg = chat.messages.find(m => m.id === msgId);
        if (!msg) return;

        const action = actionBtn.dataset.action;
        switch (action) {
            case 'reply': startReply(msg); break;
            case 'react': toggleReaction(msgId, EMOJIS[Math.floor(Math.random() * EMOJIS.length)]); break;
            case 'edit': startEdit(msg); break;
            case 'delete': deleteMessage(msg); break;
            case 'copy': copyMessage(msg); break;
            case 'pin': pinMessage(msg); break;
            case 'thread': openThread(msg); break;
        }
    });

    function startReply(msg) {
        replyToId = msg.id;
        replyPreview.classList.add('active');
        replyPreviewName.textContent = msg.sender;
        replyPreviewText.textContent = msg.text || (msg.type === 'invoice' ? '📄 Invoice: ' + msg.invoice.number : '');
        messageTextarea.focus();
    }

    function closeReply() {
        replyToId = null;
        replyPreview.classList.remove('active');
    }
    replyPreviewClose.addEventListener('click', closeReply);

    function startEdit(msg) {
        if (msg.sender !== 'You') return;
        editingId = msg.id;
        messageTextarea.value = msg.text;
        autoResizeTextarea();
        messageTextarea.focus();
        btnSend.querySelector('span').textContent = 'Save';
    }

    function deleteMessage(msg) {
        if (msg.sender !== 'You') return;
        if (!confirm('Delete this message?')) return;
        if (confirm('Delete for everyone?')) {
            msg.deleted = true;
        } else {
            msg.deleted = true;
        }
        renderFeed(activeChatId);
        showToast('Message deleted', 'info');
        saveState();
    }

    function copyMessage(msg) {
        const text = msg.text || '';
        navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard', 'success'));
    }

    function pinMessage(msg) {
        showToast(`Message pinned`, 'success');
    }

    // ===== THREAD PANEL =====
    let threadParentMsg = null;
    function openThread(msg) {
        threadParentMsg = msg;
        threadPanel.classList.add('open');
        threadPanelParent.innerHTML = '';
        threadPanelReplies.innerHTML = '';

        const parentEl = renderMessage(msg);
        threadPanelParent.appendChild(parentEl);

        if (msg.threadReplies) {
            msg.threadReplies.forEach(r => {
                const el = renderMessage(r, true);
                threadPanelReplies.appendChild(el);
            });
        }
        if (window.lucide) lucide.createIcons();
    }

    function closeThread() { threadPanel.classList.remove('open'); threadParentMsg = null; }
    threadPanelClose.addEventListener('click', closeThread);
    threadPanelSend.addEventListener('click', () => {
        const text = threadPanelTextarea.value.trim();
        if (!text || !threadParentMsg) return;
        const chat = chatData[activeChatId];
        const reply = { id: generateId(), sender: 'You', time: formatTime(new Date()), text, status: 'sent' };
        if (!threadParentMsg.threadReplies) threadParentMsg.threadReplies = [];
        threadParentMsg.threadReplies.push(reply);

        const el = renderMessage(reply, true);
        threadPanelReplies.appendChild(el);
        threadPanelTextarea.value = '';
        if (window.lucide) lucide.createIcons();
        threadPanelReplies.scrollTop = threadPanelReplies.scrollHeight;
        saveState();
    });
    threadPanelTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); threadPanelSend.click(); }
    });

    // ===== EMOJI PICKER =====
    EMOJIS.forEach(e => {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.textContent = e;
        btn.onclick = () => {
            messageTextarea.value += e;
            messageTextarea.focus();
            autoResizeTextarea();
            emojiPicker.classList.remove('active');
        };
        emojiPickerGrid.appendChild(btn);
    });
    btnEmoji.addEventListener('click', (e) => { e.stopPropagation(); emojiPicker.classList.toggle('active'); closeAttachMenu(); });
    document.addEventListener('click', (e) => { if (!e.target.closest('#btn-emoji') && !e.target.closest('.emoji-picker')) emojiPicker.classList.remove('active'); });

    // ===== ATTACH MENU =====
    btnAttach.addEventListener('click', (e) => { e.stopPropagation(); attachMenu.classList.toggle('active'); closeEmojiPicker(); });
    document.addEventListener('click', (e) => { if (!e.target.closest('#btn-attach') && !e.target.closest('.attach-menu')) attachMenu.classList.remove('active'); });
    attachMenu.querySelectorAll('.attach-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            attachMenu.classList.remove('active');
            const type = item.dataset.type;
            const chat = chatData[activeChatId];
            let attachment;
            if (type === 'image') {
                attachment = { type: 'image', urls: ['https://picsum.photos/seed/' + Date.now() + '/400/300'], name: 'photo.jpg', size: '1.2 MB' };
            } else {
                attachment = { type, name: type === 'pdf' ? 'document.pdf' : type === 'spreadsheet' ? 'data.xlsx' : 'report.docx', size: '2.4 MB' };
            }
            const msg = { id: generateId(), sender: 'You', time: formatTime(new Date()), text: '', attachment, status: 'sent' };
            appendMessageAnimated(msg);
            showToast(`${type} attached`, 'success');
        });
    });

    // ===== INVOICE SHARE =====
    btnInvoice.addEventListener('click', () => {
        const ref = referenceTypeSelect.value === 'invoice' && referenceIdInput.value.trim() ? referenceIdInput.value.trim() : 'INV-2024-' + String(Math.floor(Math.random() * 9000) + 1000);
        const chat = chatData[activeChatId];
        const msg = {
            id: generateId(), sender: 'You', time: formatTime(new Date()), type: 'invoice', status: 'sent',
            text: `Invoice ${ref}`,
            invoice: { number: ref, customer: chat.name, amount: `₦${(Math.random() * 5000000).toLocaleString(undefined, {maximumFractionDigits:2, minimumFractionDigits:2})}`, due: 'Dec 31, 2024', status: 'pending' }
        };
        appendMessageAnimated(msg);
        showToast('Invoice shared', 'success');
    });

    // ===== VOICE NOTE =====
    btnVoice.addEventListener('click', () => {
        if (!isRecording) {
            isRecording = true;
            btnVoice.style.color = 'var(--danger)';
            btnVoice.style.backgroundColor = 'var(--danger-light)';
            showToast('Recording... Click mic to stop', 'info');
        } else {
            isRecording = false;
            btnVoice.style.color = '';
            btnVoice.style.backgroundColor = '';
            const duration = Math.floor(Math.random() * 30) + 5;
            const msg = { id: generateId(), sender: 'You', time: formatTime(new Date()), text: `🎤 Voice note (${duration}s)`, status: 'sent', attachment: { type: 'audio', name: 'Voice note', size: `${duration * 16} KB` } };
            appendMessageAnimated(msg);
            showToast('Voice note sent', 'success');
        }
    });

    // ===== MENTIONS =====
    let mentionQuery = '';
    let mentionSelected = -1;
    messageTextarea.addEventListener('input', () => {
        autoResizeTextarea();
        const pos = messageTextarea.selectionStart;
        const text = messageTextarea.value;
        const before = text.slice(0, pos);
        const atIndex = before.lastIndexOf('@');
        if (atIndex !== -1 && (atIndex === 0 || before[atIndex - 1] === ' ')) {
            mentionQuery = before.slice(atIndex + 1);
            showMentions(mentionQuery);
        } else {
            closeMention();
        }
    });
    messageTextarea.addEventListener('keydown', (e) => {
        if (mentionDropdown.classList.contains('active')) {
            const items = mentionDropdown.querySelectorAll('.mention-item');
            if (e.key === 'ArrowDown') { e.preventDefault(); mentionSelected = Math.min(mentionSelected + 1, items.length - 1); updateMentionSelection(items); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); mentionSelected = Math.max(mentionSelected - 1, 0); updateMentionSelection(items); return; }
            if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); if (items[mentionSelected]) insertMention(items[mentionSelected].dataset.name); return; }
            if (e.key === 'Escape') { closeMention(); return; }
        }
    });

    function showMentions(query) {
        const filtered = MENTION_USERS.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
        if (filtered.length === 0) { closeMention(); return; }
        mentionDropdown.innerHTML = '';
        mentionDropdown.classList.add('active');
        mentionSelected = 0;
        filtered.forEach(u => {
            const div = document.createElement('div');
            div.className = 'mention-item';
            div.dataset.name = u.name;
            div.innerHTML = `<div class="mention-avatar">${u.avatarLetter}</div><span class="mention-name">${u.name}</span><span class="mention-role">${u.role}</span>`;
            div.addEventListener('click', () => insertMention(u.name));
            div.addEventListener('mouseenter', () => { mentionSelected = Array.from(mentionDropdown.children).indexOf(div); updateMentionSelection(mentionDropdown.querySelectorAll('.mention-item')); });
            mentionDropdown.appendChild(div);
        });
        updateMentionSelection(mentionDropdown.querySelectorAll('.mention-item'));
    }

    function updateMentionSelection(items) {
        items.forEach((el, i) => el.classList.toggle('selected', i === mentionSelected));
    }

    function insertMention(name) {
        const pos = messageTextarea.selectionStart;
        const text = messageTextarea.value;
        const before = text.slice(0, pos);
        const atIndex = before.lastIndexOf('@');
        messageTextarea.value = text.slice(0, atIndex) + `@${name} ` + text.slice(pos);
        messageTextarea.focus();
        closeMention();
        autoResizeTextarea();
    }

    function closeMention() { mentionDropdown.classList.remove('active'); mentionQuery = ''; mentionSelected = -1; }

    function closeEmojiPicker() { emojiPicker.classList.remove('active'); }
    function closeAttachMenu() { attachMenu.classList.remove('active'); }

    // ===== CONVERSATION SEARCH =====
    let searchActive = false;
    function openSearch() {
        searchActive = true;
        conversationSearchBar.classList.add('active');
        conversationSearchInput.value = '';
        conversationSearchInput.focus();
        clearHighlights();
    }
    function closeSearch() {
        searchActive = false;
        conversationSearchBar.classList.remove('active');
        conversationSearchInput.value = '';
        searchMatchCount.textContent = '';
        clearHighlights();
    }

    function clearHighlights() {
        messageFeed.querySelectorAll('.match-current').forEach(el => el.classList.remove('match-current'));
        messageFeed.querySelectorAll('.search-highlight').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });
        searchMatches = [];
        searchIndex = -1;
    }

    function performSearch(query) {
        clearHighlights();
        if (!query.trim()) { searchMatchCount.textContent = ''; return; }
        const textNodes = [];
        const walker = document.createTreeWalker(messageFeed, NodeFilter.SHOW_TEXT, null, false);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.parentElement && !node.parentElement.closest('.message-actions,.reaction-picker,.message-status')) {
                textNodes.push(node);
            }
        }

        textNodes.forEach(node => {
            const text = node.textContent;
            const lower = text.toLowerCase();
            const qLower = query.toLowerCase();
            if (lower.includes(qLower)) {
                const span = document.createElement('span');
                const idx = lower.indexOf(qLower);
                span.appendChild(document.createTextNode(text.slice(0, idx)));
                const mark = document.createElement('mark');
                mark.className = 'search-highlight';
                mark.textContent = text.slice(idx, idx + query.length);
                span.appendChild(mark);
                span.appendChild(document.createTextNode(text.slice(idx + query.length)));
                node.parentNode.replaceChild(span, node);
                searchMatches.push(span);
            }
        });

        searchIndex = searchMatches.length > 0 ? 0 : -1;
        updateSearchNav();
    }

    function updateSearchNav() {
        if (searchMatches.length === 0) { searchMatchCount.textContent = 'No matches'; return; }
        searchMatchCount.textContent = `${searchIndex + 1} of ${searchMatches.length}`;
        messageFeed.querySelectorAll('.match-current').forEach(el => el.classList.remove('match-current'));
        const current = searchMatches[searchIndex];
        if (current) {
            current.closest('.message-group')?.classList.add('match-current');
            current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    btnConversationSearch.addEventListener('click', () => { searchActive ? closeSearch() : (openSearch(), closeDropdown()); });
    conversationSearchClose.addEventListener('click', closeSearch);
    conversationSearchInput.addEventListener('input', (e) => performSearch(e.target.value));
    conversationSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); if (e.key === 'Enter') { e.preventDefault(); if (searchMatches.length > 0) { searchIndex = (searchIndex + 1) % searchMatches.length; updateSearchNav(); } } });
    searchPrev.addEventListener('click', () => { if (searchMatches.length > 0) { searchIndex = (searchIndex - 1 + searchMatches.length) % searchMatches.length; updateSearchNav(); } });
    searchNext.addEventListener('click', () => { if (searchMatches.length > 0) { searchIndex = (searchIndex + 1) % searchMatches.length; updateSearchNav(); } });

    // ===== DROPDOWN =====
    function closeDropdown() { dropdownMenu.classList.remove('active'); }
    btnMoreOptions.addEventListener('click', (e) => { e.stopPropagation(); dropdownMenu.classList.toggle('active'); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.dropdown-container')) closeDropdown(); });
    dropdownMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-menu-item');
        if (!item) return;
        const action = item.dataset.action;
        const chat = chatData[activeChatId];
        switch (action) {
            case 'clear': if (confirm('Clear all messages?')) { chat.messages = []; renderFeed(activeChatId); updateThreadPreview(activeChatId, 'No messages yet'); showToast('Chat cleared', 'info'); } break;
            case 'mark-unread': showToast('Marked as unread', 'success'); break;
            case 'archive': showToast('Conversation archived', 'info'); break;
            case 'star': showToast('Conversation starred', 'success'); break;
            case 'block': if (confirm(`Block ${chat.name}?`)) showToast(`${chat.name} blocked`, 'info'); break;
        }
        closeDropdown();
        saveState();
    });

    // ===== FILTER =====
    function setFilter(filter) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
        if (btn) btn.classList.add('active');
        updateConversationList(filter);
    }
    filterAll.addEventListener('click', () => setFilter('all'));
    filterUnread.addEventListener('click', () => setFilter('unread'));
    filterInvoices.addEventListener('click', () => setFilter('invoices'));

    // ===== LIGHTBOX =====
    window.openLightbox = function(index, images) {
        if (typeof images === 'string') images = JSON.parse(images.replace(/'/g, '"'));
        let current = index;
        function show() {
            lightboxImage.src = images[current] || images[0];
            lightboxInfo.textContent = `${current + 1} of ${images.length}`;
        }
        show();
        lightbox.classList.add('open');
        lightboxPrev.onclick = () => { current = (current - 1 + images.length) % images.length; show(); };
        lightboxNext.onclick = () => { current = (current + 1) % images.length; show(); };
        document.addEventListener('keydown', lightboxKeyHandler = (e) => {
            if (e.key === 'Escape') lightbox.classList.remove('open');
            if (e.key === 'ArrowLeft') { current = (current - 1 + images.length) % images.length; show(); }
            if (e.key === 'ArrowRight') { current = (current + 1) % images.length; show(); }
        });
    };
    lightboxClose.addEventListener('click', () => { lightbox.classList.remove('open'); document.removeEventListener('keydown', lightboxKeyHandler); });
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) { lightbox.classList.remove('open'); document.removeEventListener('keydown', lightboxKeyHandler); } });

    // ===== DRAG & DROP =====
    const chatCard = document.querySelector('.chat-card');
    chatCard.addEventListener('dragover', (e) => { e.preventDefault(); dropOverlay.classList.add('active'); });
    chatCard.addEventListener('dragleave', (e) => { e.preventDefault(); dropOverlay.classList.remove('active'); });
    chatCard.addEventListener('drop', (e) => {
        e.preventDefault();
        dropOverlay.classList.remove('active');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const msg = { id: generateId(), sender: 'You', time: formatTime(new Date()), text: `📎 ${files[0].name}`, status: 'sent', attachment: { type: 'document', name: files[0].name, size: 'Uploaded via drag & drop' } };
            appendMessageAnimated(msg);
            showToast('File attached', 'success');
        }
    });

    // ===== OFFLINE DETECTION =====
    function updateOnlineStatus() { offlineBanner.classList.toggle('active', !navigator.onLine); }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // ===== KEYBOARD SHORTCUTS =====
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') { e.preventDefault(); document.querySelector('.chat-search-input')?.focus(); }
        if (e.ctrlKey && e.shiftKey && e.key === 'F') { e.preventDefault(); openSearch(); }
        if (e.key === '/' && !['INPUT','TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); messageTextarea.focus(); }
    });

    // ===== THEME =====
    themeToggleBtn.addEventListener('click', () => {
        isDark = !isDark;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
        themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        lucide.createIcons();
    });

    // ===== NEW CHAT =====
    btnNewChat.addEventListener('click', () => {
        const name = prompt('Enter chat name:');
        if (!name || !name.trim()) return;
        const id = name.trim().toLowerCase().replace(/\s+/g, '-');
        if (chatData[id]) { switchChat(id); return; }
        chatData[id] = { name: name.trim(), avatarLetter: name.charAt(0).toUpperCase(), messages: [], role: 'Custom' };
        updateConversationList();
        switchChat(id);
        showToast('New conversation created', 'success');
        saveState();
    });

    // ===== LOCAL STORAGE =====
    function saveState() {
        try {
            const data = { chatData, activeChatId };
            localStorage.setItem('onbeex_messages', JSON.stringify(data));
        } catch(e) {}
    }

    function loadState() {
        try {
            const raw = localStorage.getItem('onbeex_messages');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.chatData) Object.assign(chatData, data.chatData);
                if (data.activeChatId && chatData[data.activeChatId]) activeChatId = data.activeChatId;
            }
        } catch(e) {}
    }

    loadState();

    // ===== INIT =====
    const chat = chatData[activeChatId];
    activeChatAvatar.textContent = chat.avatarLetter;
    activeChatName.textContent = chat.name;
    activeChatStatus.innerHTML = chat.isGroup
        ? '<span style="font-size:12px;color:var(--text-muted)">3 members</span>'
        : '<span class="status-dot"></span><span>Active Now</span>';
    renderFeed(activeChatId);
    updateConversationList();

    // ===== REFERENCE =====
    referenceTypeSelect.addEventListener('change', () => {
        const isRef = referenceTypeSelect.value !== 'none';
        referenceIdWrapper.classList.toggle('visible', isRef);
        if (isRef) setTimeout(() => referenceIdInput.focus(), 320);
        else referenceIdInput.value = '';
    });
});
