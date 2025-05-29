async function logout() {
  // const userlist = document.getElementsByClassName("user-list")
  // if (userlist) {
  //   const div = document.getElementById("sidebar")
  //   div.innerHTML = ''
  // }

  const res = await fetch('/api/logout', { method: 'POST' });
  if (res.ok) {
    alert('Logged out successfully!');
    window.location.reload();
  } else {
    alert('Failde to logout.')  ;
  }
}