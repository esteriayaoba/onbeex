document.addEventListener('DOMContentLoaded', () => {

    // 1. Initialize Lucide Icons
    if (window.lucide) lucide.createIcons();

    // 2. Chat Data Store
    const chatData = {
        warehouse: {
            name: 'warehouse',
            avatarLetter: 'W',
            messages: [
                { sender: 'You', time: '2:07 PM', text: 'am on a product' }
            ]
        },
        ifeoluwa: {
            name: 'Ifeoluwa',
            avatarLetter: 'I',
            messages: []
        }
    };

    const recipientResponses = {
        warehouse: [
            "Got it, checking the inventory now.",
            "I'll update the stock levels.",
            "Can you send me the product ID?",
            "All confirmed on my end.",
            "Let me verify with the team."
        ],
        ifeoluwa: [
            "Thanks for the update!",
            "I'll look into it right away.",
            "Sounds good, let me know if anything changes.",
            "Can we discuss this in the next meeting?",
            "Perfect, thanks for letting me know."
        ]
    };

    let activeChatId = 'warehouse';

    // 3. DOM References
    const threadItems          = document.querySelectorAll('.thread-item');
    const activeChatAvatar     = document.getElementById('active-chat-avatar');
    const activeChatName       = document.getElementById('active-chat-name');
    const messageFeed          = document.getElementById('message-feed');
    const messageTextarea      = document.getElementById('message-textarea');
    const btnSend              = document.getElementById('btn-send-message');
    const referenceTypeSelect  = document.getElementById('reference-type-select');
    const referenceIdWrapper   = document.getElementById('reference-id-wrapper');
    const referenceIdInput     = document.getElementById('reference-id-input');
    const themeToggleBtn       = document.getElementById('theme-toggle-btn');
    const themeIcon            = document.getElementById('theme-icon');
    const btnNewChat           = document.getElementById('btn-new-chat');

    // New references
    const btnConversationSearch = document.getElementById('btn-conversation-search');
    const conversationSearchBar = document.getElementById('conversation-search-bar');
    const conversationSearchInput = document.getElementById('conversation-search-input');
    const conversationSearchClose = document.getElementById('conversation-search-close');
    const btnMoreOptions        = document.getElementById('btn-more-options');
    const dropdownMenu          = document.getElementById('dropdown-menu');

    // 4. Utility
    function escapeHTML(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function scrollFeedToBottom() {
        requestAnimationFrame(() => {
            messageFeed.scrollTop = messageFeed.scrollHeight;
        });
    }

    function formatTime(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHour = ((hours + 11) % 12 + 1);
        return `${displayHour}:${minutes} ${ampm}`;
    }

    // 5. Render Chat Feed
    function renderFeed(chatId) {
        const chat = chatData[chatId];
        messageFeed.innerHTML = `
            <div class="date-divider">
                <div class="date-divider-line"></div>
                <span class="date-divider-text">Today</span>
            </div>
        `;

        if (chat.messages.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'text-align: center; color: var(--text-muted); font-size: 14px; margin: auto;';
            empty.textContent = 'No messages yet. Say hello!';
            messageFeed.appendChild(empty);
            return;
        }

        chat.messages.forEach(msg => {
            appendMessageToFeed(msg);
        });

        scrollFeedToBottom();
    }

    function appendMessageToFeed(msg) {
        const isMe = msg.sender === 'You';
        const chat = chatData[activeChatId];
        const avatarLetter = isMe ? 'Y' : (chat ? chat.avatarLetter : msg.sender.charAt(0));

        const group = document.createElement('div');
        group.classList.add('message-group', isMe ? 'me' : 'them');

        const avatarStyle = isMe ? '' : ' style="background-color: var(--primary); color: white;"';

        group.innerHTML = `
            <div class="message-avatar"${avatarStyle}>${avatarLetter}</div>
            <div class="message-content-wrapper">
                <div class="message-meta">
                    <span class="message-sender">${escapeHTML(msg.sender)}</span>
                    <span class="message-time fraunces-num">${msg.time}</span>
                </div>
                <div class="message-bubble">${escapeHTML(msg.text)}</div>
                ${msg.reference ? `<a class="message-reference-tag">${escapeHTML(msg.reference)}</a>` : ''}
            </div>
        `;

        messageFeed.appendChild(group);
    }

    function appendMessageAnimated(msg) {
        appendMessageToFeed(msg);

        const groups = messageFeed.querySelectorAll('.message-group');
        const lastGroup = groups[groups.length - 1];
        lastGroup.style.opacity = '0';
        lastGroup.style.transform = 'translateY(8px)';

        requestAnimationFrame(() => {
            lastGroup.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            lastGroup.style.opacity = '1';
            lastGroup.style.transform = 'translateY(0)';
        });

        scrollFeedToBottom();
    }

    function updateThreadPreview(chatId, text) {
        const previewEl = document.getElementById(`thread-preview-${chatId}`);
        if (previewEl) previewEl.textContent = text;
    }

    // 6. Chat Switching
    function switchChat(chatId) {
        if (chatId === activeChatId) return;
        activeChatId = chatId;

        const chat = chatData[chatId];

        activeChatAvatar.textContent = chat.avatarLetter;
        activeChatName.textContent = chat.name;

        threadItems.forEach(item => {
            item.classList.toggle('active', item.dataset.chatId === chatId);
        });

        renderFeed(chatId);

        messageTextarea.value = '';
        autoResizeTextarea();

        closeSearch();
        closeDropdown();
    }

    threadItems.forEach(item => {
        item.addEventListener('click', () => switchChat(item.dataset.chatId));
    });

    renderFeed(activeChatId);

    // 7. Auto-resize textarea
    function autoResizeTextarea() {
        messageTextarea.style.height = 'auto';
        messageTextarea.style.height = Math.min(messageTextarea.scrollHeight, 200) + 'px';
    }

    messageTextarea.addEventListener('input', autoResizeTextarea);

    messageTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 8. Send Message
    function sendMessage() {
        const text = messageTextarea.value.trim();
        if (!text) return;

        const timeStr = formatTime(new Date());

        const refType = referenceTypeSelect.value;
        const refId = referenceIdInput.value.trim();
        const reference = refType !== 'none' && refId ? `${refType}: ${refId}` : null;

        const newMsg = { sender: 'You', time: timeStr, text, reference };
        chatData[activeChatId].messages.push(newMsg);

        updateThreadPreview(activeChatId, text);
        appendMessageAnimated(newMsg);

        messageTextarea.value = '';
        autoResizeTextarea();
        referenceTypeSelect.value = 'none';
        referenceIdWrapper.classList.remove('visible');
        referenceIdInput.value = '';

        triggerAutoReply();
    }

    btnSend.addEventListener('click', sendMessage);

    // 9. Auto-reply from recipient
    function triggerAutoReply() {
        const chat = chatData[activeChatId];
        const responses = recipientResponses[activeChatId] || ["Got it!", "Thanks!"];
        const response = responses[Math.floor(Math.random() * responses.length)];
        const delay = 1200 + Math.random() * 1800;

        showTypingIndicator();

        setTimeout(() => {
            hideTypingIndicator();
            const timeStr = formatTime(new Date());
            const reply = { sender: chat.name, time: timeStr, text: response };
            chatData[activeChatId].messages.push(reply);
            appendMessageAnimated(reply);
            updateThreadPreview(activeChatId, response);
            scrollFeedToBottom();
        }, delay);
    }

    // 10. Typing Indicator
    let typingEl = null;

    function showTypingIndicator() {
        if (typingEl) return;
        typingEl = document.createElement('div');
        typingEl.classList.add('message-group', 'them');
        typingEl.innerHTML = `
            <div class="message-avatar" style="background-color: var(--primary); color: white;">${chatData[activeChatId].avatarLetter}</div>
            <div class="message-content-wrapper">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        typingEl.style.opacity = '0';
        messageFeed.appendChild(typingEl);

        requestAnimationFrame(() => {
            typingEl.style.transition = 'opacity 0.15s ease';
            typingEl.style.opacity = '1';
        });

        scrollFeedToBottom();
    }

    function hideTypingIndicator() {
        if (!typingEl) return;
        typingEl.remove();
        typingEl = null;
    }

    // 11. Reference Type Selector
    referenceTypeSelect.addEventListener('change', () => {
        const isRef = referenceTypeSelect.value !== 'none';
        referenceIdWrapper.classList.toggle('visible', isRef);
        if (isRef) {
            setTimeout(() => referenceIdInput.focus(), 320);
        } else {
            referenceIdInput.value = '';
        }
    });

    // 12. Light / Dark Theme Toggle
    let isDark = false;

    themeToggleBtn.addEventListener('click', () => {
        isDark = !isDark;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');

        themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        lucide.createIcons();
    });

    // 13. New Chat Button
    btnNewChat.addEventListener('click', () => {
        const chatName = prompt('Enter chat name:');
        if (!chatName || chatName.trim() === '') return;

        const id = chatName.trim().toLowerCase().replace(/\s+/g, '-');
        if (chatData[id]) {
            switchChat(id);
            return;
        }

        chatData[id] = {
            name: chatName.trim(),
            avatarLetter: chatName.charAt(0).toUpperCase(),
            messages: []
        };

        const container = document.getElementById('chat-threads-container');
        const newItem = document.createElement('div');
        newItem.classList.add('thread-item');
        newItem.dataset.chatId = id;
        newItem.innerHTML = `
            <div class="thread-avatar">${chatName.charAt(0).toUpperCase()}</div>
            <div class="thread-details">
                <div class="thread-meta">
                    <span class="thread-name">${escapeHTML(chatName.trim())}</span>
                    <span class="thread-time fraunces-num">Just now</span>
                </div>
                <div class="thread-preview" id="thread-preview-${id}">No messages yet</div>
            </div>
        `;
        newItem.addEventListener('click', () => switchChat(id));
        container.appendChild(newItem);

        newItem.addEventListener('click', () => {
            document.querySelectorAll('.thread-item').forEach(i => i.classList.remove('active'));
            newItem.classList.add('active');
        });

        switchChat(id);
    });

    // 14. Conversation Search
    let searchActive = false;

    function openSearch() {
        searchActive = true;
        conversationSearchBar.classList.add('active');
        conversationSearchInput.value = '';
        conversationSearchInput.focus();
        clearSearchHighlights();
    }

    function closeSearch() {
        searchActive = false;
        conversationSearchBar.classList.remove('active');
        conversationSearchInput.value = '';
        clearSearchHighlights();
    }

    function clearSearchHighlights() {
        messageFeed.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
        });
        messageFeed.querySelectorAll('.message-bubble').forEach(el => {
            el.style.outline = '';
        });
    }

    function performSearch(query) {
        clearSearchHighlights();
        if (!query.trim()) return;

        const bubbles = messageFeed.querySelectorAll('.message-bubble');
        let firstMatch = null;

        bubbles.forEach(bubble => {
            if (bubble.textContent.toLowerCase().includes(query.toLowerCase())) {
                bubble.style.outline = '2px solid var(--primary)';
                bubble.style.outlineOffset = '2px';
                if (!firstMatch) firstMatch = bubble;
            }
        });

        if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    btnConversationSearch.addEventListener('click', () => {
        if (searchActive) {
            closeSearch();
        } else {
            openSearch();
            closeDropdown();
        }
    });

    conversationSearchClose.addEventListener('click', closeSearch);

    conversationSearchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });

    conversationSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
    });

    // 15. More Options Dropdown
    function closeDropdown() {
        dropdownMenu.classList.remove('active');
    }

    btnMoreOptions.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-container')) {
            closeDropdown();
        }
    });

    dropdownMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-menu-item');
        if (!item) return;

        const action = item.dataset.action;
        const chat = chatData[activeChatId];

        switch (action) {
            case 'clear':
                if (confirm('Clear all messages in this conversation?')) {
                    chat.messages = [];
                    renderFeed(activeChatId);
                    updateThreadPreview(activeChatId, 'No messages yet');
                }
                break;
            case 'mark-unread':
                alert('Conversation marked as unread.');
                break;
            case 'archive':
                alert('Conversation archived.');
                break;
            case 'block':
                if (confirm(`Block ${chat.name}?`)) {
                    alert(`${chat.name} has been blocked.`);
                }
                break;
        }

        closeDropdown();
    });

});
