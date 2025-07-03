document.addEventListener('DOMContentLoaded', function() {
  const emailInput = document.querySelector('input[name="email"]');
  const pendingEmail = localStorage.getItem('pendingVerifyEmail');
  if (pendingEmail) {
    emailInput.value = pendingEmail;
    localStorage.removeItem('pendingVerifyEmail');
    document.getElementById('verifySuccess').textContent = 'A verification code was sent to your email. Please check your inbox.';
  }
});

document.getElementById('verifyForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = e.target.email.value;
  const code = e.target.code.value;
  const errorDiv = document.getElementById('verifyError');
  const successDiv = document.getElementById('verifySuccess');
  errorDiv.textContent = '';
  successDiv.textContent = '';
  try {
    const res = await fetch('/api/v1/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!res.ok) {
      errorDiv.textContent = data.message || 'Verification failed';
      return;
    }
    successDiv.textContent = 'Email verified! You can now log in.';
    setTimeout(() => window.location.href = '/login.html', 2000);
  } catch (err) {
    errorDiv.textContent = 'Network error';
  }
});

document.getElementById('resendBtn').addEventListener('click', async function() {
  const email = document.querySelector('input[name="email"]').value;
  const resendSuccessDiv = document.getElementById('resendSuccess');
  resendSuccessDiv.textContent = '';
  if (!email) {
    resendSuccessDiv.textContent = 'Please enter your email above first.';
    return;
  }
  try {
    const res = await fetch('/api/v1/auth/resend-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    resendSuccessDiv.textContent = data.message || 'Verification email resent.';
  } catch (err) {
    resendSuccessDiv.textContent = 'Network error';
  }
}); 