
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDrPA---Ak_l9jqwHouWiC2byZH6EdR9Ts",
  authDomain: "monopolymoneyapp.firebaseapp.com",
  databaseURL: "https://monopolymoneyapp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "monopolymoneyapp",
  storageBucket: "monopolymoneyapp.firebasestorage.app",
  messagingSenderId: "734008146391",
  appId: "1:734008146391:web:8ebbf21a9c324b25587392",
  measurementId: "G-3377SYGJYX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Create database reference
const database = firebase.database();

console.log("✅ Firebase initialized successfully!");
console.log("Database:", database);