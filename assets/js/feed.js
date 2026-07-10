// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
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
const db = initializeFirestore(app, {
  localCache: {
    memory: true,        // メモリキャッシュ
    persistence: true,   // IndexedDBによる永続キャッシュ
    cacheSizeBytes: CACHE_SIZE_UNLIMITED, // キャッシュサイズの上限
  }
});

const colors = {
    "A": "#c85151",
    "N": "#c56b11",
    "G": "#268f97",
    "C": "#269733"
};

const modal = document.getElementById('search-modal');
const main = document.getElementById("main");
const fragment = document.createDocumentFragment();

const q = query(
    collection(db, "posts"),
    where("status", "==", "approved"),
    orderBy("createdAt", "desc")
);

modal.style.display = "block";

const snapshot = await getDocs(q);

snapshot.forEach(post => {
    const data = post.data();
    const content = marked.parse(data.content);
    const problem = document.createElement("div");
    problem.className = "problem";
    problem.innerHTML = `
    <span class="category" style="background-color: ${colors[data.category]}">分野: ${data.category}</span>
    <span class="creator">作者: <span class="name">${data.creator}</span></span>
    <h3 class="title">${data.title}</h3>
    <div class="content">${content}</div>
    `;
    problem.addEventListener('click', () => {
        window.location.href = `solve.html?id=${post.id}`;
    });
    fragment.append(problem);
});
main.append(fragment);
await MathJax.typesetPromise([main]);
modal.style.display = "none";