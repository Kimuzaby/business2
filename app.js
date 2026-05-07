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

// 1. NUEVA FUNCIÓN: Muestra u oculta la selección de zonas
function toggleDeliveryZones() {
    const method = document.getElementById('delivery-method').value;
    const zonesContainer = document.getElementById('delivery-zones-container');
    const mapButtonContainer = document.getElementById('map-button-container'); // Contenedor del mapa
    const deliveryZone = document.getElementById('delivery-zone');
    const mapCoords = document.getElementById('map-coordinates');
    
    if (method === 'delivery') {
        zonesContainer.style.display = 'block';
        mapButtonContainer.style.display = 'block'; // Muestra el botón del mapa
    } else {
        zonesContainer.style.display = 'none';
        mapButtonContainer.style.display = 'none';  // Oculta el botón del mapa
        
        // Resetea los valores si el usuario cambió de opinión
        deliveryZone.value = ''; 
        if (mapCoords) mapCoords.value = ''; 
        
        // Limpiamos el texto del mapa en las notas si existía
        const notesField = document.getElementById('location-details');
        if (notesField) {
            notesField.value = notesField.value.replace(/\[📍 Ubicación fijada en mapa\]\n?/g, '').trim();
        }
    }
    saveAndRenderCart(); // Recalcula el total si cambió el método de entrega
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
        
        toggleDeliveryZones(); // Asegurarnos de que los desplegables y mapas se oculten al vaciar
        saveAndRenderCart();
    }
}

// 2. LÓGICA DE COBRO: Calcular los $3.00 si se selecciona delivery
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

        // Verificamos si aplica el cobro de envío ($3.00)
        const deliveryMethod = document.getElementById('delivery-method');
        const deliveryZone = document.getElementById('delivery-zone');
        let deliveryCost = 0;

        if (deliveryMethod && deliveryMethod.value === 'delivery' && deliveryZone && deliveryZone.value !== '') {
            deliveryCost = 3.00;
        }

        const finalTotal = total + deliveryCost;

        // Si hay costo de envío, mostramos el desglose en el carrito
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

// 3. ENVÍO DE WHATSAPP ACTUALIZADO
async function sendWhatsApp() {
    const clientName = document.getElementById('client-name').value;
    const deliveryMethod = document.getElementById('delivery-method').value;
    const deliveryZone = document.getElementById('delivery-zone').value;
    const locationDetails = document.getElementById('location-details').value;
    const paymentMethod = document.getElementById('payment-method').value;

    // Validación básica de campos, ahora incluyendo la zona si se elige delivery
    if (cart.length === 0 || !clientName || !deliveryMethod) {
        alert("Por favor completa tu nombre y el método de entrega.");
        return;
    }
    
    if (deliveryMethod === 'delivery' && !deliveryZone) {
        alert("Por favor selecciona tu zona de entrega.");
        return;
    }

    // Cálculos de subtotal y envío
    const subtotalOrder = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCost = (deliveryMethod === 'delivery' && deliveryZone !== '') ? 3.00 : 0;
    const totalOrder = (subtotalOrder + deliveryCost).toFixed(2);

    const phone = "50370483939"; 
    
    let messageText = `NUEVO PEDIDO: LA ABUELA COCINA URBANA\n\n`;
    messageText += `Cliente: ${clientName}\n`;
    
    if (deliveryMethod === 'delivery') {
        messageText += `Modalidad: Delivery (${deliveryZone})\n\n`;
    } else {
        messageText += `Modalidad: ${deliveryMethod}\n\n`;
    }
    
    cart.forEach(item => {
        messageText += `▪️ ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
    });

    
    if (deliveryCost > 0) {
        messageText += `\nSubtotal: $${subtotalOrder.toFixed(2)}\n`;
        messageText += `Costo de envío: $${deliveryCost.toFixed(2)}\n`;
    }

    messageText += `\nTOTAL A PAGAR: $${totalOrder}\n`;
    messageText += `Pago: ${paymentMethod}\n`;
    
    if (locationDetails) {
        // Limpiamos la etiqueta visual que le pusimos al cliente
        let cleanNotes = locationDetails.replace('[📍 Ubicación fijada en mapa]', '').trim();
        messageText += `Notas: ${cleanNotes}\n`;
    }

    // AÑADIMOS EL ENLACE DEL MAPA SI EXISTE
    const mapCoords = document.getElementById('map-coordinates').value;
    if (deliveryMethod === 'delivery' && mapCoords) {
        messageText += `📍 Ver ubicación exacta en el mapa: \n${mapCoords}\n`;
    }
    
    messageText += "\n¡Gracias por preferir a La Abuela!";
    
    // Construimos la URL de WhatsApp
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
    
    // ... (el resto del código de iOS y el fetch se mantiene igual) ...
    
    // Versión mejorada de window.open para iOS
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

    // Registro asíncrono a Google Sheets en segundo plano
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
        console.error("Error al registrar en Sheets (no crítico):", error);
    });
}

// ==========================================
// LÓGICA DEL MAPA (Leaflet + Buscador + GPS)
// ==========================================

let map = null;
let marker = null;
let selectedLat = 13.698;
let selectedLng = -89.102;

function openMapModal() {
    document.getElementById('map-modal').style.display = 'block';
    document.getElementById('map-overlay').classList.add('active');
    
    // Bloquear el scroll del body cuando el mapa está abierto en móvil
    document.body.style.overflow = 'hidden';

    if (!map) {
        map = L.map('delivery-map', {
            zoomControl: true,
            attributionControl: false
        }).setView([selectedLat, selectedLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Marcador arrastrable con icono más visible para móviles
        const customIcon = L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
        });

        marker = L.marker([selectedLat, selectedLng], { 
            draggable: true,
            icon: customIcon 
        }).addTo(map);

        marker.on('dragend', function (e) {
            selectedLat = marker.getLatLng().lat;
            selectedLng = marker.getLatLng().lng;
        });

        // Click en el mapa para mover el marcador (útil en móviles)
        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            selectedLat = e.latlng.lat;
            selectedLng = e.latlng.lng;
        });

        // Buscador de direcciones
        const geocoder = L.Control.geocoder({
            defaultMarkGeocode: false,
            placeholder: "🔍 Buscar dirección...",
            errorMessage: "No se encontró el lugar.",
            collapsed: false // Siempre visible en móviles
        })
        .on('markgeocode', function(e) {
            const center = e.geocode.center;
            
            map.setView(center, 16);
            marker.setLatLng(center);
            
            selectedLat = center.lat;
            selectedLng = center.lng;
        })
        .addTo(map);

    } else {
        // Redibujar el mapa cuando se abre de nuevo
        setTimeout(() => { 
            map.invalidateSize();
            // Centrar en la última ubicación seleccionada
            map.setView([selectedLat, selectedLng], 14);
            marker.setLatLng([selectedLat, selectedLng]);
        }, 200);
    }
}

function closeMapModal() {
    document.getElementById('map-modal').style.display = 'none';
    document.getElementById('map-overlay').classList.remove('active');
    document.body.style.overflow = ''; // Restaurar scroll
}

function findMyLocation() {
    if (!map) return;
    
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Buscando tu ubicación...";
    btn.disabled = true;

    // Opciones específicas para mejor funcionamiento en móviles
    const options = {
        enableHighAccuracy: true, // Mayor precisión GPS
        timeout: 10000,           // 10 segundos máximo
        maximumAge: 0,            // No usar caché
        setView: true,
        maxZoom: 18
    };

    map.locate(options);
    
    map.once('locationfound', function(e) {
        selectedLat = e.latlng.lat;
        selectedLng = e.latlng.lng;
        marker.setLatLng(e.latlng);
        
        // Popup temporal para mostrar la ubicación encontrada
        L.popup()
            .setLatLng(e.latlng)
            .setContent('📍 ¡Ubicación encontrada!<br>Puedes ajustar el marcador')
            .openOn(map);
        
        btn.innerHTML = "✅ ¡Listo!";
        setTimeout(() => { 
            btn.innerHTML = originalText; 
            btn.disabled = false; 
        }, 2500);
    });

    map.once('locationerror', function(e) {
        let errorMsg = "No se pudo obtener tu ubicación.";
        
        if (e.code === 1) {
            errorMsg += "\n\n⚠️ Permiso denegado. Verifica que:\n• El GPS esté activado\n• Hayas dado permiso de ubicación\n• No estés en modo incógnito";
        } else if (e.code === 2) {
            errorMsg += "\n\n⚠️ Ubicación no disponible. Intenta buscar manualmente.";
        } else if (e.code === 3) {
            errorMsg += "\n\n⚠️ Tiempo agotado. Intenta de nuevo.";
        }
        
        alert(errorMsg);
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

function confirmMapLocation() {
    const coordsStr = `${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`;
    const googleMapsLink = `https://www.google.com/maps?q=${selectedLat},${selectedLng}`;
    
    document.getElementById('map-coordinates').value = googleMapsLink;
    
    const notesField = document.getElementById('location-details');
    let currentNotes = notesField.value;
    
    // Limpiar etiqueta anterior si existe
    currentNotes = currentNotes.replace(/\[📍 Ubicación fijada en mapa\]\n?/g, '').trim();
    
    // Agregar nueva etiqueta
    notesField.value = `[📍 Ubicación fijada en mapa]\n${currentNotes}`.trim();
    
    // Feedback visual breve
    const confirmBtn = event.currentTarget;
    confirmBtn.textContent = "✅ ¡Ubicación confirmada!";
    setTimeout(() => {
        confirmBtn.textContent = "Confirmar esta ubicación";
    }, 1500);
    
    closeMapModal();
}