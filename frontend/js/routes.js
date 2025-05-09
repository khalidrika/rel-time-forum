import { renderLoginForm, renderRegisterForm } from "./auth.js";
import { renderPosts } from "./post.js";

let routes = {};

window.addEventListener("DOMContentLoaded", () => {
  routes = {
    '/login': renderLoginForm,
    '/register': renderRegisterForm,
    '/home': async () => {
      try {
        await renderPosts()
      } catch (error) {
        console.error("Failed to render posts:", error);
      }
    },
  }
  renderPage(window.location.pathname)
});


export function navigate(path) {
  history.pushState({}, '', path);
  renderPage(path);
}


export function renderPage(path) {
  console.log(path);

  // const page = routes[path] || 'login';

  //document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // document.getElementById(page).classList.add('active');
  if (routes[path]) {
    routes[path]()
    // navigate(path)
  } else {
    navigate("/login")
  }
  // if (page === 'home') {
  //   const user = sessionStorage.getItem('loggedIn');
  //   if (!user) {
  //     navigate('/login');
  //   } else {
  //     document.getElementById('welcomeUser').innerText = `Hello, ${user}`;
  //   }
  // }
  // document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // const el = document.getElementById(page);
  // if (el) el.classList.add('active');

}

window.addEventListener('popstate', () => {
  renderPage(window.location.pathname);
})