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

const modal = document.getElementById('search-modal');
const main = document.getElementById("main");
const login = document.getElementById("login-btn");
const userName = document.getElementById("user-name");
let userID = "";
let solved = [];
const userCache = new Map();

const subjects = {
    "A": {text: "A (代数)", color: "#c85151"},
    "N": {text: "N (整数)", color: "#c56b11"},
    "G": {text: "G (幾何)", color: "#268f97"},
    "C": {text: "C (組合せ)", color: "#269733"}
};

modal.style.display = "block";

onAuthStateChanged(auth, async (user) => {    
    main.innerHTML = "";

    // 新しい DocumentFragment を作成
    const fragment = document.createDocumentFragment();

    
    if (user) {
        // ログイン済み
        login.style.display = "none";
        userID = user.uid;
        await getDoc(doc(db, "users", user.uid)).then(snapshot => {
            const data = snapshot.data();
            userName.innerHTML = `ようこそ，<span class="name ${data.color}">${data.username}</span>`;
            userCache.set(user.uid, data);
        });
        
        await getDocs(collection(db, "users", user.uid, "solved")).then(ansSnapshot => {
            solved = ansSnapshot.docs.map(e => e.id);
        });
        
    } else {
        // 未ログイン
        login.style.display = "flex";
        userName.textContent = "";
    }
    
    const q = query(
        collection(db, "posts"),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const uids = [...new Set(snapshot.docs.map(post => post.data().creator))];

    await Promise.all(
        uids.map(async (uid) => {
            if (userCache.has(uid)) return;

            const snap = await getDoc(doc(db, "users", uid));

            if (snap.exists()) {
                userCache.set(uid, snap.data());
            } else {
                userCache.set(uid, {
                    username: undefined
                });
            }
        })
    );

    snapshot.forEach(post => {
        const data = post.data();
        const content = DOMPurify.sanitize(marked.parse(data.content));
        const user = userCache.get(post.data().creator);
        const problem = document.createElement("div");
        problem.className = "problem";
        
        problem.innerHTML = `
        ${solved.includes(post.id) ? `
            <svg xmlns="http://w3.org" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
` : ""}
        <span class="category" style="background-color: ${subjects[data.category].color}">${subjects[data.category].text}</span>
        <span class="creator"><span class="name ${user.color}">${user.username ?? "***"}</span></span>
        <h3 class="title">${data.title}</h3>
        <div class="content">${content}</div>
        `;
        problem.addEventListener('click', () => {
            window.location.href = `solve.html?id=${post.id}`;
        });
        problem.style.animationDelay = `${Math.random() * 0.4}s`;
        fragment.append(problem);
    });
    main.append(fragment);
    await MathJax.typesetPromise([main]);
    modal.style.display = "none";
});

/*
const snapshot = await getDocs(collection(db, "answers"));

const map = new Map();

snapshot.forEach(docSnap => {
    const data = docSnap.data();

    if (data.result !== "正解") return;

    const key = `${data.userID}_${data.problemID}`;

    if (!map.has(key)) {
        map.set(key, [{
            id: docSnap.id,
            timestamp: data.timestamp
        }]);
    } else {
        map.get(key).push({
            id: docSnap.id,
            timestamp: data.timestamp
        });
    }
});

for (const [, list] of map) {

    if (list.length <= 1) continue;

    // 古い順に並べる
    list.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

    // 2件目以降を削除
    for (let i = 1; i < list.length; i++) {
        console.log("delete", list[i].id);
        //await deleteDoc(doc(db, "answers", list[i].id));
    }
}*/



async function signout() {
    try {
        await signOut(auth)
    } catch (e) {
        console.log(e)
    }
}

window.signout = signout;