const mongoose = require("mongoose");

const { connect, Schema, model } = mongoose;

require("dotenv").config();

const URI = process.env.MONGODB_URI;
const Name = process.env.DATABASE_NAME;

connect(URI)
  .then(() => {
    console.log("Connected to MongoDB database successfully.");
  })
  .catch((err) => console.error("Error connecting to MongoDB database:", err));

const Users = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: {
    type: String,
    unique: true,
    required: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    trim: true,
  },
  password: { type: String, required: true, minlength: 8 },
  picture: { type: String, required: false, trim: true },
});

const Users_model = model("Users", Users);

const Products = new Schema({
  id: { type: Number, required: true, unique: true },
  productName: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
});

const Payment = new Schema({
  userid: { type: Number, required: true, unique: true },
  Pmethod: { type: String, required: true },
  lastDigit: { type: Number, required: true },
});

const Order = new Schema({
  address: { type: String, required: true },
  date: { type: Date, required: true },
  Sellername: { type: String, required: true },
  buyerName: { type: String, required: true },
});
const MessageSchema = new Schema({
  fromUser: String,
  toUser: String,
  message: String,
  timestamp: { type: Number, default: Date.now },
  isRead: { type: Boolean, default: false },
});

const Message_model = model("Message", MessageSchema);

const Order_model = model("Order", Order);

const Payment_model = model("Payment", Payment);

const Products_model = model("Products", Products, "products");

module.exports = {
  Users_model,
  Products_model,
  Payment_model,
  Order_model,
  Message_model,
};
