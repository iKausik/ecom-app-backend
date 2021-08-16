const Joi = require("joi");

// Register Form Validation
const registerValidation = (username, firstname, lastname, email, password) => {
  const schema = Joi.object({
    username: Joi.string().min(3).required(),
    firstname: Joi.string().min(3).required(),
    lastname: Joi.string().min(3).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate({
    username: username,
    firstname: firstname,
    lastname: lastname,
    email: email,
    password: password,
  });
};

// Login Form Validation
const loginValidation = (username, password) => {
  const schema = Joi.object({
    username: Joi.string().min(3).required(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate({
    username: username,
    password: password,
  });
};

// Add Address Form Validation
const addressValidation = (address, locality, city, state, zip) => {
  const schema = Joi.object({
    address: Joi.string().required(),
    locality: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zip: Joi.number().required(),
  });
  return schema.validate({
    address: address,
    locality: locality,
    city: city,
    state: state,
    zip: zip,
  });
};

// Add Product Form Validation
const productValidation = (
  title,
  price,
  quantity,
  description,
  category,
  label,
  image1,
  image2,
  image3
) => {
  const schema = Joi.object({
    title: Joi.string().min(6).required(),
    price: Joi.number().min(2).required(),
    quantity: Joi.number().min(1).required(),
    description: Joi.string().min(10).required(),
    category: Joi.string().required(),
    label: Joi.string(),
    image1: Joi.string().required(),
    image2: Joi.string(),
    image3: Joi.string(),
  });
  return schema.validate({
    title: title,
    price: price,
    quantity: quantity,
    description: description,
    category: category,
    label: label,
    image1: image1,
    image2: image2,
    image3: image3,
  });
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.addressValidation = addressValidation;
module.exports.productValidation = productValidation;
