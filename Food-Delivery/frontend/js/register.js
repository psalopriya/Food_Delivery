import { registerUser } from './api.js';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirm = document.getElementById('conform-password').value.trim();

    if (password !== confirm) {
        alert("Passwords do not match");
        return;
    }

    const result = await registerUser(name, email, password);
    alert(result.message);
});
