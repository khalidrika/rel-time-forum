import { renderLoginForm, renderRegisterForm } from "./auth.js";
import { renderPosts } from "./post.js";
import { socketEvent, UpgredConnetion } from "./ws.js";

let routes = {};

window.addEventListener("DOMContentLoaded", () => {
  routes = {
    '/login': renderLoginForm,
    '/register': renderRegisterForm,
    '/home': async () => {
      try {
        await renderPosts();
        // creatpostform();
        UpgredConnetion();
        socketEvent();
      } catch (error) {
        console.error("Failed to render posts:", error);
      }
    },
  };
  checkSessionAndRedirect();
});

async function checkSessionAndRedirect() {
  try {
    const res = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
    });
    if (res.ok) {
      navigate("/home");
    } else {
      console.log("hna");

      navigate("/login");
    }
  } catch (err) {
    console.error("Session check failed:", err)
    navigate("/login")
  }
}


export function navigate(path) {
  history.pushState({}, '', path);
  renderPage(path);
}


export function renderPage(path) {
  console.log("1", path);

  if (routes[path]) {
    console.log("2", path);
    routes[path]()
    // navigate(path)
  } else {
    navigate("/login")
  }

}
window.addEventListener('popstate', () => {
  renderPage(window.location.pathname);
})