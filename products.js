
// ==========================================
// FYNDIt - PRODUCTS PAGE
// ==========================================

// Store all products
let allProducts = [];


// ==========================================
// CONVERT FIRESTORE DOCUMENT
// ==========================================

function convertProductDocument(document) {

    const fields = document.fields || {};
    const result = {};

    for (const key in fields) {

        const field = fields[key];

        if (field.stringValue !== undefined) {
            result[key] = field.stringValue;
        }
        else if (field.integerValue !== undefined) {
            result[key] = Number(field.integerValue);
        }
        else if (field.doubleValue !== undefined) {
            result[key] = Number(field.doubleValue);
        }
        else if (field.booleanValue !== undefined) {
            result[key] = field.booleanValue;
        }
        else {
            result[key] = "";
        }

    }

    return result;
}


// ==========================================
// FETCH FIRESTORE COLLECTION
// ==========================================

function fetchProductsCollection(collectionName) {

    return $.ajax({

        url: `${FIRESTORE_BASE_URL}/${collectionName}`,

        method: "GET",

        dataType: "json"

    });

}


// ==========================================
// LOAD CATEGORIES INTO FILTER
// ==========================================

function loadProductCategories() {

    fetchProductsCollection("categories")

        .done(function (response) {

            const categories = response.documents || [];

            let options = '<option value="">All Categories</option>';

            categories.forEach(function (document) {

                const category = convertProductDocument(document);

                if (category.status !== "active") return;

                options += `
                    <option value="${category.name}">
                        ${category.name}
                    </option>
                `;

            });

            $("#categoryFilter").html(options);

        })

        .fail(function (error) {

            console.error("Category loading failed:", error);

        });

}


// ==========================================
// LOAD ALL PRODUCTS
// ==========================================

function loadAllProducts() {

    fetchProductsCollection("products")

        .done(function (response) {

            const documents = response.documents || [];

            allProducts = documents

                .map(convertProductDocument)

                .filter(function (product) {

                    return product.status === "active";

                });


            // Read category from URL if available

            const urlParameters = new URLSearchParams(window.location.search);

            const selectedCategory = urlParameters.get("category");

            const searchQuery = urlParameters.get("q");


            if (selectedCategory) {

                $("#categoryFilter").val(selectedCategory);

            }

            if (searchQuery) {

                $("#productSearch").val(searchQuery);

            }


            displayFilteredProducts();

        })

        .fail(function (error) {

            console.error("Product loading failed:", error);

            $("#allProductsGrid").html(
                "<p>Unable to load products. Please refresh the page.</p>"
            );

            $("#productCount").text("Products unavailable");

        });

}


// ==========================================
// DISPLAY PRODUCTS
// ==========================================

function displayProducts(products) {

    let html = "";

    if (products.length === 0) {

        $("#allProductsGrid").html(
            "<p class='no-products'>No products found. Try another search.</p>"
        );

        $("#productCount").text("0 products found");

        return;

    }


    products.forEach(function (product) {

        const imageSection = product.imageUrl

            ? `
                <img
                    src="${product.imageUrl}"
                    alt="${product.name}"
                    class="product-image"
                >
            `

            : `
                <div class="product-image-placeholder">
                    Image coming soon
                </div>
            `;


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

                    <a
                        class="view-product-button"
                        href="product-details.html?id=${encodeURIComponent(product.productId)}"
                    >
                        View Product
                    </a>

                </div>

            </div>

        `;

    });


    $("#allProductsGrid").html(html);

    $("#productCount").text(
        `${products.length} products found`
    );

}


// ==========================================
// FILTER AND SORT PRODUCTS
// ==========================================

function displayFilteredProducts() {

    let filteredProducts = [...allProducts];


    // CATEGORY FILTER

    const selectedCategory = $("#categoryFilter").val();

    if (selectedCategory) {

        filteredProducts = filteredProducts.filter(function (product) {

            return product.category === selectedCategory;

        });

    }


    // SEARCH FILTER

    const searchText = $("#productSearch").val().trim().toLowerCase();

    if (searchText) {

        filteredProducts = filteredProducts.filter(function (product) {

            return (

                product.name.toLowerCase().includes(searchText) ||

                product.category.toLowerCase().includes(searchText) ||

                product.description.toLowerCase().includes(searchText)

            );

        });

    }


    // SORT FILTER

    const sortOption = $("#sortFilter").val();

    if (sortOption === "low-high") {

        filteredProducts.sort(function (a, b) {

            return Number(a.price) - Number(b.price);

        });

    }

    else if (sortOption === "high-low") {

        filteredProducts.sort(function (a, b) {

            return Number(b.price) - Number(a.price);

        });

    }

    else if (sortOption === "name") {

        filteredProducts.sort(function (a, b) {

            return a.name.localeCompare(b.name);

        });

    }


    displayProducts(filteredProducts);

}


// ==========================================
// EVENT LISTENERS
// ==========================================

$(document).ready(function () {

    loadProductCategories();

    loadAllProducts();


    $("#categoryFilter").on("change", function () {

        displayFilteredProducts();

    });


    $("#sortFilter").on("change", function () {

        displayFilteredProducts();

    });


    $("#productSearch").on("input", function () {

        displayFilteredProducts();

    });

});
