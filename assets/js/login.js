// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { 
    getFirestore, 
    initializeFirestore,
    CACHE_SIZE_UNLIMITED,
    collection, 
    doc,
    getDocs,
    getDoc,
    where,
    limit,
    query,
    orderBy,
    updateDoc,
    startAt,
    endAt,
    startAfter,
    serverTimestamp,
    setDoc,
    addDoc,
    Timestamp,
    increment} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDMjeO6E7oA5k5HzXcVgxjRcOSZ-mhrWas",
  authDomain: "mathproblems-4cba9.firebaseapp.com",
  projectId: "mathproblems-4cba9",
  storageBucket: "mathproblems-4cba9.firebasestorage.app",
  messagingSenderId: "369391393653",
  appId: "1:369391393653:web:387cb86c7e09757d4d513c",
  measurementId: "G-HB13BRJ476"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: {
    memory: true,        // メモリキャッシュ
    persistence: true,   // IndexedDBによる永続キャッシュ
    cacheSizeBytes: CACHE_SIZE_UNLIMITED, // キャッシュサイズの上限
  }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        // ログイン済み
        document.getElementById("message").style.display = "block";
        document.getElementById("main").style.display = "none";
        //window.location.href = "index.html";
    } else {
        // 未ログイン
        document.getElementById("message").style.display = "none";
        document.getElementById("main").style.display = "block";
    }
});


const form = document.getElementById("login-form");

const number = document.getElementById("number");
const password = document.getElementById("password");
const errorMsg = document.getElementById("error-msg");

form.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
    }
});
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = `${number.value}@school.local`;

    try {
        await signInWithEmailAndPassword(auth, email, password.value);
    } catch (e) {
        console.error(e);
        errorMsg.style.display = "block";
    }
});



function passwordview() {
  if (password.type == "password") {
    //input type="password" だった場合は、input type="text" に切り替えます
    password.type = "text";
    //ボタンの見栄えを切り替えます。
    document.querySelector("i").classList.remove('fa-eye-slash');
    document.querySelector("i").classList.add('fa-eye');
  } else {
    //そうではなかったら、逆に、input type="password" に切り替えます。
    password.type = "password";
    //ボタンの見栄えを切り替えます。
    document.querySelector("i").classList.remove('fa-eye');
    document.querySelector("i").classList.add('fa-eye-slash');
  }
}
window.passwordview = passwordview;