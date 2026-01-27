// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const database = firebase.database();
const analytics = getAnalytics(app);
console.log("Firebase initialized successfully!");