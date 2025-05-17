const db = require('../config/db');

class Order {
  static async create({ userId, items, totalPrice }) {
    const [result] = await db.query(
      'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
      [userId, totalPrice, 'preparing']
    );
    return result.insertId;
  }

  static async findByUser(userId) {
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    return rows;
  }
}

module.exports = Order;