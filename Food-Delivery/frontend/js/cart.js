document.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartBody = document.getElementById('cart-body');
    const totalAmount = document.getElementById('total-amount');
    const emptyCartMsg = document.getElementById('empty-cart-message');

    // Clear existing rows (except empty row)
    if (cart.length === 0) {
        emptyCartMsg.style.display = 'table-row';
        totalAmount.textContent = 'Total: ₹0.00';
        return;
    }

    // Hide "Your cart is empty" message
    emptyCartMsg.style.display = 'none';

    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${itemTotal.toFixed(2)}</td>
            <td><button class="remove-btn" data-index="${index}">X</button></td>
        `;
        cartBody.appendChild(row);
    });

    totalAmount.textContent = `Total: ₹${total.toFixed(2)}`;

    // Handle remove item
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            location.reload(); // Refresh the page to re-render
        });
    });
});
