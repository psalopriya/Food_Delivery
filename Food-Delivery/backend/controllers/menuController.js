// backend/controllers/menuController.js
const db = require('../config/db');

exports.getMenuByRestaurant = async (req, res) => {
  const restaurantId = req.query.restaurant_id;
  if (!restaurantId) return res.status(400).json({ error: 'restaurant_id is required' });

  try {
    const [menuItems] = await db.query(
      'SELECT * FROM menu_items WHERE restaurant_id = ?',
      [restaurantId]
    );
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
