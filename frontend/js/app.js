async function logout() {
  const res = await fetch('/api/logout', {method: 'POST' });
  if (res.ok) {
    alert('Logged out successfully!');
    window.location.reload();
  }else {
    alert('Failde to logout.');
  }
} 