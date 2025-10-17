/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
// functions/src/index.ts
import * as functions from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

initializeApp();

const db = getFirestore(undefined, "note-sync");

// Create a user doc in Firestore user collections when a new user sign ups
export const createUserDoc = functions
    .region("asia-southeast1")
    .auth.user()
    .onCreate(async (user) => {
        await db
            .collection("users")
            .doc(user.uid)
            .set({
                name: user.displayName ?? null,
                createdAt: FieldValue.serverTimestamp(),
            });
    });

// Delete a user doc and its subcollections in Firestore user collections when a user deletes his account
export const deleteUserDoc = functions
    .region("asia-southeast1")
    .auth.user()
    .onDelete(async (user) => {
        const uid = user.uid;
        await db.recursiveDelete(db.doc(`users/${uid}`));
    });

// Delete a user's saved video and its 'notes' subcollection by videoId
export const deleteVideoDocWithNotes = functions
    .region("asia-southeast1")
    .https.onCall(async (data, context) => {
        const uid = data?.uid;
        const videoId = data?.videoId;

        if (context.auth.uid !== uid) {
            throw new functions.https.HttpsError("permission-denied");
        }

        const ref = db.doc(`users/${uid}/videos/${videoId}`);
        await db.recursiveDelete(ref); // removes doc and all subcollections
        return { ok: true };
    });
