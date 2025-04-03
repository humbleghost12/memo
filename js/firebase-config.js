// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgAk-HAR0bPr-SuSD43CbrEELnrJ8vy_U",
  authDomain: "yabatech-3a19a.firebaseapp.com",
  projectId: "yabatech-3a19a",
  storageBucket: "yabatech-3a19a.firebasestorage.app",
  messagingSenderId: "709741025528",
  appId: "1:709741025528:web:b91c60dacae28d6651430d"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();