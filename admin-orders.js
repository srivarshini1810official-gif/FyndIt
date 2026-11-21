
const adminOrderSession = JSON.parse(
    localStorage.getItem("fynditSession")
);

let allAdminOrders = [];

const adminOrderStatuses = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
];

function decodeOrderFields(fields) {
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
            result[key] = decodeOrderFields(value.mapValue.fields);
        } else if (value.arrayValue) {
            result[key] = (value.arrayValue.values || []).map(item => {
                if (item.mapValue) {
                    return decodeOrderFields(item.mapValue.fields);
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

function encodeFirestoreString(value) {
    return {
        stringValue: String(value)
    };
}

async function verifyAdminOrderSession() {
    if (!adminOrderSession || !adminOrderSession.idToken) {
        window.location.href = "login.html";
        return false;
    }

    const response = await fetch(
        `${FIRESTORE_BASE_URL}/users/${adminOrderSession.userId}`,
        {
            headers: {
                Authorization: `Bearer ${adminOrderSession.idToken}`
            }
        }
    );

    if (!response.ok) {
        localStorage.removeItem("fynditSession");
        window.location.href = "login.html";
        return false;
    }

    const data = await response.json();
    const profile = decodeOrderFields(data.fields);

    if (
        profile.role !== "admin" ||
        profile.status !== "active"
    ) {
        localStorage.removeItem("fynditSession");
        window.location.href = "login.html";
        return false;
    }

    return true;
}

async function fetchAllAdminOrders() {
    let orders = [];
    let nextPageToken = null;

    do {
        let url = `${FIRESTORE_BASE_URL}/orders?pageSize=100`;

        if (nextPageToken) {
            url += `&pageToken=${encodeURIComponent(nextPageToken)}`;
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${adminOrderSession.idToken}`
            }
        });

        if (!response.ok) {
            throw new Error("Unable to retrieve orders from Firestore.");
        }

        const data = await response.json();

        if (data.documents) {
            data.documents.forEach(document => {
                const order = decodeOrderFields(document.fields);

                order.documentId = document.name.split("/").pop();
                orders.push(order);
            });
        }

        nextPageToken = data.nextPageToken || null;

    } while (nextPageToken);

    return orders;
}

function formatOrderAmount(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    });
}

function formatOrderDate(dateValue) {
    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-IN");
}

function getOrderItemCount(items) {
    if (!Array.isArray(items)) {
        return 0;
    }

    return items.reduce((total, item) => {
        return total + Number(item.quantity || 0);
    }, 0);
}

function escapeOrderHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function getOrderStatusClass(status) {
    return String(status || "Pending").toLowerCase();
}

function renderAdminOrders(orders) {
    const tableBody = document.getElementById(
        "adminOrdersTableBody"
    );

    const countElement = document.getElementById(
        "adminOrderCount"
    );

    countElement.textContent = `${orders.length} orders found`;

    if (orders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:35px;">
                    No orders found.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = orders.map(order => {
        const orderId = order.documentId;
        const customerName = order.customerName || "Customer";
        const orderDate = formatOrderDate(
            order.createdAt || order.orderDate
        );

        const itemCount = getOrderItemCount(order.items);

        const amount = order.totalAmount ??
            order.grandTotal ??
            order.total ??
            0;

        const paymentMethod = order.paymentMethod || "-";
        const status = order.orderStatus || "Pending";

        const statusOptions = adminOrderStatuses.map(option => `
            <option value="${option}"
                ${status === option ? "selected" : ""}>
                ${option}
            </option>
        `).join("");

        return `
            <tr>
                <td>${escapeOrderHTML(orderId)}</td>

                <td>${escapeOrderHTML(customerName)}</td>

                <td>${escapeOrderHTML(orderDate)}</td>

                <td>${itemCount}</td>

                <td>${formatOrderAmount(amount)}</td>

                <td>${escapeOrderHTML(paymentMethod)}</td>

                <td>
                    <span class="admin-order-status ${getOrderStatusClass(status)}">
                        ${escapeOrderHTML(status)}
                    </span>
                </td>

                <td>
                    <select
                        class="admin-order-status-select"
                        data-order-id="${escapeOrderHTML(orderId)}"
                    >
                        ${statusOptions}
                    </select>

                    <button
                        class="admin-order-action"
                        data-order-id="${escapeOrderHTML(orderId)}"
                    >
                        Update
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    attachOrderUpdateEvents();
}

function searchAdminOrders() {
    const searchValue = document.getElementById(
        "adminOrderSearch"
    ).value.toLowerCase().trim();

    const filteredOrders = allAdminOrders.filter(order => {
        const orderId = String(order.documentId || "").toLowerCase();
        const customerName = String(order.customerName || "").toLowerCase();
        const customerEmail = String(order.customerEmail || "").toLowerCase();

        return orderId.includes(searchValue) ||
            customerName.includes(searchValue) ||
            customerEmail.includes(searchValue);
    });

    renderAdminOrders(filteredOrders);
}

function attachOrderUpdateEvents() {
    document.querySelectorAll(".admin-order-action").forEach(button => {
        button.addEventListener("click", async function() {
            const orderId = this.dataset.orderId;

            const statusSelect = document.querySelector(
                `.admin-order-status-select[data-order-id="${CSS.escape(orderId)}"]`
            );

            const newStatus = statusSelect.value;

            await updateAdminOrderStatus(orderId, newStatus);
        });
    });
}

async function updateAdminOrderStatus(orderId, newStatus) {
    if (!adminOrderStatuses.includes(newStatus)) {
        alert("Invalid order status.");
        return;
    }

    const order = allAdminOrders.find(
        item => item.documentId === orderId
    );

    if (!order) {
        alert("Order not found.");
        return;
    }

    const updateConfirmed = confirm(
        `Change order status to ${newStatus}?`
    );

    if (!updateConfirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${FIRESTORE_BASE_URL}/orders/${encodeURIComponent(orderId)}?updateMask.fieldPaths=orderStatus`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${adminOrderSession.idToken}`
                },
                body: JSON.stringify({
                    fields: {
                        orderStatus: encodeFirestoreString(newStatus)
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error("Unable to update the order status.");
        }

        order.orderStatus = newStatus;

        renderAdminOrders(
            allAdminOrders.filter(item => {
                const searchValue = document.getElementById(
                    "adminOrderSearch"
                ).value.toLowerCase().trim();

                return String(item.documentId).toLowerCase().includes(searchValue) ||
                    String(item.customerName || "").toLowerCase().includes(searchValue) ||
                    String(item.customerEmail || "").toLowerCase().includes(searchValue);
            })
        );

        alert("Order status updated successfully!");

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

async function loadAdminOrders() {
    const message = document.getElementById(
        "adminOrdersMessage"
    );

    try {
        const isAdmin = await verifyAdminOrderSession();

        if (!isAdmin) {
            return;
        }

        allAdminOrders = await fetchAllAdminOrders();

        renderAdminOrders(allAdminOrders);

    } catch (error) {
        console.error(error);
        message.textContent = error.message;
    }
}

document.getElementById("adminOrderSearch").addEventListener(
    "input",
    searchAdminOrders
);

document.getElementById("adminLogoutButton").addEventListener(
    "click",
    function() {
        localStorage.removeItem("fynditSession");
        window.location.href = "login.html";
    }
);

document.addEventListener("DOMContentLoaded", loadAdminOrders);
