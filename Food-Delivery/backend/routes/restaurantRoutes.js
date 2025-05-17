// backend/routes/restaurantRoutes.js
const express = require('express');
const router = express.Router();
const { getAllRestaurants } = require('../controllers/restaurantController');

router.get('/restaurants', getAllRestaurants);

module.exports = router;
