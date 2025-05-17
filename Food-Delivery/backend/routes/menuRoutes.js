// backend/routes/menuRoutes.js
const express = require('express');
const router = express.Router();
const { getMenuByRestaurant } = require('../controllers/menuController');

router.get('/menu', getMenuByRestaurant);

module.exports = router;
