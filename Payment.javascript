<script>
    // ========== GLOBAL VARIABLES ==========
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let products = [];
    let paypalButtonsRendered = false;

    // ========== INITIALIZATION ==========
    document.addEventListener('DOMContentLoaded', function() {
        initSparkles();
        initLogoHandler();
        initProducts();
        initInstagram();
        initGoldPrice();
        initEventListeners();
        
        // Initialize PayPal buttons when cart is ready
        setTimeout(initPayPalButtons, 1000);
        
        // Hide splash screen after 4 seconds
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

    // ========== PAYPAL INTEGRATION ==========
    function initPayPalButtons() {
        // Check if PayPal SDK is loaded
        if (typeof paypal === 'undefined') {
            console.error('PayPal SDK not loaded');
            setTimeout(initPayPalButtons, 1000); // Retry after 1 second
            return;
        }

        // Render PayPal button in cart modal
        renderPayPalButton();
        
        // Also render a separate PayPal button in payment section
        renderPayPalExpressButton();
    }

    function renderPayPalButton() {
        const paypalButtonContainer = document.getElementById('paypal-button-container');
        if (!paypalButtonContainer || paypalButtonsRendered) return;
        
        paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'paypal'
            },
            
            createOrder: function(data, actions) {
                // Calculate total amount
                const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                
                return actions.order.create({
                    purchase_units: [{
                        description: 'RYAAN JEWELLERS Purchase',
                        amount: {
                            currency_code: 'AED',
                            value: (total / 100).toFixed(2), // Convert to AED
                            breakdown: {
                                item_total: {
                                    currency_code: 'AED',
                                    value: (total / 100).toFixed(2)
                                }
                            }
                        },
                        items: cart.map(item => ({
                            name: item.name.substring(0, 127), // PayPal limit
                            description: item.category,
                            quantity: item.quantity,
                            unit_amount: {
                                currency_code: 'AED',
                                value: (item.price / 100).toFixed(2)
                            }
                        }))
                    }]
                });
            },
            
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    // Show success message
                    showNotification('✅ Payment successful! Order ID: ' + details.id);
                    
                    // Clear cart
                    cart = [];
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartCount();
                    
                    // Close cart modal
                    closeModal('cartModal');
                    
                    // Show success modal
                    showPaymentSuccess(details);
                    
                    // Send order details to your server (optional)
                    // sendOrderToServer(details);
                });
            },
            
            onError: function(err) {
                console.error('PayPal Error:', err);
                showNotification('❌ Payment failed. Please try again.');
            },
            
            onClick: function() {
                // Validate cart before proceeding
                if (cart.length === 0) {
                    showNotification('Your cart is empty!');
                    return false;
                }
                return true;
            }
        }).render('#paypal-button-container');
        
        paypalButtonsRendered = true;
    }

    function renderPayPalExpressButton() {
        const expressButtonContainer = document.getElementById('paypal-express-container');
        if (!expressButtonContainer) return;
        
        paypal.Buttons({
            style: {
                layout: 'horizontal',
                color: 'blue',
                shape: 'rect',
                label: 'checkout',
                tagline: false,
                height: 40
            },
            
            createOrder: function(data, actions) {
                // Get first product for express checkout
                if (cart.length === 0) {
                    // If cart is empty, create a sample order
                    const sampleProduct = products[0] || {
                        id: 1,
                        name: "Custom Jewelry Order",
                        price: 10000,
                        category: "custom"
                    };
                    
                    return actions.order.create({
                        purchase_units: [{
                            description: 'RYAAN JEWELLERS Express Order',
                            amount: {
                                currency_code: 'AED',
                                value: (sampleProduct.price / 100).toFixed(2)
                            }
                        }]
                    });
                }
                
                const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                return actions.order.create({
                    purchase_units: [{
                        description: 'RYAAN JEWELLERS Purchase',
                        amount: {
                            currency_code: 'AED',
                            value: (total / 100).toFixed(2)
                        }
                    }]
                });
            },
            
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    showNotification('✅ Express checkout successful!');
                    cart = [];
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartCount();
                    showPaymentSuccess(details);
                });
            }
        }).render('#paypal-express-container');
    }

    function showPaymentSuccess(details) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; text-align: center;">
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()" 
                        style="position: absolute; top: 20px; right: 20px; background: var(--gold); 
                               color: var(--black); border: none; width: 40px; height: 40px; 
                               border-radius: 50%; cursor: pointer; font-size: 1.2rem;">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="padding: 40px;">
                    <div style="background: var(--gold); color: var(--black); width: 80px; 
                                height: 80px; border-radius: 50%; display: flex; align-items: center; 
                                justify-content: center; margin: 0 auto 20px; font-size: 2rem;">
                        <i class="fas fa-check"></i>
                    </div>
                    
                    <h3 style="color: var(--gold); margin-bottom: 15px;">Payment Successful!</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        Thank you for your purchase at RYAAN JEWELLERS
                    </p>
                    
                    <div style="background: var(--bg-secondary); padding: 20px; border-radius: var(--border-radius); 
                                margin-bottom: 25px; text-align: left;">
                        <p><strong>Order ID:</strong> ${details.id}</p>
                        <p><strong>Amount:</strong> AED ${details.purchase_units[0].amount.value}</p>
                        <p><strong>Status:</strong> ${details.status}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 25px;">
                        A confirmation email has been sent to ${details.payer.email_address}
                    </p>
                    
                    <button class="btn btn-gold" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-home"></i> Continue Shopping
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // ========== UPDATED CART SYSTEM ==========
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
                quantity: 1,
                sku: `RJ-${product.id}`
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showNotification(`✅ ${product.name} added to cart!`);
    }

    function openCart() {
        const modal = document.getElementById('cartModal');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-shopping-bag" style="font-size: 3rem; color: var(--gold); margin-bottom: 20px;"></i>
                    <p style="color: var(--text-secondary);">Your cart is empty</p>
                    <button class="btn btn-outline" onclick="closeModal('cartModal'); scrollToSection('products')" 
                            style="margin-top: 20px;">
                        <i class="fas fa-gem"></i> Browse Collections
                    </button>
                </div>
            `;
            cartTotal.textContent = 'AED 0';
            document.getElementById('paypal-button-container').innerHTML = '';
        } else {
            let total = 0;
            cartItems.innerHTML = cart.map(item => {
                total += item.price * item.quantity;
                return `
                    <div style="display: flex; align-items: center; gap: 15px; padding: 15px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.1);">
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
                                style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem;">
                            ×
                        </button>
                    </div>
                `;
            }).join('');
            
            cartTotal.textContent = `AED ${total.toLocaleString()}`;
            
            // Update PayPal button with new total
            if (typeof paypal !== 'undefined') {
                renderPayPalButton();
            }
        }
        
        modal.classList.add('active');
    }

    function proceedToCheckout() {
        if (cart.length === 0) {
            showNotification('Your cart is empty!');
            return;
        }
        
        // If PayPal is loaded, show PayPal button
        if (typeof paypal !== 'undefined') {
            openCart();
        } else {
            showNotification('Loading payment options...');
            setTimeout(proceedToCheckout, 1000);
        }
    }

    // ========== UPDATED PAYMENT SECTION HTML ==========
    // Replace your payment section with this:
</script>
// ========== ADDITIONAL PAYMENT FUNCTIONS ==========
function openPayPalCheckout() {
    if (cart.length === 0) {
        showNotification('Please add items to cart first!');
        scrollToSection('products');
        return;
    }
    openCart();
}

function showAlternativePayment() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            <div style="padding: 40px;">
                <h3 style="margin-bottom: 25px; color: var(--gold);">
                    <i class="fas fa-credit-card"></i> Alternative Payment
                </h3>
                <p style="color: var(--text-secondary); margin-bottom: 25px;">
                    For bank transfer or cash on delivery, please contact us:
                </p>
                <div style="background: var(--bg-secondary); padding: 20px; border-radius: var(--border-radius); 
                            margin-bottom: 25px;">
                    <p><i class="fas fa-phone"></i> <strong>Phone:</strong> +971 4 XXX XXXX</p>
                    <p><i class="fas fa-envelope"></i> <strong>Email:</strong> payments@ryaanjewellers.com</p>
                    <p><i class="fas fa-university"></i> <strong>Bank:</strong> Emirates NBD</p>
                </div>
                <button class="btn btn-gold" style="width: 100%;" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-check"></i> Got it
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ========== PAYPAL SANDBOX TESTING ==========
// For testing without real PayPal account, use sandbox credentials
function setupPayPalSandbox() {
    // Test credentials (for development only)
    const testProducts = [
        {
            id: 999,
            name: "Test Product - Gold Ring",
            price: 5000,
            image: "https://via.placeholder.com/300x300/1a1a1a/D4AF37?text=Test+Product",
            description: "Test product for PayPal integration",
            category: "test"
        }
    ];
    
    // Add test product button for testing
    const testButton = document.createElement('button');
    testButton.className = 'btn btn-outline';
    testButton.innerHTML = '<i class="fas fa-vial"></i> Test PayPal';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '20px';
    testButton.style.right = '20px';
    testButton.style.zIndex = '1000';
    testButton.onclick = function() {
        cart = [{
            id: 999,
            name: "Test Gold Ring",
            price: 5000,
            quantity: 1,
            sku: "TEST-001"
        }];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        openCart();
        showNotification('Test product added to cart. Try PayPal checkout!');
    };
    
    document.body.appendChild(testButton);
}

// Uncomment for testing:
// setupPayPalSandbox();
