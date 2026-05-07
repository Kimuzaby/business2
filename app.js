// Lógica del Carrito para La Abuela Cocina Urbana

// Debug: Verificar que las funciones existen
console.log("App cargada. Funciones disponibles:", {
    initMap: typeof initMap,
    openMapModal: typeof openMapModal,
    closeMapModal: typeof closeMapModal,
    findMyLocation: typeof findMyLocation,
    confirmMapLocation: typeof confirmMapLocation
});


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
    
    let messageText = `*NUEVO PEDIDO: LA ABUELA COCINA URBANA*\n\n`;
    messageText += `*Cliente:* ${clientName}\n`;
    
    if (deliveryMethod === 'delivery') {
        messageText += `*Modalidad:* Delivery (${deliveryZone})\n\n`;
    } else {
        messageText += `*Modalidad:* ${deliveryMethod}\n\n`;
    }
    
    cart.forEach(item => {
        messageText += `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
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
        messageText += `*Ver ubicación exacta en el mapa:* \n${mapCoords.value}\n`;
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
// LÓGICA DEL MAPA (API OFICIAL DE GOOGLE MAPS)
// ==========================================

let map = null;
let marker = null;
// Coordenadas centradas por defecto en la zona de Ilopango / San Salvador
let selectedLat = 13.7013;  
let selectedLng = -89.1094; 
let isMapApiLoaded = false;
let mapInitialized = false;

// Esta función es llamada por Google Maps cuando el script termina de cargar
function initMap() {
    console.log("Google Maps API cargada correctamente");
    isMapApiLoaded = true;
}

function openMapModal() {
    const modal = document.getElementById('map-modal');
    const overlay = document.getElementById('map-overlay');
    
    modal.style.display = 'block';
    overlay.classList.add('active');

    // Pequeño retraso para asegurar que el modal sea visible
    setTimeout(() => {
        if (!isMapApiLoaded) {
            alert("El mapa aún está cargando. Por favor, espera unos segundos e inténtalo de nuevo.");
            return;
        }

        const mapContainer = document.getElementById("delivery-map");
        
        if (!mapInitialized) {
            console.log("Inicializando mapa por primera vez");
            
            // Crear el mapa
            map = new google.maps.Map(mapContainer, {
                center: { lat: selectedLat, lng: selectedLng },
                zoom: 15,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false
            });

            // Crear el marcador
            marker = new google.maps.Marker({
                position: { lat: selectedLat, lng: selectedLng },
                map: map,
                draggable: true,
                animation: google.maps.Animation.DROP
            });

            // Evento cuando se arrastra el marcador
            marker.addListener("dragend", () => {
                const position = marker.getPosition();
                selectedLat = position.lat();
                selectedLng = position.lng();
                console.log("Marcador arrastrado a:", selectedLat, selectedLng);
            });

            // Permitir clic en el mapa para mover el marcador
            map.addListener("click", (mapsMouseEvent) => {
                const position = mapsMouseEvent.latLng;
                marker.setPosition(position);
                selectedLat = position.lat();
                selectedLng = position.lng();
                console.log("Mapa clickeado en:", selectedLat, selectedLng);
            });

            // Configurar el autocomplete
            const input = document.getElementById("pac-input");
            if (input) {
                const autocomplete = new google.maps.places.Autocomplete(input);
                autocomplete.setComponentRestrictions({ country: ["sv"] });
                autocomplete.bindTo("bounds", map);

                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete.getPlace();
                    if (!place.geometry || !place.geometry.location) {
                        alert("No se encontró información para este lugar.");
                        return;
                    }

                    if (place.geometry.viewport) {
                        map.fitBounds(place.geometry.viewport);
                    } else {
                        map.setCenter(place.geometry.location);
                        map.setZoom(17);
                    }
                    
                    marker.setPosition(place.geometry.location);
                    selectedLat = place.geometry.location.lat();
                    selectedLng = place.geometry.location.lng();
                    console.log("Lugar seleccionado:", selectedLat, selectedLng);
                });
            }
            
            mapInitialized = true;
        } else {
            // Si el mapa ya existe, solo redimensionarlo y centrarlo
            console.log("Redimensionando mapa existente");
            google.maps.event.trigger(map, 'resize');
            map.setCenter({ lat: selectedLat, lng: selectedLng });
            marker.setPosition({ lat: selectedLat, lng: selectedLng });
        }
        
        // Forzar un resize adicional después de un breve momento
        setTimeout(() => {
            if (map) {
                google.maps.event.trigger(map, 'resize');
            }
        }, 200);
        
    }, 300);
}

function closeMapModal() {
    document.getElementById('map-modal').style.display = 'none';
    document.getElementById('map-overlay').classList.remove('active');
}

// 5. Geolocalización por GPS
function findMyLocation(event) {
    // Prevenir que el evento se propague
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Obtener el botón clickeado
    let btn;
    if (event && event.currentTarget) {
        btn = event.currentTarget;
    } else {
        // Fallback: buscar el botón por el texto
        const buttons = document.querySelectorAll('#map-modal button');
        buttons.forEach(button => {
            if (button.textContent.includes('Usar mi ubicación')) {
                btn = button;
            }
        });
    }
    
    if (!btn) {
        console.error("No se pudo encontrar el botón de geolocalización");
        return;
    }
    
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Buscando...";
    btn.disabled = true;

    if (!navigator.geolocation) {
        alert("Tu dispositivo no soporta geolocalización.");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    // Verificar si el mapa está inicializado
    if (!map || !marker) {
        alert("El mapa no está listo. Espera un momento e inténtalo de nuevo.");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000 // Permitir ubicación de hasta 1 minuto
    };

    navigator.geolocation.getCurrentPosition(
        (position) => {
            selectedLat = position.coords.latitude;
            selectedLng = position.coords.longitude;
            const pos = { lat: selectedLat, lng: selectedLng };
            
            console.log("Ubicación GPS obtenida:", selectedLat, selectedLng);
            
            map.setCenter(pos);
            map.setZoom(17);
            marker.setPosition(pos);
            
            btn.innerHTML = "✅ ¡Ubicación encontrada!";
            setTimeout(() => { 
                btn.innerHTML = originalText; 
                btn.disabled = false; 
            }, 2000);
        },
        (error) => {
            let mensajeError = "No se pudo obtener tu ubicación. ";
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensajeError = "Permiso de ubicación denegado. Activa el GPS en tu navegador.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensajeError = "Señal GPS no disponible. Verifica que el GPS esté activado.";
                    break;
                case error.TIMEOUT:
                    mensajeError = "Tiempo agotado. Intenta en un área con mejor señal GPS.";
                    break;
            }
            
            alert(mensajeError);
            console.error("Error de geolocalización:", error);
            btn.innerHTML = originalText;
            btn.disabled = false;
        },
        options
    );
}

// 6. Confirmar ubicación
function confirmMapLocation() {
    if (!selectedLat || !selectedLng) {
        alert("Primero selecciona una ubicación en el mapa.");
        return;
    }
    
    const googleMapsLink = `https://www.google.com/maps?q=${selectedLat},${selectedLng}`;
    
    document.getElementById('map-coordinates').value = googleMapsLink;
    
    const notesField = document.getElementById('location-details');
    let currentNotes = notesField.value || '';
    
    // Limpiar ubicaciones anteriores
    currentNotes = currentNotes.replace(/\[📍 Ubicación fijada en mapa\]\n?/g, '').trim();
    // Agregar la nueva ubicación
    notesField.value = `[📍 Ubicación fijada en mapa]\n${currentNotes}`.trim();
    
    closeMapModal();
    alert("¡Ubicación guardada con éxito!");
}