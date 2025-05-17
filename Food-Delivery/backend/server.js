require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-strong-secret-key';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// --------------------- AUTHENTICATION MIDDLEWARE ----------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --------------------- API ROUTES ----------------------

// User Authentication routes
app.post('/api/users/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (users.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email.toLowerCase(), passwordHash]
    );

    res.status(201).json({ 
      message: 'Registration successful',
      user: { id: result.insertId, name, email }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Restaurant routes
app.get('/api/restaurants', async (req, res) => {
  const location = req.query.location;
  let query = 'SELECT * FROM restaurants';
  const params = [];

  if (location) {
    query += ' WHERE location = ?';
    params.push(location);
  }

  try {
    const [restaurants] = await db.query(query, params);
    res.json(restaurants);
  } catch (error) {
    console.error('Database error fetching restaurants:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/menu', async (req, res) => {
  const restaurantId = req.query.restaurant_id;

  if (!restaurantId || isNaN(Number(restaurantId))) {
    return res.status(400).json({ error: 'Valid restaurant_id query parameter is required' });
  }

  try {
    const [menuItems] = await db.query(
      'SELECT * FROM menu_items WHERE restaurant_id = ?',
      [restaurantId]
    );

    if (menuItems.length === 0) {
      return res.status(404).json({ error: 'No menu items found for this restaurant' });
    }

    res.json(menuItems);
  } catch (err) {
    console.error('Error fetching menu items:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Order routes (protected)
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { items, total_price } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(items) || items.length === 0 || !total_price) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get user details
    const [user] = await conn.query('SELECT name, email FROM users WHERE id = ?', [userId]);
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, customer_name, customer_email, total_price, status) VALUES (?, ?, ?, ?, ?)',
      [userId, user[0].name, user[0].email, total_price, 'preparing']
    );

    const orderId = orderResult.insertId;

    // Add order items
    await Promise.all(items.map(item => 
      conn.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.price]
      )
    ));

    await conn.commit();
    res.json({ 
      message: 'Order placed successfully', 
      orderId 
    });

  } catch (err) {
    await conn.rollback();
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

app.patch('/api/orders/:id', authenticateToken, async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['preparing', 'on-the-way', 'delivered'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------- FRONTEND FALLBACK ----------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ---------------------- ERROR HANDLING --------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// ---------------------- START SERVER ---------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});