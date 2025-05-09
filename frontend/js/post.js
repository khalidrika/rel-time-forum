import { UpgredConnetion } from "./ws.js";
import { logout } from "./auth.js";

export async function showPostWithComments(postId) {
  const res = await fetch(`/api/comments?postId=${postId}`);
  const comments = await res.json();

  let commentHTML = comments.map(c => `
      <div class="comUpgredConnetionment">
        <strong>${c.nickname}</strong> - ${new Date(c.created_at).toLocaleString()}<br>
        <p>${c.content}</p>
      </div>
    `).join('');

  const commentForm = `
      <form id="comment-form">
        <textarea name="content" placeholder="Write a comment..." required></textarea>
        <button type="submit">Send</button>
      </form>
    `;

  document.getElementById("app").innerHTML = `
      <h2>Post #${postId}</h2>
      <div    const res = await fetch("/api/posts", {
      method: "GET",
      credentials: "include"
    });
   id="comments">${commentHTML}</div>
      ${commentForm}
      <button onclick="fetchUserProfile()">Back</button>
    `;

  document.getElementById("comment-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      content: formData.get("content")
    };
    const addRes = await fetch(`/api/add-comment?postId=${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (addRes.ok) {
      showPostWithComments(postId); // reload
    } else {
      const err = await addRes.json();
      alert("Failed: " + err.error);
    }
  });
}



export async function renderPosts() {
  UpgredConnetion();
  const res = await fetch("/api/posts", {
    method: "GET",
    credentials: "include"
  });

  if (!res.ok) {
    document.getElementById("app").innerHTML = `<p>Failed to load posts</p>`;
    return;
  }

  const posts = await res.json();

  if (!Array.isArray(posts)) {
    console.error("Expected posts to be an array but got:", posts);
    document.getElementById("app").innerHTML = `<p>No posts found or invalid format</p>`;
    return;
  }

  const postsHTML = posts.map(post => `
      <div class="post">
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <button onclick="showPostWithComments(${post.id})">View Comments</button>
        </div>
    `).join('');

  document.getElementById("app").innerHTML = `
      <h2>Posts Feed</h2>
      ${postsHTML}
      <button class="submit-button" id="logout">Logout</button>
    `;
    const logoutbtn = document.getElementById("logout")
    if (logoutbtn) {
      logoutbtn.addEventListener('click', () => {
        logout();
      })
    }
}
