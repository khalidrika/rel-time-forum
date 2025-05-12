import { logout } from "./auth.js";


export function createNewPostModal() {
  const modal = document.createElement("div");
  modal.id = "newPostModal";
  modal.className = "modal hidden";

  const dialog = document.createElement("div");
  dialog.className = "post-dialog";

  const closeButton = document.createElement("span");
  closeButton.id = "closeNewPostModal";
  closeButton.className = "close-button";
  closeButton.innerHTML = "&times;";

  const heading = document.createElement("h2");
  heading.textContent = "Create New Post";

  const form = document.createElement("form");
  form.id = "newPostForm";
  form.className = "post-form";

  const titleLabel = document.createElement("label");
  titleLabel.htmlFor = "formPostTitle";
  titleLabel.className = "post-label";
  titleLabel.textContent = "Title";

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.id = "formPostTitle";
  titleInput.className = "post-input";
  titleInput.placeholder = "Enter a descriptive title...";
  titleInput.maxLength = 500;
  titleInput.minLength = 4;
  titleInput.required = true;

  const contentLabel = document.createElement("label");
  contentLabel.htmlFor = "formPostContent";
  contentLabel.className = "post-label";
  contentLabel.textContent = "Content";

  const contentTextarea = document.createElement("textarea");
  contentTextarea.id = "formPostContent";
  contentTextarea.className = "post-textarea";
  contentTextarea.rows = 6;
  contentTextarea.placeholder = "Share your thoughts (gol xi haja)...";
  contentTextarea.maxLength = 8000;
  contentTextarea.required = true;

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "post-submit";
  submitButton.textContent = "Publish";

  // Assemble elements
  form.appendChild(titleLabel);
  form.appendChild(titleInput);
  form.appendChild(contentLabel);
  form.appendChild(contentTextarea);
  form.appendChild(submitButton);

  dialog.appendChild(closeButton);
  dialog.appendChild(heading);
  dialog.appendChild(form);

  modal.appendChild(dialog);

  return modal;
}

//// subbmit post
export async function bindNewPostFormSubmit() {
  const addpostform = document.getElementById("newPostForm")
  addpostform.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById("formPostTitle").value.trim();
    const content = document.getElementById("formPostContent").value.trim();

    const payload = { title, content };
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

export async function showPostWithComments(post) {
  const res = await fetch(`/api/comments?postId=${post.id}`);
  const comments = await res.json();

  const commentHTML = (Array.isArray(comments) && comments.length > 0)
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
    <h2>Comments for Post: ${post.title}</h2>
    <div id="comments">${commentHTML}</div>
    ${commentForm}
  `;

  document.getElementById("comment-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = { content: formData.get("content") };

    const addRes = await fetch(`/api/add-comment?postId=${post.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (addRes.ok) {
      showPostWithComments(post);  // Pass the full post again
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
function attachPostModalEvents() {
  // Floating action button (add post button)
  const fabAddPost = document.getElementById("fabAddPost");
  fabAddPost?.addEventListener("click", () => {
    document.getElementById("newPostModal").classList.remove("hidden");

  });
}

// add post form and get posts from   database
export async function renderPosts() {
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




  const app = document.getElementById("app")

  // app.innerHTML = `
  // <h2>Posts Feed</h2>
  // <button id="fabAddPost" class="fab">+</button>
  // <button class="submit-button" id="logout">Logout</button>
  // `;
  app.innerHTML = ""; // تنظيف كامل

const header = document.createElement("h2");
header.textContent = "Posts Feed";
app.append(header);

const addButton = document.createElement("button");
addButton.id = "fabAddPost";
addButton.className = "fab";
addButton.textContent = "+";
app.append(addButton);

const logoutButton = document.createElement("button");
logoutButton.id = "logout";
logoutButton.className = "submit-logot";
logoutButton.textContent = "Logout";
app.append(logoutButton);


  for (let post of posts) {
    const div = document.createElement("div")

    div.className = "post"
    div.id = `post-${post.id}`
    div.innerHTML = `
    <h3>${post.title}</h3>
    <p><strong>By:</strong> ${post.nickname} | <em>${new Date(post.createdAt).toLocaleString()}</em></p>
    <p>${post.content}</p>`
    const btn = document.createElement("button")
    btn.className = "view-comments-btn"
    btn.setAttribute("data-post-id", post.id)
    btn.innerHTML = "Show Comments"
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      showPostWithComments(post)
    })
    // console.log(div);
    div.append(btn)
    app.append(div)

  }


  // creatpostform();
  app.append(createNewPostModal())
  attachPostModalEvents();
  bindNewPostFormSubmit();

  const hiddencole = document.getElementById("closeNewPostModal");
  hiddencole?.addEventListener('click', () => {
    document.getElementById("newPostModal").classList.add("hidden");
  });

  const logoutbtn = document.getElementById("logout");
  logoutbtn?.addEventListener('click', logout);
}


