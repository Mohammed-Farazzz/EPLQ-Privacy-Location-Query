// Firebase Configuration
// IMPORTANT: Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyBKm9DeBvVex6Yxiu9QVmcs1rd5Q099ZEE",
    authDomain: "eplq-project-c1ac8.firebaseapp.com",
    projectId: "eplq-project-c1ac8",
    storageBucket: "eplq-project-c1ac8.firebasestorage.app",
    messagingSenderId: "667822785478",
    appId: "1:667822785478:web:648f9e6f452319ff6ee8c7"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
// Export for use in other files
window.firebaseApp = firebase;
window.auth = auth;
window.db = db;
console.log('Firebase initialized successfully');