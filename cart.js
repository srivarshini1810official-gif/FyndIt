
// ==========================================
// FYNDIt - SHOPPING CART
// ==========================================


// ==========================================
// GET CART ITEMS
// ==========================================

function getCartItems() {

    try {

        return JSON.parse(
            localStorage.getItem("fynditCart") || "[]"
        );

    }

    catch (error) {

        console.error("Unable to read cart:", error);

        return [];

    }

}


// ==========================================
// SAVE CART ITEMS
// ==========================================

function saveCartItems(cart) {

    localStorage.setItem(
        "fynditCart",
        JSON.stringify(cart)
    );

}


// ==========================================
// FORMAT PRICE
// ==========================================

function formatPrice(price) {

    return "₹" + Number(price).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


// ==========================================
// UPDATE CART COUNT
// ==========================================

function updateCartCount() {

    const cart = getCartItems();

    const totalItems = cart.reduce(function (total, item) {

        return total + Number(item.quantity);

    }, 0);

    $("#cartCount").text(totalItems);

}


// ==========================================
// DISPLAY CART ITEMS
// ==========================================

function displayCartItems() {

    const cart = getCartItems();

    let html = "";

    let subtotal = 0;


    if (cart.length === 0) {

        $("#cartItems").html(`
            <div class="empty-cart">
                <h3>Your shopping bag is empty.</h3>
                <p>Discover something special from our collection.</p>
                <a href="products.html">Explore Products</a>
            </div>
        `);

        $("#cartSubtotal").text(formatPrice(0));

        $("#cartTotal").text(formatPrice(0));

        $("#deliveryCharge").text("Free");

        $("#checkoutButton").prop("disabled", true);

        updateCartCount();

        return;

    }


    cart.forEach(function (item, index) {

        const itemPrice = Number(item.price);

        const quantity = Number(item.quantity);

        const itemTotal = itemPrice * quantity;

        subtotal += itemTotal;


        const imageSection = item.imageUrl

            ? `
                <img
                    src="${item.imageUrl}"
                    alt="${item.name}"
                    class="cart-product-image"
                >
            `

            : `
                <div class="cart-product-placeholder">
                    Image coming soon
                </div>
            `;


        html += `

            <div class="cart-item">

                <div class="cart-item-image">
                    ${imageSection}
                </div>


                <div class="cart-item-details">

                    <p class="cart-item-category">
                        ${item.category}
                    </p>

                    <h3>${item.name}</h3>

                    <p class="cart-item-price">
                        ${formatPrice(itemPrice)}
                    </p>


                    <div class="cart-item-actions">

                        <div class="cart-quantity">

                            <button
                                type="button"
                                class="quantity-decrease"
                                data-index="${index}"
                            >
                                −
                            </button>

                            <span>${quantity}</span>

                            <button
                                type="button"
                                class="quantity-increase"
                                data-index="${index}"
                            >
                                +
                            </button>

                        </div>


                        <button
                            type="button"
                            class="remove-cart-item"
                            data-index="${index}"
                        >
                            Remove
                        </button>

                    </div>

                </div>


                <div class="cart-item-total">

                    ${formatPrice(itemTotal)}

                </div>

            </div>

        `;

    });


    $("#cartItems").html(html);


    // UPDATE ORDER SUMMARY

    $("#cartSubtotal").text(formatPrice(subtotal));

    $("#cartTotal").text(formatPrice(subtotal));

    $("#deliveryCharge").text("Free");

    $("#checkoutButton").prop("disabled", false);


    updateCartCount();

}


// ==========================================
// INCREASE QUANTITY
// ==========================================

function increaseQuantity(index) {

    const cart = getCartItems();

    if (!cart[index]) return;

    cart[index].quantity++;

    saveCartItems(cart);

    displayCartItems();

}


// ==========================================
// DECREASE QUANTITY
// ==========================================

function decreaseQuantity(index) {

    const cart = getCartItems();

    if (!cart[index]) return;

    if (cart[index].quantity > 1) {

        cart[index].quantity--;

    }

    else {

        return;

    }

    saveCartItems(cart);

    displayCartItems();

}


// ==========================================
// REMOVE PRODUCT
// ==========================================

function removeCartItem(index) {

    const cart = getCartItems();

    if (!cart[index]) return;

    cart.splice(index, 1);

    saveCartItems(cart);

    displayCartItems();

}


// ==========================================
// CHECKOUT
// ==========================================

function proceedToCheckout() {

    const cart = getCartItems();

    if (cart.length === 0) {

        alert("Your shopping cart is empty.");

        return;

    }

    window.location.href = "checkout.html";

}


// ==========================================
// EVENT LISTENERS
// ==========================================

$(document).ready(function () {

    displayCartItems();


    $("#cartItems").on(
        "click",
        ".quantity-increase",
        function () {

            const index = Number($(this).data("index"));

            increaseQuantity(index);

        }
    );


    $("#cartItems").on(
        "click",
        ".quantity-decrease",
        function () {

            const index = Number($(this).data("index"));

            decreaseQuantity(index);

        }
    );


    $("#cartItems").on(
        "click",
        ".remove-cart-item",
        function () {

            const index = Number($(this).data("index"));

            removeCartItem(index);

        }
    );


    $("#checkoutButton").on("click", function () {

        proceedToCheckout();

    });

});
