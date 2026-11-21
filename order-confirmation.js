
let confirmationSession = null;

function decodeConfirmationFields(fields) {
    const result = {};

    for (const key in fields) {
        const value = fields[key];

        if (value.stringValue !== undefined) {
            result[key] = value.stringValue;
        } else if (value.integerValue !== undefined) {
            result[key] = Number(value.integerValue);
        } else if (value.doubleValue !== undefined) {
            result[key] = Number(value.doubleValue);
        } else if (value.booleanValue !== undefined) {
            result[key] = value.booleanValue;
        } else if (value.mapValue) {
            result[key] = decodeConfirmationFields(
                value.mapValue.fields || {}
            );
        } else if (value.arrayValue) {
            result[key] = (value.arrayValue.values || []).map(item => {
                if (item.mapValue) {
                    return decodeConfirmationFields(
                        item.mapValue.fields || {}
                    );
                }

                if (item.stringValue !== undefined) {
                    return item.stringValue;
                }

                if (item.integerValue !== undefined) {
                    return Number(item.integerValue);
                }

                if (item.doubleValue !== undefined) {
                    return Number(item.doubleValue);
                }

                return null;
            });
        } else if (value.nullValue !== undefined) {
            result[key] = null;
        }
    }

    return result;
}


function formatConfirmationPrice(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    });
}


function escapeConfirmationHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
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


function updateConfirmationCartCount() {
    const cart = JSON.parse(
        localStorage.getItem("fynditCart") || "[]"
    );

    const count = cart.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    const cartCount = document.getElementById("cartCount");

    if (cartCount) {
        cartCount.textContent = count;
    }
}


function getConfirmationSession() {
    const savedSession = localStorage.getItem("fynditSession");

    if (!savedSession) {
        return null;
    }

    try {
        return JSON.parse(savedSession);
    } catch (error) {
        return null;
    }
}


function displayConfirmationMessage(message) {
    document.getElementById("confirmationMessage").textContent = message;
}


async function loadOrderConfirmation() {
    confirmationSession = getConfirmationSession();

    if (
        !confirmationSession ||
        confirmationSession.role !== "customer" ||
        !confirmationSession.idToken
    ) {
        window.location.href = "login.html?returnUrl=products.html";
        return;
    }

    const parameters = new URLSearchParams(window.location.search);
    const orderId = parameters.get("orderId");

    if (!orderId) {
        displayConfirmationMessage("No order ID was provided.");
        return;
    }

    document.getElementById("confirmationOrderId").textContent = orderId;

    try {
        const response = await fetch(
            `${FIRESTORE_BASE_URL}/orders/${encodeURIComponent(orderId)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${confirmationSession.idToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Unable to retrieve order details.");
        }

        const document = await response.json();

        const order = decodeConfirmationFields(document.fields || {});

        if (order.userId !== confirmationSession.userId) {
            throw new Error("You are not authorized to view this order.");
        }

        displayOrderConfirmation(order);

    } catch (error) {
        console.error("Order confirmation error:", error);

        displayConfirmationMessage(
            error.message || "Unable to load your order details."
        );
    }
}


function displayOrderConfirmation(order) {
    document.getElementById("confirmationOrderId").textContent =
        order.orderId || "-";

    const items = Array.isArray(order.items) ? order.items : [];

    const itemsContainer = document.getElementById("confirmationItems");

    if (items.length === 0) {
        itemsContainer.textContent = "No product details found.";
    } else {
        itemsContainer.innerHTML = items.map(item => `
            <div class="confirmation-item">
                <div>
                    <h3>${escapeConfirmationHTML(item.productName)}</h3>
                    <p>
                        ${escapeConfirmationHTML(item.category)}
                        · Quantity: ${Number(item.quantity || 0)}
                    </p>
                </div>

                <span>
                    ${formatConfirmationPrice(item.lineTotal)}
                </span>
            </div>
        `).join("");
    }

    document.getElementById("confirmationSubtotal").textContent =
        formatConfirmationPrice(order.subtotal);

    document.getElementById("confirmationTotal").textContent =
        formatConfirmationPrice(order.totalAmount);

    document.getElementById("confirmationPayment").textContent =
        order.paymentMethod || "-";

    document.getElementById("confirmationPaymentStatus").textContent =
        order.paymentStatus || "-";

    document.getElementById("confirmationStatus").textContent =
        order.orderStatus || "-";

    const address = order.deliveryAddress || {};

    const addressParts = [
        address.street,
        address.city,
        address.state,
        address.pincode,
        address.country
    ].filter(Boolean);

    document.getElementById("confirmationAddress").textContent =
        addressParts.join(", ") || "Address not available.";

    displayConfirmationMessage("");
}


document.addEventListener("DOMContentLoaded", function () {
    updateConfirmationCartCount();
    loadOrderConfirmation();
});
