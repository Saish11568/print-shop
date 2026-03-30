const BASE_URL = "https://print-shop-boqx.onrender.com";
const API = BASE_URL + "/api";

// ==================== SMART EMAIL VALIDATION ====================
function validateSmartEmail(email) {
  if (!email) return { valid: false, msg: 'Please enter your email address.' };

  const parts = email.split('@');
  if (parts.length !== 2) return { valid: false, msg: 'Please enter a valid and meaningful email address.' };

  const [username, domain] = parts;
  if (!domain) return { valid: false, msg: 'Please enter a valid and meaningful email address.' };

  const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com'];
  if (!allowedDomains.includes(domain.toLowerCase())) {
    return { valid: false, msg: 'Only gmail.com, outlook.com, or yahoo.com are allowed.' };
  }

  if (username.length < 5) return { valid: false, msg: 'Email username must be at least 5 characters long.' };

  const blockWords = ['abc', 'xyz', 'test', 'demo', 'user', 'temp'];
  const lowerUser = username.toLowerCase();
  for (let w of blockWords) {
    if (lowerUser.includes(w)) {
      return { valid: false, msg: 'Please enter a valid and meaningful email address.' };
    }
  }

  const hasLetter = /[a-zA-Z]/.test(username);
  const hasNumber = /[0-9]/.test(username);
  const hasFullNamePattern = /[\._]/.test(username);

  if (!hasLetter || (!hasNumber && !hasFullNamePattern)) {
    return { valid: false, msg: 'Please enter a valid and meaningful email address.' };
  }

  return { valid: true, msg: '' };
}

function attachEmailValidator(form, emailInput, submitBtn) {
  if (!emailInput || !form || !submitBtn) return;
  const wrapper = emailInput.closest('.input-with-icon');
  const group = emailInput.closest('.form-group');
  if (!group) return;

  let errEl = group.querySelector('.email-error-msg');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.className = 'email-error-msg text-xs hidden';
    errEl.style.color = '#DC2626';
    errEl.style.fontWeight = '500';
    errEl.style.marginTop = '4px';
    group.appendChild(errEl);
  }

  let successIcon = wrapper.querySelector('.email-success-icon');
  if (!successIcon) {
    successIcon = document.createElement('span');
    successIcon.className = 'input-action-icon email-success-icon hidden';
    successIcon.style.color = '#10B981';
    successIcon.style.right = '10px';
    successIcon.style.top = '10px';
    successIcon.style.pointerEvents = 'none';
    successIcon.style.position = 'absolute';
    successIcon.innerHTML = '✅';
    wrapper.appendChild(successIcon);
  }

  emailInput.addEventListener('input', () => {
    const val = emailInput.value.trim();
    if (val === '') {
      wrapper.classList.remove('input-invalid', 'input-valid');
      errEl.classList.add('hidden');
      successIcon.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
      return;
    }

    const res = validateSmartEmail(val);
    if (!res.valid) {
      wrapper.classList.add('input-invalid');
      wrapper.classList.remove('input-valid');
      errEl.textContent = res.msg;
      errEl.classList.remove('hidden');
      successIcon.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    } else {
      wrapper.classList.remove('input-invalid');
      wrapper.classList.add('input-valid');
      errEl.classList.add('hidden');
      successIcon.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });

  emailInput.addEventListener('blur', () => {
    const val = emailInput.value.trim();
    if (val === '') return;
    const res = validateSmartEmail(val);
    if (!res.valid) {
      wrapper.classList.remove('shake-anim');
      void wrapper.offsetWidth;
      wrapper.classList.add('shake-anim');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const togglePassword = document.getElementById('togglePassword');

  // Signup
  const signupForm = document.getElementById('signupForm');
  const nameInput = document.getElementById('name');
  const signupError = document.getElementById('signupError');
  const signupSuccess = document.getElementById('signupSuccess');
  const signupBtn = document.getElementById('signupBtn');

  // Redirect already-logged-in users away from login/signup pages,
  // but ONLY after verifying the token is still valid on the server.
  const token = localStorage.getItem('ps-token');
  const user = (() => { try { return JSON.parse(localStorage.getItem('loggedInUser')); } catch (e) { return null; } })();

  if (token && user) {
    const roleInput = document.getElementById('fixedRole');
    const expectedRole = roleInput ? roleInput.value : null;

    if (expectedRole && user.role !== expectedRole) {
      console.log(`[Auth] User is logged in as ${user.role}, but visited ${expectedRole} login page. Redirecting...`);
    }

    // For Google login users, bypass backend token verification as it uses a different JWT logic locally
    if (user.loginType === 'google' || (typeof token === 'string' && token.startsWith('google-bypassed-token'))) {
      const roleRedirects = { coordinator: 'cr.html', shop: 'shopkeeper.html', student: 'student.html' };
      const dest = roleRedirects[user.role] || 'student.html';
      window.location.href = dest;
    } else {
      // Verify native token
      fetch(`${API}/verify-token`, {
        headers: { 'Authorization': 'Bearer ' + token }
      })
        .then(r => {
          if (r.ok) {
            const roleRedirects = { coordinator: 'cr.html', shop: 'shopkeeper.html', student: 'student.html' };
            const dest = roleRedirects[user.role];
            if (dest) window.location.href = dest;
          } else {
            // Token is genuinely expired or invalid, so we clear it
            localStorage.removeItem('ps-token');
            localStorage.removeItem('loggedInUser');
          }
        })
        .catch(() => {
          // If offline or backend down, just clear session to be safe (or don't, but following original behavior here)
          localStorage.removeItem('ps-token');
          localStorage.removeItem('loggedInUser');
        });
    }
  }

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
    });
  }

  function showError(container, message) {
    if (!container) return;
    container.classList.remove('hidden');
    const textEl = container.querySelector('.error-text');
    if (textEl) textEl.textContent = message;
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    const btnText = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner-small');
    if (btnText) btnText.style.opacity = loading ? '0' : '1';
    if (spinner) spinner.classList.toggle('hidden', !loading);
    btn.disabled = loading;
  }

  // ==================== LOGIN ====================
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const roleInput = document.getElementById('fixedRole');
      const role = roleInput ? roleInput.value : 'student';

      // BUG FIX: Client-side validation before hitting the server
      if (!email) { showError(loginError, 'Please enter your email address.'); return; }
      if (!password) { showError(loginError, 'Please enter your password.'); return; }

      if (loginError) loginError.classList.add('hidden');
      setLoading(loginBtn, true);

      try {
        const response = await fetch(`${API}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role })
        });

        const result = await response.json();

        if (response.ok) {
          console.log('[Login] Success! User:', result.user);
          console.log('[Login] Role from server:', result.user.role);
          console.log('[Login] Expected role from page:', role);

          localStorage.setItem('ps-token', result.token);
          localStorage.setItem('loggedInUser', JSON.stringify(result.user));

          // Verify role matches expected role for this login page
          if (result.user.role !== role) {
            console.log('[Login] ❌ Role mismatch! Blocking login.');
            showError(loginError, `This account is not a ${role}. Please use the correct login page.`);
            localStorage.removeItem('ps-token');
            localStorage.removeItem('loggedInUser');
            setLoading(loginBtn, false);
            return;
          }

          // Role-based redirect
          const redirectMap = { coordinator: 'cr.html', shop: 'shopkeeper.html', student: 'student.html' };
          const destination = redirectMap[role] || 'student.html';
          console.log('[Login] ✅ Redirecting to:', destination);

          setTimeout(() => {
            window.location.href = destination;
          }, 300);
        } else {
          showError(loginError, result.message || result.error || 'Login failed');
          setLoading(loginBtn, false);
        }
      } catch (err) {
        console.error('Login error:', err);
        showError(loginError, 'Network error. Make sure the backend is running.');
        setLoading(loginBtn, false);
      }
    });
  }

  // ==================== SIGNUP ====================
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log("Signup triggered");

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const roleInput = document.getElementById('fixedRole');
      const role = roleInput ? roleInput.value : 'student';
      const accessKeyInput = document.getElementById('accessKey');
      const accessKey = accessKeyInput ? accessKeyInput.value.trim() : undefined;

      // BUG FIX: Client-side validation before hitting the server
      if (!name) { showError(signupError, 'Please enter your name.'); return; }
      if (!email) { showError(signupError, 'Please enter your email address.'); return; }
      const emailValid = validateSmartEmail(email); if (!emailValid.valid) { showError(signupError, emailValid.msg); return; }
      if (!password) { showError(signupError, 'Please enter a password.'); return; }
      if (password.length < 6) { showError(signupError, 'Password must be at least 6 characters.'); return; }

      if (signupError) signupError.classList.add('hidden');
      if (signupSuccess) signupSuccess.classList.add('hidden');
      setLoading(signupBtn, true);

      try {


        const response = await fetch(`${API}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role, accessKey })
        });

        const result = await response.json();

        if (response.ok) {
          if (signupSuccess) {
            signupSuccess.classList.remove('hidden');
            const successText = signupSuccess.querySelector('.success-text');
            if (successText) successText.textContent = 'Account created! Redirecting to login...';
          }
          setTimeout(() => {
            if (role === 'coordinator') {
              window.location.href = 'cr-login.html';
            } else if (role === 'shop') {
              window.location.href = 'shopkeeper-login.html';
            } else {
              window.location.href = 'student-login.html';
            }
          }, 1500);
        } else {
          showError(signupError, result.error || 'Signup failed');
          setLoading(signupBtn, false);
        }
      } catch (err) {
        console.error('Signup error:', err);
        showError(signupError, 'Network error. Make sure the backend is running.');
        setLoading(signupBtn, false);
      }
    });
  }
});
// ==================== GOOGLE SIGN-IN ====================
window.handleCredentialResponse = function (response) {
  fetch(`${API}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token: response.credential
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error || !data.token) {
      console.error("Google login failed:", data.error);
      return;
    }

    localStorage.setItem("ps-token", data.token);
    localStorage.setItem("loggedInUser", JSON.stringify(data.user));

    // redirect based on role
    if (data.user.role === "coordinator") {
        window.location.href = "cr.html";
    } else if (data.user.role === "shop") {
        window.location.href = "shopkeeper.html";
    } else {
        window.location.href = "student.html";
    }
  })
  .catch(err => {
      console.error("Google login connection failed:", err);
  });
};
