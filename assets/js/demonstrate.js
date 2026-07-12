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
const main = document.getElementById("main");
const form = document.getElementById("problem-form");
const title = document.getElementById("title");
const problem = document.getElementById("problem");
const problemPrevBtn = document.getElementById("problem-preview-btn");
const problemPrev = document.getElementById("problem-preview");
/*const explanation = document.getElementById("explanation");
const explanationPrevBtn = document.getElementById("explanation-preview-btn");
const explanationPrev = document.getElementById("explanation-preview");*/
const answer = document.getElementById("answer");
const category = document.getElementById("category");
const status = document.getElementById("status");
let userID = "";
let hasUnsavedChanges = false;
const params = new URLSearchParams(window.location.search);
const problemID = params.get("id");

modal.style.display = "block";


onAuthStateChanged(auth, async (user) => {
    if (user) {
        // ログイン済み
        main.style.display = "block";
        login.style.display = "none";
        userID = user.uid;
        await getDoc(doc(db, "users", user.uid)).then(async snapshot => {
            const data = snapshot.data();
            userName.innerHTML = `ようこそ，<span class="name ${data.color}">${data.username}</span>`;
            
            if (!data.authorization) window.location.href = "index.html";
            
            await getDoc(doc(db, "posts", problemID)).then(submittedProblem => {
                const data = submittedProblem.data();
                
                title.value = unescapeText(data.title);
                problem.value = data.content;
                answer.value = data.answer;
                category.value = data.category;
                status.value = data.status;
                problemPrevBtn.click();
            });

            modal.style.display = "none";

        });
    } else {
        // 未ログイン
        window.location.href = "index.html";
    }
});

problemPrevBtn.addEventListener('click', () => { 
    const text = problem.value;
    problemPrev.innerHTML = marked.parse(text);
    MathJax.typeset();
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (userID == "") return;

    await getDoc(doc(db, "users", userID)).then(snapshot => {
        if (snapshot.data().authorization == false) {
            window.location.href = "index.html";
        }
    });

    modal.style.display = "block";

    await getDoc(doc(db, "posts", problemID)).then(async myProblem => {
        const data = myProblem.data();
        const newProblem = await setDoc(doc(db, "posts", problemID), {
            answer: answer.value,
            category: category.value,
            content: problem.value,
            status: status.value,
            title: title.value
        }, { merge: true });
        // 保存したら false にする
        hasUnsavedChanges = false;
        showToast();
        
        
    });
    modal.style.display = "none";

    
});

// 編集されたら true にする
document.querySelectorAll("textarea, input").forEach(textarea => {
    textarea.addEventListener("input", () => {
        hasUnsavedChanges = true;
    });
});

window.addEventListener("beforeunload", (event) => {
    if (!hasUnsavedChanges) return;

    event.preventDefault();
    event.returnValue = "";
});
function escapeText(text) {
    return text
        .replace(/\\/g, "\\\\") // \ → \\
        .replace(/\$/g, "\\$"); // $ → \$
}
function unescapeText(text) {
    return text
        .replace(/\\\$/g, "$")
        .replace(/\\\\/g, "\\");
}
function showToast(message = "保存しました") {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}