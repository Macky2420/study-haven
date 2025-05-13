// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGJcTijIGDgc15d0w4i24iFInilO5IuOc",
  authDomain: "study-haven.firebaseapp.com",
  databaseURL: "https://study-haven-default-rtdb.firebaseio.com",
  projectId: "study-haven",
  storageBucket: "study-haven.appspot.com",
  messagingSenderId: "604774905949",
  appId: "1:604774905949:web:95640d0e2731a911f375b4",
  measurementId: "G-N71BYJ9K0D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth();

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

// Log auth state changes for debugging
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.uid);
  } else {
    console.log('No user is signed in.');
  }
});

export { auth, database };