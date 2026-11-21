
let myOrdersSession = null;


function decodeMyOrdersFields(fields) {
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
            result[key] = decodeMyOrdersFields(
                value.mapValue.fields || {}
            );
        } else if (value.arrayValue) {
            result[key] = (value.arrayValue.values || []).map(item => {
                if (item.mapValue) {
                    return decodeMyOrdersFields(
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


function escapeMyOrdersHTML(value) {
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


function formatMyOrdersPrice(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    });
}


function getMyOrdersSession() {
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


function updateMyOrdersCartCount() {
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


function formatMyOrderDate(dateValue) {
    if (!dateValue) {
        return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function getMyOrderStatusClass(status) {
    return String(status || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
}


function displayMyOrders(orders) {
    const container = document.getElementById("myOrdersContainer");
    const count = document.getElementById("myOrdersCount");

    count.textContent = `${orders.length} order(s)`;

    if (orders.length === 0) {
        container.innerHTML = `
            <p class="my-orders-message">
                You haven't placed any orders yet.
                Explore our collection to find something you love.
            </p>
        `;
        return;
    }

    container.innerHTML = orders.map(order => {
        const items = Array.isArray(order.items) ? order.items : [];

        const itemHTML = items.map(item => `
            <div class="my-order-item">
                <div>
                    <h4>${escapeMyOrdersHTML(item.productName)}</h4>
                    <p>
                        ${escapeMyOrdersHTML(item.category)}
                        · Quantity: ${Number(item.quantity || 0)}
                    </p>
                </div>

                <span>
                    ${formatMyOrdersPrice(item.lineTotal)}
                </span>
            </div>
        `).join("");

        const status = order.orderStatus || "Pending";
        const statusClass = getMyOrderStatusClass(status);

        return `
            <article class="my-order-card">

                <div class="my-order-card-header">

                    <div>
                        <div class="my-order-id">
                            ${escapeMyOrdersHTML(order.orderId)}
                        </div>

                        <p class="my-order-date">
                            ${formatMyOrderDate(order.createdAt)}
                        </p>
                    </div>

                    <span class="my-order-status ${statusClass}">
                        ${escapeMyOrdersHTML(status)}
                    </span>

                </div>

                <div class="my-order-items">
                    ${itemHTML || "No product details available."}
                </div>

                <div class="my-order-card-footer">

                    <span class="my-order-payment">
                        ${escapeMyOrdersHTML(order.paymentMethod)}
                    </span>

                    <span class="my-order-total">
                        Total: ${formatMyOrdersPrice(order.totalAmount)}
                    </span>

                </div>

            </article>
        `;
    }).join("");
}


async function loadMyOrders() {
    myOrdersSession = getMyOrdersSession();

    if (
        !myOrdersSession ||
        myOrdersSession.role !== "customer" ||
        !myOrdersSession.idToken
    ) {
        window.location.href = "login.html?returnUrl=products.html";
        return;
    }

    const container = document.getElementById("myOrdersContainer");

    try {
        const response = await fetch(
            `${FIRESTORE_BASE_URL}:runQuery`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${myOrdersSession.idToken}`
                },
                body: JSON.stringify({
                    structuredQuery: {
                        from: [
                            {
                                collectionId: "orders"
                            }
                        ],
                        where: {
                            fieldFilter: {
                                field: {
                                    fieldPath: "userId"
                                },
                                op: "EQUAL",
                                value: {
                                    stringValue: myOrdersSession.userId
                                }
                            }
                        }
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error("Unable to retrieve your orders.");
        }

        const results = await response.json();

        const orders = results
            .filter(result => result.document)
            .map(result => {
                return decodeMyOrdersFields(
                    result.document.fields || {}
                );
            })
            .filter(order => order.userId === myOrdersSession.userId);

        orders.sort((a, b) => {
            return new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0);
        });

        displayMyOrders(orders);

    } catch (error) {
        console.error("My Orders error:", error);

        container.innerHTML = `
            <p class="my-orders-message">
                Unable to load your orders.
                Please refresh the page and try again.
            </p>
        `;

        document.getElementById("myOrdersCount").textContent =
            "Unable to load";
    }
}


document.addEventListener("DOMContentLoaded", function () {
    updateMyOrdersCartCount();
    loadMyOrders();
});
