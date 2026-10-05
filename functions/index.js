const logger = require("firebase-functions/logger");
const functions = require("firebase-functions/v1");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {
  CORRECT_RESULT,
  makeStats,
  withCreatorBaseline,
  buildSearchTokens,
  sameArray
} = require("./stats");

initializeApp();

const db = getFirestore();

exports.onAnswerCreated = functions.firestore
  .document("answers/{answerId}")
  .onCreate(async (snap, context) => {
  const answer = snap.data();
  if (!answer || !answer.problemID) {
    logger.warn("answers document is missing problemID", {answerId: context.params.answerId});
    return;
  }

  const postRef = db.collection("posts").doc(answer.problemID);
  const isCorrect = answer.result === CORRECT_RESULT;

  await db.runTransaction(async (transaction) => {
    const postSnap = await transaction.get(postRef);
    if (!postSnap.exists) {
      logger.warn("answer points to a missing post", {
        answerId: context.params.answerId,
        problemID: answer.problemID
      });
      return;
    }

    const post = postSnap.data() || {};
    if (answer.userID && answer.userID === post.creator) {
      if (post.creatorIncludedInStats !== true) {
        transaction.set(postRef, withCreatorBaseline(post), {merge: true});
      }
      return;
    }

    const baseline = post.creatorIncludedInStats === true ? 0 : 1;
    const answerCount = Number(post.answerCount || 0) + baseline + 1;
    const correctCount = Number(post.correctCount || 0) + baseline + (isCorrect ? 1 : 0);

    transaction.set(postRef, {
      ...makeStats(answerCount, correctCount),
      creatorIncludedInStats: true
    }, {merge: true});
  });
});

exports.onPostWritten = functions.firestore
  .document("posts/{postId}")
  .onWrite(async (change) => {
  if (!change.after.exists) return;

  const post = change.after.data() || {};
  const updates = {};
  const searchTokens = buildSearchTokens(post);

  if (!sameArray(post.searchTokens, searchTokens)) {
    updates.searchTokens = searchTokens;
  }

  if (post.creator && post.creatorIncludedInStats !== true) {
    Object.assign(updates, withCreatorBaseline(post));
  }

  if (Object.keys(updates).length === 0) return;

  await change.after.ref.set(updates, {merge: true});
});
