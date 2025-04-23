function renderLoginForm() {
  const form = `
  <div class="modal-overlay">
  <div class="modal-dialog">
  <span id="closeModalBtn" class="close-button">×</span>
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
    renderRegisterForm();
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
      document.getElementById("error").textContent = data.error || "Login failed";
      return;
    }

    alert("Login successful! Welcome " + data.name);
  });
}

// Show form on page load
window.addEventListener("DOMContentLoaded", renderLoginForm);
function renderRegisterForm() {
  const form = `  
    <div class="modal-overlay">
  <div class="modal-dialog">
  <span id="closeModalBtn" class="close-button">×</span>
  <div id="signUpContainer" class="form-container">
    <h2 class="modal-title">Register</h2>
    <form id="register-form" class="auth-from">
        <label for="signUpNickName">
        NickName
          <span>*</sapn>
        </label>
    <input type="text" name="nickname" id="signUpNickName" class="input-field" placeholder="Nickname" required />
        <label for="signUpAge">
        Age
          <span>*</sapn>
        </label>
    <input type="number" name="age" placeholder="Age" id="signUpAge" class="input-field" required />
            <label for="signUpGender">
            Gender
          <span>*</sapn>
        </label>
    <input type="text" name="gender" placeholder="Gender" id="signUpGender" class="input-field" required />
            <label for="signUpFirstName">
            Yor First Name
          <span>*</sapn>
        </label>
    <input type="text" name="firstName" placeholder="First Name" id="signUpFirtName" class="input-field" required />
            <label for="signUpLastName">
            Your Last Name
          <span>*</sapn>
        </label>
    <input type="text" name="lastName" placeholder="Last Name" id="signUpLastName" class="input-field" required />
            <label for="signUpEmail">
            Youe Email
          <span>*</sapn>
        </label>
      <input type="email" name="email" placeholder="Email" id="signUpEmail" class="input-field" required />
              <label for="signUpPassword">
              Password
          <span>*</sapn>
        </label>
      <input type="password" name="password" placeholder="Password" id="signUpPassword" class="input-field" required />
      <button type="submit" id="signUpSubmit" class="submit-button disbled" >Register</button>
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
    renderLoginForm();
  });
  document.getElementById("register-form").addEventListener("submit", async(e)=> {
    e.preventDefault();

  })
}

//ff
async function handleRegister(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = {
    nickname: formData.get("nickname"),
    age: Number(formData.get("age")),
    gender: formData.get("gender"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password")
  };

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    document.getElementById("error").textContent = data.error || "Registration failed";
    return;
  }

  alert("Registration successful! Welcome " + data.nickname);
  renderLoginForm(); // redirect to login
}
