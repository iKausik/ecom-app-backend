const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const database = require("./db");
const {
  registerValidation,
  loginValidation,
  addressValidation,
  productValidation,
} = require("./validation");
const requiresAuth = require("./verifyToken");
const { response } = require("express");

const app = express();
const PORT = process.env.PORT;

// Middlewares
app.use(cors());
app.use(express.json());

//
// ROUTES
// Sign up
app.post("/signup", async (req, res) => {
  try {
    // Validate data before submission
    const { error } = registerValidation(
      req.body.username,
      req.body.firstname,
      req.body.lastname,
      req.body.email,
      req.body.password
    );
    if (error) return res.status(400).send(error.details[0].message);

    // Checking if username already exists
    const usernameExist = await database.query(
      "SELECT username FROM users WHERE username=$1",
      [req.body.username]
    );
    if (usernameExist.rows[0])
      return res.status(400).send("Username already taken!");

    // Checking if email already exists
    const emailExist = await database.query(
      "SELECT email FROM users WHERE email=$1",
      [req.body.email]
    );
    if (emailExist.rows[0])
      return res.status(400).send("Email already exists!");

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Save the New User
    const newUser = await database.query(
      "INSERT INTO users(username, firstname, lastname, email, password) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [
        req.body.username,
        req.body.firstname,
        req.body.lastname,
        req.body.email,
        hashedPassword,
      ]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    // Validate data before submission
    const { error } = loginValidation(req.body.username, req.body.password);
    if (error) return res.status(400).send(error.details[0].message);

    // Checking if username doesn't exists
    const validUsername = await database.query(
      "SELECT username FROM users WHERE username=$1",
      [req.body.username]
    );
    if (!validUsername.rows[0])
      return res.status(400).send("Username is not found");

    // Checking if password is correct
    const validPass = await database.query(
      "SELECT password FROM users WHERE username=$1",
      [req.body.username]
    );

    hashedPassFromDB = validPass.rows[0].password;
    normalPass = req.body.password;

    const comparePass = await bcrypt.compare(normalPass, hashedPassFromDB);
    if (!comparePass) return res.status(400).send("Invalid password");

    // Create and assign a token
    const token = jwt.sign(
      { username: req.body.username },
      process.env.TOKEN_SECRET,
      {
        noTimestamp: true,
        expiresIn: "10d",
      }
    );
    res.header("auth-token", token).send(token);
  } catch (err) {
    console.error(err.message);
  }
});

// Profile Details
app.get("/user", requiresAuth, async (req, res) => {
  try {
    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    res.json(loggedinUser.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// Update user details
app.put("/user", requiresAuth, async (req, res) => {
  try {
    // Current user Username from jwt
    const userName = req.user.username;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Update
    const updateProfile = await database.query(
      "UPDATE users SET firstname=$1, lastname=$2, email=$3, password=$4, phone=$5 WHERE username=$6 RETURNING *",
      [
        req.body.firstname,
        req.body.lastname,
        req.body.email,
        hashedPassword,
        req.body.phone,
        userName,
      ]
    );
    res.json(updateProfile.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// Delete User
app.delete("/user", requiresAuth, async (req, res) => {
  try {
    const userName = req.user.username;
    await database.query("DELETE FROM users WHERE username=$1", [userName]);
    res.send("Your account was deleted.");
  } catch (err) {
    console.error(err.message);
  }
});

//
//
// Add New Product
app.post("/products", async (req, res) => {
  try {
    // Validate data before submission
    const { error } = productValidation(
      req.body.title,
      req.body.price,
      req.body.quantity,
      req.body.description,
      req.body.category,
      req.body.label,
      req.body.image1,
      req.body.image2,
      req.body.image3
    );
    if (error) return res.status(400).send(error.details[0].message);

    const {
      title,
      price,
      quantity,
      description,
      category,
      label,
      image1,
      image2,
      image3,
    } = req.body;
    const newProduct = await database.query(
      "INSERT INTO products(title, price, quantity, description, category, label, image1, image2, image3) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        title,
        price,
        quantity,
        description,
        category,
        label,
        image1,
        image2,
        image3,
      ]
    );
    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// Get All Products
app.get("/products", async (req, res) => {
  try {
    const allProducts = await database.query("SELECT * FROM products");
    res.json(allProducts.rows);
    // res.cookie("cookie1", ((SameSite = None), Secure));
  } catch (err) {
    console.error(err.message);
  }
});

// Single Product
app.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await database.query(
      `SELECT * FROM products WHERE id=${id}`
    );
    res.json(product.rows[0]);
    // res.cookie("cookie1", ((SameSite = None), Secure));
  } catch (err) {
    console.error(err.message);
  }
});

// Update Product Details
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      price,
      quantity,
      description,
      category,
      label,
      image1,
      image2,
      image3,
    } = req.body;
    const updateProduct = await database.query(
      "UPDATE products SET title=$1, price=$2, quantity=$3, description=$4, category=$5, label=$6, image1=$7, image2=$8, image3=$9 WHERE id=$10 RETURNING *",
      [
        title,
        price,
        quantity,
        description,
        category,
        label,
        image1,
        image2,
        image3,
        id,
      ]
    );
    res.json(updateProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// Delete Product
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await database.query("DELETE FROM products WHERE id=$1", [id]);
    res.json("The product was deleted.");
  } catch (err) {
    console.error(err.message);
  }
});

//
//
// Add to Cart
app.post("/cart", requiresAuth, async (req, res) => {
  try {
    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    const userDetails = loggedinUser.rows[0];
    const userId = userDetails.id;

    const qty = 1;

    const newCartItem = await database.query(
      "INSERT INTO cart(product_id, user_id, quantity, size, cart_image) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [req.body.product_id, userId, qty, req.body.size, req.body.cart_image]
    );

    res.json(newCartItem.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// All Cart
app.get("/cart", requiresAuth, async (req, res) => {
  try {
    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    const userDetails = loggedinUser.rows[0];
    const userId = userDetails.id;

    const allCart = await database.query(
      "SELECT products.id AS product_id, products.title, products.description, products.price, cart.cart_image, products.image2, products.image3, products.image4, cart.id AS cart_id, cart.quantity AS cart_quantity, cart.size, cart.quantity*products.price AS total_price FROM products JOIN cart ON products.id=cart.product_id WHERE cart.user_id=$1",
      [userId]
    );

    res.json(allCart.rows);
  } catch (err) {
    console.error(err.message);
  }
});

// Update Quantity in Cart item
app.put("/cart", requiresAuth, async (req, res) => {
  try {
    // const { id } = req.params;

    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    const userDetails = loggedinUser.rows[0];
    const userId = userDetails.id;

    const updateCartQty = await database.query(
      "UPDATE cart SET quantity=$1 WHERE id=$2 AND user_id=$3 RETURNING *",
      [req.body.quantity, req.body.id, userId]
    );
    res.json(updateCartQty.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// Delete Cart item
app.delete("/cart", requiresAuth, async (req, res) => {
  try {
    // const { id } = req.params;

    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    const userDetails = loggedinUser.rows[0];
    const userId = userDetails.id;

    await database.query("DELETE FROM cart WHERE id=$1 AND user_id=$2", [
      req.body.id,
      userId,
    ]);
    res.json("The item was deleted from cart.");
  } catch (err) {
    console.error(err.message);
  }
});

// Delete All Cart items
app.delete("/cart", requiresAuth, async (req, res) => {
  try {
    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    const userDetails = loggedinUser.rows[0];
    const userId = userDetails.id;

    await database.query("DELETE FROM cart WHERE user_id=$1", [userId]);
    res.json("Your cart was cleared.");
  } catch (err) {
    console.error(err.message);
  }
});

//
//
// Place Order
// app.post("/orders", requiresAuth, async (req, res) => {
//   try {
//     const userName = req.user.username;
//     const loggedinUser = await database.query(
//       "SELECT * FROM users WHERE username=$1",
//       [userName]
//     );
//     const userDetails = loggedinUser.rows[0];
//     const userId = userDetails.id;

//     const orderStatus = "ordered";

//     const newOrder = await database.query(
//       "INSERT INTO orders(product_id, cart_id, user_id, status) VALUES($1, $2, $3, $4) RETURNING *",
//       [req.body.product_id, req.body.cart_id, userId, orderStatus]
//     );
//     res.json(newOrder.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//   }
// });

// All Orders
app.get("/orders", requiresAuth, async (req, res) => {
  try {
    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    const userDetails = loggedinUser.rows[0];
    const userId = userDetails.id;

    const allOrders = await database.query(
      "SELECT products.title, products.price, orders.id AS order_id, orders.order_quantity, orders.order_size, orders.order_image, orders.order_quantity*products.price AS total_price, orders.status, orders.order_date FROM orders JOIN products ON products.id=orders.product_id WHERE orders.user_id=$1",
      [userId]
    );
    res.json(allOrders.rows);
  } catch (err) {
    console.error(err.message);
  }
});

// Update Order Status
// app.put("/orders", requiresAuth, async (req, res) => {
//   try {
//     // const { id } = req.params;

//     const userName = req.user.username;
//     const loggedinUser = await database.query(
//       "SELECT * FROM users WHERE username=$1",
//       [userName]
//     );
//     const userDetails = loggedinUser.rows[0];
//     const userId = userDetails.id;

//     const updateOrderStatus = await database.query(
//       "UPDATE orders SET status=$1 WHERE id=$2 AND user_id=$3 RETURNING *",
//       [req.body.status, req.body.id, userId]
//     );
//     res.json(updateOrderStatus.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//   }
// });

//
//
// Add Address
app.post("/address", requiresAuth, async (req, res) => {
  try {
    // Validate data before submission
    const { error } = addressValidation(
      req.body.address,
      req.body.locality,
      req.body.city,
      req.body.state,
      req.body.zip
    );
    if (error) return res.status(400).send(error.details[0].message);

    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    const userDetails = loggedinUser.rows[0];
    const userId = userDetails.id;

    const newAddress = await database.query(
      "INSERT INTO address(zip, address, locality, city, state, user_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        req.body.zip,
        req.body.address,
        req.body.locality,
        req.body.city,
        req.body.state,
        userId,
      ]
    );
    res.json(newAddress.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// All Address
app.get("/address", requiresAuth, async (req, res) => {
  try {
    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    const userDetails = loggedinUser.rows[0];
    const userId = userDetails.id;

    const allAddress = await database.query(
      "SELECT * FROM address WHERE user_id=$1",
      [userId]
    );
    res.json(allAddress.rows);
  } catch (err) {
    console.error(err.message);
  }
});

// Update Address
app.put("/address", requiresAuth, async (req, res) => {
  try {
    // const { id } = req.params;

    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    const userDetails = loggedinUser.rows[0];
    const userId = userDetails.id;

    const updateAddress = await database.query(
      "UPDATE address SET zip=$1, address=$2, locality=$3, city=$4, state=$5 WHERE id=$6 AND user_id=$7 RETURNING *",
      [
        req.body.zip,
        req.body.address,
        req.body.locality,
        req.body.city,
        req.body.state,
        req.body.id,
        userId,
      ]
    );
    res.json(updateAddress.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// Delete Address
app.delete("/address", requiresAuth, async (req, res) => {
  try {
    // const { id } = req.params;

    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    const userDetails = loggedinUser.rows[0];
    const userId = userDetails.id;

    await database.query("DELETE FROM address WHERE id=$1 AND user_id=$2", [
      req.body.id,
      userId,
    ]);
    res.json("The address was deleted.");
  } catch (err) {
    console.error(err.message);
  }
});

//
//
// make Payment
app.post("/create-checkout-session", requiresAuth, async (req, res) => {
  // res.cookie("key", "value", { sameSite: "none", secure: true });
  try {
    // get current user id
    const userName = req.user.username;
    const loggedinUser = await database.query(
      "SELECT * FROM users WHERE username=$1",
      [userName]
    );
    const userDetails = loggedinUser.rows[0];
    const userId = userDetails.id;
    const userEmail = userDetails.email;

    // get cart details
    const cartDetail = await database.query(
      "SELECT products.id AS product_id, products.title, products.price, cart.cart_image, cart.id AS cart_id, cart.quantity AS cart_quantity, cart.size, cart.quantity*products.price AS total_price FROM products JOIN cart ON products.id=cart.product_id WHERE cart.user_id=$1",
      [userId]
    );

    // cart data
    const data = cartDetail.rows;
    const lineItems = data.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          images: [item.cart_image],
        },
        unit_amount: Math.trunc(item.price) * 100,
      },
      quantity: item.cart_quantity,
    }));

    const DOMAIN_URL = process.env.FRONTEND_DOMAIN_URL;

    // stripe payment
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      submit_type: "pay",
      billing_address_collection: "auto", // it can't be disabled based on country
      // shipping_address_collection: {
      //   allowed_countries: ["US"],
      // },
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: { user_Id: userId },
      mode: "payment",
      success_url: `${DOMAIN_URL}/success`,
      cancel_url: `${DOMAIN_URL}/canceled`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err.message);
  }
});

// webhook
// Match the raw body to content type application/json
app.post(
  "/webhook",
  express.json({ type: "application/json" }),
  async (req, res) => {
    let event = req.body;

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const checkoutSession = event.data.object;
        const userId = checkoutSession.metadata.user_Id;

        // // get cart details
        const cartDetail = await database.query(
          "SELECT products.id AS product_id, products.title, products.price, cart.cart_image, cart.id AS cart_id, cart.quantity AS cart_quantity, cart.size, cart.quantity*products.price AS total_price FROM products JOIN cart ON products.id=cart.product_id WHERE cart.user_id=$1",
          [userId]
        );
        const data = cartDetail.rows;

        if (checkoutSession.payment_status === "paid") {
          // Add Orders
          const orderStatus = "ordered";

          data.map(async (item) => {
            await database.query(
              "INSERT INTO orders(product_id, user_id, order_quantity, order_size, order_image, status) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
              [
                item.product_id,
                userId,
                item.cart_quantity,
                item.size,
                item.cart_image,
                orderStatus,
              ]
            );
          });

          // // clear cart
          await database.query("DELETE FROM cart WHERE user_id=$1", [userId]);

          // console.log(
          //   `Checkout session user id was ${checkoutSession.metadata.user_Id}`
          // );
        } else {
          console.log("Something went wrong!");
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return res.send();
  }
);

app.listen(PORT, () => {
  console.log(`server has started on port ${PORT}`);
});
