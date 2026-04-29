// Lógica del Carrito para La Abuela Cocina Urbana
let cart = JSON.parse(localStorage.getItem('cart_la_abuela')) || [];
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountElement = document.getElementById('cart-count');
const cartTotalElement = document.getElementById('cart-total');
const btnWhatsApp = document.getElementById('btn-whatsapp');
const btnEmpty = document.getElementById('btn-empty');

// Renderizar el carrito al cargar
window.onload = () => saveAndRenderCart();

function openTab(evt, tabName) {
    let tabcontent = document.getElementsByClassName("menu-tab");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }
    let tablinks = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
}

function addToCart(id, name, price) {
    const existing = cart.find(i => i.id === id);
    if (existing) { existing.quantity += 1; }
    else { cart.push({ id, name, price, quantity: 1 }); }
    saveAndRenderCart();
    if (!cartSidebar.classList.contains('active')) toggleCart();
}

function updateQuantity(id, change) {
    const idx = cart.findIndex(i => i.id === id);
    if (idx > -1) {
        cart[idx].quantity += change;
        if (cart[idx].quantity <= 0) cart.splice(idx, 1);
    }
    saveAndRenderCart();
}

function emptyCart() {
    if (confirm("¿Estás seguro de que deseas vaciar tu carrito?")) {
        cart = [];
        document.getElementById('client-name').value = '';
        document.getElementById('delivery-method').value = '';
        document.getElementById('location-details').value = '';
        saveAndRenderCart();
    }
}

function saveAndRenderCart() {
    localStorage.setItem('cart_la_abuela', JSON.stringify(cart));
    cartItemsContainer.innerHTML = '';
    let total = 0, totalItems = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align:center; padding: 30px 10px; color:var(--text-muted);">
                <div style="font-size:2.5rem; margin-bottom:10px;">🛒</div>
                <p>Tu carrito está vacío</p>
            </div>`;
        btnWhatsApp.disabled = true;
        btnWhatsApp.style.opacity = '0.5';
        btnEmpty.style.display = 'none';
    } else {
        btnWhatsApp.disabled = false;
        btnWhatsApp.style.opacity = '1';
        btnEmpty.style.display = 'block';
        
        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            totalItems += item.quantity;
            cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-controls">
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                            <span style="width:20px;text-align:center;font-weight:bold;">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        </div>
                        <div class="item-price">$${subtotal.toFixed(2)}</div>
                    </div>
                </div>`;
        });
    }
    cartCountElement.innerText = totalItems;
    cartTotalElement.innerText = `$${total.toFixed(2)}`;
}

/**
 * FUNCIÓN ACTUALIZADA: Envía a Google Sheets y luego a WhatsApp
 */
async function sendWhatsApp() {
    const clientName = document.getElementById('client-name').value;
    const deliveryMethod = document.getElementById('delivery-method').value;
    const locationDetails = document.getElementById('location-details').value;
    const paymentMethod = document.getElementById('payment-method').value;

    // Validación básica de campos
    if (cart.length === 0 || !clientName || !deliveryMethod) {
        alert("Por favor completa tu nombre y el método de entrega.");
        return;
    }

    const totalOrder = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    // 1. Preparar el objeto de datos para Google Sheets
    const orderData = {
        id_pedido: Date.now(),
        fecha: new Date().toLocaleString(),
        cliente: clientName,
        items: cart.map(item => `${item.quantity}x ${item.name}`).join(", "),
        total: totalOrder,
        metodo_entrega: deliveryMethod,
        pago: paymentMethod,
        notas: locationDetails
    };

    // 2. Enviar a Google Sheets vía SheetDB (Asíncrono)
    // REEMPLAZA 'TU_API_ID' con el código que te dio SheetDB.io
    try {
        await fetch('https://sheetdb.io/api/v1/5r8sg0dmxgzp0', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [orderData] })
        });
        console.log("Pedido registrado en Google Sheets con éxito.");
    } catch (error) {
        console.error("Error al registrar en Sheets:", error);
        // Continuamos con el pedido de WhatsApp aunque falle el registro en Sheets
    }

    // 3. Proceder con el envío de WhatsApp original
    const phone = "50370483939"; // Número de La Abuela
    
    let messageText = `NUEVO PEDIDO: LA ABUELA COCINA URBANA\n\n`;
    messageText += `Cliente: ${clientName}\n`;
    messageText += `Modalidad: ${deliveryMethod}\n\n`;
    
    cart.forEach(item => {
        messageText += ` ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
    });

    messageText += `\nTOTAL A PAGAR: $${totalOrder}\n`;
    messageText += `Pago: ${paymentMethod}\n`;
    if (locationDetails) messageText += `Detalles/Dirección: ${locationDetails}\n`;
    
    messageText += "\n¡Gracias por preferir a La Abuela!";
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
    
    // Abrir WhatsApp en una nueva pestaña
    window.open(url, '_blank');
}