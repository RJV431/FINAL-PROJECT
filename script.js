let products = [];
let cart = [];

// Load products from JSON
fetch("products.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Unable to load products");
    }
    return response.json();
  })
  .then((data) => {
    products = data;
    displayProducts();
  })
  .catch((error) => {
    document.getElementById("product-list").textContent =
      "Unable to load products. Please run using Live Server.";
    console.error(error);
  });

// Display products
function displayProducts() {
  const productList = document.getElementById("product-list");

  productList.innerHTML = products
    .map(
      (product) => `
        <div class="product">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>₱${product.price.toFixed(2)}</p>
            <button onclick="addToCart(${product.id})">
                Add to Cart
            </button>
        </div>
    `,
    )
    .join("");
}

// Add product to cart
function addToCart(id) {
  const product = products.find((p) => p.id === id);
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      ...product,
      quantity: 1,
    });
  }

  displayCart();
}

// Display cart
function displayCart() {
  const cartItems = document.getElementById("cart-items");

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    cartItems.innerHTML = cart
      .map(
        (item) => `
            <div class="cart-item">
                <span>
                    ${item.name} - ₱${item.price.toFixed(2)}
                </span>

                <div>
                    <button onclick="changeQuantity(${item.id}, -1)">−</button>
                    ${item.quantity}
                    <button onclick="changeQuantity(${item.id}, 1)">+</button>
                    <button onclick="removeItem(${item.id})">
                        Remove
                    </button>
                </div>
            </div>
        `,
      )
      .join("");
  }

  updateTotal();
}

// Change quantity
function changeQuantity(id, amount) {
  const item = cart.find((p) => p.id === id);

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    removeItem(id);
  } else {
    displayCart();
  }
}

// Remove item
function removeItem(id) {
  cart = cart.filter((item) => item.id !== id);
  displayCart();
}

// Calculate total
function updateTotal() {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  document.getElementById("total").textContent = total.toFixed(2);
}

// Checkout
function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  document.getElementById("checkout").scrollIntoView({ behavior: "smooth" });
}

// Place order
document
  .getElementById("order-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    if (cart.length === 0) {
      alert("Please add products to your cart.");
      return;
    }

    const name = document.getElementById("customer").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;
    const payment = document.getElementById("payment").value;

    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order = {
      customer: name,
      phone: phone,
      address: address,
      payment: payment,
      items: cart.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total: total,
      date: new Date().toISOString(),
    };

    // Demo order confirmation
    console.log("New Order:", order);

    document.getElementById("confirmation").innerHTML =
      `Thank you, ${name}! Your order has been received.
         Total: ₱${total.toFixed(2)}.
         Payment: ${payment}.`;

    cart = [];
    displayCart();
    this.reset();
  });

// Initial cart display
displayCart();
