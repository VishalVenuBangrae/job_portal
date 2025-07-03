document.getElementById('signupForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const errorDiv = document.getElementById('signupError');
  errorDiv.textContent = '';

  try {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      errorDiv.textContent = data.message || 'Registration failed';
      return;
    }
    // Redirect to verify email page and prefill email
    localStorage.setItem('pendingVerifyEmail', form.email.value);
    window.location.href = '/verify-email.html';
  } catch (err) {
    errorDiv.textContent = 'Network error';
  }
}); 