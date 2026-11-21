
 // ==========================================
 // FYNDIt - PRODUCT DETAILS PAGE
 // ==========================================

 let selectedProduct = null;


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
 // LOAD SELECTED PRODUCT
 // ==========================================

 function loadProductDetails() {

     const urlParameters = new URLSearchParams(window.location.search);

     const productId = urlParameters.get("id");

     if (!productId) {

         $("#productDetailsContainer").html(
             "<p>No product was selected. Please return to the Products page.</p>"
         );

         return;
     }


     $.ajax({

         url: `${FIRESTORE_BASE_URL}/products`,

         method: "GET",

         dataType: "json"

     })

     .done(function (response) {

         const documents = response.documents || [];

         selectedProduct = documents

             .map(convertProductDocument)

             .find(function (product) {

                 return product.productId === productId
                     && product.status === "active";

             });


         if (!selectedProduct) {

             $("#productDetailsContainer").html(
                 "<p>Sorry, this product could not be found.</p>"
             );

             return;
         }


         displayProductDetails(selectedProduct);

     })

     .fail(function (error) {

         console.error("Product loading failed:", error);

         $("#productDetailsContainer").html(
             "<p>Unable to load product details. Please refresh the page.</p>"
         );

     });

 }


 // ==========================================
 // DISPLAY PRODUCT DETAILS
 // ==========================================

 function displayProductDetails(product) {

     const imageSection = product.imageUrl

         ? `
             <img
                 src="${product.imageUrl}"
                 alt="${product.name}"
                 class="product-details-image"
             >
         `

         : `
             <div class="product-details-placeholder">
                 Product image coming soon
             </div>
         `;


     const stock = Number(product.stock) || 0;

     const stockMessage = stock > 0
         ? `${stock} units available`
         : "Currently out of stock";


     const html = `

         <div class="product-details-layout">

             <div class="product-details-image-container">
                 ${imageSection}
             </div>


             <div class="product-details-info">

                 <p class="product-details-category">
                     ${product.category}
                 </p>

                 <h1>${product.name}</h1>

                 <p class="product-details-price">
                     ₹${Number(product.price).toLocaleString("en-IN")}
                 </p>

                 <div class="product-details-divider"></div>

                 <h3>Product Description</h3>

                 <p class="product-details-description">
                     ${product.description || "Discover this product from the FyndIt collection."}
                 </p>

                 <p class="product-stock">
                     ${stockMessage}
                 </p>

                 <div class="quantity-section">

                     <label for="productQuantity">
                         Quantity
                     </label>

                     <input
                         type="number"
                         id="productQuantity"
                         value="1"
                         min="1"
                         max="${stock}"
                         ${stock === 0 ? "disabled" : ""}
                     >

                 </div>

                 <button
                     type="button"
                     id="addToCartButton"
                     class="view-product-button"
                     ${stock === 0 ? "disabled" : ""}
                 >
                     Add to Cart
                 </button>

                 <a href="products.html" class="back-to-products">
                     ← Continue Shopping
                 </a>

             </div>

         </div>

     `;


     $("#productDetailsContainer").html(html);


     $("#addToCartButton").on("click", addProductToCart);

 }


 // ==========================================
 // ADD PRODUCT TO CART
 // ==========================================

 function addProductToCart() {

     if (!selectedProduct) {
         return;
     }


     const quantity = Number($("#productQuantity").val());

     const stock = Number(selectedProduct.stock) || 0;


     if (!Number.isInteger(quantity) || quantity < 1) {

         alert("Please enter a valid quantity.");

         return;
     }


     if (quantity > stock) {

         alert("Requested quantity is not available in stock.");

         return;
     }


     let cart = JSON.parse(localStorage.getItem("fynditCart") || "[]");


     const existingItem = cart.find(function (item) {

         return item.productId === selectedProduct.productId;

     });


     if (existingItem) {

         if (existingItem.quantity + quantity > stock) {

             alert("You cannot add more than the available stock.");

             return;
         }

         existingItem.quantity += quantity;

     }

     else {

         cart.push({

             productId: selectedProduct.productId,

             name: selectedProduct.name,

             category: selectedProduct.category,

             price: Number(selectedProduct.price),

             imageUrl: selectedProduct.imageUrl || "",

             quantity: quantity

         });

     }


     localStorage.setItem("fynditCart", JSON.stringify(cart));


     updateCartCount();


     alert("Product added to your cart!");

 }


 // ==========================================
 // UPDATE CART COUNT
 // ==========================================

 function updateCartCount() {

     const cart = JSON.parse(localStorage.getItem("fynditCart") || "[]");

     const totalItems = cart.reduce(function (total, item) {

         return total + Number(item.quantity);

     }, 0);


     $("#cartCount").text(totalItems);

 }


 // ==========================================
 // PAGE INITIALIZATION
 // ==========================================

 $(document).ready(function () {

     loadProductDetails();

     updateCartCount();

 });
