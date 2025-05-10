import { UpgredConnetion } from "./ws.js";
import { logout } from "./auth.js";

export async function addpost() {

}

export function creatpostform() {

  document.getElementById("app").innerHTML += `
  <!-- New Post Modal -->
<div id="newPostModal" class="modal">
    <div class="post-dialog">
        <span id="closeNewPostModal" class="close-button">&times;</span>
        <h2>Create New Post</h2>
        <form id="newPostForm" class="post-form">
            <label for="formPostTitle" class="post-label">Title</label>
            <input
                type="text"
                id="formPostTitle"
                class="post-input"
                placeholder="Enter a descriptive title..."
                maxlength="500"
                minlength="4"
                required />

            <label for="formPostContent" class="post-label">Content</label>
            <textarea
                id="formPostContent"
                class="post-textarea"
                rows="6"
                placeholder="Share your thoughts (dwi)..."
                maxlength="8000"
                required></textarea>
            <button type="submit" class="post-submit">Publish</button>
        </form>
    </div>
</div>
  `
}
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

// add post
function AddPostListener() {
  // Floating action button (add post button)
  const fabAddPost = document.getElementById("fabAddPost");
  console.log(fabAddPost);
  console.log(document.getElementById("newPostModal"));

  fabAddPost?.addEventListener("click", () => {
    console.log("HA HYA");
    document.getElementById("newPostModal").classList.remove("hidden");
  });

  // Create post in dropDown menu.
  document.getElementById("createPost")?.addEventListener("click", (e) => {
    e.preventDefault()
    document.getElementById("newPostModal")?.classList.remove("hidden");
  });
}


export async function renderPosts() {
  // UpgredConnetion();
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
  <button id="fabAddPost" class="fab">+</button>
      <button class="submit-button" id="logout">Logout</button>
    `;
  const fabAddPost = document.getElementById("fabAddPost");
  console.log(fabAddPost, document.getElementById("newPostModal"));

  fabAddPost.addEventListener("click", () => {
    console.log("HA HYA");
    creatpostform();
  });
  const logoutbtn = document.getElementById("logout")
  if (logoutbtn) {
    logoutbtn.addEventListener('click', () => {
      logout();
    })
  }
}
