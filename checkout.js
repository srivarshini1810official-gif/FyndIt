
// ==========================================
// FYNDIt - CHECKOUT AND ORDER PLACEMENT
// ==========================================

let checkoutSession = null;
let checkoutCustomerProfile = null;


// Read the customer's session
function getCheckoutSession() {
    try {
        return JSON.parse(localStorage.getItem("fynditSession"));
    } catch (error) {
        return null;
    }
}


// Read cart data
function getCheckoutCart() {
    try {
        return JSON.parse(localStorage.getItem("fynditCart")) || [];
    } catch (error) {
        console.error("Unable to read cart:", error);
        return [];
    }
}


// Decode Firestore REST fields
function decodeCheckoutFields(fields) {
    const result = {};

    for (const [key, value] of Object.entries(fields || {})) {

        if (value.stringValue !== undefined) {
            result[key] = value.stringValue;

        } else if (value.integerValue !== undefined) {
            result[key] = Number(value.integerValue);

        } else if (value.doubleValue !== undefined) {
            result[key] = Number(value.doubleValue);

        } else if (value.booleanValue !== undefined) {
            result[key] = value.booleanValue;

        } else if (value.timestampValue !== undefined) {
            result[key] = value.timestampValue;

        } else if (value.mapValue) {
            result[key] = decodeCheckoutFields(value.mapValue.fields);

        } else if (value.arrayValue) {
            result[key] = (value.arrayValue.values || []).map(item => {
                if (item.mapValue) {
                    return decodeCheckoutFields(item.mapValue.fields);
                }

                return item.stringValue ??
                    item.integerValue ??
                    item.doubleValue ??
                    null;
            });

        } else if (value.nullValue !== undefined) {
            result[key] = null;
        }
    }

    return result;
}


// Encode values for Firestore REST API
function encodeCheckoutValue(value) {

    if (value === null || value === undefined) {
        return { nullValue: null };
    }

    if (typeof value === "string") {
        return { stringValue: value };
    }

    if (typeof value === "number") {
        return Number.isInteger(value)
            ? { integerValue: String(value) }
            : { doubleValue: value };
    }

    if (typeof value === "boolean") {
        return { booleanValue: value };
    }

    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(item => ({
                    mapValue: {
                        fields: encodeCheckoutObject(item)
                    }
                }))
            }
        };
    }

    if (typeof value === "object") {
        return {
            mapValue: {
                fields: encodeCheckoutObject(value)
            }
        };
    }
}


function encodeCheckoutObject(object) {
    const fields = {};

    for (const [key, value] of Object.entries(object)) {
        fields[key] = encodeCheckoutValue(value);
    }

    return fields;
}


// Format prices in Indian Rupees
function formatCheckoutPrice(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    });
}


// Safely display HTML text
function escapeCheckoutHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(character) {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}


// Update cart quantity in header
function updateCheckoutCartCount(cart) {
    const totalQuantity = cart.reduce(function(total, item) {
        return total + Number(item.quantity || 0);
    }, 0);

    const cartCount = document.getElementById("cartCount");

    if (cartCount) {
        cartCount.textContent = totalQuantity;
    }
}


// Calculate cart subtotal
function calculateCheckoutSubtotal(cart) {
    return cart.reduce(function(total, item) {
        return total +
            (Number(item.price) * Number(item.quantity));
    }, 0);
}


// Verify customer session and retrieve profile
async function verifyCheckoutCustomer() {

    if (!checkoutSession || !checkoutSession.idToken) {
        window.location.href = "login.html?returnUrl=checkout.html";
        return false;
    }

    if (checkoutSession.role !== "customer") {
        alert("Please log in using a customer account to place an order.");

        localStorage.removeItem("fynditSession");

        window.location.href = "login.html?returnUrl=checkout.html";
        return false;
    }

    const response = await fetch(
        `${FIRESTORE_BASE_URL}/users/${checkoutSession.userId}`,
        {
            headers: {
                Authorization: `Bearer ${checkoutSession.idToken}`
            }
        }
    );

    if (!response.ok) {
        throw new Error("Unable to verify your customer profile. Please log in again.");
    }

    const data = await response.json();

    checkoutCustomerProfile = decodeCheckoutFields(data.fields);

    if (
        checkoutCustomerProfile.role !== "customer" ||
        checkoutCustomerProfile.status !== "active"
    ) {
        throw new Error("Your customer account is not active.");
    }

    return true;
}


// Fill delivery details from customer profile
function fillCustomerDetails() {

    if (!checkoutCustomerProfile) {
        return;
    }

    const address = checkoutCustomerProfile.address || {};

    document.getElementById("customerName").value =
        checkoutCustomerProfile.name || "";

    document.getElementById("customerEmail").value =
        checkoutCustomerProfile.email || "";

    document.getElementById("customerPhone").value =
        checkoutCustomerProfile.phone || "";

    document.getElementById("deliveryAddress").value =
        address.street || address.addressLine || address.address || "";

    document.getElementById("deliveryCity").value =
        address.city || "";

    document.getElementById("deliveryState").value =
        address.state || "";

    document.getElementById("deliveryPincode").value =
        address.pincode || address.postalCode || "";
}


// Display order summary
function displayCheckoutSummary() {

    const cart = getCheckoutCart();

    const checkoutItems = document.getElementById("checkoutItems");
    const subtotalElement = document.getElementById("checkoutSubtotal");
    const totalElement = document.getElementById("checkoutTotal");

    updateCheckoutCartCount(cart);

    if (!checkoutItems || !subtotalElement || !totalElement) {
        return;
    }

    if (cart.length === 0) {

        checkoutItems.innerHTML = `
            <p>Your cart is empty.</p>
            <p><a href="products.html">Continue shopping</a></p>
        `;

        subtotalElement.textContent = formatCheckoutPrice(0);
        totalElement.textContent = formatCheckoutPrice(0);

        document.getElementById("placeOrderButton").disabled = true;

        return;
    }

    let subtotal = 0;

    checkoutItems.innerHTML = cart.map(function(item) {

        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const itemTotal = price * quantity;

        subtotal += itemTotal;

        return `
            <div class="checkout-item">

                <div class="checkout-item-details">
                    <h3>${escapeCheckoutHTML(item.name)}</h3>

                    <p>
                        ${escapeCheckoutHTML(item.category)}
                        &nbsp; | &nbsp;
                        Quantity: ${quantity}
                    </p>
                </div>

                <span class="checkout-item-price">
                    ${formatCheckoutPrice(itemTotal)}
                </span>

            </div>
        `;

    }).join("");

    subtotalElement.textContent = formatCheckoutPrice(subtotal);
    totalElement.textContent = formatCheckoutPrice(subtotal);
}


// Validate delivery details
function getCheckoutDeliveryAddress() {

    const phone = document.getElementById("customerPhone").value.trim();
    const pincode = document.getElementById("deliveryPincode").value.trim();

    if (!/^[0-9]{10}$/.test(phone)) {
        throw new Error("Please enter a valid 10-digit phone number.");
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
        throw new Error("Please enter a valid 6-digit PIN code.");
    }

    return {
        street: document.getElementById("deliveryAddress").value.trim(),
        city: document.getElementById("deliveryCity").value.trim(),
        state: document.getElementById("deliveryState").value.trim(),
        pincode: pincode,
        country: "India"
    };
}


// Place order in Firestore
async function placeCustomerOrder(event) {

    event.preventDefault();

    const placeOrderButton = document.getElementById("placeOrderButton");

    const cart = getCheckoutCart();

    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    if (!checkoutSession || !checkoutCustomerProfile) {
        alert("Please log in using your customer account.");
        window.location.href = "login.html?returnUrl=checkout.html";
        return;
    }

    if (!document.getElementById("checkoutForm").reportValidity()) {
        return;
    }

    try {

        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "PLACING ORDER...";

        const deliveryAddress = getCheckoutDeliveryAddress();

        const customerName = document.getElementById("customerName").value.trim();
        const customerEmail = document.getElementById("customerEmail").value.trim();
        const customerPhone = document.getElementById("customerPhone").value.trim();

        if (!customerName || !customerEmail || !customerPhone) {
            throw new Error("Please complete all customer details.");
        }

        // Prepare order items
        const orderItems = cart.map(item => {

            const quantity = Number(item.quantity);
            const price = Number(item.price);

            if (
                !item.productId ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                !Number.isFinite(price) ||
                price < 0
            ) {
                throw new Error("Your cart contains an invalid product. Please review your cart.");
            }

            return {
                productId: String(item.productId),
                productName: String(item.name),
                category: String(item.category || ""),
                price: price,
                quantity: quantity,
                lineTotal: Number((price * quantity).toFixed(2))
            };
        });

        const subtotal = Number(
            calculateCheckoutSubtotal(cart).toFixed(2)
        );

        const deliveryCharge = 0;

        const totalAmount = Number(
            (subtotal + deliveryCharge).toFixed(2)
        );

        const paymentMethod = document.querySelector(
            'input[name="paymentMethod"]:checked'
        ).value;

        // Generate unique order ID
        const orderId = "ORD" + Date.now();

        // Prepare Firestore order document
        const orderData = {

            orderId: orderId,

            userId: checkoutSession.userId,

            customerName: customerName,

            customerEmail: customerEmail,

            customerPhone: customerPhone,

            items: orderItems,

            itemCount: orderItems.reduce(
                (total, item) => total + item.quantity,
                0
            ),

            subtotal: subtotal,

            deliveryCharge: deliveryCharge,

            totalAmount: totalAmount,

            paymentMethod: paymentMethod,

            paymentStatus: "Pending",

            orderStatus: "Pending",

            deliveryAddress: deliveryAddress,

            createdAt: new Date().toISOString()
        };

        // Save order through Firestore REST API
        const response = await fetch(
            `${FIRESTORE_BASE_URL}/orders?documentId=${encodeURIComponent(orderId)}`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${checkoutSession.idToken}`
                },

                body: JSON.stringify({
                    fields: encodeCheckoutObject(orderData)
                })
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            console.error("Firestore order error:", responseData);

            throw new Error(
                responseData.error?.message ||
                "Unable to place your order. Please try again."
            );
        }

        // Clear cart only after successful order creation
        localStorage.removeItem("fynditCart");

        updateCheckoutCartCount([]);

        document.getElementById("checkoutForm").reset();

        displayCheckoutSummary();

        alert(
            "Your order has been placed successfully!\n\n" +
            "Order ID: " + orderId + "\n" +
            "Total Amount: " + formatCheckoutPrice(totalAmount) + "\n" +
            "Order Status: Pending"
        );

        // Redirect to order confirmation page (to be created)
        window.location.href =
            "order-confirmation.html?orderId=" +
            encodeURIComponent(orderId);

    } catch (error) {

        console.error("Order placement error:", error);

        alert(error.message);

        placeOrderButton.disabled = false;
        placeOrderButton.textContent = "PLACE ORDER";
    }
}


// Initialize checkout page
async function initializeCheckout() {

    checkoutSession = getCheckoutSession();

    displayCheckoutSummary();

    try {

        const verified = await verifyCheckoutCustomer();

        if (!verified) {
            return;
        }

        fillCustomerDetails();

    } catch (error) {

        console.error(error);

        alert(error.message);

        localStorage.removeItem("fynditSession");

        window.location.href = "login.html?returnUrl=checkout.html";
    }
}


// Connect checkout form
document.getElementById("checkoutForm").addEventListener(
    "submit",
    placeCustomerOrder
);


// Load checkout page
document.addEventListener("DOMContentLoaded", initializeCheckout);
