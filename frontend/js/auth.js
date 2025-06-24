import { clearintirval, navigate } from "./routes.js";
import { renderPosts } from "./post.js";
import { socket } from "./ws.js";

export function renderLoginForm() {
  const form = `
  <div class="modal-overlay">
  <div class="modal-dialog">
  <div id="loginContainer" class="form-container">
    <h2 class="modal-title">Login</h2>
    <form id="login-form">
    <label for="loginEmail">
    Email or nickname
    <span>*</span>
    </label>
      <input type="text" name="identifier" id="liginEmail" class="input-field" placeholder="Email or Nickname" maxlength="200" required />
      <label for="liginPassword">
      Password
      <span>*</span>
      </label>
      <input type="password" id="loginPassword" class="input-field" name="password" maxlength="100" placeholder="Password" required />
      <button type="submit" id="loginSubmit" class="submit-button disbled">Log In</button>
    </form>
    <p>Don't have an account? <a href="#" id="show-register">Register here</a></p>
    <div id="error" style="color: red;"></div>
    </div>
    </div>
    </div>
  `;

  document.getElementById("app").innerHTML = form;
  document.getElementById("show-register").addEventListener("click", (e) => {
    e.preventDefault();
    navigate("/register")
    // renderRegisterForm();
  });
  // Event handler for login
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      identifier: formData.get("identifier"),
      password: formData.get("password")
    };
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      // console.log("WWWWWWW");
      document.getElementById("error").textContent = data.error || "Login failed";
      return;
    }

    navigate("/home")

    // alert("Login successful! Welcome " + data.name);
    document.getElementById("app").innerHTML = ""
    renderPosts();
  });
}

// Show form on page load
export function renderRegisterForm() {
  const form = `  
    <div class="modal-overlay">
  <div class="modal-dialog">
  <div id="signUpContainer" class="form-container">
    <h2 class="modal-title">Register</h2>
    <form id="register-form" class="auth-from" autocomplete="off">
        <label for="signUpNickName">
        NickName<span>*</span>
        </label>
    <input type="text" name="nickname" id="signUpNickName" class="input-field" placeholder="Nickname" required pattern="^[A-Za-z0-9_]{3,20}$" maxlength="20" />
        <label for="signUpAge">
        Age
          <span>*</span>
        </label>
    <input type="number" name="age" placeholder="Age" id="signUpAge" class="input-field" required min="6" max="120" />
        <label for="signUpGender">
            Gender
          <span>*</span>
        </label>
    <input type="text" name="gender" placeholder="Gender (Male/Female)" id="signUpGender" class="input-field" required maxlength="10"/>
            <label for="signUpFirstName">
            Your First Name
          <span>*</span>
        </label>
    <input type="text" name="firstName" placeholder="First Name" id="signUpFirstName" class="input-field" required pattern="^[A-Za-z]{2,30}$" maxlength="30" />
            <label for="signUpLastName">
            Your Last Name
          <span>*</span>
        </label>
    <input type="text" name="lastName" placeholder="Last Name" id="signUpLastName" class="input-field" required pattern="^[A-Za-z]{2,30}$" maxlength="30" />
            <label for="signUpEmail">
            Your Email
          <span>*</span>
        </label>
      <input type="email" name="email" placeholder="Email" id="signUpEmail" class="input-field" required maxlength="100" />
              <label for="signUpPassword">
              Password
          <span>*</span>
        </label>
      <input type="password" name="password" placeholder="Password" id="signUpPassword" class="input-field" required minlength="4" maxlength="50" />
      <button type="submit" id="signUpSubmit" class="submit-button">Register</button>
    </form>
<p>Already have an account? <a href="#" id="show-login">Login here</a></p>
    <div id="error" style="color: red;"></div>
    </div>
    </div>
    </div>
  `;

  document.getElementById("app").innerHTML = form;
  document.getElementById("register-form").addEventListener("submit", handleRegister);
  document.getElementById("show-login").addEventListener("click", (e) => {
    e.preventDefault();
    navigate("/login")
  });
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const errorDiv = document.getElementById("error");

  // Custom JS validation
  const nickname = form.nickname.value.trim();
  const age = Number(form.age.value);
  const gender = form.gender.value.trim();
  const firstName = form.firstName.value.trim();
  const lastName = form.lastName.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;

  if (!/^[A-Za-z0-9_]{3,20}$/.test(nickname)) {
    errorDiv.textContent = "Nickname must be 3-20 characters, letters, numbers, or underscores.";
    return;
  }
  if (age < 6 || age > 120) {
    errorDiv.textContent = "Age must be between 6 and 120.";
    return;
  }
  if (!/^(Male|Female)$/i.test(gender)) {
    errorDiv.textContent = "Gender must be Male or Female.";
    return;
  }
  if (!/^[A-Za-z]{2,30}$/.test(firstName)) {
    errorDiv.textContent = "First name must be 2-30 letters.";
    return;
  }
  if (!/^[A-Za-z]{2,30}$/.test(lastName)) {
    errorDiv.textContent = "Last name must be 2-30 letters.";
    return;
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    errorDiv.textContent = "Invalid email format.";
    return;
  }
  if (password.length < 4 || password.length > 50) {
    errorDiv.textContent = "Password must be at least 8 characters.";
    return;
  }

  const formData = new FormData(form);
  const payload = {
    nickname: nickname,
    age: age,
    gender: gender,
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password
  };

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    errorDiv.textContent = data.error || "Registration failed";
    return;
  }

  alert("Registration successful! Welcome " + data.nickname);
  document.getElementById("app").innerHTML = "";
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.innerHTML = "";

  renderLoginForm(); // redirect to login
}

export async function logout() {
  clearInterval(clearintirval)
  const res = await fetch('/api/logout', { method: 'POST' });
  // alert('Logged out successfully!');
  // window.location.reload();
  navigate("/login");
  socket.close()
}