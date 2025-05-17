//restaurant.js
document.addEventListener('DOMContentLoaded', () => {
    const isMenuPage = window.location.pathname.includes('menu.html');

    if (isMenuPage) {
        loadMenuForRestaurant();
    } else {
        const savedLocation = localStorage.getItem('user_location') || '';
        document.getElementById('location-input').value = savedLocation;
        loadRestaurants(savedLocation);

        document.getElementById('location-btn')?.addEventListener('click', () => {
            const locationInput = document.getElementById('location-input').value.trim();
            localStorage.setItem('user_location', locationInput); // ✅ Save location
            loadRestaurants(locationInput);
        });
    }
});

async function loadRestaurants(location = '') {
    let url = 'http://localhost:5000/api/restaurants';
    if (location) {
        url += `?location=${encodeURIComponent(location)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch restaurants');

        const restaurants = await response.json();
        const container = document.getElementById('restaurants-list');
        if (!container) return;

        container.innerHTML = '';

        if (restaurants.length === 0) {
            container.innerHTML = '<p>No restaurants found for this location.</p>';
            return;
        }

        restaurants.forEach(restaurant => {
            const div = document.createElement('div');
            div.className = 'restaurant-card';
            div.innerHTML = `
                <h3>${restaurant.name}</h3>
                <p><strong>Cuisine:</strong> ${restaurant.cuisine_type}</p>
                <p><strong>Address:</strong> ${restaurant.shopAddress || 'N/A'}</p>
                <button onclick="location.href='menu.html?restaurant_id=${restaurant.id}'">View Menu</button>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        const container = document.getElementById('restaurants-list');
        if (container) {
            container.innerHTML = '<p>Error loading restaurants.</p>';
        }
    }
}

function loadMenuForRestaurant() {
    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = urlParams.get('restaurant_id');
    const dishesDiv = document.getElementById('dishes');

    if (!restaurantId) {
        dishesDiv.innerHTML = "<p>No restaurant selected.</p>";
        return;
    }

    fetch(`http://localhost:5000/api/menu?restaurant_id=${restaurantId}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                dishesDiv.innerHTML = "<p>No dishes found for this restaurant.</p>";
            } else {
                dishesDiv.innerHTML = '';
                data.forEach(item => {
                    const dish = document.createElement('div');
                    dish.classList.add('dish-item');
                    dish.innerHTML = `
                        <h3>${item.name}</h3>
                        <p>Price: ₹${item.price}</p>
                        <div class="quantity-control">
                            <button class="decrement">-</button>
                            <input type="number" value="1" min="1" readonly />
                            <button class="increment">+</button>
                        </div>
                        <button class="add-to-cart">Add to Cart</button>
                    `;
                    dishesDiv.appendChild(dish);

                    // Quantity functionality
                    const decrementBtn = dish.querySelector('.decrement');
                    const incrementBtn = dish.querySelector('.increment');
                    const quantityInput = dish.querySelector('input');

                    decrementBtn.addEventListener('click', () => {
                        const current = parseInt(quantityInput.value);
                        if (current > 1) quantityInput.value = current - 1;
                    });

                    incrementBtn.addEventListener('click', () => {
                        quantityInput.value = parseInt(quantityInput.value) + 1;
                    });

                    // Add to Cart button functionality
                    const addToCartBtn = dish.querySelector('.add-to-cart');
                    addToCartBtn.addEventListener('click', () => {
                        const cart = JSON.parse(localStorage.getItem('cart')) || [];

                        const cartItem = {
                            id: item.id,       // unique id for the dish
                            name: item.name,
                            price: item.price,
                            quantity: parseInt(quantityInput.value)
                        };

                        // Check if item already exists in cart
                        const existingIndex = cart.findIndex(ci => ci.id === cartItem.id);
                        if (existingIndex > -1) {
                            cart[existingIndex].quantity += cartItem.quantity;  // update quantity
                        } else {
                            cart.push(cartItem);  // add new item
                        }

                        localStorage.setItem('cart', JSON.stringify(cart));  // save updated cart

                        //alert(`${cartItem.name} added to cart!`);
                    });
                });
            }
        })
        .catch(err => {
            console.error("Error fetching menu:", err);
            dishesDiv.innerHTML = "<p>Error loading menu.</p>";
        });
}
