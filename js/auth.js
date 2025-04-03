// Firebase Auth State Listener - Final Corrected Version
firebase.auth().onAuthStateChanged((user) => {
  const currentPage = window.location.pathname.split('/').pop();
  const publicPages = ['login.html', 'signup.html', 'forget-password.html', 'admin-login.html', 'index.html'];
  const adminPages = ['admin.html', 'admin-login.html'];

  console.log('Auth state changed. User:', user);
  console.log('Current page:', currentPage);

  if (user) {
    // User is logged in
    firebase.firestore().collection('users').doc(user.uid).get()
      .then((doc) => {
        if (!doc.exists) {
          console.log("User document doesn't exist, but keeping user logged in");
          // Don't sign out, just handle as regular user
          if (adminPages.includes(currentPage)) {
            window.location.href = "dashboard.html";
          }
          return;
        }

        const isAdmin = doc.data().isAdmin;
        
        // Handle admin-specific routing
        if (currentPage === 'admin.html' && !isAdmin) {
          console.log('Non-admin trying to access admin page');
          window.location.href = "dashboard.html";
          return;
        }

        if (currentPage === 'admin-login.html') {
          window.location.href = isAdmin ? "admin.html" : "dashboard.html";
          return;
        }

        // Redirect from public pages to appropriate dashboard
        if (publicPages.includes(currentPage)) {
          window.location.href = isAdmin ? "admin.html" : "dashboard.html";
          return;
        }

        // For protected pages, verify access
        if (adminPages.includes(currentPage) && !isAdmin) {
          window.location.href = "dashboard.html";
        }
      })
      .catch((error) => {
        console.error("Error checking admin status:", error);
        // On error, redirect to dashboard instead of login
        if (adminPages.includes(currentPage)) {
          window.location.href = "dashboard.html";
        }
        // Otherwise stay on current page
      });
  } else {
    // No user logged in - redirect to login if on protected page
    if (!publicPages.includes(currentPage)) {
      console.log("No user logged in, redirecting to login");
      window.location.href = "login.html";
    }
  }
});

// Enhanced login function with admin support
function login(email, password) {
  return firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Login successful, checking admin status");
      return firebase.firestore().collection('users').doc(userCredential.user.uid).get();
    })
    .then((doc) => {
      if (!doc.exists) {
        console.log("User document doesn't exist - treating as regular user");
        window.location.href = "dashboard.html";
        return;
      }
      
      const isAdmin = doc.data().isAdmin;
      window.location.href = isAdmin ? "admin.html" : "dashboard.html";
    })
    .catch((error) => {
      console.error('Login error:', error.message);
      if (document.getElementById('error-message')) {
        document.getElementById('error-message').textContent = error.message;
      }
    });
}

// Logout function remains the same
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