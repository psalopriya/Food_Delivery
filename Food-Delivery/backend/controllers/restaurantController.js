// backend/controllers/restaurantController.js
const db = require('../config/db');

exports.getAllRestaurants = async (req, res) => {
  try {
    const [restaurants] = await db.query('SELECT * FROM restaurants');
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
