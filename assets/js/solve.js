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
const message = document.getElementById("message");
const title = document.getElementById("title");
const problem = document.getElementById("problem");
const category = document.getElementById("category");
const name = document.getElementById("name");
const rate = document.getElementById("rate");
const answer = document.getElementById("answer");
const submitBtn = document.getElementById("submit-btn");
const form = document.getElementById("form");
const answerBtn = document.getElementById("answer-btn");

const params = new URLSearchParams(window.location.search);
const problemID = params.get("id");
let userID = "";
let ans = "";

modal.style.display = "block";

answerBtn.addEventListener('click', () => {
    window.location.href = `answer.html?id=${problemID}`;
});

const subjects = {
    "A": {text: "A (代数)", color: "#c85151"},
    "N": {text: "N (整数)", color: "#c56b11"},
    "G": {text: "G (幾何)", color: "#268f97"},
    "C": {text: "C (組合せ)", color: "#269733"}
};


onAuthStateChanged(auth, async (user) => {
    if (user) {
        // ログイン済み
        message.style.display = "none";
        submitBtn.classList.remove("NA");
        submitBtn.formNoValidate = false;
        login.style.display = "none";
        userID = user.uid;
        const solvedRef = doc(db, "users", user.uid, "solved", problemID);
        const solvedSnap = await getDoc(solvedRef);

        if (solvedSnap.exists()) {
            message.textContent = "この問題はすでに解答済みです。";
            submitBtn.disabled = true;
            answer.disabled = true;
            submitBtn.classList.add("NA");

            message.style.display = "block";
        }
        await getDoc(doc(db, "users", user.uid)).then(async snapshot => {
            const data = snapshot.data();
            userName.innerHTML = `ようこそ，<span class="name ${data.color}">${data.username}</span>`;
        });

    } else {
        // 未ログイン
        login.style.display = "flex";
        userName.textContent = "";
        message.style.display = "block";
        submitBtn.classList.add("NA");
        submitBtn.formNoValidate = true;
    }
});

let correct = 0, total = 0;
getDocs(query(collection(db,"answers"), where("problemID", "==", problemID))).then(snapshot => {
    snapshot.forEach(doc => {
        total++;
        if (doc.data().result == "正解") correct++;
    });
    const percent = total === 0 ? "0.0" : (correct / total * 100).toFixed(1);
    rate.innerHTML = `${percent}% ( ${correct} / ${total} )`;
    MathJax.typeset();
});

await getDoc(doc(db, "posts", problemID)).then(async snapshot => {
    if (!snapshot.exists()) {
        window.location.href = "index.html";
        return;
    }

    const data = snapshot.data();

    // 承認されていない問題は表示しない
    if (data.status !== "approved") {
        alert("承認されていません。")
        window.location.href = "index.html";
        
        return;
    }

    ans = data.answer;

    await getDoc(doc(db, "users", data.creator)).then(creator => {
        if (!creator.exists()) {
            name.textContent = "***";
        } else {
            const creatorData = creator.data();
            name.textContent = creatorData.username;
            name.classList.add(creatorData.color);
        }
        title.textContent = data.title;
        problem.innerHTML = DOMPurify.sanitize(marked.parse(data.content));
        category.textContent = subjects[data.category].text;
        category.style.backgroundColor = subjects[data.category].color;

        MathJax.typeset();
    });
});

modal.style.display = "none";

let submitting = false;


form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (submitting) return;
    submitting = true;

    try {

        if (userID == "" || ans == "") return;

        
        const solvedRef = doc(db, "users", userID, "solved", problemID);
        const solvedSnap = await getDoc(solvedRef);

        if (solvedSnap.exists()) {
            alert("この問題はすでに解答済みです。");
            return;
        }

        modal.style.display = "block";
        if (answer.value == ans) {

            const userRef = doc(db, "users", userID, "solved", problemID);

            const snapshot = await getDoc(userRef);

            if (!snapshot.exists()) {
                // 存在しないので追加
                await setDoc(userRef, {
                    timestamp: serverTimestamp()
                });
            }
        }
        const result = answer.value == ans ? "正解" : "不正解";
        await addDoc(collection(db, "answers"), {
            input: answer.value,
            problemID: problemID,
            result: result,
            timestamp: serverTimestamp(),
            userID: userID
        });
        modal.style.display = "none";
        window.location.href = `answer.html?id=${problemID}`;
    } finally {
        submitting = false;
    }
});