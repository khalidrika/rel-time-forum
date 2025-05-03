const routes = {
  '/login': 'login',
  '/register': 'register',
  '/home': 'home',
}; 

export function navigate(path) {
  history.pushState({}, '', path);
  renderPage(path);
}


export function renderPage(path) {
  const page = routes[path] || 'login';

  //document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
 // document.getElementById(page).classList.add('active');

  if (page === 'home') {
    const user = sessionStorage.getItem('loggedIn');
    if (!user) {
      navigate('/login');
    } else {
      document.getElementById('welcomeUser').innerText = `Hello, ${user}`;
    }
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(page);
  if (el) el.classList.add('active');
  window.addEventListener('popstate', ()=> {
    renderPage(window.location.pathname);
  })

}