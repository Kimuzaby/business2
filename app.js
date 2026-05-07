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

// Muestra u oculta la selección de zonas y el mapa
function toggleDeliveryZones() {
    const method = document.getElementById('delivery-method').value;
    const zonesContainer = document.getElementById('delivery-zones-container');
    const mapButtonContainer = document.getElementById('map-button-container'); 
    const deliveryZone = document.getElementById('delivery-zone');
    const mapCoords = document.getElementById('map-coordinates');
    
    if (method === 'delivery') {
        zonesContainer.style.display = 'block';
        mapButtonContainer.style.display = 'block'; 
    } else {
        zonesContainer.style.display = 'none';
        mapButtonContainer.style.display = 'none';  
        
        deliveryZone.value = ''; 
        if (mapCoords) mapCoords.value = ''; 
        
        const notesField = document.getElementById('location-details');
        if (notesField) {
            notesField.value = notesField.value.replace(/\[📍 Ubicación fijada en mapa\]\n?/g, '').trim();
        }
    }
    saveAndRenderCart(); 
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
        document.getElementById('delivery-zone').value = '';
        document.getElementById('location-details').value = '';
        if (document.getElementById('map-coordinates')) document.getElementById('map-coordinates').value = '';
        
        toggleDeliveryZones(); 
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
        cartTotalElement.innerText = `$0.00`;
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

        const deliveryMethod = document.getElementById('delivery-method');
        const deliveryZone = document.getElementById('delivery-zone');
        let deliveryCost = 0;

        if (deliveryMethod && deliveryMethod.value === 'delivery' && deliveryZone && deliveryZone.value !== '') {
            deliveryCost = 3.00;
        }

        const finalTotal = total + deliveryCost;

        if (deliveryCost > 0) {
            cartTotalElement.innerHTML = `
                <div style="display: flex; flex-direction: column; text-align: right;">
                    <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: normal;">Subtotal: $${total.toFixed(2)}</span>
                    <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: normal; margin-bottom: 5px;">Envío: $${deliveryCost.toFixed(2)}</span>
                    <span>$${finalTotal.toFixed(2)}</span>
                </div>
            `;
        } else {
            cartTotalElement.innerText = `$${finalTotal.toFixed(2)}`;
        }
    }
    
    cartCountElement.innerText = totalItems;
}

async function sendWhatsApp() {
    const clientName = document.getElementById('client-name').value;
    const deliveryMethod = document.getElementById('delivery-method').value;
    const deliveryZone = document.getElementById('delivery-zone').value;
    const locationDetails = document.getElementById('location-details').value;
    const paymentMethod = document.getElementById('payment-method').value;

    if (cart.length === 0 || !clientName || !deliveryMethod) {
        alert("Por favor completa tu nombre y el método de entrega.");
        return;
    }
    
    if (deliveryMethod === 'delivery' && !deliveryZone) {
        alert("Por favor selecciona tu zona de entrega.");
        return;
    }

    const subtotalOrder = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCost = (deliveryMethod === 'delivery' && deliveryZone !== '') ? 3.00 : 0;
    const totalOrder = (subtotalOrder + deliveryCost).toFixed(2);

    const phone = "50370483939"; 
    
    let messageText = `*NUEVO PEDIDO: LA ABUELA COCINA URBANA* 🍔\n\n`;
    messageText += `*Cliente:* ${clientName}\n`;
    
    if (deliveryMethod === 'delivery') {
        messageText += `*Modalidad:* Delivery (${deliveryZone})\n\n`;
    } else {
        messageText += `*Modalidad:* ${deliveryMethod}\n\n`;
    }
    
    cart.forEach(item => {
        messageText += `▪️ ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
    });

    if (deliveryCost > 0) {
        messageText += `\n*Subtotal:* $${subtotalOrder.toFixed(2)}\n`;
        messageText += `*Costo de envío:* $${deliveryCost.toFixed(2)}\n`;
    }

    messageText += `\n*TOTAL A PAGAR: $${totalOrder}*\n`;
    messageText += `*Pago:* ${paymentMethod}\n`;
    
    if (locationDetails) {
        let cleanNotes = locationDetails.replace('[📍 Ubicación fijada en mapa]', '').trim();
        messageText += `*Notas:* ${cleanNotes}\n`;
    }

    // AÑADIMOS EL ENLACE DEL MAPA SI EXISTE
    const mapCoords = document.getElementById('map-coordinates');
    if (deliveryMethod === 'delivery' && mapCoords && mapCoords.value !== '') {
        messageText += `*📍 Ver ubicación exacta en el mapa:* \n${mapCoords.value}\n`;
    }
    
    messageText += "\n¡Gracias por preferir a La Abuela!";
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
    
    function openWhatsApp(url) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS) {
            const phone = "50370483939";
            const message = url.split('?text=')[1];
            const directUrl = `whatsapp://send?phone=${phone}&text=${message || ''}`;
            
            const startTime = Date.now();
            window.location.href = directUrl;
            
            setTimeout(function() {
                if (Date.now() - startTime < 1500) {
                    window.location.href = url;
                }
            }, 1000);
        } else {
            window.open(url, '_blank');
        }
    }

    openWhatsApp(url);

    // Registro en Google Sheets
    const orderData = {
        id_pedido: Date.now(),
        fecha: new Date().toLocaleString(),
        cliente: clientName,
        items: cart.map(item => `${item.quantity}x ${item.name}`).join(", "),
        total: totalOrder,
        metodo_entrega: deliveryMethod === 'delivery' ? `Delivery: ${deliveryZone}` : deliveryMethod,
        pago: paymentMethod,
        notas: locationDetails
    };

    fetch('https://sheetdb.io/api/v1/5r8sg0dmxgzp0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [orderData] })
    }).catch(error => {
        console.error("Error al registrar en Sheets:", error);
    });
}

// ==========================================
// LÓGICA DEL MAPA HÍBRIDO (Leaflet -> Google Maps)
// ==========================================

let map = null;
let marker = null;
let selectedLat = 13.698;  // Coordenada por defecto (San Salvador)
let selectedLng = -89.102; // Coordenada por defecto (Ilopango/Soyapango aprox)

function openMapModal() {
    document.getElementById('map-modal').style.display = 'block';
    document.getElementById('map-overlay').classList.add('active');

    if (!map) {
        // Inicializamos el mapa con Leaflet
        map = L.map('delivery-map').setView([selectedLat, selectedLng], 14);

        // Capa de OpenStreetMap (Gratuita)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Marcador rojo
        marker = L.marker([selectedLat, selectedLng], { draggable: true }).addTo(map);

        // Actualizar coordenadas al mover el marcador
        marker.on('dragend', function (e) {
            selectedLat = marker.getLatLng().lat;
            selectedLng = marker.getLatLng().lng;
        });

        // Buscador de Direcciones (Leaflet Control Geocoder)
        if (typeof L.Control.Geocoder !== 'undefined') {
            L.Control.geocoder({
                defaultMarkGeocode: false,
                placeholder: "Buscar colonia, calle...",
                errorMessage: "Lugar no encontrado."
            })
            .on('markgeocode', function(e) {
                const center = e.geocode.center;
                map.fitBounds(e.geocode.bbox);
                marker.setLatLng(center);
                selectedLat = center.lat;
                selectedLng = center.lng;
            })
            .addTo(map);
        }
    } else {
        setTimeout(() => { map.invalidateSize(); }, 100);
    }
}

function closeMapModal() {
    document.getElementById('map-modal').style.display = 'none';
    document.getElementById('map-overlay').classList.remove('active');
}

// Buscar ubicación por GPS del celular/navegador
function findMyLocation() {
    if (!map) return;
    
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Buscando...";
    btn.disabled = true;

    map.locate({setView: true, maxZoom: 16});
    
    map.once('locationfound', function(e) {
        selectedLat = e.latlng.lat;
        selectedLng = e.latlng.lng;
        marker.setLatLng(e.latlng);
        
        btn.innerHTML = "✅ ¡Ubicación encontrada!";
        setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
    });

    map.once('locationerror', function(e) {
        alert("No se pudo obtener la ubicación. Revisa tu GPS.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

// Guardar y armar el enlace de Google Maps
function confirmMapLocation() {
    // Aquí está la magia: Transformamos las coordenadas de Leaflet en un link de Google Maps
    const googleMapsLink = `https://www.google.com/maps?q=${selectedLat.toFixed(6)},${selectedLng.toFixed(6)}`;
    
    document.getElementById('map-coordinates').value = googleMapsLink;
    
    const notesField = document.getElementById('location-details');
    let currentNotes = notesField.value;
    
    currentNotes = currentNotes.replace(/\[📍 Ubicación fijada en mapa\]/g, '').trim();
    notesField.value = `[📍 Ubicación fijada en mapa]\n${currentNotes}`.trim();
    
    closeMapModal();
}