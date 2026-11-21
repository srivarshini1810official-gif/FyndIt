
const adminSalesSession = JSON.parse(
    localStorage.getItem("fynditSession")
);

function decodeSalesFields(fields) {
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
            result[key] = decodeSalesFields(value.mapValue.fields);
        } else if (value.arrayValue) {
            result[key] = (value.arrayValue.values || []).map(item => {
                if (item.mapValue) {
                    return decodeSalesFields(item.mapValue.fields);
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

async function verifySalesAdmin() {
    if (!adminSalesSession || !adminSalesSession.idToken) {
        window.location.href = "login.html";
        return false;
    }

    const response = await fetch(
        `${FIRESTORE_BASE_URL}/users/${adminSalesSession.userId}`,
        {
            headers: {
                Authorization: `Bearer ${adminSalesSession.idToken}`
            }
        }
    );

    if (!response.ok) {
        localStorage.removeItem("fynditSession");
        window.location.href = "login.html";
        return false;
    }

    const data = await response.json();
    const profile = decodeSalesFields(data.fields);

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

async function fetchSalesOrders() {
    let orders = [];
    let nextPageToken = null;

    do {
        let url = `${FIRESTORE_BASE_URL}/orders?pageSize=100`;

        if (nextPageToken) {
            url += `&pageToken=${encodeURIComponent(nextPageToken)}`;
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${adminSalesSession.idToken}`
            }
        });

        if (!response.ok) {
            throw new Error("Unable to retrieve sales orders.");
        }

        const data = await response.json();

        if (data.documents) {
            data.documents.forEach(document => {
                orders.push(decodeSalesFields(document.fields));
            });
        }

        nextPageToken = data.nextPageToken || null;

    } while (nextPageToken);

    return orders;
}

function formatSalesCurrency(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    });
}

function getSalesAmount(order) {
    return Number(
        order.totalAmount ??
        order.grandTotal ??
        order.total ??
        0
    );
}

function displaySalesSummary(orders) {
    const totalOrders = orders.length;

    const completedOrders = orders.filter(order =>
        ["Completed", "Delivered"].includes(order.orderStatus)
    );

    const pendingOrders = orders.filter(order =>
        order.orderStatus === "Pending"
    );

    const totalRevenue = completedOrders.reduce(
        (total, order) => total + getSalesAmount(order),
        0
    );

    document.getElementById("salesTotalRevenue").textContent =
        formatSalesCurrency(totalRevenue);

    document.getElementById("salesTotalOrders").textContent =
        totalOrders;

    document.getElementById("salesCompletedOrders").textContent =
        completedOrders.length;

    document.getElementById("salesPendingOrders").textContent =
        pendingOrders.length;

    displayOrderPerformance(orders);
}

function displayOrderPerformance(orders) {
    const statuses = [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Completed",
        "Cancelled"
    ];

    const tableBody = document.getElementById(
        "salesSummaryTableBody"
    );

    tableBody.innerHTML = statuses.map(status => {
        const matchingOrders = orders.filter(
            order => order.orderStatus === status
        );

        const count = matchingOrders.length;

        const revenue = matchingOrders.reduce(
            (total, order) => total + getSalesAmount(order),
            0
        );

        return `
            <tr>
                <td>${status}</td>
                <td>${count}</td>
                <td>${formatSalesCurrency(revenue)}</td>
            </tr>
        `;
    }).join("");
}

async function loadAdminSales() {
    const message = document.getElementById(
        "adminSalesMessage"
    );

    try {
        const isAdmin = await verifySalesAdmin();

        if (!isAdmin) {
            return;
        }

        const orders = await fetchSalesOrders();

        displaySalesSummary(orders);

    } catch (error) {
        console.error(error);
        message.textContent = error.message;
    }
}

document.getElementById("adminLogoutButton").addEventListener(
    "click",
    function() {
        localStorage.removeItem("fynditSession");
        window.location.href = "login.html";
    }
);

document.addEventListener("DOMContentLoaded", loadAdminSales);
