const fs = require("fs");
const path = require("path");
const {initializeApp, cert} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {recalculatePostStats} = require("./stats");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (fs.existsSync(serviceAccountPath)) {
  initializeApp({
    credential: cert(require(serviceAccountPath)),
    projectId: "mathproblems-4cba9"
  });
} else {
  initializeApp({
    projectId: "mathproblems-4cba9"
  });
}

recalculatePostStats(getFirestore())
  .then((result) => {
    console.log(`Recalculated ${result.postCount} posts from ${result.answerCount} answers.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
