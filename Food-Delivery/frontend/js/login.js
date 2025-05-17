//login.js
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store user info and token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);

      // Hide login form
      document.getElementById('login-form').style.display = 'none';

      // Show user account info
      showUserAccount(data.user.name, data.user.email);

      // Check for redirect URL (from cart or protected pages)
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect');
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    document.getElementById('error-message').textContent = error.message;
    document.getElementById('error-message').style.display = 'block';
  }
});

async function showUserAccount(name, email) {
  const container = document.getElementById('login-container'); // Changed to more specific container
  const token = localStorage.getItem('token');

  container.innerHTML = `
    <div class="user-profile">
      <h2>Welcome, ${name}</h2>
      <p>Email: ${email}</p>
      <h3>Your Orders</h3>
      <div id="orders-list">Loading orders...</div>
      <button id="logout-btn" class="btn btn-danger">Logout</button>
    </div>
  `;

  // Logout functionality
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.href = '/login.html'; // Redirect to login page
  });

  // Fetch order history with JWT authentication
  try {
    const response = await fetch(`http://localhost:5000/api/orders/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const orders = await response.json();
      const ordersList = document.getElementById('orders-list');

      if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders yet.</p>';
      } else {
        ordersList.innerHTML = orders.map(order => `
          <div class="order-card">
            <div class="order-header">
              <span class="order-id">Order #${order.id}</span>
              <span class="order-status ${order.status.replace('-', '')}">${order.status}</span>
            </div>
            <div class="order-details">
              <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
              <p>Total: ₹${order.total_price.toFixed(2)}</p>
              <div class="order-items">
                ${order.items.map(item => `
                  <div class="order-item">
                    <span>${item.item_name} (${item.quantity}x)</span>
                    <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('');
      }
    } else {
      throw new Error('Failed to load orders');
    }
  } catch (error) {
    document.getElementById('orders-list').innerHTML = 
      `<p class="error">Error loading orders: ${error.message}</p>`;
  }
}

// On page load, check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');

  if (token && userName && userEmail) {
    document.getElementById('login-form').style.display = 'none';
    showUserAccount(userName, userEmail);
  } else {
    // Show login form if not logged in
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('login-container').style.display = 'block';
  }
});