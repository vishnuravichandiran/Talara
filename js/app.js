/**
 * TALARA — The Palmyra Company
 * Application Controller & Interactive Core
 * Premium Indian Startup E-Commerce Showcase (₹ INR)
 */

(function () {
  'use strict';

  // State Management
  const STATE = {
    theme: localStorage.getItem('talara_theme') || 'light',
    cart: JSON.parse(localStorage.getItem('talara_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('talara_wishlist') || '[]'),
    activeCategory: 'all',
    activeStatusFilter: 'all', // 'all', 'featured', 'new', 'concept'
    activeAnatomyPart: null,
    searchQuery: '',
    sortBy: 'featured',
    selectedProductForModal: null,
    selectedVariantIndex: 0,
    modalQuantity: 1,
    activeProcessStep: 0,
    appliedPromo: null,
    freeShippingThreshold: 999.00,
    isAuthenticated: false,
    userProfile: JSON.parse(localStorage.getItem('talara_current_user') || 'null'),
    recentLogins: JSON.parse(localStorage.getItem('talara_recent_logins') || '[]'),
    users: JSON.parse(localStorage.getItem('talara_users') || '[]') // DB simulation
  };
  STATE.isAuthenticated = !!STATE.userProfile;

  // Promo codes configuration (Prices & discounts in ₹ INR)
  const PROMO_CODES = {
    'PALMVALUE': { type: 'percent', value: 0.15, label: '15% Off (Palm = Value)' },
    'BORASSUS': { type: 'percent', value: 0.20, label: '20% Off Launch Special' },
    'VANGUARD': { type: 'fixed', value: 100.00, label: '₹100 Off Pure Craft' }
  };

  // DOM Elements cache
  let dom = {};

  function initDOM() {
    dom = {
      navbar: document.getElementById('main-navbar'),
      loggedOutNav: document.getElementById('logged-out-nav'),
      loggedInNav: document.getElementById('logged-in-nav'),
      navSearchInput: document.getElementById('nav-search-input'),
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
      navMobileMenu: document.getElementById('mobile-menu-drawer'),
      navMobileToggle: document.getElementById('mobile-menu-toggle'),
      cartDrawer: document.getElementById('cart-drawer'),
      wishlistDrawer: document.getElementById('wishlist-drawer'),
      drawerBackdrop: document.getElementById('drawer-backdrop'),
      modalBackdrop: document.getElementById('modal-backdrop'),
      productPageView: document.getElementById('product-page-view'),
      unifiedAuthModal: document.getElementById('unified-auth-modal'),
      profileModal: document.getElementById('profile-modal'),
      checkoutModal: document.getElementById('checkout-modal'),
      orderSuccessModal: document.getElementById('order-success-modal'),
      toastContainer: document.getElementById('toast-container'),

      // Badges
      cartBadge: document.getElementById('cart-count-badge'),
      wishlistBadge: document.getElementById('wishlist-count-badge'),

      // Catalog
      productsGrid: document.getElementById('products-grid'),
      productCountEl: document.getElementById('product-results-count'),
      categoryFilterPills: document.querySelectorAll('.filter-pill[data-category]'),
      statusTabBtns: document.querySelectorAll('.status-tab-btn[data-status]'),
      searchInput: document.getElementById('product-search-input'),
      sortSelect: document.getElementById('product-sort-select'),

      // Anatomy
      anatomyCardsContainer: document.getElementById('anatomy-cards-container'),
      anatomyDetailPanel: document.getElementById('anatomy-detail-panel'),

      // Process
      processTimelineContainer: document.getElementById('process-timeline-container'),
      processDetailPanel: document.getElementById('process-detail-panel'),

      // Cart Elements
      cartItemsList: document.getElementById('cart-items-list'),
      cartSubtotalEl: document.getElementById('cart-subtotal-val'),
      cartShippingEl: document.getElementById('cart-shipping-val'),
      cartTotalEl: document.getElementById('cart-total-val'),
      cartFreeShippingBar: document.getElementById('cart-free-shipping-fill'),
      cartFreeShippingText: document.getElementById('cart-free-shipping-text'),
      promoCodeInput: document.getElementById('promo-code-input'),
      applyPromoBtn: document.getElementById('apply-promo-btn'),
      promoFeedbackEl: document.getElementById('promo-feedback-msg'),
      promoDiscountRow: document.getElementById('cart-promo-discount-row'),
      promoDiscountVal: document.getElementById('cart-promo-discount-val'),

      // Wishlist Elements
      wishlistItemsList: document.getElementById('wishlist-items-list'),

      // Contact Form
      b2bForm: document.getElementById('b2b-inquiry-form'),
      
      // Drawer counts
      cartDrawerCount: document.getElementById('cart-drawer-count')
    };
  }

  // --- Currency & Formatting Helpers (Indian Rupees ₹ / INR) ---
  function formatMoney(amount) {
    const num = Math.round(Number(amount) || 0);
    return '₹' + num.toLocaleString('en-IN');
  }

  function showToast(message, type = 'info') {
    if (!dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'warn') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-amber-light)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <div class="flex-shrink-0">${iconSvg}</div>
      <div class="text-sm font-medium">${message}</div>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function saveCart() {
    localStorage.setItem('talara_cart', JSON.stringify(STATE.cart));
    if (STATE.isAuthenticated && STATE.userProfile) {
      const userIdx = STATE.users.findIndex(u => u.email === STATE.userProfile.email);
      if (userIdx > -1) {
        STATE.users[userIdx].cart = STATE.cart;
        localStorage.setItem('talara_users', JSON.stringify(STATE.users));
      }
    }
    updateCartUI();
  }

  function saveWishlist() {
    localStorage.setItem('talara_wishlist', JSON.stringify(STATE.wishlist));
    if (STATE.isAuthenticated && STATE.userProfile) {
      const userIdx = STATE.users.findIndex(u => u.email === STATE.userProfile.email);
      if (userIdx > -1) {
        STATE.users[userIdx].wishlist = STATE.wishlist;
        localStorage.setItem('talara_users', JSON.stringify(STATE.users));
      }
    }
    updateWishlistUI();
  }

  // --- Scroll & Navbar Handling ---
  function initNavbarScroll() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        dom.navbar.classList.add('navbar-scrolled');
      } else {
        dom.navbar.classList.remove('navbar-scrolled');
      }
    }, { passive: true });
  }

  // Theme Management removed per user request (Default to dark)



  // --- Catalog Filtering & Sorting ---
  function getFilteredProducts() {
    let list = [...PRODUCTS_DATA];

    // Filter by Category
    if (STATE.activeCategory !== 'all') {
      list = list.filter(p => p.category === STATE.activeCategory);
    }

    // Filter by Status / Highlight (Featured, New, Concepts)
    if (STATE.activeStatusFilter === 'featured') {
      list = list.filter(p => p.isFeatured);
    } else if (STATE.activeStatusFilter === 'new') {
      list = list.filter(p => p.isNew);
    } else if (STATE.activeStatusFilter === 'concept') {
      list = list.filter(p => p.status === 'concept');
    }

    // Filter by Palm Anatomy Part
    if (STATE.activeAnatomyPart) {
      list = list.filter(p => p.palmPartId === STATE.activeAnatomyPart);
    }

    // Filter by Search Query
    if (STATE.searchQuery.trim() !== '') {
      const q = STATE.searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.shortDesc.toLowerCase().includes(q) ||
        p.palmPart.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        (p.ingredients && p.ingredients.some(i => i.toLowerCase().includes(q)))
      );
    }

    // Sorting
    if (STATE.sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (STATE.sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (STATE.sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (STATE.sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Featured priority
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return list;
  }

  // --- Render Products Grid ---
  function renderProductsGrid() {
    if (!dom.productsGrid) return;
    const items = getFilteredProducts();

    if (dom.productCountEl) {
      dom.productCountEl.textContent = `Showing ${items.length} creations across the Borassus ecosystem`;
    }

    if (items.length === 0) {
      dom.productsGrid.innerHTML = `
        <div class="col-span-full text-center py-16 px-4">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-950/40 text-amber-400 mb-4 border border-amber-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <h3 class="text-xl font-display font-semibold text-white mb-2">No Palm Creations Found</h3>
          <p class="text-zinc-400 max-w-md mx-auto text-sm mb-6">No products match your active criteria. Reset filters or search for another palm derivative.</p>
          <button id="reset-filters-btn" class="btn-primary py-2 px-6 text-sm">Reset All Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filters-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          STATE.activeCategory = 'all';
          STATE.activeStatusFilter = 'all';
          STATE.activeAnatomyPart = null;
          STATE.searchQuery = '';
          if (dom.searchInput) dom.searchInput.value = '';
          updateCategoryPills();
          updateStatusTabs();
          renderProductsGrid();
        });
      }
      return;
    }

    dom.productsGrid.innerHTML = items.map(product => {
      const isWishlisted = STATE.wishlist.some(id => id === product.id);
      const isConcept = product.status === 'concept';

      return `
        <article class="product-card group flex flex-col overflow-hidden" data-product-id="${product.id}">
          ${product.isAlcoholic ? `
            <div class="w-full py-1.5 px-3 bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-b border-red-500/40 text-center flex items-center justify-center gap-2 z-20">
              <span class="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] tracking-wider font-mono uppercase shadow-sm">21+ ONLY</span>
              <span class="text-[11px] font-semibold text-red-200 tracking-wide font-sans">For Adults Aged 21 and Above</span>
            </div>
          ` : ''}
          <!-- Product Visual Container (ONE UNIQUE IMAGE PER PRODUCT) -->
          <div class="product-card-img-wrap relative">
            <img 
              src="${product.image}" 
              alt="${product.name}" 
              class="product-card-img w-full h-56 sm:h-64 object-cover" 
              loading="lazy"
              onerror="this.src='images/hero-palmyra.jpg'"
            />
            
            <!-- Badges Overlay -->
            <div class="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
              <span class="badge-tag ${product.isAlcoholic ? 'badge-red' : (isConcept ? 'badge-blue' : 'badge-amber')}" ${isConcept ? 'style="background:rgba(56,189,248,0.2);border-color:#38bdf8;color:#e0f2fe"' : ''}>
                ${product.badge}
              </span>
              ${product.isNew ? '<span class="badge-tag badge-emerald">New Harvest</span>' : ''}
            </div>

            <!-- Wishlist Button -->
            <button 
              class="wishlist-toggle-btn absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-amber-400 hover:scale-110 transition-all z-10 ${isWishlisted ? 'text-amber-400 !border-amber-400/40 bg-amber-950/50' : ''}"
              data-product-id="${product.id}"
              aria-label="Save to wishlist"
              title="Add to wishlist"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>

            <!-- Quick Specs Hover Button -->
            <button 
              class="quick-view-btn absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 py-2 px-5 bg-black/85 hover:bg-black backdrop-blur-md border border-amber-500/40 text-amber-200 rounded-full text-xs font-semibold tracking-wider uppercase shadow-xl flex items-center gap-1.5 pointer-events-auto"
              data-product-id="${product.id}"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Quick Specs
            </button>
          </div>

          <!-- Product Details Body -->
          <div class="p-5 flex flex-col flex-grow">
            <div class="flex items-center justify-between text-xs text-amber-400/80 mb-1.5 font-mono uppercase tracking-wider">
              <span class="truncate max-w-[160px]">${product.categoryLabel}</span>
              <span class="flex items-center gap-1 text-zinc-400 flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--primary-amber)" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                ${product.rating} (${product.reviewsCount})
              </span>
            </div>

            <h3 class="font-display font-semibold text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors mb-1 line-clamp-1 cursor-pointer" data-product-id="${product.id}">
              ${product.name}
            </h3>

            <!-- Explicit Palmyra Palm Source Part Identification -->
            <div class="text-xs text-zinc-400 mb-2 font-mono flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
              <span class="truncate">Source: <strong class="text-zinc-200">${product.palmPart}</strong></span>
            </div>

            <!-- Short Description -->
            <p class="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed flex-grow">
              ${product.shortDesc}
            </p>

            <!-- Card Bottom Bar: Price in ₹ INR & Action Buttons -->
            <div class="pt-3 border-t border-white/5 flex items-center justify-between mt-auto">
              <div>
                <span class="text-[10px] text-zinc-500 block uppercase tracking-wider font-mono">Price (INR)</span>
                <span class="text-lg font-bold font-display text-white">${formatMoney(product.price)}</span>
              </div>

              <div class="flex items-center gap-2">
                <!-- Explore Product Story Modal Button -->
                <button 
                  class="open-product-modal-btn p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors border border-white/10"
                  data-product-id="${product.id}"
                  title="Explore Full Story & Specs"
                  aria-label="View product details"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </button>

                <!-- Add to Cart or Explore Concept Button -->
                ${isConcept ? `
                  <button 
                    class="open-product-modal-btn text-xs py-2 px-3.5 rounded-full border border-sky-500/40 bg-sky-950/30 text-sky-200 hover:bg-sky-900/50 font-semibold flex items-center gap-1.5 transition-all"
                    data-product-id="${product.id}"
                  >
                    <span>Concept</span>
                  </button>
                ` : `
                  <button 
                    class="direct-add-cart-btn btn-amber-outline py-2 px-3 text-xs font-semibold flex items-center gap-1.5"
                    data-product-id="${product.id}"
                    title="Add to Cart"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    <span>Add</span>
                  </button>
                  <button 
                    class="direct-buy-now-btn btn-primary py-2 px-3 text-xs font-semibold flex items-center gap-1.5"
                    data-product-id="${product.id}"
                    title="Buy Now"
                  >
                    <span>Buy</span>
                  </button>
                `}
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    bindProductCardEvents();
  }

  function bindProductCardEvents() {
    // Open product modal
    document.querySelectorAll('.open-product-modal-btn, .quick-view-btn, .product-card h3').forEach(el => {
      el.addEventListener('click', (e) => {
        const card = e.target.closest('[data-product-id]');
        if (card) {
          const pid = card.dataset.productId;
          openProductModal(pid);
        }
      });
    });

    // Wishlist toggle
    document.querySelectorAll('.wishlist-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = btn.dataset.productId;
        toggleWishlist(pid);
      });
    });

    // Direct Add to Cart
    document.querySelectorAll('.direct-add-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = btn.dataset.productId;
        handleAddToCartDirect(pid);
      });
    });

    // Buy Now
    document.querySelectorAll('.direct-buy-now-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = btn.dataset.productId;
        const product = PRODUCTS_DATA.find(p => p.id === pid);
        if (!product) return;
        
        if (product.status === 'concept') {
          openProductModal(pid);
          return;
        }

        const defaultVariant = product.variants[0] || { price: product.price, name: 'Standard' };
        addToCart(product.id, defaultVariant.name, defaultVariant.price, 1);
        
        if (STATE.isAuthenticated) {
          openCheckoutModal();
        } else {
          showToast('Please login to checkout.', 'warn');
          openUnifiedAuthModal('login');
        }
      });
    });
  }

  function updateCategoryPills() {
    dom.categoryFilterPills.forEach(pill => {
      if (pill.dataset.category === STATE.activeCategory) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  function updateStatusTabs() {
    if (!dom.statusTabBtns) return;
    dom.statusTabBtns.forEach(btn => {
      if (btn.dataset.status === STATE.activeStatusFilter) {
        btn.className = 'status-tab-btn active px-3.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 text-amber-200 font-semibold transition-all';
      } else {
        btn.className = 'status-tab-btn px-3.5 py-1.5 rounded-lg border border-white/10 bg-black/40 text-zinc-400 hover:text-white transition-all';
      }
    });
  }

  // --- Palm Anatomy Interactive Module ---
  function renderAnatomySection() {
    if (!dom.anatomyCardsContainer) return;

    dom.anatomyCardsContainer.innerHTML = PALM_ANATOMY.map((part, index) => {
      const isActive = STATE.activeAnatomyPart === part.id;
      return `
        <div 
          class="anatomy-card glass-panel rounded-xl p-5 border border-white/5 hover:border-amber-500/40 transition-all ${isActive ? 'active' : ''}"
          data-part-id="${part.id}"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">Node 0${index + 1}</span>
            <div class="anatomy-node-dot"></div>
          </div>
          <h4 class="font-display font-semibold text-base text-white mb-1">${part.partName}</h4>
          <p class="text-xs text-zinc-400 italic mb-2.5">${part.botanicalTerm}</p>
          <p class="text-xs text-zinc-300 line-clamp-2 mb-3 leading-relaxed">${part.role}</p>
          <div class="flex items-center justify-between text-xs text-amber-300/90 pt-2 border-t border-white/5">
            <span>${part.relatedProductIds.length} Flagship Derivatives</span>
            <span class="flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform">
              Explore →
            </span>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.anatomy-card').forEach(card => {
      card.addEventListener('click', () => {
        const partId = card.dataset.partId;
        selectAnatomyPart(partId);
      });
    });

    updateAnatomyDetailPanel();
  }

  function selectAnatomyPart(partId) {
    if (STATE.activeAnatomyPart === partId) {
      STATE.activeAnatomyPart = null;
    } else {
      STATE.activeAnatomyPart = partId;
    }
    renderAnatomySection();
    renderProductsGrid();

    if (STATE.activeAnatomyPart) {
      const catSection = document.getElementById('catalog-section');
      if (catSection) {
        catSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  function updateAnatomyDetailPanel() {
    if (!dom.anatomyDetailPanel) return;
    const currentPart = PALM_ANATOMY.find(p => p.id === (STATE.activeAnatomyPart || 'inflorescence'));
    if (!currentPart) return;

    dom.anatomyDetailPanel.innerHTML = `
      <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-amber-500/20 shadow-2xl relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-amber-500/5 blur-3xl pointer-events-none"></div>

        <div class="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-white/10 pb-4">
          <div>
            <span class="badge-tag badge-amber mb-1.5 font-mono text-[11px]">Botanical Fraction</span>
            <h3 class="font-display text-2xl font-bold text-white">${currentPart.partName}</h3>
            <p class="text-sm font-mono text-amber-400 italic">${currentPart.botanicalTerm}</p>
          </div>
          <div class="text-right">
            <span class="text-xs text-zinc-400 block font-mono">Harvest Window</span>
            <span class="text-sm font-semibold text-zinc-200">${currentPart.harvestSeason}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <h5 class="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Tree Function & Ecosystem Role</h5>
            <p class="text-zinc-300 leading-relaxed">${currentPart.role}</p>
          </div>
          <div>
            <h5 class="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Modern High-Value Transformation</h5>
            <p class="text-zinc-300 leading-relaxed">${currentPart.modernValue}</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-black/40 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="text-zinc-300"><strong class="text-white">Yield Efficiency:</strong> ${currentPart.utilizationRate}</span>
          </div>
          <button 
            id="filter-by-anatomy-btn"
            class="btn-amber-outline text-xs py-1.5 px-3.5"
            data-part-id="${currentPart.id}"
          >
            Filter Catalog for This Part (${currentPart.relatedProductIds.length})
          </button>
        </div>
      </div>
    `;

    const filterBtn = document.getElementById('filter-by-anatomy-btn');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        STATE.activeAnatomyPart = filterBtn.dataset.partId;
        renderProductsGrid();
        const catalogEl = document.getElementById('catalog-section');
        if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  // --- Process Journey Timeline ---
  function renderProcessTimeline() {
    if (!dom.processTimelineContainer) return;

    dom.processTimelineContainer.innerHTML = PROCESS_STEPS.map((step, index) => {
      const isActive = STATE.activeProcessStep === index;
      return `
        <button 
          class="process-step-tab text-left p-4 rounded-xl transition-all border ${isActive ? 'bg-amber-950/30 border-amber-500/40 text-white' : 'bg-transparent border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/20'}"
          data-step-index="${index}"
        >
          <span class="font-mono text-xs text-amber-400 font-bold block mb-1">STAGE ${step.step}</span>
          <h4 class="font-display font-semibold text-sm ${isActive ? 'text-amber-200' : 'text-zinc-300'}">${step.title}</h4>
        </button>
      `;
    }).join('');

    document.querySelectorAll('.process-step-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        STATE.activeProcessStep = parseInt(tab.dataset.stepIndex, 10);
        renderProcessTimeline();
        updateProcessDetailPanel();
      });
    });

    updateProcessDetailPanel();
  }

  function updateProcessDetailPanel() {
    if (!dom.processDetailPanel) return;
    const step = PROCESS_STEPS[STATE.activeProcessStep];
    if (!step) return;

    dom.processDetailPanel.innerHTML = `
      <div class="glass-panel p-6 sm:p-10 rounded-2xl border border-white/10 relative overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-4">
            <span class="step-number text-amber-500/40">${step.step}</span>
            <div>
              <span class="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold block">${step.phase}</span>
              <h3 class="font-display text-2xl font-bold text-white">${step.title}</h3>
            </div>
          </div>
        </div>

        <p class="text-base text-zinc-200 mb-4 leading-relaxed font-sans font-medium">
          ${step.summary}
        </p>

        <p class="text-sm text-zinc-400 mb-6 leading-relaxed">
          ${step.detail}
        </p>

        <div class="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-4 text-xs font-mono text-emerald-400 bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-500/20">
          <span class="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            ${step.metrics}
          </span>
          <div class="flex gap-2">
            <button id="prev-process-btn" class="p-1.5 rounded-full hover:bg-white/10 text-white" ${STATE.activeProcessStep === 0 ? 'disabled style="opacity:0.3"' : ''}>← Prev</button>
            <button id="next-process-btn" class="p-1.5 rounded-full hover:bg-white/10 text-white" ${STATE.activeProcessStep === PROCESS_STEPS.length - 1 ? 'disabled style="opacity:0.3"' : ''}>Next →</button>
          </div>
        </div>
      </div>
    `;

    const prevBtn = document.getElementById('prev-process-btn');
    const nextBtn = document.getElementById('next-process-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (STATE.activeProcessStep > 0) {
          STATE.activeProcessStep--;
          renderProcessTimeline();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (STATE.activeProcessStep < PROCESS_STEPS.length - 1) {
          STATE.activeProcessStep++;
          renderProcessTimeline();
        }
      });
    }
  }

  // --- Product Detail Modal (Single Image + Alternative Products Showcase) ---
  function openProductModal(productId) {
    const product = PRODUCTS_DATA.find(p => p.id === productId);
    if (!product) return;

    STATE.selectedProductForModal = product;
    STATE.selectedVariantIndex = 0;
    STATE.modalQuantity = 1;

    renderProductModalContent();
    dom.productPageView.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    dom.productPageView.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Get distinct alternative products for the modal to showcase ecosystem breadth
  function getAlternativeProducts(currentProductId) {
    return PRODUCTS_DATA
      .filter(p => p.id !== currentProductId)
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
  }

  function renderProductModalContent() {
    const product = STATE.selectedProductForModal;
    if (!product) return;

    const currentVariant = product.variants[STATE.selectedVariantIndex] || { price: product.price, name: 'Standard' };
    const totalPrice = currentVariant.price * STATE.modalQuantity;
    const isConcept = product.status === 'concept';
    const alternativeProducts = getAlternativeProducts(product.id);

    dom.productPageView.innerHTML = `
      <div class="site-container py-8 max-w-6xl mx-auto">
        <!-- Back Button -->
        <button 
          id="close-modal-btn" 
          class="mb-6 flex items-center gap-2 text-zinc-400 hover:text-amber-400 transition-colors"
          aria-label="Back to Catalog"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          <span class="font-mono text-sm tracking-wider uppercase font-semibold">Back to Catalog</span>
        </button>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-12 mb-8">
          <!-- Left: Single High-Definition Visual & Botanical Origin -->
          <div class="md:col-span-6 flex flex-col">
            <div class="rounded-2xl overflow-hidden bg-black/40 border border-white/10 relative mb-4">
              <img 
                src="${product.image}" 
                alt="${product.name}" 
                class="w-full h-80 object-cover" 
                onerror="this.src='images/hero-palmyra.jpg'"
              />
              <div class="absolute bottom-3 left-3 flex flex-wrap gap-2">
                <span class="badge-tag ${product.isAlcoholic ? 'badge-red' : (isConcept ? 'badge-blue' : 'badge-amber')}">${product.badge}</span>
                ${product.isAlcoholic ? '<span class="badge-tag" style="background:rgba(239,68,68,0.25);border:1px solid rgba(239,68,68,0.5);color:#fca5a5;font-size:10px;">21+ ONLY • For Adults Aged 21 and Above</span>' : ''}
                ${product.isNew ? '<span class="badge-tag badge-emerald">New Harvest</span>' : ''}
              </div>
            </div>

            <!-- Palm Part Breakdown Card -->
            <div class="p-4 rounded-xl bg-black/30 border border-emerald-500/20 text-xs">
              <span class="text-amber-400 font-mono uppercase tracking-wider block mb-1">Botanical Origin Fraction</span>
              <p class="text-white font-semibold text-sm mb-1">${product.palmPart}</p>
              <p class="text-zinc-400 leading-relaxed">
                Harvested non-destructively from coastal agroforestry groves in Tamil Nadu. 100% tree life preserved.
              </p>
            </div>
          </div>

          <!-- Right: Details, Nutrition, E-Commerce in ₹ INR -->
          <div class="md:col-span-7 flex flex-col">
            ${product.isAlcoholic ? `
              <div class="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-red-950/70 via-red-900/50 to-red-950/70 border border-red-500/50 flex items-center gap-3">
                <span class="px-2 py-1 rounded-md bg-red-600 text-white font-bold text-xs font-mono tracking-wider uppercase flex-shrink-0 shadow-sm">21+ ONLY</span>
                <div class="text-xs">
                  <span class="font-bold text-red-200 block">For Adults Aged 21 and Above</span>
                  <span class="text-[11px] text-red-300/80 font-sans">Traditional Alcoholic Beverage (~5.2% ABV). Legal age verification required.</span>
                </div>
              </div>
            ` : ''}
            <div class="mb-4">
              <div class="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400 mb-1">
                <span>${product.categoryLabel}</span>
                <span>•</span>
                <span>★ ${product.rating} (${product.reviewsCount} verified reviews)</span>
              </div>
              <h2 class="font-display text-2xl sm:text-3xl font-bold text-white mb-1">${product.name}</h2>
              <p class="text-sm text-zinc-400 italic mb-3">${product.subtitle}</p>
              <p class="text-sm text-zinc-300 leading-relaxed mb-4">${product.fullDescription}</p>
            </div>

            <!-- Tab Buttons -->
            <div class="flex border-b border-white/10 text-xs font-medium gap-6 mb-4">
              <button class="modal-tab-btn active pb-2 border-b-2 border-amber-500 text-white font-semibold" data-tab="specs">Ingredients & Nutrition</button>
              <button class="modal-tab-btn pb-2 border-b-2 border-transparent text-zinc-400 hover:text-white" data-tab="journey">Harvest & Packaging</button>
              <button class="modal-tab-btn pb-2 border-b-2 border-transparent text-zinc-400 hover:text-white" data-tab="safety">Scientific Rigor & Safety</button>
            </div>

            <!-- Tab 1: Specs -->
            <div id="modal-tab-specs" class="modal-tab-content space-y-4 text-xs">
              <div>
                <h5 class="font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Ingredients / Materials</h5>
                <ul class="list-disc list-inside text-zinc-200 space-y-1">
                  ${product.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
              </div>

              ${product.nutrition ? `
                <div class="p-3.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px]">
                  <div class="flex justify-between font-bold text-white pb-1.5 border-b border-white/10 mb-1.5">
                    <span>NUTRITIONAL PANEL</span>
                    <span>${product.nutrition.servingSize}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-300">
                    <div>Energy: <strong class="text-white">${product.nutrition.calories}</strong></div>
                    ${product.nutrition.carbs ? `<div>Carbohydrates: <strong class="text-white">${product.nutrition.carbs}</strong></div>` : ''}
                    ${product.nutrition.sugars ? `<div>Sugars: <strong class="text-white">${product.nutrition.sugars}</strong></div>` : ''}
                    ${product.nutrition.protein ? `<div>Protein: <strong class="text-white">${product.nutrition.protein}</strong></div>` : ''}
                    ${product.nutrition.dietaryFiber ? `<div>Dietary Fiber: <strong class="text-white">${product.nutrition.dietaryFiber}</strong></div>` : ''}
                    ${product.nutrition.resistantStarch ? `<div>Resistant Starch: <strong class="text-white">${product.nutrition.resistantStarch}</strong></div>` : ''}
                    ${product.nutrition.potassium ? `<div>Potassium: <strong class="text-white">${product.nutrition.potassium}</strong></div>` : ''}
                    ${product.nutrition.iron ? `<div>Iron: <strong class="text-white">${product.nutrition.iron}</strong></div>` : ''}
                  </div>
                </div>
              ` : ''}

              <div class="grid grid-cols-2 gap-3 text-zinc-300">
                <div>
                  <span class="text-zinc-500 uppercase block text-[10px]">Allergen Statement</span>
                  <span>Naturally Gluten-Free & Vegan</span>
                </div>
                <div>
                  <span class="text-zinc-500 uppercase block text-[10px]">FSSAI Compliance</span>
                  <span>Certified Clean Batch Facility</span>
                </div>
              </div>
            </div>

            <!-- Tab 2: Journey -->
            <div id="modal-tab-journey" class="modal-tab-content hidden space-y-3 text-xs">
              <div>
                <h5 class="font-mono text-zinc-400 uppercase tracking-wider mb-1">Single-Origin Harvest</h5>
                <p class="text-zinc-300 leading-relaxed">
                  Collected directly from our network of 420+ certified tapper families across Tirunelveli and Thoothukudi groves.
                </p>
              </div>
              <div>
                <h5 class="font-mono text-zinc-400 uppercase tracking-wider mb-1">Zero-Tree Sustainable Packaging</h5>
                <p class="text-zinc-300 leading-relaxed">
                  Secondary cushioning molded from shed palm petioles paired with pharmaceutical-grade UV-filtering glass and recyclable kraft paper.
                </p>
              </div>
            </div>

            <!-- Tab 3: Safety & Science -->
            <div id="modal-tab-safety" class="modal-tab-content hidden space-y-3 text-xs">
              <div class="safety-warning-banner p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-lg text-amber-200">
                <strong class="block mb-1 font-bold uppercase tracking-wider">Scientific Advisory:</strong>
                TALARA products are unrefined natural botanical foods and homeware. While unrefined palm sweeteners possess a lower glycemic profile than white table sugar, they contribute carbohydrates and calories. No product on this site cures or treats diabetes or metabolic illnesses.
              </div>
            </div>

            <!-- Variant Selector & E-Commerce in ₹ INR -->
            <div class="mt-6 pt-4 border-t border-white/10">
              <div class="mb-3">
                <span class="text-xs font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">Select Size / Pack (₹ INR)</span>
                <div class="flex flex-wrap gap-2">
                  ${product.variants.map((v, idx) => `
                    <button 
                      class="variant-btn py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${idx === STATE.selectedVariantIndex ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-md' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}"
                      data-variant-index="${idx}"
                    >
                      ${v.name} (${formatMoney(v.price)})
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Quantity & Add to Cart -->
              <div class="flex items-center gap-3 pt-2">
                ${isConcept ? `
                  <button 
                    id="concept-notify-btn" 
                    class="btn-primary flex-grow py-3 px-6 text-sm"
                  >
                    Notify Me Upon Prototype Release
                  </button>
                ` : `
                  <div class="flex items-center border border-white/15 rounded-full bg-black/40 overflow-hidden flex-shrink-0">
                    <button id="modal-qty-minus" class="px-3.5 py-2 text-zinc-400 hover:text-white transition-colors">-</button>
                    <span id="modal-qty-val" class="px-3 py-2 text-sm font-bold font-mono text-white">${STATE.modalQuantity}</span>
                    <button id="modal-qty-plus" class="px-3.5 py-2 text-zinc-400 hover:text-white transition-colors">+</button>
                  </div>

                  <button 
                    id="modal-add-to-cart-btn" 
                    class="btn-amber-outline flex-grow py-3 px-2 text-xs sm:text-sm font-semibold whitespace-nowrap"
                  >
                    Add • ${formatMoney(totalPrice)}
                  </button>
                  <button 
                    id="modal-buy-now-btn" 
                    class="btn-primary flex-grow py-3 px-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    Buy Now
                  </button>
                `}
              </div>
            </div>

          </div>
        </div>

        <!-- ALTERNATIVE PALMYRA PALM PRODUCTS (No Duplicate Photos) -->
        <div class="pt-6 border-t border-white/10">
          <div class="flex items-center justify-between mb-4">
            <div>
              <span class="text-xs font-mono uppercase tracking-wider text-amber-400 block">Explore The Whole Tree</span>
              <h4 class="font-display font-bold text-lg text-white">Alternative Palmyra Palm Creations</h4>
            </div>
            <span class="text-xs font-mono text-zinc-400 hidden sm:inline">Different derivatives from Borassus flabellifer</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            ${alternativeProducts.map(alt => `
              <div 
                class="alt-product-card glass-panel p-3 rounded-xl border border-white/5 hover:border-amber-500/40 cursor-pointer transition-all group"
                data-alt-id="${alt.id}"
              >
                <div class="w-full h-24 rounded-lg overflow-hidden mb-2 bg-black/50 relative">
                  <img src="${alt.image}" alt="${alt.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span class="absolute bottom-1 left-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-amber-300">
                    ${alt.categoryLabel.split(' ')[0]}
                  </span>
                </div>
                <h5 class="text-xs font-semibold text-white group-hover:text-amber-300 truncate">${alt.name}</h5>
                <p class="text-[11px] font-mono text-amber-400 font-bold">${formatMoney(alt.price)}</p>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    bindModalEvents();
  }

  function bindModalEvents() {
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeProductModal);

    // Tab switching
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-tab-btn').forEach(b => {
          b.classList.remove('active', 'border-amber-500', 'text-white', 'font-semibold');
          b.classList.add('border-transparent', 'text-zinc-400');
        });
        btn.classList.add('active', 'border-amber-500', 'text-white', 'font-semibold');
        btn.classList.remove('border-transparent', 'text-zinc-400');

        const tabKey = btn.dataset.tab;
        document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.add('hidden'));
        const targetContent = document.getElementById(`modal-tab-${tabKey}`);
        if (targetContent) targetContent.classList.remove('hidden');
      });
    });

    // Variant Selection
    document.querySelectorAll('.variant-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.selectedVariantIndex = parseInt(btn.dataset.variantIndex, 10);
        renderProductModalContent();
      });
    });

    // Quantity controls
    const minusBtn = document.getElementById('modal-qty-minus');
    const plusBtn = document.getElementById('modal-qty-plus');
    if (minusBtn) {
      minusBtn.addEventListener('click', () => {
        if (STATE.modalQuantity > 1) {
          STATE.modalQuantity--;
          renderProductModalContent();
        }
      });
    }
    if (plusBtn) {
      plusBtn.addEventListener('click', () => {
        STATE.modalQuantity++;
        renderProductModalContent();
      });
    }

    // Add to Cart
    const addBtn = document.getElementById('modal-add-to-cart-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const product = STATE.selectedProductForModal;
        const variant = product.variants[STATE.selectedVariantIndex] || { price: product.price, name: 'Standard' };
        addToCart(product.id, variant.name, variant.price, STATE.modalQuantity);
        closeProductModal();
      });
    }

    const buyNowBtn = document.getElementById('modal-buy-now-btn');
    if (buyNowBtn) {
      buyNowBtn.addEventListener('click', () => {
        const product = STATE.selectedProductForModal;
        const variant = product.variants[STATE.selectedVariantIndex] || { price: product.price, name: 'Standard' };
        addToCart(product.id, variant.name, variant.price, STATE.modalQuantity);
        closeProductModal();
        
        if (STATE.isAuthenticated) {
          openCheckoutModal();
        } else {
          showToast('Please login to checkout.', 'warn');
          openUnifiedAuthModal('login');
        }
      });
    }

    // Concept notify
    const notifyBtn = document.getElementById('concept-notify-btn');
    if (notifyBtn) {
      notifyBtn.addEventListener('click', () => {
        showToast('Thank you! You will be notified when this prototype enters testing.', 'success');
        closeProductModal();
      });
    }

    // Alternative product clicks
    document.querySelectorAll('.alt-product-card').forEach(card => {
      card.addEventListener('click', () => {
        const altId = card.dataset.altId;
        openProductModal(altId);
      });
    });
  }

  // --- Cart Management in ₹ INR ---
  function handleAddToCartDirect(productId) {
    if (!STATE.isAuthenticated) {
      showToast('Please login to add items to cart.', 'warn');
      return openUnifiedAuthModal('login');
    }

    const product = PRODUCTS_DATA.find(p => p.id === productId);
    if (!product) return;

    if (product.status === 'concept') {
      openProductModal(productId);
      return;
    }

    const defaultVariant = product.variants[0] || { price: product.price, name: 'Standard' };
    addToCart(product.id, defaultVariant.name, defaultVariant.price, 1);
  }

  function addToCart(productId, variantName, price, quantity) {
    if (!STATE.isAuthenticated) {
      showToast('Please login to add items to cart.', 'warn');
      return openUnifiedAuthModal('login');
    }

    const existingIndex = STATE.cart.findIndex(item => item.productId === productId && item.variantName === variantName);
    if (existingIndex > -1) {
      STATE.cart[existingIndex].quantity += quantity;
    } else {
      STATE.cart.push({
        productId,
        variantName,
        price,
        quantity
      });
    }
    saveCart();
    const product = PRODUCTS_DATA.find(p => p.id === productId);
    showToast(`Added "${product.name}" to cart`, 'success');
  }

  function updateCartItemQuantity(index, delta) {
    if (!STATE.cart[index]) return;
    STATE.cart[index].quantity += delta;
    if (STATE.cart[index].quantity <= 0) {
      STATE.cart.splice(index, 1);
    }
    saveCart();
  }

  function removeCartItem(index) {
    if (!STATE.cart[index]) return;
    STATE.cart.splice(index, 1);
    saveCart();
    showToast('Item removed from cart', 'info');
  }

  function getCartCalculations() {
    const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;

    if (STATE.appliedPromo) {
      if (STATE.appliedPromo.type === 'percent') {
        discount = subtotal * STATE.appliedPromo.value;
      } else if (STATE.appliedPromo.type === 'fixed') {
        discount = Math.min(subtotal, STATE.appliedPromo.value);
      }
    }

    const shipping = (subtotal >= STATE.freeShippingThreshold || subtotal === 0) ? 0 : 70.00;
    const total = Math.max(0, subtotal - discount + shipping);

    return { subtotal, discount, shipping, total };
  }

  function updateCartUI() {
    const totalCount = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (dom.cartBadge) {
      dom.cartBadge.textContent = totalCount;
      dom.cartBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }
    if (dom.cartDrawerCount) {
      dom.cartDrawerCount.textContent = totalCount;
    }

    const { subtotal, discount, shipping, total } = getCartCalculations();

    if (dom.cartSubtotalEl) dom.cartSubtotalEl.textContent = formatMoney(subtotal);
    if (dom.cartShippingEl) dom.cartShippingEl.textContent = shipping === 0 ? 'FREE' : formatMoney(shipping);
    if (dom.cartTotalEl) dom.cartTotalEl.textContent = formatMoney(total);

    // Free shipping threshold progress bar (₹999)
    if (dom.cartFreeShippingBar && dom.cartFreeShippingText) {
      if (subtotal === 0) {
        dom.cartFreeShippingBar.style.width = '0%';
        dom.cartFreeShippingText.textContent = `Add ${formatMoney(STATE.freeShippingThreshold)} for Free Climate-Neutral Delivery`;
      } else if (subtotal >= STATE.freeShippingThreshold) {
        dom.cartFreeShippingBar.style.width = '100%';
        dom.cartFreeShippingText.textContent = 'You have unlocked Free Climate-Neutral Delivery!';
      } else {
        const remaining = STATE.freeShippingThreshold - subtotal;
        const pct = Math.min(100, (subtotal / STATE.freeShippingThreshold) * 100);
        dom.cartFreeShippingBar.style.width = `${pct}%`;
        dom.cartFreeShippingText.textContent = `Add ${formatMoney(remaining)} more for Free Shipping`;
      }
    }

    // Promo row display
    if (dom.promoDiscountRow && dom.promoDiscountVal) {
      if (discount > 0) {
        dom.promoDiscountRow.classList.remove('hidden');
        dom.promoDiscountVal.textContent = `-${formatMoney(discount)}`;
      } else {
        dom.promoDiscountRow.classList.add('hidden');
      }
    }

    // Render Items
    if (!dom.cartItemsList) return;

    if (STATE.cart.length === 0) {
      dom.cartItemsList.innerHTML = `
        <div class="text-center py-16 px-4">
          <div class="w-14 h-14 rounded-full bg-white/5 text-zinc-500 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </div>
          <p class="text-white font-medium text-sm mb-1">Your cart is empty</p>
          <p class="text-xs text-zinc-400 mb-4">Explore our 70+ Palmyra Palm creations to add pure products.</p>
          <button id="cart-start-shopping-btn" class="btn-amber-outline text-xs py-2 px-4">Browse Collection</button>
        </div>
      `;
      const startBtn = document.getElementById('cart-start-shopping-btn');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          closeCartDrawer();
          const catSection = document.getElementById('catalog-section');
          if (catSection) catSection.scrollIntoView({ behavior: 'smooth' });
        });
      }
      return;
    }

    dom.cartItemsList.innerHTML = STATE.cart.map((item, index) => {
      const product = PRODUCTS_DATA.find(p => p.id === item.productId);
      if (!product) return '';

      return `
        <div class="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/30 border border-white/5">
          <img 
            src="${product.image}" 
            alt="${product.name}" 
            class="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-zinc-900" 
            onerror="this.src='images/hero-palmyra.jpg'"
          />

          <div class="flex-grow min-w-0">
            <h4 class="text-sm font-semibold text-white truncate">${product.name}</h4>
            <p class="text-xs text-amber-400/90 font-mono">${item.variantName}</p>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs font-mono font-bold text-white">${formatMoney(item.price * item.quantity)}</span>

              <div class="flex items-center border border-white/10 rounded-md bg-zinc-900/80">
                <button class="cart-minus-btn px-2 py-0.5 text-xs text-zinc-400 hover:text-white" data-index="${index}">-</button>
                <span class="px-2 text-xs font-mono text-white">${item.quantity}</span>
                <button class="cart-plus-btn px-2 py-0.5 text-xs text-zinc-400 hover:text-white" data-index="${index}">+</button>
              </div>
            </div>
          </div>

          <button 
            class="cart-remove-btn p-1.5 text-zinc-500 hover:text-red-400 transition-colors" 
            data-index="${index}"
            title="Remove item"
            aria-label="Remove item"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;
    }).join('');

    // Attach cart item events
    document.querySelectorAll('.cart-minus-btn').forEach(btn => {
      btn.addEventListener('click', () => updateCartItemQuantity(parseInt(btn.dataset.index, 10), -1));
    });
    document.querySelectorAll('.cart-plus-btn').forEach(btn => {
      btn.addEventListener('click', () => updateCartItemQuantity(parseInt(btn.dataset.index, 10), 1));
    });
    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => removeCartItem(parseInt(btn.dataset.index, 10)));
    });
  }

  function openCartDrawer() {
    dom.cartDrawer.classList.add('open');
    dom.drawerBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    dom.cartDrawer.classList.remove('open');
    dom.drawerBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  // --- Wishlist Management ---
  function toggleWishlist(productId) {
    if (!STATE.isAuthenticated) {
      showToast('Please login to use the wishlist.', 'warn');
      return openUnifiedAuthModal('login');
    }

    const index = STATE.wishlist.indexOf(productId);
    const product = PRODUCTS_DATA.find(p => p.id === productId);

    if (index > -1) {
      STATE.wishlist.splice(index, 1);
      showToast(`Removed "${product.name}" from wishlist`, 'info');
    } else {
      STATE.wishlist.push(productId);
      showToast(`Saved "${product.name}" to wishlist`, 'success');
    }

    saveWishlist();
    renderProductsGrid();
  }

  function updateWishlistUI() {
    if (dom.wishlistBadge) {
      dom.wishlistBadge.textContent = STATE.wishlist.length;
      dom.wishlistBadge.style.display = STATE.wishlist.length > 0 ? 'flex' : 'none';
    }

    if (!dom.wishlistItemsList) return;

    if (STATE.wishlist.length === 0) {
      dom.wishlistItemsList.innerHTML = `
        <div class="text-center py-16 px-4">
          <div class="w-14 h-14 rounded-full bg-white/5 text-zinc-500 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
          <p class="text-white font-medium text-sm mb-1">Your wishlist is empty</p>
          <p class="text-xs text-zinc-400">Save items you love to revisit anytime.</p>
        </div>
      `;
      return;
    }

    dom.wishlistItemsList.innerHTML = STATE.wishlist.map(pid => {
      const product = PRODUCTS_DATA.find(p => p.id === pid);
      if (!product) return '';

      return `
        <div class="flex items-center gap-3.5 p-3.5 rounded-xl bg-black/30 border border-white/5">
          <img 
            src="${product.image}" 
            alt="${product.name}" 
            class="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-zinc-900" 
            onerror="this.src='images/hero-palmyra.jpg'"
          />

          <div class="flex-grow min-w-0">
            <h4 class="text-sm font-semibold text-white truncate">${product.name}</h4>
            <p class="text-xs font-mono text-amber-400 font-bold mb-2">${formatMoney(product.price)}</p>
            <div class="flex items-center gap-2">
              <button 
                class="move-wishlist-cart-btn btn-amber-outline py-1 px-3 text-[11px]" 
                data-product-id="${product.id}"
              >
                Move to Cart
              </button>
              <button 
                class="remove-wishlist-btn text-xs text-zinc-500 hover:text-red-400" 
                data-product-id="${product.id}"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.move-wishlist-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.productId;
        handleAddToCartDirect(pid);
        toggleWishlist(pid);
      });
    });

    document.querySelectorAll('.remove-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.productId;
        toggleWishlist(pid);
      });
    });
  }

  function openWishlistDrawer() {
    dom.wishlistDrawer.classList.add('open');
    dom.drawerBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeWishlistDrawer() {
    dom.wishlistDrawer.classList.remove('open');
    dom.drawerBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  // --- Unified Auth & Sign-In Flow ---
  function openUnifiedAuthModal(defaultView = 'login') {
    switchAuthView(defaultView);
    if (defaultView === 'login') updateRecentLoginsUI();
    if (dom.unifiedAuthModal) dom.unifiedAuthModal.classList.add('open');
    if (dom.modalBackdrop) dom.modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeUnifiedAuthModal() {
    if (dom.unifiedAuthModal) dom.unifiedAuthModal.classList.remove('open');
    if (dom.modalBackdrop) dom.modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  function switchAuthView(view) {
    document.getElementById('auth-login-view').classList.add('hidden');
    document.getElementById('auth-register-view').classList.add('hidden');
    document.getElementById('auth-otp-view').classList.add('hidden');

    if (view === 'login') {
      document.getElementById('auth-login-view').classList.remove('hidden');
    } else if (view === 'register') {
      document.getElementById('auth-register-view').classList.remove('hidden');
    } else if (view === 'otp') {
      document.getElementById('auth-otp-view').classList.remove('hidden');
    }
  }

  function updateRecentLoginsUI() {
    const listEl = document.getElementById('recent-logins-list');
    if (!listEl) return;
    
    if (STATE.recentLogins.length === 0) {
      listEl.innerHTML = '<li class="text-zinc-500 italic">No recent logins.</li>';
      return;
    }

    listEl.innerHTML = STATE.recentLogins.map(login => `
      <li class="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10" onclick="document.getElementById('login-email').value='${login.email}'">
        <div>
          <strong class="text-white block">${login.name || 'Anonymous'}</strong>
          <span class="text-xs text-zinc-400">${login.email}</span>
        </div>
        <span class="text-[9px] text-zinc-500 uppercase">${new Date(login.date).toLocaleDateString()}</span>
      </li>
    `).join('');
  }

  // --- Profile Flow ---
  function openProfileModal() {
    if (!STATE.isAuthenticated) return;
    
    document.getElementById('profile-name-disp').textContent = STATE.userProfile.name || 'Anonymous';
    document.getElementById('profile-email-disp').textContent = STATE.userProfile.email;
    
    const d = new Date(STATE.userProfile.createdAt || Date.now());
    document.getElementById('profile-date-disp').textContent = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    
    document.getElementById('profile-orders-disp').textContent = STATE.userProfile.orders || 0;
    document.getElementById('profile-wishlist-disp').textContent = STATE.wishlist.length;
    
    dom.profileModal.classList.add('open');
    dom.modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProfileModal() {
    dom.profileModal.classList.remove('open');
    dom.modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  function signOut() {
    // Save current state to user profile before signing out
    if (STATE.userProfile) {
      const userIdx = STATE.users.findIndex(u => u.email === STATE.userProfile.email);
      if (userIdx > -1) {
        STATE.users[userIdx].cart = STATE.cart;
        STATE.users[userIdx].wishlist = STATE.wishlist;
        localStorage.setItem('talara_users', JSON.stringify(STATE.users));
      }
    }
    
    STATE.isAuthenticated = false;
    STATE.userProfile = null;
    STATE.cart = [];
    STATE.wishlist = [];
    localStorage.removeItem('talara_current_user');
    
    closeProfileModal();
    updateAuthStateUI();
    showToast('Signed out successfully.', 'success');
  }

  function initiateCheckoutFlow() {
    if (STATE.cart.length === 0) {
      showToast('Add items to cart before proceeding to checkout', 'warn');
      return;
    }
    
    closeCartDrawer();
    
    if (STATE.isAuthenticated) {
      openCheckoutModal();
    } else {
      showToast('Please login to checkout.', 'warn');
      openUnifiedAuthModal('login');
    }
  }

  function updateAuthStateUI() {
    const loggedOutEls = document.querySelectorAll('.auth-logged-out');
    const loggedInEls = document.querySelectorAll('.auth-logged-in');
    
    if (STATE.isAuthenticated) {
      if (dom.loggedOutNav) {
        dom.loggedOutNav.classList.remove('lg:flex');
        dom.loggedOutNav.classList.add('hidden');
        dom.loggedOutNav.style.display = '';
      }
      if (dom.loggedInNav) {
        dom.loggedInNav.classList.remove('hidden');
        dom.loggedInNav.classList.add('hidden', 'lg:flex');
        dom.loggedInNav.style.display = '';
      }
      
      loggedOutEls.forEach(el => el.classList.add('hidden'));
      loggedInEls.forEach(el => el.classList.remove('hidden'));
      loggedInEls.forEach(el => {
        if (el.tagName === 'DIV') {
            el.style.display = 'flex';
        }
      });
      
      // Update counts
      updateCartUI();
      updateWishlistUI();
    } else {
      if (dom.loggedOutNav) {
        dom.loggedOutNav.classList.remove('hidden');
        dom.loggedOutNav.classList.add('hidden', 'lg:flex');
        dom.loggedOutNav.style.display = '';
      }
      if (dom.loggedInNav) {
        dom.loggedInNav.classList.remove('lg:flex');
        dom.loggedInNav.classList.add('hidden');
        dom.loggedInNav.style.display = '';
      }
      
      loggedOutEls.forEach(el => el.classList.remove('hidden'));
      loggedInEls.forEach(el => el.classList.add('hidden'));
      loggedInEls.forEach(el => el.style.display = 'none');
      
      document.getElementById('hero-section').style.display = 'block';
      document.getElementById('universe-section').style.display = 'block';
      document.getElementById('anatomy-section').style.display = 'block';
      document.getElementById('process-section').style.display = 'block';
      document.getElementById('science-section').style.display = 'block';
      document.getElementById('sustainability-section').style.display = 'block';
      document.getElementById('story-section').style.display = 'block';
    }
  }
  

  // --- Checkout Simulation Flow in ₹ INR ---
  function openCheckoutModal() {
    if (STATE.cart.length === 0) {
      showToast('Add items to cart before proceeding to checkout', 'warn');
      return;
    }

    closeCartDrawer();
    const { subtotal, discount, shipping, total } = getCartCalculations();

    dom.checkoutModal.innerHTML = `
      <div class="p-6 sm:p-8 max-w-2xl mx-auto">
        <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div>
            <span class="badge-tag badge-amber mb-1 font-mono text-[10px]">Secure Express Checkout</span>
            <h3 class="font-display text-2xl font-bold text-white">Order Finalization (India)</h3>
          </div>
          <button id="close-checkout-btn" class="text-zinc-400 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form id="checkout-form" class="space-y-6">
          <!-- Step 1: Shipping Details -->
          <div>
            <h4 class="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-3">1. Delivery Address & Contact</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <input type="text" id="chk-name" placeholder="Full Name" required value="${STATE.userProfile?.name || 'Aarav'}" class="sm:col-span-2 p-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:border-amber-400 outline-none" />
              <input type="email" id="chk-email" placeholder="Email Address" required value="${STATE.userProfile?.email || 'aarav.sundaram@talara.in'}" class="sm:col-span-2 p-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:border-amber-400 outline-none" />
              <input type="text" id="chk-address" placeholder="Delivery Street Address" required value="${STATE.userProfile?.address || 'Flat 4B, Coastal Palm Residency, Besant Nagar'}" class="sm:col-span-2 p-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:border-amber-400 outline-none" />
              <input type="text" id="chk-city" placeholder="City" required value="Chennai" class="p-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:border-amber-400 outline-none" />
              <input type="text" id="chk-postal" placeholder="PIN Code" required value="600090" class="p-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:border-amber-400 outline-none" />
            </div>
          </div>

          <!-- Step 2: Delivery Speed -->
          <div>
            <h4 class="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-3">2. Domestic Carbon-Neutral Shipping</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label class="flex items-start gap-3 p-3 rounded-lg border border-amber-500/40 bg-amber-950/20 cursor-pointer">
                <input type="radio" name="delivery_method" checked class="mt-0.5" />
                <div>
                  <strong class="text-white block">Standard Cold-Chain Express</strong>
                  <span class="text-zinc-400">2–3 Days Across India • ${shipping === 0 ? 'FREE' : formatMoney(shipping)}</span>
                </div>
              </label>
              <label class="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-black/30 cursor-pointer">
                <input type="radio" name="delivery_method" class="mt-0.5" />
                <div>
                  <strong class="text-white block">White-Glove Insulated Freight</strong>
                  <span class="text-zinc-400">Next-Day Refrigerated • +₹150</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Step 3: Payment Method -->
          <div>
            <h4 class="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-3">3. Payment Mode (Sandbox)</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
              <label class="payment-option-label flex items-start gap-3 p-3 rounded-lg border border-amber-500/40 bg-amber-950/20 cursor-pointer transition-colors">
                <input type="radio" name="payment_method" value="online" checked class="mt-0.5" />
                <div>
                  <strong class="text-white block">Online Payment</strong>
                  <span class="text-zinc-400 block mt-1">UPI / RuPay / NetBanking / Cards</span>
                </div>
              </label>
              <label class="payment-option-label flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-black/30 cursor-pointer transition-colors hover:bg-black/50">
                <input type="radio" name="payment_method" value="cod" class="mt-0.5" />
                <div>
                  <strong class="text-white block">Cash on Delivery</strong>
                  <span class="text-zinc-400 block mt-1">Pay with cash at your doorstep</span>
                </div>
              </label>
            </div>
            <div class="p-3 bg-black/40 rounded-lg border border-white/5">
              <p class="text-[11px] text-zinc-400 leading-relaxed">
                🔒 Demonstration Mode: No real financial transaction occurs. Clicking "Place Order" generates a simulated Indian tax invoice and order receipt.
              </p>
            </div>
          </div>

          <!-- Summary Strip -->
          <div class="p-4 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between text-sm">
            <div>
              <span class="text-xs text-zinc-400 block font-mono">Total Payable (INR)</span>
              <span class="text-2xl font-bold font-display text-white">${formatMoney(total)}</span>
            </div>
            <button type="submit" class="btn-primary py-3 px-6 text-sm">
              Confirm & Place Order →
            </button>
          </div>
        </form>
      </div>
    `;

    dom.checkoutModal.classList.add('open');
    dom.modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    document.getElementById('close-checkout-btn').addEventListener('click', () => {
      dom.checkoutModal.classList.remove('open');
      dom.modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    });

    const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
    paymentRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        document.querySelectorAll('.payment-option-label').forEach(lbl => {
          lbl.classList.remove('border-amber-500/40', 'bg-amber-950/20');
          lbl.classList.add('border-white/10', 'bg-black/30', 'hover:bg-black/50');
        });
        const selectedLabel = e.target.closest('.payment-option-label');
        selectedLabel.classList.remove('border-white/10', 'bg-black/30', 'hover:bg-black/50');
        selectedLabel.classList.add('border-amber-500/40', 'bg-amber-950/20');
      });
    });

    document.getElementById('checkout-form').addEventListener('submit', (e) => {
      e.preventDefault();
      executeSimulatedCheckout();
    });
  }

  function executeSimulatedCheckout() {
    const orderId = 'TLR-IN-' + Math.floor(100000 + Math.random() * 900000);
    const { subtotal, discount, shipping, total } = getCartCalculations();
    const purchasedItems = [...STATE.cart];

    const paymentMethodInput = document.querySelector('input[name="payment_method"]:checked');
    const paymentMethodText = paymentMethodInput && paymentMethodInput.value === 'cod' ? 'Cash on Delivery' : 'Online Payment';

    const custName = document.getElementById('chk-name').value;
    const custEmail = document.getElementById('chk-email').value;
    const custAddress = `${document.getElementById('chk-address').value}, ${document.getElementById('chk-city').value} - ${document.getElementById('chk-postal').value}`;

    // Clear state
    STATE.cart = [];
    STATE.appliedPromo = null;
    
    // Update user orders
    if (STATE.isAuthenticated && STATE.userProfile) {
      STATE.userProfile.orders = (STATE.userProfile.orders || 0) + 1;
      const userIdx = STATE.users.findIndex(u => u.email === STATE.userProfile.email);
      if (userIdx > -1) {
        STATE.users[userIdx].orders = STATE.userProfile.orders;
        STATE.users[userIdx].cart = [];
        localStorage.setItem('talara_users', JSON.stringify(STATE.users));
      }
      localStorage.setItem('talara_current_user', JSON.stringify(STATE.userProfile));
    }
    
    saveCart();
    // Show Receipt Modal in ₹ INR
    dom.orderSuccessModal.innerHTML = `
      <div class="p-6 sm:p-10 max-w-lg mx-auto text-center">
        <div class="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>

        <span class="badge-tag badge-emerald mb-2">Order Confirmed & Logged</span>
        <h3 class="font-display text-2xl font-bold text-white mb-1">Nandri! Thank You for Supporting the Palm</h3>
        <p class="text-xs font-mono text-amber-400 mb-6">Order ID: #${orderId}</p>

        <div class="text-left p-4 rounded-xl bg-black/50 border border-white/10 text-xs space-y-2.5 mb-6 font-mono">
          <div class="text-zinc-400 font-bold border-b border-white/10 pb-1.5 flex justify-between">
            <span>ITEM</span>
            <span>PRICE (INR)</span>
          </div>
          ${purchasedItems.map(item => {
            const p = PRODUCTS_DATA.find(prod => prod.id === item.productId);
            return `
              <div class="flex justify-between text-zinc-300">
                <span class="truncate pr-2">${item.quantity}x ${p ? p.name : 'Creation'} (${item.variantName})</span>
                <span>${formatMoney(item.price * item.quantity)}</span>
              </div>
            `;
          }).join('')}
          <div class="border-t border-white/10 pt-2 flex justify-between font-bold text-white text-sm">
            <span>Total (${paymentMethodText})</span>
            <span>${formatMoney(total)}</span>
          </div>
        </div>

        <div class="p-3.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-left text-xs mb-6 text-zinc-300">
          <strong class="text-emerald-300 block mb-1">Grove Traceability Initialized:</strong>
          Harvest batch allocation is synchronized with our coastal tapper collective in Tamil Nadu. Packaged with zero-tree molded pulp cushioning.
        </div>

        <button id="order-success-close-btn" class="btn-primary w-full py-3 text-sm">
          Return to The Product Ecosystem
        </button>
      </div>
    `;

    dom.checkoutModal.classList.remove('open');
    dom.orderSuccessModal.classList.add('open');
    dom.modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Send email asynchronously
    const orderPayload = {
      name: custName,
      contact: custEmail,
      address: custAddress,
      cart: purchasedItems.map(item => {
        const p = PRODUCTS_DATA.find(prod => prod.id === item.productId);
        return {
          name: p ? p.name : 'Unknown Product',
          variant: item.variantName,
          quantity: item.quantity,
          price: item.price
        };
      }),
      total: total.toFixed(2)
    };

    fetch('/api/send-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    }).catch(err => console.error('Order email failed', err));

    updateCartUI();

    document.getElementById('order-success-close-btn').addEventListener('click', () => {
      dom.orderSuccessModal.classList.remove('open');
      dom.modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Promo Engine ---
  function handleApplyPromo() {
    if (!dom.promoCodeInput) return;
    const code = dom.promoCodeInput.value.trim().toUpperCase();

    if (PROMO_CODES[code]) {
      STATE.appliedPromo = PROMO_CODES[code];
      updateCartUI();
      showToast(`Promo "${code}" applied: ${PROMO_CODES[code].label}`, 'success');
      if (dom.promoFeedbackEl) {
        dom.promoFeedbackEl.textContent = `Applied: ${PROMO_CODES[code].label}`;
        dom.promoFeedbackEl.className = 'text-xs text-emerald-400 mt-1.5 block font-mono';
      }
    } else {
      showToast('Invalid promo code. Try PALMVALUE, BORASSUS, or VANGUARD', 'warn');
      if (dom.promoFeedbackEl) {
        dom.promoFeedbackEl.textContent = 'Invalid promo code. Try PALMVALUE, BORASSUS, or VANGUARD';
        dom.promoFeedbackEl.className = 'text-xs text-red-400 mt-1.5 block font-mono';
      }
    }
  }

  function initSubscriptionCalculator() {
    const usageSlider = document.getElementById('calc-usage-slider');
    const peopleSlider = document.getElementById('calc-people-slider');
    const usageVal = document.getElementById('calc-usage-val');
    const peopleVal = document.getElementById('calc-people-val');
    const resultWeight = document.getElementById('calc-result-weight');
    const resultJars = document.getElementById('calc-result-jars');
    const subscribeBtn = document.getElementById('subscribe-btn');

    if (!usageSlider || !peopleSlider) return;

    function calculateSubscription() {
      const spoons = parseInt(usageSlider.value, 10);
      const people = parseInt(peopleSlider.value, 10);
      
      usageVal.textContent = spoons === 1 ? '1 Spoon' : spoons + ' Spoons';
      peopleVal.textContent = people === 1 ? '1 Person' : people + ' People';

      // Math: Spoons * People * 5g per spoon * 30 days
      const totalGrams = spoons * people * 5 * 30;
      
      let formattedWeight = totalGrams + 'g';
      if (totalGrams >= 1000) {
        formattedWeight = (totalGrams / 1000).toFixed(1) + 'kg';
      }
      
      resultWeight.textContent = formattedWeight;

      // Assuming standard jar is 300g
      const jarsRequired = Math.ceil(totalGrams / 300);
      resultJars.textContent = 'Requires: ' + jarsRequired + 'x 300g Jars / month';
    }

    usageSlider.addEventListener('input', calculateSubscription);
    peopleSlider.addEventListener('input', calculateSubscription);
    
    if (subscribeBtn) {
      subscribeBtn.addEventListener('click', () => {
        showToast('Subscription plan added to your cart!', 'success');
        // Actually add it to the cart logic
        const subProduct = PRODUCTS_DATA.find(p => p.id === 'talara-sugar-01');
        if (subProduct) {
          const jars = Math.ceil((parseInt(usageSlider.value, 10) * parseInt(peopleSlider.value, 10) * 5 * 30) / 300);
          addToCart(subProduct.id, jars);
          openCartDrawer();
        }
      });
    }

    // Initial calculation
    calculateSubscription();
  }

  // --- Event Listeners Setup ---
  function initEventListeners() {
    initNavbarScroll();
    initSubscriptionCalculator();

    // Mobile Menu Toggle
    if (dom.navMobileToggle && dom.navMobileMenu) {
      dom.navMobileToggle.addEventListener('click', () => {
        dom.navMobileMenu.classList.toggle('hidden');
      });
      dom.navMobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => dom.navMobileMenu.classList.add('hidden'));
      });
    }

    // Category Filter Pills
    dom.categoryFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        STATE.activeCategory = pill.dataset.category;
        STATE.activeAnatomyPart = null;
        updateCategoryPills();
        renderProductsGrid();
      });
    });

    // Status Tab Buttons (All, Featured, New, Concepts)
    if (dom.statusTabBtns) {
      dom.statusTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          STATE.activeStatusFilter = btn.dataset.status;
          updateStatusTabs();
          renderProductsGrid();
        });
      });
    }

    // Search Input
    // Search Input listeners
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', (e) => {
        STATE.searchQuery = e.target.value;
        renderProductsGrid();
      });
    }

    if (dom.navSearchInput) {
      dom.navSearchInput.addEventListener('input', (e) => {
        STATE.searchQuery = e.target.value;
        // Optionally sync with the main search input
        if (dom.searchInput) dom.searchInput.value = e.target.value;
        renderProductsGrid();
        
        // Auto scroll to catalog if searching from nav
        if (e.target.value.trim().length > 0) {
          const catalogEl = document.getElementById('catalog-section');
          if (catalogEl) {
            const rect = catalogEl.getBoundingClientRect();
            if (rect.top > window.innerHeight || rect.bottom < 0) {
              catalogEl.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      });
    }

    // Sort Select
    if (dom.sortSelect) {
      dom.sortSelect.addEventListener('change', (e) => {
        STATE.sortBy = e.target.value;
        renderProductsGrid();
      });
    }

    // Drawers & Modal Backdrops
    if (dom.drawerBackdrop) {
      dom.drawerBackdrop.addEventListener('click', () => {
        closeCartDrawer();
        closeWishlistDrawer();
      });
    }

    if (dom.modalBackdrop) {
      dom.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === dom.modalBackdrop) {
          closeProductModal();
          dom.checkoutModal.classList.remove('open');
          dom.orderSuccessModal.classList.remove('open');
          if (dom.unifiedAuthModal) dom.unifiedAuthModal.classList.remove('open');
          if (dom.profileModal) dom.profileModal.classList.remove('open');
          dom.modalBackdrop.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    }

    // Cart Drawer triggers
    document.querySelectorAll('.open-cart-btn').forEach(btn => {
      btn.addEventListener('click', openCartDrawer);
    });
    const closeCartBtn = document.getElementById('close-cart-btn');
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);

    // Wishlist Drawer triggers
    document.querySelectorAll('.open-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', openWishlistDrawer);
    });
    const closeWishlistBtn = document.getElementById('close-wishlist-btn');
    if (closeWishlistBtn) closeWishlistBtn.addEventListener('click', closeWishlistDrawer);

    // Nav Login Triggers
    const navLoginBtn = document.getElementById('nav-login-btn');
    if (navLoginBtn) {
      navLoginBtn.addEventListener('click', () => openUnifiedAuthModal('login'));
    }
    
    // Profile Triggers
    const navProfileBtn = document.getElementById('nav-profile-btn');
    if (navProfileBtn) {
      navProfileBtn.addEventListener('click', openProfileModal);
    }
    const closeProfileBtn = document.getElementById('close-profile-btn');
    if (closeProfileBtn) {
      closeProfileBtn.addEventListener('click', closeProfileModal);
    }
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', signOut);
    }
    
    // Old navLoginForm deleted.
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', initiateCheckoutFlow);
    }
    
    // Auth Flow Listeners
    const closeAuthBtn = document.getElementById('close-auth-btn');
    if (closeAuthBtn) {
      closeAuthBtn.addEventListener('click', closeAuthModal);
    }
    
    const authDetailsForm = document.getElementById('auth-details-form');
    // Auth Flow Listeners
    const closeUnifiedAuthBtn = document.getElementById('close-unified-auth-btn');
    if (closeUnifiedAuthBtn) {
      closeUnifiedAuthBtn.addEventListener('click', closeUnifiedAuthModal);
    }

    const switchToRegisterBtn = document.getElementById('switch-to-register-btn');
    if (switchToRegisterBtn) switchToRegisterBtn.addEventListener('click', () => switchAuthView('register'));

    const switchToLoginBtn = document.getElementById('switch-to-login-btn');
    if (switchToLoginBtn) switchToLoginBtn.addEventListener('click', () => switchAuthView('login'));

    let currentOTP = null;
    let pendingRegisterData = null;
    let otpTimerInterval = null;

    function startOtpTimer() {
      let seconds = 300; // 5 minutes
      const timerEl = document.getElementById('otp-timer-text');
      const resendBtn = document.getElementById('resend-otp-btn');
      resendBtn.disabled = true;

      clearInterval(otpTimerInterval);
      otpTimerInterval = setInterval(() => {
        seconds--;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `Expires in: ${m}:${s}`;
        
        if (seconds <= 0) {
          clearInterval(otpTimerInterval);
          timerEl.textContent = 'OTP Expired';
          resendBtn.disabled = false;
        }
      }, 1000);
    }

    const unifiedRegisterForm = document.getElementById('unified-register-form');
    if (unifiedRegisterForm) {
      unifiedRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const pass = document.getElementById('register-password').value;
        const conf = document.getElementById('register-confirm-password').value;

        if (pass !== conf) {
          return showToast('Passwords do not match.', 'error');
        }

        // Check if user already exists
        const exists = STATE.users.find(u => u.email === email);
        if (exists) {
          return showToast('An account with this email already exists.', 'warn');
        }

        const submitBtn = unifiedRegisterForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending OTP...';
        
        pendingRegisterData = { name, email, password: pass };
        currentOTP = Math.floor(1000 + Math.random() * 9000).toString();
        
        try {
          const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp: currentOTP })
          });

          if (!response.ok) throw new Error('Failed to send email');

          document.getElementById('otp-target-email').textContent = email;
          switchAuthView('otp');
          startOtpTimer();
          showToast('OTP sent to ' + email, 'success');
        } catch (error) {
          console.error(error);
          showToast('Failed to send OTP. Is the backend server running?', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send OTP';
        }
      });
    }

    const unifiedOtpForm = document.getElementById('unified-otp-form');
    if (unifiedOtpForm) {
      unifiedOtpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const otpInput = document.getElementById('unified-otp-input').value;
        const timerEl = document.getElementById('otp-timer-text');
        
        if (timerEl.textContent === 'OTP Expired') {
          return showToast('OTP has expired. Please resend.', 'error');
        }

        if (otpInput === currentOTP) {
          // Success! Create User
          const newUser = {
            ...pendingRegisterData,
            cart: [],
            wishlist: [],
            orders: 0,
            createdAt: new Date().toISOString()
          };
          
          STATE.users.push(newUser);
          localStorage.setItem('talara_users', JSON.stringify(STATE.users));
          
          showToast('Account created successfully!', 'success');
          
          // Redirect to login automatically
          document.getElementById('login-email').value = newUser.email;
          switchAuthView('login');
          clearInterval(otpTimerInterval);
        } else {
          showToast('Invalid OTP code.', 'error');
        }
      });
    }

    const resendOtpBtn = document.getElementById('resend-otp-btn');
    if (resendOtpBtn) {
      resendOtpBtn.addEventListener('click', async () => {
        resendOtpBtn.disabled = true;
        currentOTP = Math.floor(1000 + Math.random() * 9000).toString();
        try {
          await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pendingRegisterData.email, otp: currentOTP })
          });
          startOtpTimer();
          showToast('New OTP sent.', 'success');
        } catch(e) {
          showToast('Failed to resend.', 'error');
          resendOtpBtn.disabled = false;
        }
      });
    }

    const unifiedLoginForm = document.getElementById('unified-login-form');
    if (unifiedLoginForm) {
      unifiedLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;

        const user = STATE.users.find(u => u.email === email && u.password === pass);
        if (user) {
          STATE.isAuthenticated = true;
          STATE.userProfile = user;
          STATE.cart = user.cart || [];
          STATE.wishlist = user.wishlist || [];
          
          localStorage.setItem('talara_current_user', JSON.stringify(user));
          saveCart();
          saveWishlist();
          
          // Track recent login (last 4 privately)
          const newLogin = { email, name: user.name, date: new Date().toISOString() };
          STATE.recentLogins = [newLogin, ...STATE.recentLogins.filter(l => l.email !== email)].slice(0, 4);
          localStorage.setItem('talara_recent_logins', JSON.stringify(STATE.recentLogins));

          closeUnifiedAuthModal();
          updateAuthStateUI();
          showToast('Welcome back, ' + user.name, 'success');
          
          // Smooth scroll to catalog
          const catalogSection = document.getElementById('catalog-section');
          if (catalogSection) {
            catalogSection.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          showToast('Invalid email or password.', 'error');
        }
      });
    }

    // Promo code apply
    if (dom.applyPromoBtn) {
      dom.applyPromoBtn.addEventListener('click', handleApplyPromo);
    }

    // B2B Inquiry Form
    if (dom.b2bForm) {
      dom.b2bForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = dom.b2bForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        const payload = {
          name: document.getElementById('b2b-name').value,
          company: document.getElementById('b2b-company').value,
          email: document.getElementById('b2b-email').value,
          role: document.getElementById('b2b-role').value,
          inquiry: document.getElementById('b2b-message').value
        };

        try {
          const res = await fetch('/api/send-partnership', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            showToast('Inquiry received! Our enterprise logistics team will respond within 24 hours.', 'success');
            dom.b2bForm.reset();
          } else {
            showToast('Failed to send inquiry. Please try again.', 'error');
          }
        } catch(err) {
          showToast('Network error while sending inquiry.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
    }

    // Newsletter forms
    document.querySelectorAll('.newsletter-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Subscribed! Welcome to the TALARA Vanguard.', 'success');
        form.reset();
      });
    });

    // Escape key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCartDrawer();
        closeWishlistDrawer();
        closeProductModal();
        dom.checkoutModal.classList.remove('open');
        dom.orderSuccessModal.classList.remove('open');
        dom.modalBackdrop.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // --- Initialize App ---
  function init() {
    if (STATE.isAuthenticated && STATE.userProfile) {
      STATE.cart = STATE.userProfile.cart || [];
      STATE.wishlist = STATE.userProfile.wishlist || [];
    }
    
    initDOM();
    initEventListeners();
    renderProductsGrid();
    renderAnatomySection();
    renderProcessTimeline();
    updateCartUI();
    updateWishlistUI();
    updateAuthStateUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
