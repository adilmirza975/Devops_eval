const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();

// ─── Database Configuration ──────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('rds.amazonaws.com')
    ? { rejectUnauthorized: false }
    : false
});

// Fallback data for tests or when DB is unavailable
const productsFallback = [
  { id: 1, name: 'Wireless Headphones', price: 2499, category: 'Electronics', rating: 4.5, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop' },
  { id: 2, name: 'Running Shoes', price: 1899, category: 'Fashion', rating: 4.2, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop' },
  { id: 3, name: 'Coffee Maker', price: 3299, category: 'Kitchen', rating: 4.7, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop' },
  { id: 4, name: 'Yoga Mat', price: 799, category: 'Sports', rating: 4.4, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=300&h=300&fit=crop' },
  { id: 5, name: 'Backpack', price: 1299, category: 'Fashion', rating: 4.3, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop' },
  { id: 6, name: 'Smart Watch', price: 4999, category: 'Electronics', rating: 4.6, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop' },
  { id: 7, name: 'Desk Lamp', price: 599, category: 'Home', rating: 4.1, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&h=300&fit=crop' },
  { id: 8, name: 'Water Bottle', price: 399, category: 'Sports', rating: 4.8, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=300&fit=crop' },
];

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// In-memory cart: { productId: quantity }
let cart = {};

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShopSmart Backend is running', timestamp: new Date().toISOString() });
});

// GET all products (with optional category filter)
app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  try {
    if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
    
    let query = 'SELECT * FROM products';
    const params = [];
    if (category) {
      query += ' WHERE LOWER(category) = LOWER($1)';
      params.push(category);
    }
    
    const { rows } = await pool.query(query);
    res.json({ products: rows, total: rows.length });
  } catch (err) {
    // Fallback for tests or local dev without DB
    const result = category
      ? productsFallback.filter(p => p.category.toLowerCase() === category.toLowerCase())
      : productsFallback;
    res.json({ products: result, total: result.length });
  }
});

// GET single product by id
app.get('/api/products/:id', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    const product = productsFallback.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  }
});

// GET all unique categories
app.get('/api/categories', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
    const { rows } = await pool.query('SELECT DISTINCT category FROM products');
    const categories = rows.map(r => r.category);
    res.json({ categories });
  } catch (err) {
    const categories = [...new Set(productsFallback.map(p => p.category))];
    res.json({ categories });
  }
});

// GET cart (with full product info)
app.get('/api/cart', async (req, res) => {
  try {
    const productIds = Object.keys(cart);
    if (productIds.length === 0) return res.json({ items: [], total: 0, count: 0 });

    let items;
    if (process.env.DATABASE_URL) {
      const { rows } = await pool.query('SELECT * FROM products WHERE id = ANY($1)', [productIds]);
      items = rows.map(product => ({ ...product, quantity: cart[product.id] }));
    } else {
      items = productIds.map(id => {
        const product = productsFallback.find(p => p.id === parseInt(id));
        return product ? { ...product, quantity: cart[id] } : null;
      }).filter(Boolean);
    }

    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    res.json({ items, total, count: items.reduce((s, i) => s + i.quantity, 0) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart details' });
  }
});

// POST add item to cart
app.post('/api/cart', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });

  try {
    if (process.env.DATABASE_URL) {
      const { rows } = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    } else {
      const product = productsFallback.find(p => p.id === parseInt(productId));
      if (!product) return res.status(404).json({ error: 'Product not found' });
    }

    cart[productId] = (cart[productId] || 0) + quantity;
    res.json({ message: 'Added to cart', productId, quantity: cart[productId] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE remove item from cart
app.delete('/api/cart/:productId', (req, res) => {
  const { productId } = req.params;
  if (!cart[productId]) return res.status(404).json({ error: 'Item not in cart' });
  delete cart[productId];
  res.json({ message: 'Removed from cart', productId });
});

// DELETE clear entire cart
app.delete('/api/cart', (req, res) => {
  cart = {};
  res.json({ message: 'Cart cleared' });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Catch-all
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
