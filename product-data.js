
const categories = [
    { id: "CAT001", name: "Fashion", description: "Clothing and everyday fashion" },
    { id: "CAT002", name: "Electronics", description: "Electronic devices and accessories" },
    { id: "CAT003", name: "Beauty", description: "Beauty and personal care products" },
    { id: "CAT004", name: "Home & Living", description: "Home essentials and decor" },
    { id: "CAT005", name: "Books", description: "Books and educational resources" },
    { id: "CAT006", name: "Grocery", description: "Everyday grocery essentials" },
    { id: "CAT007", name: "Sports", description: "Sports and fitness products" },
    { id: "CAT008", name: "Accessories", description: "Personal and lifestyle accessories" }
];

const products = [
    // FASHION - 8 PRODUCTS
    { id: "FAS001", name: "Classic Cotton T-Shirt", category: "Fashion", price: 599, stock: 40, description: "Comfortable everyday cotton T-shirt with a regular fit." },
    { id: "FAS002", name: "Slim Fit Denim Jeans", category: "Fashion", price: 1499, stock: 25, description: "Stylish slim-fit denim jeans for casual wear." },
    { id: "FAS003", name: "Women's Floral Kurti", category: "Fashion", price: 899, stock: 30, description: "Elegant floral printed kurti for everyday occasions." },
    { id: "FAS004", name: "Men's Casual Shirt", category: "Fashion", price: 1199, stock: 22, description: "Smart casual shirt made with breathable fabric." },
    { id: "FAS005", name: "Women's Straight Leg Trousers", category: "Fashion", price: 1299, stock: 18, description: "Versatile straight-leg trousers with a comfortable fit." },
    { id: "FAS006", name: "Unisex Hooded Sweatshirt", category: "Fashion", price: 1599, stock: 20, description: "Soft fleece sweatshirt suitable for cooler days." },
    { id: "FAS007", name: "Women's Casual Summer Dress", category: "Fashion", price: 1399, stock: 16, description: "Lightweight summer dress with a relaxed silhouette." },
    { id: "FAS008", name: "Men's Formal Trousers", category: "Fashion", price: 1499, stock: 19, description: "Tailored formal trousers for office and occasions." },

    // ELECTRONICS - 8 PRODUCTS
    { id: "ELE001", name: "Wireless Bluetooth Headphones", category: "Electronics", price: 1999, stock: 35, description: "Over-ear wireless headphones with clear sound and comfortable cushions." },
    { id: "ELE002", name: "Smart Fitness Band", category: "Electronics", price: 2499, stock: 28, description: "Fitness band with activity tracking and heart-rate monitoring." },
    { id: "ELE003", name: "Portable Bluetooth Speaker", category: "Electronics", price: 1499, stock: 32, description: "Compact portable speaker with rich sound." },
    { id: "ELE004", name: "Wireless Optical Mouse", category: "Electronics", price: 699, stock: 45, description: "Ergonomic wireless mouse for work and everyday use." },
    { id: "ELE005", name: "Mechanical Gaming Keyboard", category: "Electronics", price: 2999, stock: 15, description: "Mechanical keyboard designed for gaming and productivity." },
    { id: "ELE006", name: "USB-C Fast Charging Cable", category: "Electronics", price: 399, stock: 60, description: "Durable USB-C charging cable for compatible devices." },
    { id: "ELE007", name: "Full HD Webcam", category: "Electronics", price: 1799, stock: 20, description: "Full HD webcam for video meetings and online classes." },
    { id: "ELE008", name: "20W USB-C Wall Charger", category: "Electronics", price: 899, stock: 38, description: "Compact 20W USB-C charger for compatible smartphones." },

    // BEAUTY - 8 PRODUCTS
    { id: "BEA001", name: "Vitamin C Face Serum", category: "Beauty", price: 499, stock: 35, description: "Lightweight vitamin C facial serum for daily skincare." },
    { id: "BEA002", name: "Rose Water Toner", category: "Beauty", price: 299, stock: 42, description: "Refreshing rose water toner for everyday skincare." },
    { id: "BEA003", name: "Hydrating Face Moisturizer", category: "Beauty", price: 399, stock: 30, description: "Daily face moisturizer for soft and hydrated skin." },
    { id: "BEA004", name: "Matte Liquid Lipstick", category: "Beauty", price: 349, stock: 28, description: "Long-wear matte liquid lipstick with a smooth finish." },
    { id: "BEA005", name: "Gentle Foaming Face Wash", category: "Beauty", price: 249, stock: 40, description: "Gentle daily cleanser for removing dirt and impurities." },
    { id: "BEA006", name: "Aloe Vera Body Lotion", category: "Beauty", price: 375, stock: 26, description: "Moisturizing body lotion enriched with aloe vera." },
    { id: "BEA007", name: "Waterproof Mascara", category: "Beauty", price: 449, stock: 24, description: "Water-resistant mascara for defined-looking lashes." },
    { id: "BEA008", name: "Sunscreen SPF 50", category: "Beauty", price: 599, stock: 33, description: "Daily broad-spectrum SPF 50 sunscreen." },

    // HOME & LIVING - 8 PRODUCTS
    { id: "HOM001", name: "Ceramic Coffee Mug", category: "Home & Living", price: 299, stock: 50, description: "Durable ceramic coffee mug for everyday beverages." },
    { id: "HOM002", name: "Decorative Table Lamp", category: "Home & Living", price: 1199, stock: 18, description: "Modern decorative lamp for bedside and living spaces." },
    { id: "HOM003", name: "Cotton Bedsheet Set", category: "Home & Living", price: 1499, stock: 20, description: "Soft cotton bedsheet set for comfortable sleep." },
    { id: "HOM004", name: "Stainless Steel Water Bottle", category: "Home & Living", price: 599, stock: 40, description: "Reusable stainless steel bottle for daily hydration." },
    { id: "HOM005", name: "Decorative Cushion Covers", category: "Home & Living", price: 499, stock: 32, description: "Set of decorative cushion covers for sofas and beds." },
    { id: "HOM006", name: "Non-Stick Frying Pan", category: "Home & Living", price: 899, stock: 22, description: "Everyday non-stick frying pan for convenient cooking." },
    { id: "HOM007", name: "Wall Clock", category: "Home & Living", price: 699, stock: 25, description: "Minimal wall clock suitable for home and office." },
    { id: "HOM008", name: "Laundry Storage Basket", category: "Home & Living", price: 549, stock: 27, description: "Lightweight laundry basket for organized storage." },

    // BOOKS - 8 PRODUCTS
    { id: "BOO001", name: "The Alchemist", category: "Books", price: 299, stock: 30, description: "A popular inspirational novel by Paulo Coelho." },
    { id: "BOO002", name: "Atomic Habits", category: "Books", price: 499, stock: 25, description: "A practical guide to building good habits by James Clear." },
    { id: "BOO003", name: "Wings of Fire", category: "Books", price: 350, stock: 28, description: "The autobiography of Dr. A. P. J. Abdul Kalam." },
    { id: "BOO004", name: "Rich Dad Poor Dad", category: "Books", price: 399, stock: 24, description: "A personal finance and financial education book by Robert Kiyosaki." },
    { id: "BOO005", name: "Ikigai", category: "Books", price: 350, stock: 26, description: "A book exploring the Japanese concept of purpose and well-being." },
    { id: "BOO006", name: "The Psychology of Money", category: "Books", price: 399, stock: 22, description: "Morgan Housel explores how people think about money." },
    { id: "BOO007", name: "Think Like a Monk", category: "Books", price: 450, stock: 20, description: "Jay Shetty shares lessons on purpose and mindful living." },
    { id: "BOO008", name: "Introduction to Programming", category: "Books", price: 599, stock: 18, description: "A beginner-friendly guide to programming fundamentals." },

    // GROCERY - 8 PRODUCTS
    { id: "GRO001", name: "Premium Basmati Rice 1kg", category: "Grocery", price: 180, stock: 50, description: "Long-grain basmati rice suitable for everyday meals." },
    { id: "GRO002", name: "Organic Toor Dal 1kg", category: "Grocery", price: 165, stock: 40, description: "Quality toor dal for traditional Indian cooking." },
    { id: "GRO003", name: "Cold Pressed Groundnut Oil 1L", category: "Grocery", price: 220, stock: 28, description: "Groundnut cooking oil produced using cold-press extraction." },
    { id: "GRO004", name: "Whole Wheat Atta 5kg", category: "Grocery", price: 275, stock: 32, description: "Whole wheat flour for soft homemade rotis." },
    { id: "GRO005", name: "Mixed Dry Fruits 250g", category: "Grocery", price: 349, stock: 24, description: "Assorted almonds, cashews, raisins and other dry fruits." },
    { id: "GRO006", name: "Green Tea Bags Pack", category: "Grocery", price: 199, stock: 35, description: "Pack of green tea bags for a refreshing beverage." },
    { id: "GRO007", name: "Natural Honey 500g", category: "Grocery", price: 299, stock: 26, description: "Natural honey for everyday use." },
    { id: "GRO008", name: "Rolled Oats 1kg", category: "Grocery", price: 199, stock: 30, description: "Whole-grain rolled oats for breakfast and baking." },

    // SPORTS - 8 PRODUCTS
    { id: "SPO001", name: "Non-Slip Yoga Mat", category: "Sports", price: 899, stock: 25, description: "Comfortable non-slip yoga mat for exercise and stretching." },
    { id: "SPO002", name: "Adjustable Dumbbell Set", category: "Sports", price: 2499, stock: 12, description: "Adjustable dumbbell set for home strength training." },
    { id: "SPO003", name: "Cricket Tennis Ball Set", category: "Sports", price: 299, stock: 40, description: "Pack of durable tennis balls for casual cricket." },
    { id: "SPO004", name: "Football Size 5", category: "Sports", price: 799, stock: 20, description: "Size 5 football suitable for recreational play." },
    { id: "SPO005", name: "Skipping Rope", category: "Sports", price: 249, stock: 35, description: "Adjustable skipping rope for cardio workouts." },
    { id: "SPO006", name: "Resistance Bands Set", category: "Sports", price: 499, stock: 30, description: "Resistance bands in multiple strengths for exercise." },
    { id: "SPO007", name: "Badminton Racket", category: "Sports", price: 999, stock: 18, description: "Lightweight badminton racket for recreational players." },
    { id: "SPO008", name: "Insulated Gym Shaker Bottle", category: "Sports", price: 449, stock: 28, description: "Reusable shaker bottle for mixing workout drinks." },

    // ACCESSORIES - 8 PRODUCTS
    { id: "ACC001", name: "Classic Analog Wrist Watch", category: "Accessories", price: 1499, stock: 20, description: "Classic analog wristwatch with a minimalist dial." },
    { id: "ACC002", name: "Leather Wallet", category: "Accessories", price: 799, stock: 25, description: "Compact wallet with multiple card slots." },
    { id: "ACC003", name: "Silk Hair Scrunchies", category: "Accessories", price: 299, stock: 35, description: "Soft silk-finish scrunchies for comfortable hairstyling." },
    { id: "ACC004", name: "Polarized Sunglasses", category: "Accessories", price: 999, stock: 18, description: "Stylish polarized sunglasses for outdoor use." },
    { id: "ACC005", name: "Minimalist Pendant Necklace", category: "Accessories", price: 699, stock: 22, description: "Simple pendant necklace for everyday styling." },
    { id: "ACC006", name: "Canvas Laptop Backpack", category: "Accessories", price: 1299, stock: 16, description: "Spacious backpack with a padded laptop compartment." },
    { id: "ACC007", name: "Classic Leather Belt", category: "Accessories", price: 599, stock: 24, description: "Versatile belt for formal and casual outfits." },
    { id: "ACC008", name: "Reusable Tote Bag", category: "Accessories", price: 349, stock: 32, description: "Lightweight reusable tote bag for shopping and daily use." }
];

// Basic validation
console.log("Total categories:", categories.length);
console.log("Total products:", products.length);

console.log(
    "Products per category:",
    categories.map(category => ({
        category: category.name,
        count: products.filter(product => product.category === category.name).length
    }))
);

const allIds = products.map(product => product.id);
const uniqueIds = new Set(allIds);

console.log("----- FYNDIt PRODUCT VALIDATION -----");
console.log("Total categories:", categories.length);
console.log("Total products:", products.length);
console.log("Unique product IDs:", uniqueIds.size);
console.log("All product IDs unique:", uniqueIds.size === products.length);

categories.forEach(category => {
    const count = products.filter(
        product => product.category === category.name
    ).length;

    console.log(category.name + ": " + count + " products");
});

const valid =
    categories.length === 8 &&
    products.length === 64 &&
    uniqueIds.size === 64 &&
    categories.every(category =>
        products.filter(product => product.category === category.name).length === 8
    );

console.log("------------------------------------");
console.log(valid ? "VALIDATION SUCCESSFUL!" : "VALIDATION FAILED!");
module.exports = { categories, products };