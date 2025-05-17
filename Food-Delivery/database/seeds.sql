-- database/seeds.sql
INSERT INTO restaurants (name, cuisine_type, delivery_time) VALUES
('Pizza Palace', 'Italian', '30 mins'),
('Burger King', 'American', '20 mins'),
('Sushi Heaven', 'Japanese', '45 mins');

INSERT INTO menu_items (restaurant_id, name, price) VALUES
(1, 'Margherita Pizza', 10.99),
(1, 'Pepperoni Pizza', 12.99),
(2, 'Cheeseburger', 8.99),
(3, 'California Roll', 14.99);
-- Add to your existing seeds.sql
-- Password is "test1234" (hashed)
INSERT INTO users (name, email, password) VALUES
('Test User', 'test@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqUV3a7fRO9F2ZQJx1f5P62/5q.0e');