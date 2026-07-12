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

const grade = document.getElementById("grade");
const cls = document.getElementById("class-number");
const studentNumber = document.getElementById("student-number");
const number = document.getElementById("number");
const username = document.getElementById("username");
const password = document.getElementById("password");
const passwordCheck = document.getElementById("password-check");
const errorMsg = document.getElementById("error-msg");
const errorTxt = document.getElementById("error-txt");

form.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!/^[A-Za-z0-9]+$/.test(username.value)) {
        alert("ユーザー名は半角英数字のみです。");
        return;
    }

    if (password.value.length < 8) {
        alert("パスワードは8文字以上にしてください。");
        return;
    }

    if (password.value != passwordCheck.value) {
        errorMsg.style.display = "block";
        errorTxt.textContent = "2つのパスワードが異なっています．";
        return;
    }


    const email = `${number.value}@school.local`;

    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password.value
        );

        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            username: username.value,
            grade: Number(grade.value),
            class: Number(cls.value),
            stundentNum: Number(studentNumber.value),
            number: Number(number.value),
            color: "black",
            createdAt: serverTimestamp()
        });

    } catch (error) {
        console.error(error);
        errorMsg.style.display = "block";
        switch (error.code) {
            case "auth/email-already-in-use":
                errorTxt.textContent = "このユーザーは既に登録されています．";
                break;

            case "auth/weak-password":
                errorTxt.textContent = "パスワードは6文字以上にしてください．";
                break;

            case "auth/invalid-email":
                errorTxt.textContent = "ユーザー情報が正しくありません．";
                break;

            default:
                errorTxt.textContent = "登録に失敗しました．";
                break;
        }
    }
});




function passwordview(id, i) {
  if (document.getElementById(id).type == "password") {
    //input type="password" だった場合は、input type="text" に切り替えます
    document.getElementById(id).type = "text";
    //ボタンの見栄えを切り替えます。
    document.getElementById(i).classList.remove('fa-eye-slash');
    document.getElementById(i).classList.add('fa-eye');
  } else {
    //そうではなかったら、逆に、input type="password" に切り替えます。
    document.getElementById(id).type = "password";
    //ボタンの見栄えを切り替えます。
    document.getElementById(i).classList.remove('fa-eye');
    document.getElementById(i).classList.add('fa-eye-slash');
  }
}
window.passwordview = passwordview;