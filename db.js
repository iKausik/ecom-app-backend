const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// production server config
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  user: process.env.HEROKU_PSQL_USER || "postgres",
  password: process.env.HEROKU_PSQL_PASSWORD || "hello@sql",
  host: process.env.HEROKU_PSQL_HOST || "localhost",
  port: process.env.HEROKU_PSQL_PORT || 5432,
  database: process.env.HEROKU_PSQL_DATABASE || "sneakpick",
});

// dev server config
// const pool = new Pool({
//   user: "postgres",
//   password: "hello@sql",
//   host: "localhost",
//   port: 5432,
//   database: "sneakpick",
// });

// Drop Tables if Exists
// const dropTablesIfExists = async () => {
//   try {
//     await pool.query("DROP TABLE IF EXISTS users");
//     await pool.query("DROP TABLE IF EXISTS products");
//     await pool.query("DROP TABLE IF EXISTS address");
//     await pool.query("DROP TABLE IF EXISTS cart");
//     await pool.query("DROP TABLE IF EXISTS orders");
//   } catch (err) {
//     console.error(err.message);
//   }
// };
// dropTablesIfExists();

// Users Table
const createUsersTable = async () => {
  try {
    await pool.query(
      "CREATE TABLE users(id SERIAL PRIMARY KEY, username VARCHAR(255) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, firstname VARCHAR(255) NOT NULL, lastname VARCHAR(255) NOT NULL, phone NUMERIC(20, 0))"
    );
  } catch (err) {
    console.error(err.message);
  }
};
createUsersTable();

// Products Table
const createProductsTable = async () => {
  try {
    await pool.query(
      "CREATE TABLE products(id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, price NUMERIC(8, 2) NOT NULL, category VARCHAR(255) NOT NULL, label VARCHAR(255), description VARCHAR(500) NOT NULL, quantity INT NOT NULL, image1 VARCHAR(1000) NOT NULL, image2 VARCHAR(1000), image3 VARCHAR(1000), image4 VARCHAR(1000), btn_color1 VARCHAR(255) NOT NULL, btn_color2 VARCHAR(255) NOT NULL, btn_color3 VARCHAR(255) NOT NULL, btn_color4 VARCHAR(255) NOT NULL)"
    );
  } catch (err) {
    console.error(err.message);
  }
};
createProductsTable();

// Address Table
const createAddressTable = async () => {
  try {
    await pool.query(
      "CREATE TABLE address(id SERIAL PRIMARY KEY, zip VARCHAR(255) NOT NULL, address VARCHAR(255) NOT NULL, locality VARCHAR(255) NOT NULL, city VARCHAR(255) NOT NULL, state VARCHAR(255) NOT NULL, user_id INT, CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id))"
    );
  } catch (err) {
    console.error(err.message);
  }
};
createAddressTable();

// Cart Table
const createCartTable = async () => {
  try {
    await pool.query(
      "CREATE TABLE cart(id SERIAL PRIMARY KEY, product_id INT, CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES products(id), user_id INT, CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id), quantity INT NOT NULL, size VARCHAR(255) NOT NULL, cart_image VARCHAR(1000) NOT NULL)"
    );
  } catch (err) {
    console.error(err.message);
  }
};
createCartTable();

// Orders Table
const createOrdersTable = async () => {
  try {
    await pool.query(
      "CREATE TABLE orders(id SERIAL PRIMARY KEY, product_id INT, CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES products(id), user_id INT, CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id), order_quantity INT NOT NULL, order_size VARCHAR(255) NOT NULL, order_image VARCHAR(1000) NOT NULL, status VARCHAR(255) NOT NULL, order_date DATE NOT NULL DEFAULT CURRENT_DATE)"
    );
  } catch (err) {
    console.error(err.message);
  }
};
createOrdersTable();

module.exports = pool;
