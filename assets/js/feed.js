// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import {
    initializeFirestore,
    CACHE_SIZE_UNLIMITED,
    collection,
    doc,
    getDocs,
    getDoc,
    getCountFromServer,
    where,
    limit,
    query,
    orderBy,
    startAfter
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// Your web app's Firebase configuration
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
    memory: true,
    persistence: true,
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  }
});

const PAGE_SIZE = 20;
const SORT_CREATED = "createdAt";
const SORT_RATE = "correctRate";

const modal = document.getElementById("search-modal");
const main = document.getElementById("main");
const login = document.getElementById("login-btn");
const userName = document.getElementById("user-name");
const createdAtFilter = document.getElementById("createdAt-fil");
const rateFilter = document.getElementById("difficulty-fil");
const prevBtn = document.getElementById("prev-page-btn");
const nextBtn = document.getElementById("next-page-btn");
const pageInfo = document.getElementById("page-info");
const emptyMessage = document.getElementById("empty-message");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search-btn");

let userID = "";
let solved = [];
let currentSort = SORT_CREATED;
let pageIndex = 0;
let pageCursors = [null];
let lastVisible = null;
let hasNextPage = false;
let searchTerm = "";
let totalPages = 0;
const userCache = new Map();

const subjects = {
    "A": {text: "A (代数)", color: "#c85151"},
    "N": {text: "N (整数)", color: "#c56b11"},
    "G": {text: "G (幾何)", color: "#268f97"},
    "C": {text: "C (組合せ)", color: "#269733"}
};

modal.style.display = "block";

onAuthStateChanged(auth, async (user) => {
    await loadUserState(user);
    resetPagination();
    await loadProblems();
});

createdAtFilter.addEventListener("click", async () => {
    if (currentSort === SORT_CREATED) return;
    currentSort = SORT_CREATED;
    resetPagination();
    await loadProblems();
});

rateFilter.addEventListener("click", async () => {
    if (currentSort === SORT_RATE) return;
    currentSort = SORT_RATE;
    resetPagination();
    await loadProblems();
});

prevBtn.addEventListener("click", async () => {
    if (pageIndex === 0) return;
    pageIndex--;
    await loadProblems(pageCursors[pageIndex]);
});

nextBtn.addEventListener("click", async () => {
    if (!hasNextPage || !lastVisible) return;
    pageIndex++;
    pageCursors[pageIndex] = lastVisible;
    pageCursors = pageCursors.slice(0, pageIndex + 1);
    await loadProblems(lastVisible);
});

searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    searchTerm = normalizeSearchTerm(searchInput.value);
    resetPagination();
    await loadProblems();
});

clearSearchBtn.addEventListener("click", async () => {
    if (!searchTerm && searchInput.value.trim() === "") return;
    searchInput.value = "";
    searchTerm = "";
    resetPagination();
    await loadProblems();
});

async function loadUserState(user) {
    main.innerHTML = "";

    if (user) {
        login.style.display = "none";
        userID = user.uid;

        const snapshot = await getDoc(doc(db, "users", user.uid));
        const data = snapshot.data();
        userName.innerHTML = `ようこそ，<span class="name ${data.color}">${data.username}</span>`;
        userCache.set(user.uid, data);

        const ansSnapshot = await getDocs(collection(db, "users", user.uid, "solved"));
        solved = ansSnapshot.docs.map(e => e.id);
    } else {
        login.style.display = "flex";
        userName.textContent = "";
        userID = "";
        solved = [];
    }
}

function resetPagination() {
    pageIndex = 0;
    pageCursors = [null];
    lastVisible = null;
    hasNextPage = false;
    totalPages = 0;
}

function makeBaseConstraints() {
    const constraints = [
        where("status", "in", ["approved"])
    ];

    if (searchTerm) constraints.push(where("searchTokens", "array-contains", searchTerm));

    return constraints;
}

function makeProblemsQuery(cursor = null) {
    const order = currentSort === SORT_RATE
        ? [orderBy("correctRateSortKey", "asc"), orderBy("createdAt", "desc")]
        : [orderBy("createdAt", "desc")];

    const constraints = [
        ...makeBaseConstraints(),
        ...order,
        limit(PAGE_SIZE + 1)
    ];

    if (cursor) constraints.splice(constraints.length - 1, 0, startAfter(cursor));

    return query(collection(db, "posts"), ...constraints);
}

function makeCountQuery() {
    return query(collection(db, "posts"), ...makeBaseConstraints());
}

async function loadProblems(cursor = null) {
    modal.style.display = "block";
    setFilterState();
    setPaginationState(true);
    main.innerHTML = "";
    emptyMessage.style.display = "none";

    try {
        const [snapshot, countSnapshot] = await Promise.all([
            getDocs(makeProblemsQuery(cursor)),
            getCountFromServer(makeCountQuery())
        ]);
        const docs = snapshot.docs.slice(0, PAGE_SIZE);
        const totalCount = countSnapshot.data().count;
        totalPages = Math.ceil(totalCount / PAGE_SIZE);
        hasNextPage = snapshot.docs.length > PAGE_SIZE;
        lastVisible = docs.length > 0 ? docs[docs.length - 1] : null;

        await cacheCreators(docs);
        renderProblems(docs);
        updatePagination(docs.length);
        await MathJax.typesetPromise([main]);
    } catch (error) {
        console.error(error);
        const message = error && error.message ? error.message : "";
        emptyMessage.textContent = message.includes("index") || message.includes("インデックス")
            ? "検索用インデックスを作成中です。しばらく待ってからもう一度お試しください。"
            : "問題を読み込めませんでした。時間をおいてもう一度お試しください。";
        emptyMessage.style.display = "block";
        updatePagination(0);
    } finally {
        modal.style.display = "none";
        setPaginationState(false);
    }
}

function setFilterState() {
    createdAtFilter.classList.toggle("on", currentSort === SORT_CREATED);
    rateFilter.classList.toggle("on", currentSort === SORT_RATE);
}

function setPaginationState(loading) {
    prevBtn.disabled = loading || pageIndex === 0;
    nextBtn.disabled = loading || !hasNextPage;
}

function updatePagination(renderedCount) {
    prevBtn.disabled = pageIndex === 0;
    nextBtn.disabled = !hasNextPage;
    pageInfo.textContent = renderedCount === 0
        ? "0件"
        : `${totalPages}ページ中 ${pageIndex + 1}ページ目`;
}

async function cacheCreators(posts) {
    const uids = [...new Set(posts.map(post => post.data().creator))];

    await Promise.all(
        uids.map(async (uid) => {
            if (userCache.has(uid)) return;

            const snap = await getDoc(doc(db, "users", uid));

            if (snap.exists()) {
                userCache.set(uid, snap.data());
            } else {
                userCache.set(uid, {
                    username: undefined,
                    color: ""
                });
            }
        })
    );
}

function renderProblems(posts) {
    const fragment = document.createDocumentFragment();

    if (posts.length === 0) {
        emptyMessage.textContent = searchTerm
            ? "検索に一致する問題がありません。"
            : "表示できる問題がありません。";
        emptyMessage.style.display = "block";
        main.append(fragment);
        return;
    }

    posts.forEach((post, index) => {
        const data = post.data();
        const content = DOMPurify.sanitize(marked.parse(data.content));
        const user = userCache.get(data.creator) ?? {username: undefined, color: ""};
        const subject = subjects[data.category] ?? {text: data.category || "未分類", color: "#5f86c9"};
        const isSolved = solved.includes(post.id) || (userID && data.creator === userID);
        const problem = document.createElement("div");
        problem.className = "problem";

        problem.innerHTML = `
        <div class="problem-meta">
            <span class="category" style="background-color: ${subject.color}">${subject.text}</span>
            ${formatRateBar(data)}
            ${isSolved ? `
                <svg class="solved-icon" xmlns="http://w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-label="正解済み">
                <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
` : '<span class="solved-placeholder" aria-hidden="true"></span>'}
        </div>
        <h3 class="title">${data.title}</h3>
        <div class="content">${content}</div>
        <span class="creator"><span class="name ${user.color ?? ""}">${user.username ?? "***"}</span></span>
        `;
        problem.querySelectorAll("a").forEach(a => {
            a.target = "_blank";
            a.rel = "noopener noreferrer";
        });
        problem.addEventListener("click", () => {
            window.location.href = `solve.html?id=${post.id}`;
        });
        problem.style.animationDelay = `${index * 0.02}s`;
        fragment.append(problem);
    });

    main.append(fragment);
}

function normalizeSearchTerm(value) {
    const normalized = value
        .normalize("NFKC")
        .toLowerCase()
        .trim();
    const tokens = normalized.match(/[\p{Letter}\p{Number}]+/gu) || [];

    return (tokens[0] || "").slice(0, 12);
}

function formatRate(data) {
    const answerCount = Number(data.answerCount ?? 0);
    const correctCount = Number(data.correctCount ?? 0);
    const correctRate = Number(data.correctRate);

    if (answerCount <= 0 || !Number.isFinite(correctRate)) {
        return "--";
    }

    return `${correctRate.toFixed(1)}%`;
}

function formatRateBar(data) {
    const answerCount = Number(data.answerCount ?? 0);
    const correctRate = Number(data.correctRate);

    if (answerCount <= 0 || !Number.isFinite(correctRate)) {
        return `
            <span class="rate rate-empty">
                <span class="rate-label">--</span>
                <span class="rate-track"><span class="rate-fill" style="width: 0%"></span></span>
            </span>
        `;
    }

    const percent = Math.max(0, Math.min(100, correctRate));
    const level = percent < 40 ? "low" : percent < 75 ? "middle" : "high";

    return `
        <span class="rate rate-${level}" aria-label="正答率 ${percent.toFixed(1)}%">
            <span class="rate-label">${percent.toFixed(1)}%</span>
            <span class="rate-track"><span class="rate-fill" style="width: ${percent}%"></span></span>
        </span>
    `;
}

async function signout() {
    try {
        await signOut(auth);
    } catch (e) {
        console.log(e);
    }
}

window.signout = signout;
