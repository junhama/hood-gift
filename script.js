// hood-gift - Main JavaScript

// DOM Elements
const newPostBtn = document.getElementById('newPostBtn');
const postModal = document.getElementById('postModal');
const chatModal = document.getElementById('chatModal');
const cancelPostBtn = document.getElementById('cancelPost');
const closeChatBtn = document.getElementById('closeChat');
const postForm = document.getElementById('postForm');
const postsList = document.getElementById('postsList');
const sendMessageBtn = document.getElementById('sendMessage');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

// State
let posts = JSON.parse(localStorage.getItem('hood-gift-posts')) || [];
let currentFilter = { type: 'all', category: 'all' };
let currentChat = null;

// Initialize
function init() {
  bindEvents();
  renderPosts();
  updateFilterButtons();
}

function bindEvents() {
  // Modal controls
  newPostBtn?.addEventListener('click', () => openModal(postModal));
  cancelPostBtn?.addEventListener('click', () => closeModal(postModal));
  closeChatBtn?.addEventListener('click', () => closeModal(chatModal));
  
  // Form
  postForm?.addEventListener('submit', handleSubmit);
  
  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter.type = btn.dataset.type;
      updateFilterButtons();
      renderPosts();
    });
  });
  
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter.category = btn.dataset.cat;
      updateFilterButtons();
      renderPosts();
    });
  });
  
  // Chat
  sendMessageBtn?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  // Close modals on backdrop click
  [postModal, chatModal].forEach(modal => {
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });
}

function openModal(modal) {
  modal?.classList.add('active');
  modal?.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal?.classList.remove('active');
  modal?.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const post = {
    id: Date.now(),
    type: formData.get('type'),
    category: formData.get('category'),
    title: formData.get('title'),
    description: formData.get('description'),
    location: formData.get('location'),
    timestamp: new Date().toISOString()
  };
  
  posts.unshift(post);
  savePosts();
  renderPosts();
  closeModal(postModal);
  e.target.reset();
}

function savePosts() {
  localStorage.setItem('hood-gift-posts', JSON.stringify(posts));
}

function renderPosts() {
  if (!postsList) return;
  
  const filtered = posts.filter(post => {
    const typeMatch = currentFilter.type === 'all' || post.type === currentFilter.type;
    const catMatch = currentFilter.category === 'all' || post.category === currentFilter.category;
    return typeMatch && catMatch;
  });
  
  if (filtered.length === 0) {
    postsList.innerHTML = `
      <div class="empty-state" role="status" aria-live="polite">
        <p>投稿がありません</p>
        <p>新しい投稿を作成しましょう！</p>
      </div>
    `;
    return;
  }
  
  postsList.innerHTML = filtered.map(post => `
    <article class="post-card ${'type-' + post.type}" data-id="${post.id}" role="article" tabindex="0" aria-label="${post.title}">
      <div class="post-header">
        <span class="post-type ${'type-' + post.type}">${getTypeLabel(post.type)}</span>
        <span class="post-category">${getCategoryLabel(post.category)}</span>
      </div>
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <p class="post-description">${escapeHtml(post.description)}</p>
      <div class="post-footer">
        <span class="post-location">${escapeHtml(post.location)}</span>
        <time datetime="${post.timestamp}">${formatDate(post.timestamp)}</time>
      </div>
    </article>
  `).join('');
  
  // Add click handlers
  document.querySelectorAll('.post-card').forEach(card => {
    card.addEventListener('click', () => openChat(parseInt(card.dataset.id)));
    card.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') openChat(parseInt(card.dataset.id));
    });
  });
}

function getTypeLabel(type) {
  const labels = { give: 'あげます', request: 'ください', exchange: '交換' };
  return labels[type] || type;
}

function getCategoryLabel(cat) {
  const labels = { food: '🍎 フード', items: '📦 物品', help: '🤝 手伝い', info: '💡 情報' };
  return labels[cat] || cat;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000 / 60);
  
  if (diff < 1) return 'たった今';
  if (diff < 60) return `${diff}分前`;
  if (diff < 1440) return `${Math.floor(diff / 60)}時間前`;
  return `${Math.floor(diff / 1440)}日前`;
}

function updateFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const isActive = btn.dataset.type === currentFilter.type;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive);
  });
  
  document.querySelectorAll('.cat-btn').forEach(btn => {
    const isActive = btn.dataset.cat === currentFilter.category;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive);
  });
}

function openChat(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  
  currentChat = post;
  const chatTitle = document.getElementById('chatTitle');
  if (chatTitle) chatTitle.textContent = post.title;
  chatMessages.innerHTML = '';
  openModal(chatModal);
}

function sendMessage() {
  const text = chatInput?.value.trim();
  if (!text) return;
  
  const messageEl = document.createElement('div');
  messageEl.className = 'message sent';
  messageEl.textContent = text;
  messageEl.style.cssText = 'background: var(--primary); color: white; padding: 10px 14px; border-radius: 18px; margin: 8px 0; align-self: flex-end; max-width: 80%;';
  
  chatMessages?.appendChild(messageEl);
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
