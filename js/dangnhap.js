// Elements chính
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showLogin = document.getElementById('show-login');
const showRegister = document.getElementById('show-register');

// Helpers an toàn
const safeGet = id => document.getElementById(id);

// ---------------- HIỂN THỊ FORM ----------------
if (showRegister && loginForm && registerForm) {
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });
}

if (showLogin && loginForm && registerForm) {
  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });
}

// ---------------- XỬ LÝ ĐĂNG KÝ ----------------
if (registerForm) {
  // tạo vùng báo lỗi cho form đăng ký nếu chưa có
  let registerError = safeGet('register-error');
  if (!registerError) {
    registerError = document.createElement('small');
    registerError.id = 'register-error';
    registerError.className = 'error-message';
    // chèn vào sau input password trong register form (nếu tồn tại)
    const regPw = safeGet('register-password');
    if (regPw && regPw.parentNode) regPw.parentNode.appendChild(registerError);
    else registerForm.appendChild(registerError);
  }

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (safeGet('register-name')?.value || '').trim();
    const email = (safeGet('register-email')?.value || '').trim();
    const password = (safeGet('register-password')?.value || '').trim();

    registerError.style.display = 'none';

    if (password.length < 6) {
      registerError.textContent = 'Mật khẩu phải ít nhất 6 ký tự!';
      registerError.style.display = 'block';
      return;
    }
      const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;
  if (!specialCharPattern.test(password)) {
    registerError.textContent = 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt!';
    registerError.style.display = 'block';
    return;
  }

    const user = { name, email, password };
    localStorage.setItem(email, JSON.stringify(user));

    // reset + chuyển về login
    registerForm.reset();
    if (showLogin) showLogin.click();
  });
}

// ---------------- XỬ LÝ ĐĂNG NHẬP (LỖI NHỎ) ----------------
if (loginForm) {
  // đảm bảo có thẻ small cho email/password
  const ensureSmall = (id, inputId) => {
    let el = safeGet(id);
    if (!el) {
      el = document.createElement('small');
      el.id = id;
      el.className = 'error-message';
      const input = safeGet(inputId);
      if (input && input.parentNode) input.parentNode.appendChild(el);
      else loginForm.appendChild(el);
    }
    return el;
  };

  const emailError = ensureSmall('email-error', 'login-username-email');
  const passwordError = ensureSmall('password-error', 'login-password');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

   const loginInput = (safeGet('login-username-email')?.value || '').trim();
   


    const password = (safeGet('login-password')?.value || '').trim();

    emailError.style.display = 'none';
    passwordError.style.display = 'none';
      let user = null;
      //tìm theo mail trước
    const userJson = localStorage.getItem(loginInput);
   
    try { user = userJson ? JSON.parse(userJson) : null; } catch { user = null; }
// khồng tìm thấy theo mail thì tìm theo tên
 if (!user) {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // skip key lưu currentUser
    if (key === 'currentUser') continue;

    let tmpUser = null;
    try { tmpUser = JSON.parse(localStorage.getItem(key)); } catch {}
    if (tmpUser && tmpUser.name === loginInput) {
      user = tmpUser;
      break;
    }
  }
}
//check tồn tại user
if (!user) {
  emailError.textContent = 'Email hoặc tên không tồn tại';
  emailError.style.display = 'block';
  return;

}
//check mật khẩu
if (user.password !== password) {
  passwordError.textContent = 'Mật khẩu không đúng';
  passwordError.style.display = 'block';
  return;
}

    localStorage.setItem('currentUser', JSON.stringify(user));
    // chuyển trang (đổi URL nếu cần)
    window.location.href = "http://localhost:3000/index.html";
  });
}

// ---------------- 👁 Toggle ẩn/hiện mật khẩu ----------------
const togglePw = safeGet('togglePw');
const pwInput = safeGet('login-password');
if (togglePw && pwInput) {
  togglePw.addEventListener('click', () => {
    const type = pwInput.getAttribute('type') === 'password' ? 'text' : 'password';
    pwInput.setAttribute('type', type);
    togglePw.classList.toggle('fa-eye-slash');
  });
}

// ---------------- FORGOT PASSWORD ----------------
const forgotLink = safeGet('forgot-link');
const forgotPopup = safeGet('forgot-popup');
const closePopup = safeGet('close-popup');
const sendReset = safeGet('send-reset');
const resetEmail = safeGet('reset-email');

let forgotError = null;
if (resetEmail) {
  // tạo vùng lỗi nhỏ cạnh ô input reset email (nếu chưa có)
  forgotError = document.createElement('small');
  forgotError.className = 'error-message';
  forgotError.style.color = 'red';
  forgotError.style.display = 'none';
  resetEmail.parentNode && resetEmail.parentNode.insertBefore(forgotError, resetEmail.nextSibling);
}

if (forgotLink && forgotPopup) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotPopup.classList.add('active');
    if (forgotError) { forgotError.style.display = 'none'; forgotError.style.color = 'red'; }
  });
}

if (closePopup && forgotPopup) {
  closePopup.addEventListener('click', () => {
    forgotPopup.classList.remove('active');
  });
}

if (sendReset && resetEmail) {
  sendReset.addEventListener('click', (e) => {
    e.preventDefault();
    const email = (resetEmail.value || '').trim();
    if (!forgotError) return;
    forgotError.style.display = 'none';

    if (email === '') {
      forgotError.textContent = 'Vui lòng nhập email!';
      forgotError.style.display = 'block';
    } else if (!localStorage.getItem(email)) {
      forgotError.textContent = 'Email này chưa được đăng ký!';
      forgotError.style.display = 'block';
    } else {
      forgotError.style.color = 'green';
      forgotError.textContent = `Đã gửi link khôi phục mật khẩu đến ${email}`;
      forgotError.style.display = 'block';
    }
  });
}
