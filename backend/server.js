// ============================================================
//  VAARADHI SWEETS — server.js
//  Backend: Node.js + Express + MongoDB
//  Routes: Products, Orders, Contact, Users
// ============================================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
const path = require("path");

app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// ── MONGODB CONNECTION ────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vaaradhi")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// ── SCHEMAS ──────────────────────────────────────────────────

const productSchema = new mongoose.Schema({
  name:     String,
  telugu:   String,
  price:    Number,
  unit:     String,
  img:      String,
  tag:      String,
  category: String,
  stock:    { type: Number, default: 100 },
  rating:   { type: Number, default: 4.5 },
});

const orderSchema = new mongoose.Schema({
  customerName:  String,
  phone:         String,
  email:         String,
  address:       String,
  items:         Array,
  total:         Number,
  status:        { type: String, default: "pending" },
  paymentMethod: { type: String, default: "COD" },
  createdAt:     { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  name:      String,
  email:     { type: String, unique: true },
  phone:     String,
  password:  String,
  createdAt: { type: Date, default: Date.now },
});

const contactSchema = new mongoose.Schema({
  name:      String,
  email:     String,
  message:   String,
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);
const Order   = mongoose.model("Order", orderSchema);
const User    = mongoose.model("User", userSchema);
const Contact = mongoose.model("Contact", contactSchema);

// ── PRODUCT ROUTES ───────────────────────────────────────────

// GET all products
app.get("/api/products", async (req, res) => {
  try {
    const { category, search } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (search)   filter.name = { $regex: search, $options: "i" };
    const products = await Product.find(filter);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ORDER ROUTES ─────────────────────────────────────────────

// POST create order
app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, phone, email, address, items, total, paymentMethod } = req.body;
    if (!customerName || !phone || !items?.length) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const order = await Order.create({ customerName, phone, email, address, items, total, paymentMethod });

    // Send confirmation email
    await sendOrderEmail(order);

    res.json({ success: true, orderId: order._id, message: "Order placed successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all orders (admin)
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders, total: orders.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update order status
app.patch("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── USER ROUTES ──────────────────────────────────────────────

// POST register
app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });

    // NOTE: In production, hash the password with bcrypt!
    const user = await User.create({ name, email, phone, password });
    res.json({ success: true, message: "Registered successfully!", userId: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST login
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── CONTACT ROUTE ────────────────────────────────────────────

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await Contact.create({ name, email, message });
    res.json({ success: true, message: "Message received! We'll reply within 24 hours." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ANALYTICS ROUTE ──────────────────────────────────────────

app.get("/api/analytics", async (req, res) => {
  try {
    const totalOrders  = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const revenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    const totalRevenue = revenue[0]?.total || 0;
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: { totalOrders, pendingOrders, totalRevenue, recentOrders }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── EMAIL HELPER ─────────────────────────────────────────────
async function sendOrderEmail(order) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const itemList = order.items.map(i => `• ${i.name} x${i.qty} = ₹${i.price * i.qty}`).join("\n");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Order from ${order.customerName} — ₹${order.total}`,
      text: `
New order received at Vaaradhi Sweets!

Customer: ${order.customerName}
Phone: ${order.phone}
Address: ${order.address}

Items:
${itemList}

Total: ₹${order.total}
Payment: ${order.paymentMethod}
      `,
    });
  } catch (err) {
    console.log("Email not sent:", err.message);
  }
}

// ── SEED PRODUCTS (run once) ─────────────────────────────────
app.post("/api/seed", async (req, res) => {
  const products = [
    { name:"Kovapuri",        telugu:"కోవాపురి",          price:400,  unit:"kg",    category:"milk",        tag:"Best Seller" },
    { name:"Rasagulla",       telugu:"రసగుల్లా",          price:580,  unit:"dozen", category:"milk",        tag:"" },
    { name:"Ice Cream Burfi", telugu:"ఐస్‌క్రీమ్ బర్ఫీ", price:700,  unit:"kg",    category:"burfi",       tag:"" },
    { name:"Soan Papdi",      telugu:"సోన్ పప్డీ",        price:450,  unit:"kg",    category:"dry",         tag:"" },
    { name:"Palkova",         telugu:"పాలకోవా",           price:560,  unit:"kg",    category:"milk",        tag:"" },
    { name:"Mysore Pak",      telugu:"మైసూర్ పాక్",      price:560,  unit:"kg",    category:"burfi",       tag:"" },
    { name:"Kaju Katli",      telugu:"కాజూ కట్లి",       price:1300, unit:"kg",    category:"dry",         tag:"Premium" },
    { name:"Motichur Laddu",  telugu:"మోతిచూర్ లడ్డు",  price:660,  unit:"kg",    category:"laddu",       tag:"" },
    { name:"Bobbatlu",        telugu:"బొబ్బట్లు",         price:400,  unit:"dozen", category:"traditional", tag:"Traditional" },
    { name:"Putharekhulu",    telugu:"పూతరేకులు",         price:1150, unit:"kg",    category:"traditional", tag:"Rare" },
  ];
  await Product.deleteMany({});
  await Product.insertMany(products);
  res.json({ success: true, message: `${products.length} products seeded!` });
});

// ── START SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Vaaradhi Sweets server running at http://localhost:${PORT}`);
});
