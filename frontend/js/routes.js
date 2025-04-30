const routes = {
    '/login': 'login',
    '/register': 'register',
    '/home': 'home',
}; 

export function navigate(path) {
    history.pushState({}, '', path);
   // renderPage(path);
}


function renderPage(path) {
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
}