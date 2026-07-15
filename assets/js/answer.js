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
    deleteDoc,
    where,
    limit,
    query,
    orderBy,
    updateDoc,
    startAt,
    endAt,
    startAfter,
    setDoc,
    addDoc,
    Timestamp,
    serverTimestamp,
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

const login = document.getElementById("login-btn");
const userName = document.getElementById("user-name");
const modal = document.getElementById('search-modal');
const tbody = document.getElementById("tbody");

const params = new URLSearchParams(window.location.search);
const problemID = params.get("id");
let userID = "";

modal.style.display = "block";


document.getElementById("solve-btn").addEventListener('click', () => {
    window.location.href = `solve.html?id=${problemID}`;
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // ログイン済み
        login.style.display = "none";
        userID = user.uid;
        await getDoc(doc(db, "users", user.uid)).then(async snapshot => {
            const data = snapshot.data();
            userName.innerHTML = `ようこそ，<span class="name ${data.color}">${data.username}</span>`;
            
            const q = query(
                            collection(db, "answers"),
                            where("problemID", "==", problemID),
                            where("userID", "==", userID),
                            orderBy("timestamp", "desc")
                        );
            
            const myAnswers = await getDocs(q);
            
            myAnswers.forEach(answer => {
                const date = answer.data().timestamp.toDate().toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });
                const tr = document.createElement("tr");
                tr.innerHTML = `
                <td>${date}</td>
                <td><span class="name ${data.color}">${data.username}</span></td>
                <td>${answer.data().input}</td>
                <td><span class="${answer.data().result == "正解" ? "correct" : "incorrect"}">${answer.data().result}</span></td>
                `;
                tbody.appendChild(tr);
            });
            modal.style.display = "none";
        });

    } else {
        // 未ログイン
        window.location.href = 'index.html';
        login.style.display = "flex";
        userName.textContent = "";  
    }
});



