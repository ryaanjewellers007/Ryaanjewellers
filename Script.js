// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Hide splash screen after delay
    setTimeout(function() {
        const splashScreen = document.getElementById('splash-screen');
        splashScreen.classList.add('hidden');
        
        // Remove splash screen from DOM after animation
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 1000);
    }, 4000);
    
    // Initialize the application
    initializeApp();
});

// ========== APPLICATION DATA ==========
// Using your actual product images
const products = [
    {
        id: 1,
        name: "Chopard Inspired 3 Diamond Chain & Pendant",
        category: "necklaces",
        price: 28900,
        image: "Screenshot_20251129_014405_Chrome.jpg",
        description: "Exquisite Chopard-inspired necklace featuring three brilliant diamonds set in 18K white gold. A statement piece for special occasions."
    },
    {
        id: 2,
        name: "Messika UNO Full Diamond Earrings - Yellow Gold",
        category: "earrings",
        price: 18900,
        image: "Screenshot_20251129_014443_Chrome.jpg",
        description: "Luxurious Messika-inspired diamond earrings in 18K yellow gold. Full diamond coverage for maximum brilliance and elegance."
    },
    {
        id: 3,
        name: "Messika Chain & Pendant - White Gold",
        category: "necklaces",
        price: 32900,
        image: "Screenshot_20251129_014511_Chrome.jpg",
        description: "Sophisticated Messika-inspired chain and pendant in 18K white gold. Modern design with timeless appeal."
    },
    {
        id: 4,
        name: "Messika Diamond Ring - Rose Gold",
        category: "rings",
        price: 15900,
        image: "Screenshot_20251129_014550_Chrome.jpg",
        description: "Elegant Messika-inspired diamond ring set in 18K rose gold. Perfect blend of contemporary design and classic elegance."
    },
    {
        id: 5,
        name: "Messika Duo Diamond Ring - Rose Gold",
        category: "rings",
        price: 21900,
        image: "Screenshot_20251129_014553_Chrome.jpg",
        description: "Stunning Messika-inspired duo diamond ring in 18K rose gold. Features two brilliant diamonds in a modern setting."
    },
    {
        id: 6,
        name: "Messika UNO 5-Motif Diamond Necklace",
        category: "necklaces",
        price: 45900,
        image: "Screenshot_20251129_014606_Chrome.jpg",
        description: "Luxurious Messika-inspired necklace with five diamond motifs. A masterpiece of contemporary jewelry design."
    },
    {
        id: 7,
        name: "Messika Tie-Band Diamond Bracelet",
        category: "bracelets",
        price: 27900,
        image: "Screenshot_20251129_014624_Chrome.jpg",
        description: "Elegant Messika-inspired tie-band bracelet featuring brilliant diamonds. Adjustable design for perfect fit."
    },
    {
        id: 8,
        name: "Messika Full-Diamond Bangle - Rose Gold",
        category: "bracelets",
        price: 38900,
        image: "Screenshot_20251129_014633_Chrome.jpg",
        description: "Luxurious full-diamond bangle in 18K rose gold. Complete diamond coverage for ultimate luxury."
    },
    {
        id: 9,
        name: "Messika Diamond Ring - Rose Gold",
        category: "rings",
        price: 17900,
        image: "Screenshot_20251129_014643_Chrome.jpg",
        description: "Beautiful Messika-inspired diamond ring in 18K rose gold. Single brilliant diamond in a contemporary setting."
    }
];

// Cart data
let cart = JSON.parse(localStorage.getItem('ryaanCart')) || [];
let wishlist = JSON.parse(localStorage.getItem('ryaanWishlist')) || [];

// Quick view product
let quickViewProduct = null;

// ========== INITIALIZE APP ==========
function initializeApp() {
    // Load products
    renderProducts();
    
    // Update cart count
    updateCartCount();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup filter functionality
    setupProductFilters();
    
    // Setup testimonial slider
    setupTestimonialSlider();
}

// ========== RENDER PRODUCTS ==========
function renderProducts(filter = 'all') {
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = '';
    
    const filteredProducts = filter === 'all' 
        ? products 
        : products.filter(product => product.category === filter);
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card fade-in';
        productCard.innerHTML = `
            <div class="product-image" style="background-image: url('${product.image}');">
                <div class="product-overlay">
                    <button class="quick-view-btn" onclick="openQuickView(${product.id})">Quick View</button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category.toUpperCase()}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">AED ${product.price.toLocaleString()}</div>
                <div class="product-actions">
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Add to Cart</button>
                    <button class="add-to-wishlist-btn" onclick="addToWishlist(${product.id})">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// ========== PRODUCT FILTERS ==========
function setupProductFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter value
            const filter = this.getAttribute('data-filter');
            
            // Render filtered products
            renderProducts(filter);
        });
    });
}

// ========== QUICK VIEW FUNCTIONALITY ==========
function openQuickView(productId) {
    const product = products.find(p => p.id === productId);
    quickViewProduct = product;
    
    // Populate quick view modal
    document.getElementById('quick-view-image').style.backgroundImage = `url('${product.image}')`;
    document.getElementById('quick-view-category').textContent = product.category.toUpperCase();
    document.getElementById('quick-view-title').textContent = product.name;
    document.getElementById('quick-view-price').textContent = `AED ${product.price.toLocaleString()}`;
    document.getElementById('quick-view-description').textContent = product.description;
    
    // Show modal
    document.querySelector('.quick-view-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeQuickView() {
    document.querySelector('.quick-view-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
    quickViewProduct = null;
}

// ========== CART FUNCTIONALITY ==========
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }
    
    // Save to localStorage
    localStorage.setItem('ryaanCart', JSON.stringify(cart));
    
    // Update UI
    updateCartCount();
    renderCartItems();
    showNotification(`${product.name} added to cart!`);
    
    // Open cart if on mobile
    if (window.innerWidth <= 768) {
        toggleCart();
    }
}

function addToCartFromQuickView() {
    if (quickViewProduct) {
        const size = document.getElementById('size').value;
        if (size) {
            addToCart(quickViewProduct.id, 1);
            closeQuickView();
        } else {
            showNotification('Please select a size');
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('ryaanCart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    showNotification('Item removed from cart');
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = count;
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty" style="text-align: center; padding: 50px 20px; color: var(--text-muted);">
                <i class="fas fa-shopping-bag" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        document.querySelector('.cart-total-amount').textContent = 'AED 0.00';
        return;
    }
    
    let itemsHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        itemsHTML += `
            <div class="cart-item">
                <div class="cart-item-image" style="background-image: url('${item.image}');"></div>
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <div class="cart-item-price">AED ${item.price.toLocaleString()}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = itemsHTML;
    document.querySelector('.cart-total-amount').textContent = `AED ${total.toLocaleString()}`;
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        localStorage.setItem('ryaanCart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
    }
}

function toggleCart() {
    const cartModal = document.querySelector('.cart-modal');
    cartModal.classList.toggle('active');
    document.body.style.overflow = cartModal.classList.contains('active') ? 'hidden' : 'auto';
    
    if (cartModal.classList.contains('active')) {
        renderCartItems();
    }
}

function proceedToPayment() {
    if (cart.length === 0) {
        showNotification('Your cart is empty');
        return;
    }
    
    // Save cart total to localStorage for payment page
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartData = {
        items: cart,
        total: total,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('ryaanPendingPayment', JSON.stringify(cartData));
    
    // Redirect to payment page
    window.location.href = 'payment.html';
}

// ========== WISHLIST FUNCTIONALITY ==========
function addToWishlist(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!wishlist.find(item => item.id === productId)) {
        wishlist.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
        });
        
        localStorage.setItem('ryaanWishlist', JSON.stringify(wishlist));
        showNotification(`${product.name} added to wishlist!`);
    } else {
        showNotification(`${product.name} is already in your wishlist`);
    }
}

// ========== TESTIMONIAL SLIDER ==========
function setupTestimonialSlider() {
    const dots = document.querySelectorAll('.slider-dot');
    const slides = document.querySelectorAll('.testimonial-slide');
    let currentSlide = 0;
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            // Remove active class from all slides and dots
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));
            
            // Add active class to current slide and dot
            slides[index].classList.add('active');
            dot.classList.add('active');
            currentSlide = index;
        });
    });
    
    // Auto-rotate slides every 5 seconds
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }, 5000);
}

// ========== FORM SUBMISSION ==========
function setupEventListeners() {
    // Appointment form
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                message: document.getElementById('message').value
            };
            
            // In a real application, send this to your server
            console.log('Appointment booked:', formData);
            
            // Show success message
            showNotification('Appointment booked successfully! We will confirm via email.');
            
            // Reset form
            appointmentForm.reset();
            
            // Set minimum date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('date').min = today;
        });
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').min = today;
    }
    
    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('.newsletter-input').value;
            
            if (email) {
                showNotification('Thank you for subscribing to our newsletter!');
                this.querySelector('.newsletter-input').value = '';
            }
        });
    }
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    
    // Close cart when clicking outside
    document.addEventListener('click', function(e) {
        const cartModal = document.querySelector('.cart-modal');
        const cartBtn = document.querySelector('.cart-btn');
        
        if (cartModal.classList.contains('active') && 
            !cartModal.contains(e.target) && 
            !cartBtn.contains(e.target)) {
            toggleCart();
        }
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (window.innerWidth <= 768) {
                    navLinks.style.display = 'none';
                }
            }
        });
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ========== NOTIFICATION SYSTEM ==========
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ========== INITIAL RENDER ==========
// Render cart items on page load
renderCartItems();
