
// ==========================================
// FYNDIt - HOMEPAGE DATABASE CONNECTION
// Uses jQuery AJAX + Firestore REST API
// ==========================================

// Convert Firestore document fields into normal JavaScript values
function convertFirestoreDocument(document) {
    const fields = document.fields || {};
    const result = {};

    for (const key in fields) {
        const field = fields[key];

        if (field.stringValue !== undefined) {
            result[key] = field.stringValue;
        } else if (field.integerValue !== undefined) {
            result[key] = Number(field.integerValue);
        } else if (field.doubleValue !== undefined) {
            result[key] = Number(field.doubleValue);
        } else if (field.booleanValue !== undefined) {
            result[key] = field.booleanValue;
        } else {
            result[key] = "";
        }
    }

    return result;
}


// Fetch all documents from a Firestore collection
function fetchCollection(collectionName) {
    return $.ajax({
        url: `${FIRESTORE_BASE_URL}/${collectionName}`,
        method: "GET",
        dataType: "json"
    });
}


// Load and display categories
function loadCategories() {
    fetchCollection("categories")
        .done(function (response) {
            const categories = response.documents || [];

            let html = "";

            categories.forEach(function (document) {
                const category = convertFirestoreDocument(document);

                if (category.status !== "active") return;

                html += `
                    <a class="category-card"
                       href="products.html?category=${encodeURIComponent(category.name)}">
                        <div class="category-icon">
                            ${category.name}
                        </div>
                        <h3>${category.name}</h3>
                        <p>${category.description || "Explore products"}</p>
                    </a>
                `;
            });

            $("#categoryGrid").html(
                html || "<p>No categories available.</p>"
            );
        })
        .fail(function (error) {
            console.error("Category loading failed:", error);
            $("#categoryGrid").html(
                "<p>Unable to load categories. Please refresh the page.</p>"
            );
        });
}


// Load and display featured products
function loadProducts() {
    fetchCollection("products")
        .done(function (response) {
            const products = response.documents || [];

            let html = "";

            products
                .map(convertFirestoreDocument)
                .filter(product => product.status === "active")
                .slice(0, 8)
                .forEach(function (product) {

                    const imageSection = product.imageUrl
                        ? `<img src="${product.imageUrl}"
                                alt="${product.name}"
                                class="product-image">`
                        : `<div class="product-image-placeholder">
                                Image coming soon
                           </div>`;

                    html += `
                        <div class="product-card">
                            ${imageSection}

                            <div class="product-info">
                                <p class="product-category">
                                    ${product.category}
                                </p>

                                <h3>${product.name}</h3>

                                <p class="product-price">
                                    ₹${Number(product.price).toLocaleString("en-IN")}
                                </p>

                                <a class="view-product-button"
                                   href="product-details.html?id=${encodeURIComponent(product.productId)}">
                                    View Product
                                </a>
                            </div>
                        </div>
                    `;
                });

            $("#productGrid").html(
                html || "<p>No products available.</p>"
            );
        })
        .fail(function (error) {
            console.error("Product loading failed:", error);
            $("#productGrid").html(
                "<p>Unable to load products. Please refresh the page.</p>"
            );
        });
}


// Homepage search
function setupSearch() {
    $("#searchButton").on("click", function () {
        const searchText = $("#searchInput").val().trim();

        if (searchText) {
            window.location.href =
                `products.html?q=${encodeURIComponent(searchText)}`;
        }
    });

    $("#searchInput").on("keypress", function (event) {
        if (event.which === 13) {
            $("#searchButton").click();
        }
    });
}


// Start homepage functions after the page loads
$(document).ready(function () {
    loadCategories();
    loadProducts();
    setupSearch();
});
