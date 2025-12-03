<script>
    // ========== GLOBAL VARIABLES ==========
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let products = [];
    
    // ========== INITIALIZATION ==========
    document.addEventListener('DOMContentLoaded', function() {
        initSparkles();
        initLogoHandler();
        initProducts();
        initInstagram();
        initGoldPrice();
        initEventListeners();
        
        // Hide splash screen
        setTimeout(() => {
            const splashScreen = document.getElementById('splash-screen');
            splashScreen.style.opacity = '0';
            splashScreen.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                splashScreen.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 500);
        }, 4000);
    });

    // ========== WORKING PAYMENT SYSTEM ==========
    
    // Function to handle order form submission
    function setupOrderForm() {
        const orderForm = document.getElementById('orderForm');
        if (!orderForm) return;
        
        orderForm.addEventListener('submit', function(e) {
            // Get cart items as text
            const cartItemsText = cart.map(item => 
                `${item.name} (Qty: ${item.quantity}) - AED ${item.price * item.quantity}`
            ).join('\n');
            
            // Calculate total
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            // Add cart items and total to form
            const cartItemsInput = document.getElementById('cartItemsInput');
            if (cartItemsInput) {
                cartItemsInput.value = `CART ITEMS:\n${cartItemsText}\n\nTOTAL: AED ${total.toLocaleString()}`;
            }
            
            // Add hidden total field
            let totalInput = document.querySelector('input[name="total_amount"]');
            if (!totalInput) {
                totalInput = document.createElement('input');
                totalInput.type = 'hidden';
                totalInput.name = 'total_amount';
                totalInput.value = `AED ${total.toLocaleString()}`;
                orderForm.appendChild(totalInput);
            }
            
            // Validate cart
            if (cart.length === 0) {
                e.preventDefault();
                showNotification('Your cart is empty! Please add items before ordering.');
                return false;
            }
            
            // Show confirmation
            const confirmation = confirm(`Confirm order for AED ${total.toLocaleString()}?\nWe'll email you payment instructions.`);
            if (!confirmation) {
                e.preventDefault();
                return false;
            }
            
            // Clear cart after successful submission
            localStorage.setItem('cart', JSON.stringify([]));
            cart = [];
            updateCartCount();
            
            return true;
        });
    }
    
    // Function to show payment information modal
    function showPaymentInfo(type) {
        const paymentInfo = {
            'bank': {
                title: 'Bank Transfer',
                details: 'Transfer to Emirates NBD<br>Account: 1234567890<br>IBAN: AE070331234567890123456<br>Bank: Emirates NBD, Dubai<br>SWIFT: EBILAEAD',
                instructions: 'Send screenshot of transfer to WhatsApp: +971 50 123 4567'
            },
            'cash': {
                title: 'Cash on Delivery',
                details: 'Available in Dubai only<br>Minimum order: AED 500<br>Delivery: 24-48 hours<br>Free delivery for orders above AED 2000',
                instructions: 'Our representative will call to confirm delivery time'
            },
            'card': {
                title: 'Credit/Debit Card',
                details: 'Visa, MasterCard, American Express<br>Secure payment link will be sent via SMS/Email<br>3D Secure Verified',
                instructions: 'Click "Submit Order" to receive payment link'
            },
            'paypal': {
                title: 'PayPal',
                details: 'PayPal.me link will be sent after order confirmation<br>Currency: AED or USD<br>Buyer protection included',
                instructions: 'We\'ll email you the PayPal payment link'
            },
            'tabby': {
                title: 'Tabby Installments',
                details: '4 interest-free payments<br>No hidden fees<br>Instant approval',
                instructions: 'Select Tabby at checkout'
            },
            'tamara': {
                title: 'Tamara',
                details: 'Pay in 3 installments<br>0% interest<br>Shariah compliant',
                instructions: 'Select Tamara at checkout'
            }
        };
        
        const info = paymentInfo[type];
        if (!info) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
                <div style="padding: 40px;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="width: 60px; height: 60px; background: var(--gold); color: var(--black); 
                                  border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                                  font-size: 1.5rem; margin: 0 auto 15px;">
                            <i class="fas ${type === 'bank' ? 'fa-university' : 
                                          type === 'cash' ? 'fa-money-bill-wave' : 
                                          type === 'card' ? 'fa-credit-card' : 
                                          type === 'paypal' ? 'fab fa-paypal' : 
                                          type === 'tabby' ? 'fa-calendar-alt' : 'fa-wallet'}"></i>
                        </div>
                        <h3 style="color: var(--gold);">${info.title}</h3>
                    </div>
                    
                    <div style="background: var(--bg-secondary); padding: 20px; border-radius: var(--border-radius); 
                                margin-bottom: 25px;">
                        <div style="color: var(--text-secondary); line-height: 1.6;">
                            ${info.details}
                        </div>
                    </div>
                    
                    <div style="background: rgba(212, 175, 55, 0.1); padding: 15px; border-radius: var(--border-radius); 
                                border-left: 4px solid var(--gold); margin-bottom: 25px;">
                        <p style="color: var(--gold); margin: 0;">
                            <i class="fas fa-info-circle"></i> ${info.instructions}
                        </p>
                    </div>
                    
                    <button class="btn btn-gold" style="width: 100%;" 
                            onclick="this.parentElement.parentElement.parentElement.remove(); 
                                     document.getElementById('orderForm').scrollIntoView({behavior: 'smooth'});">
                        <i class="fas fa-shopping-cart"></i> Proceed to Order
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // ========== CART SYSTEM ==========
    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showNotification(`✅ ${product.name} added to cart!`);
    }
    
    function updateCartCount() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = count;
        }
    }
    
    function openCart() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        
        if (cart.length === 0) {
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div style="padding: 40px; text-align: center;">
                        <div style="font-size: 3rem; color: var(--gold); margin-bottom: 20px;">
                            <i class="fas fa-shopping-bag"></i>
                        </div>
                        <h3 style="color: var(--gold); margin-bottom: 15px;">Your Cart is Empty</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 30px;">
                            Add some beautiful jewelry to your cart
                        </p>
                        <button class="btn btn-gold" onclick="this.parentElement.parentElement.parentElement.remove(); 
                                 scrollToSection('products');">
                            <i class="fas fa-gem"></i> Browse Collections
                        </button>
                    </div>
                </div>
            `;
        } else {
            let total = 0;
            const cartItemsHTML = cart.map(item => {
                total += item.price * item.quantity;
                return `
                    <div style="display: flex; align-items: center; gap: 15px; padding: 15px 0; 
                                border-bottom: 1px solid rgba(212, 175, 55, 0.1);">
                        <img src="${item.image}" alt="${item.name}" 
                             style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iMzAiIHk9IjMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kPC90ZXh0Pjwvc3ZnPg=='">
                        <div style="flex: 1;">
                            <h4 style="margin-bottom: 5px; color: var(--text-primary); font-size: 0.9rem;">
                                ${item.name}
                            </h4>
                            <p style="color: var(--gold); font-weight: 600; font-size: 0.9rem;">
                                AED ${item.price.toLocaleString()} × ${item.quantity}
                            </p>
                        </div>
                        <button onclick="removeFromCart(${item.id})" 
                                style="background: none; border: none; color: var(--text-muted); 
                                       cursor: pointer; font-size: 1.2rem; padding: 5px;">
                            ×
                        </button>
                    </div>
                `;
            }).join('');
            
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div style="padding: 40px;">
                        <h3 style="margin-bottom: 30px; color: var(--gold);">
                            <i class="fas fa-shopping-bag"></i> Your Cart (${cart.length} items)
                        </h3>
                        <div style="margin-bottom: 30px; max-height: 300px; overflow-y: auto;">
                            ${cartItemsHTML}
                        </div>
                        <div style="border-top: 2px solid rgba(212, 175, 55, 0.3); padding-top: 20px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
                                <h4>Total Amount:</h4>
                                <h4 style="color: var(--gold);">AED ${total.toLocaleString()}</h4>
                            </div>
                            <button class="btn btn-gold" style="width: 100%; margin-bottom: 15px;"
                                    onclick="this.parentElement.parentElement.parentElement.remove(); 
                                             document.getElementById('orderForm').scrollIntoView({behavior: 'smooth'});">
                                <i class="fas fa-paper-plane"></i> PROCEED TO ORDER
                            </button>
                            <p style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                                We'll contact you within 24 hours for payment
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        document.body.appendChild(modal);
    }
    
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        openCart();
    }
    
    // ========== FORM SUBMIT CO SETUP ==========
    // Create a thank you page
    function createThankYouPage() {
        // Check if we're on GitHub Pages and need to create the thank you page
        if (window.location.href.includes('github.io')) {
            const thankYouHTML = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Thank You - RYAAN JEWELLERS</title>
                    <style>
                        body {
                            font-family: 'Montserrat', sans-serif;
                            background: #0A0A0A;
                            color: white;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                        }
                        .container {
                            max-width: 600px;
                            text-align: center;
                            background: rgba(26, 26, 26, 0.9);
                            padding: 50px;
                            border-radius: 20px;
                            border: 2px solid #D4AF37;
                            box-shadow: 0 0 40px rgba(212, 175, 55, 0.3);
                        }
                        h1 {
                            color: #D4AF37;
                            margin-bottom: 20px;
                        }
                        .success-icon {
                            font-size: 4rem;
                            color: #D4AF37;
                            margin-bottom: 20px;
                        }
                        .btn {
                            background: linear-gradient(45deg, #D4AF37, #B8941F);
                            color: black;
                            padding: 15px 30px;
                            border: none;
                            border-radius: 10px;
                            font-weight: 600;
                            cursor: pointer;
                            text-decoration: none;
                            display: inline-block;
                            margin-top: 30px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="success-icon">✓</div>
                        <h1>Order Received Successfully!</h1>
                        <p>Thank you for your order at RYAAN JEWELLERS.</p>
                        <p>We will contact you within 24 hours via email/phone to confirm your order and provide payment instructions.</p>
                        <p>For immediate assistance, WhatsApp: +971 50 123 4567</p>
                        <a href="/" class="btn">Return to Homepage</a>
                    </div>
                </body>
                </html>
            `;
            
            // Store in localStorage to check later
            localStorage.setItem('thankYouPage', thankYouHTML);
        }
    }
    
    // Call this on load
    createThankYouPage();

    // ========== REST OF YOUR CODE (keep everything else) ==========
    // Keep all your existing functions for:
    // - initSparkles()
    // - initLogoHandler()
    // - initGoldPrice()
    // - initProducts()
    // - initInstagram()
    // - openZoomViewer()
    // - open360Viewer()
    // - zoom functions
    // - notification functions
    // - etc.
    
    // Just add this to your initEventListeners():
    function initEventListeners() {
        // ... your existing event listeners ...
        
        // Add order form setup
        setupOrderForm();
        
        // Update cart count on page load
        updateCartCount();
    }
</script>
