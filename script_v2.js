// hood-gift V2 Features - Enhanced with Points, Tipping & Priority Display

// V2 State
let userPoints = parseInt(localStorage.getItem('hood-gift-points')) || 100;
let isPremium = localStorage.getItem('hood-gift-premium') === 'true';

// Load V2 data
function loadV2Data() {
  updatePointsDisplay();
}

// Update points display
function updatePointsDisplay() {
  const pointsEl = document.getElementById('userPoints');
  if (pointsEl) pointsEl.textContent = userPoints;
}

// Add points
function addPoints(amount) {
  userPoints += amount;
  localStorage.setItem('hood-gift-points', userPoints);
  updatePointsDisplay();
  showToast(`💎 +${amount}ポイント獲得！`);
}

// Consume points
function consumePoints(amount) {
  if (userPoints >= amount) {
    userPoints -= amount;
    localStorage.setItem('hood-gift-points', userPoints);
    updatePointsDisplay();
    return true;
  }
  showToast('💎 ポイントが足りません');
  return false;
}

// Modified handleSubmit for V2
function handleSubmitV2(e) {
  e.preventDefault();
  const form = e.target;
  const priorityCheckbox = document.getElementById('priorityPost');
  const usePriority = priorityCheckbox?.checked;
  
  const formData = new FormData(form);
  const post = {
    id: Date.now(),
    type: formData.get('type'),
    category: formData.get('category'),
    title: formData.get('title'),
    description: formData.get('description'),
    location: formData.get('location'),
    timestamp: new Date().toISOString(),
    priority: usePriority || false,
    tips: 0,
    author: 'anonymous'
  };
  
  // Priority check
  if (usePriority && !isPremium) {
    if (!consumePoints(20)) {
      return; // Cancel if not enough points
    }
    post.priority = true;
  }
  
  posts.unshift(post);
  savePosts();
  renderPosts();
  closeModal(postModal);
  form.reset();
  
  // Add points for posting
  addPoints(10);
}

// Tip functionality
function tipPost(postId, amount) {
  if (!consumePoints(amount)) return;
  
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.tips = (post.tips || 0) + amount;
    savePosts();
    renderPosts();
    showToast(`💎 ${amount}ポイントを投げ銭しました！`);
  }
}

// Render tip buttons
function renderTipButtons(postId) {
  return `
    <div class="tip-section">
      <span class="tip-label">投げ銭:</span>
      <button class="btn-tip" onclick="tipPost(${postId}, 100)">💎100</button>
      <button class="btn-tip" onclick="tipPost(${postId}, 300)">💎300</button>
      <button class="btn-tip" onclick="tipPost(${postId}, 500)">💎500</button>
    </div>
  `;
}

// Premium subscription
function subscribePremium() {
  isPremium = true;
  localStorage.setItem('hood-gift-premium', 'true');
  showToast('👑 プレミアムに登録しました！');
  updatePremiumUI();
}

// Update UI for premium
function updatePremiumUI() {
  const premiumBtn = document.getElementById('premiumBtn');
  if (premiumBtn) {
    premiumBtn.classList.add('active');
    premiumBtn.title = isPremium ? 'プレミアム (アクティブ)' : 'プレミアム';
  }
  
  // Hide priority indicator for premium users
  const priorityDesc = document.querySelector('.priority-desc');
  if (priorityDesc && isPremium) {
    priorityDesc.textContent = '無制限（プレミアム）';
  }
}

// Open premium modal
function openPremiumModal() {
  if (isPremium) {
    showToast('👑 既にプレミアムです');
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal active premium-modal';
  modal.innerHTML = `
    <div class="modal-content premium-content">
      <h2>👑 プレミアムプラン</h2>
      <div class="premium-features">
        <p>✨ 無制限ポイント</p>
        <p>📢 優先表示無料</p>
        <p>💎 投げ銭特典2倍</p>
      </div>
      <div class="premium-pricing">
        <button class="btn-subscribe" onclick="subscribePremium(); this.closest('.modal').remove();">¥980/月で登録</button>
      </div>
      <button class="btn-close-modal" onclick="this.closest('.modal').remove()">閉じる</button>
    </div>
  `;
  document.body.appendChild(modal);
}

// Enhanced renderPosts with V2 features
function renderPostsV2() {
  if (!postsList) return;
  
  let filtered = posts.filter(post => {
    const typeMatch = currentFilter.type === 'all' || post.type === currentFilter.type;
    const catMatch = currentFilter.category === 'all' || post.category === currentFilter.category;
    return typeMatch && catMatch;
  });
  
  // Sort by priority
  filtered.sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  if (filtered.length === 0) {
    postsList.innerHTML = `
      <div class="empty-state">
        <p>投稿がありません</p>
        <p>新しい投稿を作成しましょう！</p>
      </div>
    `;
    return;
  }
  
  postsList.innerHTML = filtered.map(post => `
    <article class="post-card ${'type-' + post.type} ${post.priority ? 'priority' : ''}" data-id="${post.id}">
      <div class="post-header">
        <span class="post-type ${'type-' + post.type}">${getTypeLabel(post.type)}</span>
        <span class="post-category">${getCategoryLabel(post.category)}</span>
        ${post.priority ? '<span class="priority-badge">⭐優先</span>' : ''}
      </div>
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <p class="post-description">${escapeHtml(post.description)}</p>
      <div class="post-footer">
        <span class="post-location">${escapeHtml(post.location)}</span>
        <time datetime="${post.timestamp}">${formatDate(post.timestamp)}</time>
      </div>
      ${renderTipButtons(post.id)}
    </article>
  `).join('');
  
  // Add click handlers
  document.querySelectorAll('.post-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.tip-section')) {
        openChat(parseInt(card.dataset.id));
      }
    });
  });
}

// Toast notification
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize V2
document.addEventListener('DOMContentLoaded', () => {
  loadV2Data();
  updatePremiumUI();
  
  // Override original functions
  window.handleSubmit = handleSubmitV2;
  window.renderPosts = renderPostsV2;
  window.openPremiumModal = openPremiumModal;
  window.subscribePremium = subscribePremium;
  window.tipPost = tipPost;
});
