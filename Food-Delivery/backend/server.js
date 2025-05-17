const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Get restaurants (optionally by location)
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
  } catch (err) {
    console.error('Restaurant fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get menu items by restaurant ID
app.get('/api/menu', async (req, res) => {
  const restaurantId = req.query.restaurant_id;
  if (!restaurantId || isNaN(Number(restaurantId))) {
    return res.status(400).json({ error: 'Valid restaurant_id required' });
  }

  try {
    const [items] = await db.query(
      'SELECT * FROM menu_items WHERE restaurant_id = ?',
      [restaurantId]
    );
    res.json(items);
  } catch (err) {
    console.error('Menu fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fallback route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
