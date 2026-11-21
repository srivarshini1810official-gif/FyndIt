
// ==========================================
// FYNDIt - ADMIN CUSTOMER MANAGEMENT
// FIRESTORE REST API
// ==========================================

let customerAdminSession = null;
let adminCustomerRecords = [];


// ------------------------------------------
// FIRESTORE DATA CONVERSION
// ------------------------------------------

function decodeCustomerField(field) {

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

        Object.entries(field.mapValue.fields || {}).forEach(
            ([key, value]) => {
                result[key] = decodeCustomerField(value);
            }
        );

        return result;
    }

    if (field.arrayValue) {

        return (field.arrayValue.values || []).map(
            decodeCustomerField
        );
    }

    return null;
}


function decodeCustomerDocument(document) {

    const result = {};

    Object.entries(document.fields || {}).forEach(
        ([key, value]) => {
            result[key] = decodeCustomerField(value);
        }
    );

    return result;
}


// ------------------------------------------
// ADMIN SESSION
// ------------------------------------------

function getCustomerAdminSession() {

    try {

        return JSON.parse(
            localStorage.getItem("fynditSession")
        );

    } catch (error) {

        return null;

    }
}


function showCustomerMessage(message, isError = false) {

    const element =
        document.getElementById("adminCustomersMessage");

    element.textContent = message;

    element.style.color = isError ? "#B42318" : "#267A45";
}


// ------------------------------------------
// FIRESTORE COLLECTION RETRIEVAL
// ------------------------------------------

async function getAdminCustomers() {

    let customers = [];
    let nextPageToken = "";

    do {

        let url =
            `${FIRESTORE_BASE_URL}/users?pageSize=100`;

        if (nextPageToken) {

            url += `&pageToken=${encodeURIComponent(nextPageToken)}`;

        }

        const response = await fetch(url, {

            method: "GET",

            headers: {

                Authorization:
                    `Bearer ${customerAdminSession.idToken}`

            }

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.error?.message ||
                "Unable to retrieve customer information."
            );

        }

        const documents = result.documents || [];

        documents.forEach(document => {

            const customer = decodeCustomerDocument(document);

            customer.documentId =
                document.name.split("/").pop();

            // Include only customer accounts
            if (customer.role === "customer") {

                customers.push(customer);

            }

        });

        nextPageToken = result.nextPageToken || "";

    } while (nextPageToken);

    return customers;

}


// ------------------------------------------
// HTML ESCAPING
// ------------------------------------------

function escapeCustomerHTML(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]
    );
}


// ------------------------------------------
// DISPLAY CUSTOMER TABLE
// ------------------------------------------

function displayAdminCustomers(searchTerm = "") {

    const tableBody =
        document.getElementById("adminCustomersTableBody");

    const search = searchTerm.toLowerCase().trim();

    const filteredCustomers = adminCustomerRecords.filter(
        customer => {

            const name =
                String(customer.name || "").toLowerCase();

            const email =
                String(customer.email || "").toLowerCase();

            const phone =
                String(customer.phone || "").toLowerCase();

            const customerId =
                String(customer.userId || customer.documentId || "")
                    .toLowerCase();

            return name.includes(search) ||
                   email.includes(search) ||
                   phone.includes(search) ||
                   customerId.includes(search);

        }
    );


    document.getElementById("adminCustomerCount").textContent =
        `${filteredCustomers.length} of ${adminCustomerRecords.length} customers`;


    if (filteredCustomers.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No customers found.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML = filteredCustomers.map(customer => {

        const customerId =
            customer.userId || customer.documentId;

        const name =
            customer.name || "-";

        const email =
            customer.email || "-";

        const phone =
            customer.phone || "-";

        const status =
            String(customer.status || "active").toLowerCase();


        return `

            <tr>

                <td>
                    ${escapeCustomerHTML(customerId)}
                </td>

                <td>
                    ${escapeCustomerHTML(name)}
                </td>

                <td>
                    ${escapeCustomerHTML(email)}
                </td>

                <td>
                    ${escapeCustomerHTML(phone)}
                </td>

                <td>

                    <span class="${
                        status === "active"
                            ? "admin-status-active"
                            : "admin-status-inactive"
                    }">

                        ${escapeCustomerHTML(status)}

                    </span>

                </td>

                <td>

                    <button
                        class="admin-customer-view-button"
                        data-customer-id="${escapeCustomerHTML(customer.documentId)}"
                    >

                        View Details

                    </button>

                </td>

            </tr>

        `;

    }).join("");

}


// ------------------------------------------
// CUSTOMER DELIVERY ADDRESS
// ------------------------------------------

function formatCustomerAddress(address) {

    if (!address) return "No delivery address available.";

    if (typeof address === "string") {
        return address;
    }

    if (typeof address === "object") {

        const addressParts = [

            address.street,
            address.addressLine,
            address.city,
            address.state,
            address.pincode,
            address.postalCode,
            address.country

        ];

        const formattedAddress = addressParts
            .filter(Boolean)
            .join(", ");

        return formattedAddress || "No delivery address available.";

    }

    return "No delivery address available.";

}


// ------------------------------------------
// VIEW CUSTOMER DETAILS
// ------------------------------------------

function viewCustomerDetails(customerDocumentId) {

    const customer = adminCustomerRecords.find(
        item => item.documentId === customerDocumentId
    );

    if (!customer) return;


    const address =
        formatCustomerAddress(customer.address);


    document.getElementById("detailCustomerName").textContent =
        customer.name || "-";

    document.getElementById("detailCustomerEmail").textContent =
        customer.email || "-";

    document.getElementById("detailCustomerPhone").textContent =
        customer.phone || "-";

    document.getElementById("detailCustomerAddress").textContent =
        address;

    document.getElementById("detailCustomerStatus").textContent =
        customer.status || "active";


    document.getElementById("customerModal").style.display =
        "block";

}


// ------------------------------------------
// CLOSE CUSTOMER DETAILS
// ------------------------------------------

function closeCustomerModal() {

    document.getElementById("customerModal").style.display =
        "none";

}


// ------------------------------------------
// LOAD CUSTOMER DATA
// ------------------------------------------

async function loadAdminCustomerRecords() {

    const tableBody =
        document.getElementById("adminCustomersTableBody");

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;">
                Loading customers...
            </td>
        </tr>
    `;

    try {

        adminCustomerRecords = await getAdminCustomers();

        displayAdminCustomers(
            document.getElementById("adminCustomerSearch").value
        );

        showCustomerMessage(
            "Customer information loaded successfully."
        );

    } catch (error) {

        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    Unable to load customers.
                </td>
            </tr>
        `;

        showCustomerMessage(error.message, true);

    }

}


// ------------------------------------------
// INITIALIZE CUSTOMERS PAGE
// ------------------------------------------

document.addEventListener("DOMContentLoaded", async function () {

    customerAdminSession = getCustomerAdminSession();


    if (
        !customerAdminSession ||
        customerAdminSession.role !== "admin" ||
        !customerAdminSession.idToken
    ) {

        window.location.href =
            "login.html?returnUrl=admin-customers.html";

        return;

    }


    try {

        // Verify administrator profile
        const response = await fetch(

            `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(customerAdminSession.userId)}`,

            {

                headers: {

                    Authorization:
                        `Bearer ${customerAdminSession.idToken}`

                }

            }

        );


        if (!response.ok) {

            throw new Error(
                "Administrator verification failed."
            );

        }


        const profile = decodeCustomerDocument(
            await response.json()
        );


        if (
            profile.role !== "admin" ||
            profile.status !== "active"
        ) {

            throw new Error(
                "Administrator access denied."
            );

        }


        // Load customers
        await loadAdminCustomerRecords();


        // Customer search
        document.getElementById("adminCustomerSearch")
            .addEventListener("input", function () {

                displayAdminCustomers(this.value);

            });


        // View customer details
        document.getElementById("adminCustomersTableBody")
            .addEventListener("click", function (event) {

                const button = event.target.closest(
                    "button[data-customer-id]"
                );

                if (!button) return;

                viewCustomerDetails(
                    button.dataset.customerId
                );

            });


        // Close details modal
        document.getElementById("closeCustomerModal")
            .addEventListener("click", closeCustomerModal);

        document.getElementById("closeCustomerDetailsButton")
            .addEventListener("click", closeCustomerModal);


        // Close modal by clicking outside
        document.getElementById("customerModal")
            .addEventListener("click", function (event) {

                if (event.target === this) {
                    closeCustomerModal();
                }

            });


        // Logout
        document.getElementById("adminLogoutButton")
            .addEventListener("click", function () {

                localStorage.removeItem("fynditSession");

                window.location.href = "login.html";

            });


    } catch (error) {

        console.error(error);

        showCustomerMessage(error.message, true);

        localStorage.removeItem("fynditSession");

        setTimeout(function () {

            window.location.href = "login.html";

        }, 2000);

    }

});
