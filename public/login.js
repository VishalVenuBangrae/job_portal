document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value;
  const password = form.password.value;
  const errorDiv = document.getElementById('loginError');
  errorDiv.textContent = '';

  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.message && data.message.includes('verify your email')) {
        localStorage.setItem('pendingVerifyEmail', email);
        window.location.href = '/verify-email.html';
        return;
      }
      errorDiv.textContent = data.message || 'Login failed';
      return;
    }
    // Store token and userType, redirect to correct dashboard
    localStorage.setItem('token', data.token);
    localStorage.setItem('userType', data.userType);
    if (data.userType === 'employer') {
      window.location.href = '/employer.html';
    } else {
      window.location.href = '/jobseeker.html';
    }
  } catch (err) {
    errorDiv.textContent = 'Network error';
  }
}); 