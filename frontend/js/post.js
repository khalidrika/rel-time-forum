import { logout } from "./auth.js";

export function creatpostform() {
// Drawing for adding a post
  document.getElementById("app").innerHTML += `
  <!-- New Post Modal -->
<div id="newPostModal" class="modal hidden">
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
///

//// subbmit post
export async function addpost() {
  const addpostform = document.getElementById("newPostForm")
  addpostform.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById("formPostTitle").value.trim();
    const content = document.getElementById("formPostContent").value.trim();

    const payload = { title, content };

    console.log("Sending payload:", JSON.stringify(payload));

    const res = await fetch(`/api/create-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log("Post created successfully");
      document.getElementById("newPostModal").classList.add("hidden");
      renderPosts();
    } else {
      console.error("Failed to create post");
    }
  });
}
////

export async function showPostWithComments(postId) {
  const res = await fetch(`/api/comments?postId=${postId}`);
  const comments = await res.json();

  const commentHTML = comments.length > 0
    ? comments.map(c => `
        <div class="comment">
          <p><strong>${c.nickname}</strong> - <em>${new Date(c.createdAt).toLocaleString()}</em></p>
          <p>${c.content}</p>
        </div>
      `).join('')
    : `<p>No comments here</p>`;

  const commentForm = `
    <form id="comment-form">
      <textarea name="content" placeholder="Write a comment..." required></textarea>
      <button type="submit">Send</button>
    </form>
    <button id="back-to-posts">Back to Posts</button>
  `;

  document.getElementById("app").innerHTML = `
    <h2>Comments for Post #${postId}</h2>
    <div id="comments">${commentHTML}</div>
    ${commentForm}
  `;

  document.getElementById("comment-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = { content: formData.get("content") };

    const addRes = await fetch(`/api/add-comment?postId=${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (addRes.ok) {
      showPostWithComments(postId);  
    } else {
      const err = await addRes.json();
      alert("Failed: " + err.error);
    }
  });

  document.getElementById("back-to-posts").addEventListener("click", () => {
    renderPosts();
  });
}


// add post
function AddPostListener() {
  // Floating action button (add post button)
  const fabAddPost = document.getElementById("fabAddPost");
  console.log(fabAddPost);
  console.log(document.getElementById("newPostModal"));

  fabAddPost?.addEventListener("click", () => {
    document.getElementById("newPostModal").classList.remove("hidden");

  });
}

// add post form and get posts from   database
export async function renderPosts() {
  console.log("renderPosts is called");
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
    <div class="post" id="post-${post.id}">
      <h3>${post.title}</h3>
      <p><strong>By:</strong> ${post.nickname} | <em>${new Date(post.createdAt).toLocaleString()}</em></p>
      <p>${post.content}</p>
      <button class="view-comments-btn" data-post-id="${post.id}">Show Comments</button>
    </div>
  `).join('');

  document.getElementById("app").innerHTML = `
    <h2>Posts Feed</h2>
    <button id="fabAddPost" class="fab">+</button>
    ${postsHTML}
    <button class="submit-button" id="logout">Logout</button>
  `;

  const buttons = (document.querySelectorAll(".view-comments-btn"));  
  buttons.forEach((btn) => {
    console.log("hh", btn.dataset.postId);
    
    btn.addEventListener('click', () => {
      const postId = btn.dataset.postId;
      console.log("Clicked on post:", postId);  
      showPostWithComments(postId);  
    });
  });
  const postt = document.querySelectorAll(".post")
  console.log("00", postt[0]);
  postt[0].addEventListener('click',()=>{
    console.log("yassir");
    
  })
  
  creatpostform();
  AddPostListener();
  addpost();

  const hiddencole = document.getElementById("closeNewPostModal");
  hiddencole?.addEventListener('click', () => {
    document.getElementById("newPostModal").classList.add("hidden");
  });

  const logoutbtn = document.getElementById("logout");
  logoutbtn?.addEventListener('click', logout);
}
