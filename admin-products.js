
// ==========================================
// FYNDIt - ADMIN PRODUCT MANAGEMENT
// FIRESTORE REST API
// ==========================================

let adminProductSession = null;
let adminProducts = [];
let adminCategories = [];


// ------------------------------------------
// FIRESTORE VALUE CONVERSION
// ------------------------------------------

function decodeProductField(field) {

    if (!field) return null;

    if (field.stringValue !== undefined) return field.stringValue;
    if (field.integerValue !== undefined) return Number(field.integerValue);
    if (field.doubleValue !== undefined) return Number(field.doubleValue);
    if (field.booleanValue !== undefined) return field.booleanValue;

    if (field.mapValue) {

        const result = {};

        Object.entries(field.mapValue.fields || {}).forEach(
            ([key, value]) => {
                result[key] = decodeProductField(value);
            }
        );

        return result;
    }

    if (field.arrayValue) {

        return (field.arrayValue.values || []).map(
            decodeProductField
        );
    }

    return null;
}


function decodeProductDocument(document) {

    const result = {};

    Object.entries(document.fields || {}).forEach(
        ([key, value]) => {
            result[key] = decodeProductField(value);
        }
    );

    return result;
}


function encodeProductField(value) {

    if (value === null || value === undefined) {
        return { nullValue: null };
    }

    if (typeof value === "string") {
        return { stringValue: value };
    }

    if (typeof value === "boolean") {
        return { booleanValue: value };
    }

    if (typeof value === "number") {

        if (Number.isInteger(value)) {
            return { integerValue: String(value) };
        }

        return { doubleValue: value };
    }

    if (Array.isArray(value)) {

        return {
            arrayValue: {
                values: value.map(encodeProductField)
            }
        };
    }

    if (typeof value === "object") {

        const fields = {};

        Object.entries(value).forEach(([key, item]) => {
            fields[key] = encodeProductField(item);
        });

        return {
            mapValue: { fields }
        };
    }

    return { nullValue: null };
}


function encodeProductDocument(product) {

    const fields = {};

    Object.entries(product).forEach(([key, value]) => {

        fields[key] = encodeProductField(value);

    });

    return { fields };
}


// ------------------------------------------
// ADMIN SESSION
// ------------------------------------------

function getProductAdminSession() {

    try {

        return JSON.parse(
            localStorage.getItem("fynditSession")
        );

    } catch (error) {

        return null;

    }
}


function showProductMessage(message, isError = false) {

    const element =
        document.getElementById("adminProductsMessage");

    element.textContent = message;

    element.style.color = isError ? "#B42318" : "#267A45";
}


// ------------------------------------------
// FIRESTORE REQUESTS
// ------------------------------------------

async function getProductCollection(collectionName) {

    const response = await fetch(
        `${FIRESTORE_BASE_URL}/${collectionName}?pageSize=100`,
        {
            headers: {
                Authorization:
                    `Bearer ${adminProductSession.idToken}`
            }
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error?.message ||
            `Unable to load ${collectionName}.`
        );
    }

    let documents = (result.documents || []).map(document => ({
        documentId: document.name.split("/").pop(),
        ...decodeProductDocument(document)
    }));

    let nextPageToken = result.nextPageToken;

    while (nextPageToken) {

        const nextResponse = await fetch(
            `${FIRESTORE_BASE_URL}/${collectionName}?pageSize=100&pageToken=${encodeURIComponent(nextPageToken)}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${adminProductSession.idToken}`
                }
            }
        );

        const nextResult = await nextResponse.json();

        if (!nextResponse.ok) {
            throw new Error(
                nextResult.error?.message ||
                `Unable to load ${collectionName}.`
            );
        }

        documents = documents.concat(
            (nextResult.documents || []).map(document => ({
                documentId: document.name.split("/").pop(),
                ...decodeProductDocument(document)
            }))
        );

        nextPageToken = nextResult.nextPageToken;
    }

    return documents;
}


// ------------------------------------------
// CATEGORY DROPDOWN
// ------------------------------------------

function getCategoryName(category) {

    return category.categoryName ||
           category.name ||
           category.category ||
           category.categoryId ||
           category.documentId;
}


function populateCategoryDropdown() {

    const dropdown =
        document.getElementById("adminProductCategory");

    dropdown.innerHTML =
        '<option value="">Select Category</option>';

    adminCategories.forEach(category => {

        const name = getCategoryName(category);

        const option = document.createElement("option");

        option.value = name;
        option.textContent = name;

        dropdown.appendChild(option);

    });
}


// ------------------------------------------
// DISPLAY PRODUCTS
// ------------------------------------------

function escapeProductHTML(value) {

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


function displayAdminProducts(searchTerm = "") {

    const tableBody =
        document.getElementById("adminProductsTableBody");

    const search = searchTerm.toLowerCase().trim();

    const filteredProducts = adminProducts.filter(product => {

        const name = String(product.name || "").toLowerCase();
        const id = String(product.productId || product.documentId || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();

        return name.includes(search) ||
               id.includes(search) ||
               category.includes(search);

    });

    document.getElementById("adminProductCount").textContent =
        `${filteredProducts.length} of ${adminProducts.length} products`;


    if (filteredProducts.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML = filteredProducts.map(product => {

        const id = product.documentId;

        const productId =
            product.productId || id;

        const category =
            product.category || product.categoryName || "-";

        const price = Number(product.price || 0);

        const stock = Number(product.stock || 0);

        const status =
            String(product.status || "active").toLowerCase();

        return `
            <tr>

                <td>${escapeProductHTML(productId)}</td>

                <td>${escapeProductHTML(product.name || "-")}</td>

                <td>${escapeProductHTML(category)}</td>

                <td>₹${price.toLocaleString("en-IN")}</td>

                <td>${stock}</td>

                <td>
                    <span class="${
                        status === "active"
                            ? "admin-status-active"
                            : "admin-status-inactive"
                    }">
                        ${escapeProductHTML(status)}
                    </span>
                </td>

                <td>

                    <button
                        class="admin-product-action admin-edit-button"
                        data-action="edit"
                        data-id="${escapeProductHTML(id)}"
                    >
                        Edit
                    </button>

                    <button
                        class="admin-product-action admin-delete-button"
                        data-action="delete"
                        data-id="${escapeProductHTML(id)}"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");

}


// ------------------------------------------
// PRODUCT MODAL
// ------------------------------------------

function openProductModal(product = null) {

    const modal =
        document.getElementById("productModal");

    const form =
        document.getElementById("adminProductForm");

    form.reset();

    document.getElementById("adminProductId").value = "";

    if (product) {

        document.getElementById("productModalTitle").textContent =
            "Edit Product";

        document.getElementById("adminProductId").value =
            product.documentId;

        document.getElementById("adminProductName").value =
            product.name || "";

        document.getElementById("adminProductCategory").value =
            product.category || product.categoryName || "";

        document.getElementById("adminProductPrice").value =
            product.price || "";

        document.getElementById("adminProductStock").value =
            product.stock ?? 0;

        document.getElementById("adminProductDescription").value =
            product.description || "";

        document.getElementById("adminProductImage").value =
            product.imageUrl || "";

        document.getElementById("adminProductStatus").value =
            product.status || "active";

    } else {

        document.getElementById("productModalTitle").textContent =
            "Add New Product";

    }

    modal.style.display = "block";

}


function closeProductModal() {

    document.getElementById("productModal").style.display =
        "none";

}


// ------------------------------------------
// ADD OR UPDATE PRODUCT
// ------------------------------------------

async function saveAdminProduct(event) {

    event.preventDefault();

    const saveButton =
        document.getElementById("saveProductButton");

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {

        const existingId =
            document.getElementById("adminProductId").value;

        const name =
            document.getElementById("adminProductName").value.trim();

        const category =
            document.getElementById("adminProductCategory").value;

        const price =
            Number(document.getElementById("adminProductPrice").value);

        const stock =
            Number(document.getElementById("adminProductStock").value);

        const description =
            document.getElementById("adminProductDescription").value.trim();

        const imageUrl =
            document.getElementById("adminProductImage").value.trim();

        const status =
            document.getElementById("adminProductStatus").value;


        if (
            !name ||
            !category ||
            !description ||
            !Number.isFinite(price) ||
            price <= 0 ||
            !Number.isInteger(stock) ||
            stock < 0
        ) {

            throw new Error("Please enter valid product details.");

        }


        let documentId = existingId;

        let productId = "";


        if (existingId) {

            const existingProduct = adminProducts.find(
                product => product.documentId === existingId
            );

            if (!existingProduct) {
                throw new Error("Product not found.");
            }

            productId = existingProduct.productId || existingId;

        } else {

            // Generate a unique product ID
            productId = "PRD" + Date.now();

            documentId = productId;

        }


        const productData = {

            ...(existingId
                ? adminProducts.find(
                    product => product.documentId === existingId
                )
                : {}),

            productId: productId,

            name: name,

            category: category,

            price: price,

            stock: stock,

            description: description,

            imageUrl: imageUrl,

            status: status,

            updatedAt: new Date().toISOString()

        };


        if (!existingId) {

            productData.createdAt = new Date().toISOString();

        }


        const documentURL =
            `${FIRESTORE_BASE_URL}/products/${encodeURIComponent(documentId)}`;

        const response = await fetch(documentURL, {

            method: "PATCH",

            headers: {
                "Content-Type": "application/json",
                Authorization:
                    `Bearer ${adminProductSession.idToken}`
            },

            body: JSON.stringify(
                encodeProductDocument(productData)
            )

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.error?.message ||
                "Unable to save product."
            );

        }


        showProductMessage(
            existingId
                ? "Product updated successfully!"
                : "New product added successfully!"
        );

        closeProductModal();

        await loadAdminProducts();

    } catch (error) {

        console.error(error);

        showProductMessage(error.message, true);

    } finally {

        saveButton.disabled = false;
        saveButton.textContent = "Save Product";

    }

}


// ------------------------------------------
// DELETE PRODUCT
// ------------------------------------------

async function deleteAdminProduct(productDocumentId) {

    const product = adminProducts.find(
        item => item.documentId === productDocumentId
    );

    if (!product) return;

    const confirmed = confirm(
        `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;


    try {

        const response = await fetch(
            `${FIRESTORE_BASE_URL}/products/${encodeURIComponent(productDocumentId)}`,
            {

                method: "DELETE",

                headers: {
                    Authorization:
                        `Bearer ${adminProductSession.idToken}`
                }

            }
        );

        if (!response.ok) {

            const result = await response.json();

            throw new Error(
                result.error?.message ||
                "Unable to delete product."
            );

        }


        showProductMessage("Product deleted successfully!");

        await loadAdminProducts();

    } catch (error) {

        console.error(error);

        showProductMessage(error.message, true);

    }

}


// ------------------------------------------
// LOAD PRODUCTS AND CATEGORIES
// ------------------------------------------

async function loadAdminProducts() {

    const tableBody =
        document.getElementById("adminProductsTableBody");

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;">
                Loading products...
            </td>
        </tr>
    `;

    try {

        const [products, categories] = await Promise.all([

            getProductCollection("products"),

            getProductCollection("categories")

        ]);

        adminProducts = products;
        adminCategories = categories;

        populateCategoryDropdown();

        displayAdminProducts(
            document.getElementById("adminProductSearch").value
        );

    } catch (error) {

        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    Unable to load products.
                </td>
            </tr>
        `;

        showProductMessage(error.message, true);

    }

}


// ------------------------------------------
// INITIALIZE ADMIN PRODUCTS PAGE
// ------------------------------------------

document.addEventListener("DOMContentLoaded", async function () {

    adminProductSession = getProductAdminSession();


    if (
        !adminProductSession ||
        adminProductSession.role !== "admin" ||
        !adminProductSession.idToken
    ) {

        window.location.href =
            "login.html?returnUrl=admin-products.html";

        return;

    }


    try {

        // Verify administrator profile
        const response = await fetch(
            `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(adminProductSession.userId)}`,
            {

                headers: {
                    Authorization:
                        `Bearer ${adminProductSession.idToken}`
                }

            }
        );

        if (!response.ok) {

            throw new Error("Administrator verification failed.");

        }

        const profile = decodeProductDocument(
            await response.json()
        );

        if (
            profile.role !== "admin" ||
            profile.status !== "active"
        ) {

            throw new Error("Administrator access denied.");

        }


        // Load the product collection
        await loadAdminProducts();


        // Search products
        document.getElementById("adminProductSearch")
            .addEventListener("input", function () {

                displayAdminProducts(this.value);

            });


        // Open add product form
        document.getElementById("addProductButton")
            .addEventListener("click", function () {

                openProductModal();

            });


        // Close modal
        document.getElementById("closeProductModal")
            .addEventListener("click", closeProductModal);

        document.getElementById("cancelProductButton")
            .addEventListener("click", closeProductModal);


        // Save product
        document.getElementById("adminProductForm")
            .addEventListener("submit", saveAdminProduct);


        // Edit and delete product actions
        document.getElementById("adminProductsTableBody")
            .addEventListener("click", function (event) {

                const button = event.target.closest("button[data-action]");

                if (!button) return;

                const productId = button.dataset.id;

                if (button.dataset.action === "edit") {

                    const product = adminProducts.find(
                        item => item.documentId === productId
                    );

                    if (product) openProductModal(product);

                }

                if (button.dataset.action === "delete") {

                    deleteAdminProduct(productId);

                }

            });


        // Logout
        document.getElementById("adminLogoutButton")
            .addEventListener("click", function () {

                localStorage.removeItem("fynditSession");

                window.location.href = "login.html";

            });


        // Close modal when clicking outside
        document.getElementById("productModal")
            .addEventListener("click", function (event) {

                if (event.target === this) {
                    closeProductModal();
                }

            });


    } catch (error) {

        console.error(error);

        showProductMessage(error.message, true);

        localStorage.removeItem("fynditSession");

        setTimeout(function () {

            window.location.href = "login.html";

        }, 2000);

    }

});
