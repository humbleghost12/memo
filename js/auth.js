// Firebase Auth State Listener - Updated Version
firebase.auth().onAuthStateChanged((user) => {
  const currentPage = window.location.pathname.split('/').pop();
  const publicPages = ['login.html', 'signup.html', 'forget-password.html', 'admin-login.html', 'index.html'];

  console.log('Auth state changed. User:', user); // Debug log
  console.log('Current page:', currentPage); // Debug log

  if (user) {
    firebase.firestore().collection('users').doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const isAdmin = doc.data().isAdmin;

          if (currentPage === 'admin.html') {
            if (!isAdmin) {
              console.log('User is not admin, redirecting to dashboard');
              window.location.href = "dashboard.html";
            }
          } else if (currentPage === 'admin-login.html') {
            if (isAdmin) {
              console.log('Admin login detected, redirecting to admin.html');
              window.location.href = "admin.html";
            } else {
              console.log('Non-admin user attempting admin login');
              window.location.href = "dashboard.html";
            }
          } else if (publicPages.includes(currentPage)) {
            if (isAdmin) {
              console.log('Redirecting admin to admin.html');
              window.location.href = "admin.html";
            } else {
              console.log('Redirecting user to dashboard.html');
              window.location.href = "dashboard.html";
            }
          }
          // If already on a protected page, do nothing
        } else {
          console.log("User document does not exist, logging out");
          firebase.auth().signOut();
        }
      })
      .catch((error) => {
        console.error("Error checking admin status:", error);
        window.location.href = "dashboard.html";
      });
  } else {
    if (!publicPages.includes(currentPage)) {
      console.log("No user logged in, redirecting to login.html");
      window.location.href = "login.html";
    }
  }
});

// Enhanced login function
function login(email, password) {
  return firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Login successful, checking admin status");
      return firebase.firestore().collection('users').doc(userCredential.user.uid).get();
    })
    .then((doc) => {
      if (doc.exists && doc.data().isAdmin) {
        console.log("User is admin, redirecting to admin.html");
        window.location.href = "admin.html";
      } else {
        console.log("Regular user, redirecting to dashboard.html");
        window.location.href = "dashboard.html";
      }
    })
    .catch((error) => {
      console.error('Login error:', error.message);
      if (document.getElementById('error-message')) {
        document.getElementById('error-message').textContent = error.message;
      }
    });
}

// Logout function
function logout() {
  firebase.auth().signOut()
    .then(() => {
      console.log("User logged out, redirecting to login.html");
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error('Logout error:', error);
      if (document.getElementById('error-message')) {
        document.getElementById('error-message').textContent = 'Logout failed. Please try again.';
      }
    });
}
