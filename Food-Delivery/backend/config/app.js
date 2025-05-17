const express = require('express');
const app = express();
const db = require('./db'); // or however you import your MySQL connection
app.get('/api/restaurants', async (req, res) => {
  const location = req.query.location;
  let query = 'SELECT * FROM restaurants';
  let params = [];

  if (location) {
    query += ' WHERE location = ?';
    params.push(location);
  }

  try {
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});
