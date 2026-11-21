
// ==========================================
// FYNDIt - ADMIN DASHBOARD
// FIRESTORE REST API
// ==========================================


// Read the saved administrator session
function getAdminSession() {

    try {

        const savedSession =
            localStorage.getItem("fynditSession");

        return savedSession ? JSON.parse(savedSession) : null;

    } catch (error) {

        console.error("Session error:", error);

        return null;

    }

}


// Convert Firestore REST values into JavaScript values
function getFirestoreValue(field) {

    if (!field) return null;

    if (field.stringValue !== undefined) {
        return field.stringValue;
    }

    if (field.integerValue !== undefined) {
        return Number(field.integerValue);
    }

    if (field.doubleValue !== undefined) {
        return Number(field.doubleValue);
    }

    if (field.booleanValue !== undefined) {
        return field.booleanValue;
    }

    if (field.mapValue) {

        const result = {};

        const fields = field.mapValue.fields || {};

        Object.keys(fields).forEach(function (key) {
            result[key] = getFirestoreValue(fields[key]);
        });

        return result;

    }

    if (field.arrayValue) {

        return (field.arrayValue.values || []).map(
            getFirestoreValue
        );

    }

    return null;

}


// Convert a complete Firestore document into a JavaScript object
function convertAdminDocument(document) {

    const result = {};

    const fields = document.fields || {};

    Object.keys(fields).forEach(function (key) {

        result[key] = getFirestoreValue(fields[key]);

    });

    return result;

}


// Retrieve all documents from a Firestore collection
async function getAdminCollection(collectionName, idToken) {

    let documents = [];
    let nextPageToken = "";

    do {

        let url =
            `${FIRESTORE_BASE_URL}/${collectionName}?pageSize=100`;

        if (nextPageToken) {

            url += `&pageToken=${encodeURIComponent(nextPageToken)}`;

        }

        const response = await fetch(url, {

            method: "GET",

            headers: {
                "Authorization": `Bearer ${idToken}`
            }

        });

        const result = await response.json();

        if (!response.ok) {

            console.error(
                `Unable to load ${collectionName}:`,
                result
            );

            throw new Error(
                `Unable to load ${collectionName} from Firestore.`
            );

        }

        const collectionDocuments = result.documents || [];

        documents = documents.concat(
            collectionDocuments.map(convertAdminDocument)
        );

        nextPageToken = result.nextPageToken || "";

    } while (nextPageToken);

    return documents;

}


// Verify the logged-in administrator using Firestore
async function verifyAdminSession(session) {

    if (!session || !session.userId || !session.idToken) {

        throw new Error("Please sign in as an administrator.");

    }

    const profileURL =
        `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(session.userId)}`;

    const response = await fetch(profileURL, {

        method: "GET",

        headers: {
            "Authorization": `Bearer ${session.idToken}`
        }

    });

    const result = await response.json();

    if (!response.ok) {

        throw new Error(
            "Unable to verify administrator permissions. Please sign in again."
        );

    }

    const profile = convertAdminDocument(result);

    if (
        profile.role !== "admin" ||
        profile.status !== "active"
    ) {

        throw new Error(
            "Access denied. This page is only for active administrators."
        );

    }

    return profile;

}


// Format sales in Indian Rupees
function formatAdminCurrency(amount) {

    return Number(amount).toLocaleString("en-IN", {

        style: "currency",

        currency: "INR",

        maximumFractionDigits: 2

    });

}


// Read an order amount from supported field names
function getOrderAmount(order) {

    const possibleFields = [
        "totalAmount",
        "grandTotal",
        "total"
    ];

    for (const field of possibleFields) {

        if (order[field] !== undefined && order[field] !== null) {

            const amount = Number(order[field]);

            if (Number.isFinite(amount)) {
                return amount;
            }

        }

    }

    return 0;

}


// Display dashboard statistics
async function loadAdminDashboard(session) {

    const message =
        document.getElementById("adminDashboardMessage");

    try {

        message.textContent = "Loading store information...";


        // Retrieve products, users and orders
        const [products, users, orders] = await Promise.all([

            getAdminCollection("products", session.idToken),

            getAdminCollection("users", session.idToken),

            getAdminCollection("orders", session.idToken)

        ]);


        // Count customers, excluding the administrator
        const customers = users.filter(function (user) {

            return user.role === "customer";

        });


        // Include only delivered or completed orders in sales
        const completedOrders = orders.filter(function (order) {

            const status = String(
                order.orderStatus || ""
            ).toLowerCase();

            return status === "delivered" ||
                   status === "completed";

        });


        // Calculate total sales
        const totalSales = completedOrders.reduce(
            function (total, order) {

                return total + getOrderAmount(order);

            },
            0
        );


        // Display statistics
        document.getElementById("totalProducts").textContent =
            products.length;

        document.getElementById("totalCustomers").textContent =
            customers.length;

        document.getElementById("totalOrders").textContent =
            orders.length;

        document.getElementById("totalSales").textContent =
            formatAdminCurrency(totalSales);


        message.textContent = "Dashboard information loaded successfully.";

        message.style.color = "#267A45";

    } catch (error) {

        console.error("Dashboard loading error:", error);

        message.textContent = error.message;

        message.style.color = "#B42318";

    }

}


// Administrator logout
function adminLogout() {

    localStorage.removeItem("fynditSession");

    window.location.href = "login.html";

}


// Start the administrator dashboard
document.addEventListener("DOMContentLoaded", async function () {

    const session = getAdminSession();

    const message =
        document.getElementById("adminDashboardMessage");

    const logoutButton =
        document.getElementById("adminLogoutButton");


    logoutButton.addEventListener("click", adminLogout);


    try {

        message.textContent = "Verifying administrator account...";

        const profile = await verifyAdminSession(session);


        // Display administrator name
        document.getElementById("adminWelcome").textContent =
            `Welcome, ${profile.name || "Admin"}`;


        // Load dashboard statistics
        await loadAdminDashboard(session);

    } catch (error) {

        console.error("Admin verification error:", error);

        message.textContent = error.message;

        message.style.color = "#B42318";


        // Do not allow an unverified session to remain on this page
        localStorage.removeItem("fynditSession");

        setTimeout(function () {

            window.location.href = "login.html";

        }, 2000);

    }

});
