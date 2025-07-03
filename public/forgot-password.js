document.getElementById('forgotForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = e.target.email.value;
  const errorDiv = document.getElementById('forgotError');
  const successDiv = document.getElementById('forgotSuccess');
  errorDiv.textContent = '';
  successDiv.textContent = '';
  try {
    const res = await fetch('/api/v1/auth/forgot-password-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      errorDiv.textContent = data.message || 'Failed to send code';
      return;
    }
    localStorage.setItem('resetEmail', email);
    successDiv.textContent = 'Reset code sent! Check your email.';
    setTimeout(() => window.location.href = '/reset-password.html', 2000);
  } catch (err) {
    errorDiv.textContent = 'Network error';
  }
}); 