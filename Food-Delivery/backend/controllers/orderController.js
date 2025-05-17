const db = require('../config/db');

exports.placeOrder = async (req, res) => {
  const { customer_name, customer_email, total_price, items } = req.body;

  if (!customer_name || !customer_email || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Invalid order data.' });
  }

  const conn = await db.getConnection(); // Ensure using pool or promise-based connection

  try {
    await conn.beginTransaction();

    // Insert into orders table
    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_name, customer_email, total_price) VALUES (?, ?, ?)',
      [customer_name, customer_email, total_price]
    );
    const orderId = orderResult.insertId;

    // Insert into order_items table
    const itemInsertPromises = items.map(item => {
      return conn.query(
        'INSERT INTO order_items (order_id, item_name, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.name, item.quantity, item.price]
      );
    });

    await Promise.all(itemInsertPromises);

    await conn.commit();
    res.status(200).json({ message: 'Order placed successfully' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};
