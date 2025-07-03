document.getElementById('resetForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = e.target.email.value;
  const code = e.target.code.value;
  const newPassword = e.target.newPassword.value;
  const errorDiv = document.getElementById('resetError');
  const successDiv = document.getElementById('resetSuccess');
  errorDiv.textContent = '';
  successDiv.textContent = '';
  try {
    const res = await fetch('/api/v1/auth/reset-password-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword })
    });
    const data = await res.json();
    if (!res.ok) {
      errorDiv.textContent = data.message || 'Failed to reset password';
      return;
    }
    successDiv.textContent = 'Password reset successful! Redirecting to login...';
    setTimeout(() => window.location.href = '/login.html', 2000);
  } catch (err) {
    errorDiv.textContent = 'Network error';
  }
}); 