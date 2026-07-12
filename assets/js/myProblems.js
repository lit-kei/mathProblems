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
const main = document.getElementById("main");
const message = document.getElementById("message");
let userID = "";

modal.style.display = "block";


onAuthStateChanged(auth, async (user) => {
    if (user) {
        // ログイン済み
        main.style.display = "block";
        message.style.display = "none";
        login.style.display = "none";
        userID = user.uid;
        await getDoc(doc(db, "users", user.uid)).then(async snapshot => {
            const data = snapshot.data();
            userName.innerHTML = `ようこそ，<span class="name ${data.color}">${data.username}</span>`;
            const q = query(
                collection(db, "posts"),
                where("creator", "==", userID),
                orderBy("createdAt", "desc")
            );

            const myProblems = await getDocs(q);

            myProblems.forEach(problem => {
                //problem
                const date = problem.data().createdAt.toDate().toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });
                const tr = document.createElement("tr");
                tr.innerHTML = `
                <td>${problem.data().title}</td>
                <td>${date}</td>
                <td><span class="${problem.data().status}">${problem.data().status}</span></td>
                `;
                tr.addEventListener('click', () => {
                    window.location.href = `make.html?id=${problem.id}`;
                });
                tbody.appendChild(tr);
            });

            modal.style.display = "none";

        });
    } else {
        // 未ログイン
        login.style.display = "flex";
        userName.textContent = "";
        message.style.display = "block";
        main.style.display = "none";
        modal.style.display = "none";
    }
});

document.getElementById("new-btn").addEventListener('click', async () => {
    if (userID == "") return;
    modal.style.display = "block";
    const newProblem = await addDoc(collection(db, "posts"), {
        answer: "",
        category: "",
        content: "",
        createdAt: serverTimestamp(),
        creator: userID,
        status: "draft",
        title: ""
    });
    modal.style.display = "none";
    window.location.href = `make.html?id=${newProblem.id}`;
});
