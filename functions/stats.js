const CORRECT_RESULT = "正解";
const UNANSWERED_SORT_KEY = 101;
const BATCH_LIMIT = 450;
const MAX_SEARCH_TOKENS = 500;

async function recalculatePostStats(db) {
  const postsSnap = await db.collection("posts").get();
  const statsByPostId = new Map();

  postsSnap.forEach((postDoc) => {
    statsByPostId.set(postDoc.id, {
      answerCount: 1,
      correctCount: 1,
      creator: postDoc.data().creator || "",
      post: postDoc.data()
    });
  });

  const answersSnap = await db.collection("answers").get();
  answersSnap.forEach((answerDoc) => {
    const answer = answerDoc.data();
    if (!answer.problemID || !statsByPostId.has(answer.problemID)) return;

    const stats = statsByPostId.get(answer.problemID);
    if (answer.userID && answer.userID === stats.creator) return;

    stats.answerCount++;
    if (answer.result === CORRECT_RESULT) stats.correctCount++;
  });

  let batch = db.batch();
  let operationCount = 0;
  let updatedCount = 0;

  for (const [postId, stats] of statsByPostId) {
    batch.set(
      db.collection("posts").doc(postId),
      {
        ...makeStats(stats.answerCount, stats.correctCount),
        creatorIncludedInStats: true,
        searchTokens: buildSearchTokens(stats.post)
      },
      {merge: true}
    );
    operationCount++;
    updatedCount++;

    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) await batch.commit();

  return {
    postCount: updatedCount,
    answerCount: answersSnap.size
  };
}

function makeStats(answerCount, correctCount) {
  const correctRate = answerCount > 0 ? (correctCount / answerCount) * 100 : 0;

  return {
    answerCount,
    correctCount,
    correctRate,
    correctRateSortKey: answerCount > 0 ? correctRate : UNANSWERED_SORT_KEY
  };
}

function withCreatorBaseline(post) {
  const answerCount = Number(post.answerCount || 0) + 1;
  const correctCount = Number(post.correctCount || 0) + 1;

  return {
    ...makeStats(answerCount, correctCount),
    creatorIncludedInStats: true
  };
}

function buildSearchTokens(post) {
  const source = normalizeSearchText([
    post.title || "",
    post.content || "",
    post.category || ""
  ].join(" "));
  const chunks = source.match(/[\p{Letter}\p{Number}]+/gu) || [];
  const tokens = new Set();

  for (const chunk of chunks) {
    for (let size = 1; size <= Math.min(12, chunk.length); size++) {
      for (let i = 0; i <= chunk.length - size; i++) {
        tokens.add(chunk.slice(i, i + size));
        if (tokens.size >= MAX_SEARCH_TOKENS) return [...tokens];
      }
    }

    if (tokens.size >= MAX_SEARCH_TOKENS) break;
  }

  return [...tokens];
}

function normalizeSearchText(value) {
  return String(value)
    .normalize("NFKC")
    .toLowerCase();
}

function sameArray(left = [], right = []) {
  if (!Array.isArray(left) || left.length !== right.length) return false;

  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return false;
  }

  return true;
}

module.exports = {
  CORRECT_RESULT,
  recalculatePostStats,
  makeStats,
  withCreatorBaseline,
  buildSearchTokens,
  sameArray
};
