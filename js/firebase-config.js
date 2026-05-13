// Firebase Configuration Placeholder
// REPLACE with your actual config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCz5BCrd2FE2C7ndj2h2DsMnL5CxcuoFHw",
    authDomain: "mail-architect.firebaseapp.com",
    projectId: "mail-architect",
    storageBucket: "mail-architect.firebasestorage.app",
    messagingSenderId: "623617699938",
    appId: "1:623617699938:web:e0f44ce31ba1987afaa13b",
    measurementId: "G-20LE4J70E6"
};

// Initialize Firebase only if the script is loaded and config is present
let firebaseApp, db, auth, provider;

if (typeof firebase !== 'undefined') {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  provider = new firebase.auth.GoogleAuthProvider();
  if (firebase.analytics && firebaseConfig.measurementId) {
    firebase.analytics();
  }
}

const fbHelper = {
  signIn() {
    if (!auth) return Promise.reject("Firebase not initialized");
    return auth.signInWithPopup(provider);
  },
  signOut() {
    if (!auth) return Promise.reject("Firebase not initialized");
    return auth.signOut();
  },
  onAuthStateChanged(callback) {
    if (!auth) return;
    auth.onAuthStateChanged(callback);
  },
  async saveEmailToDb(uid, emailData, emailId = 'default') {
    if (!db) return;
    try {
      await db.collection("users").doc(uid).collection("emails").doc(emailId).set({
        ...emailData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.error("Error saving email to Firebase", e);
    }
  },
  async loadUserEmails(uid) {
    if (!db) return [];
    try {
      const snap = await db.collection("users").doc(uid).collection("emails").get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("Error loading user emails", e);
      return [];
    }
  },
  async deleteEmail(uid, emailId) {
    if (!db) return;
    try {
      await db.collection("users").doc(uid).collection("emails").doc(emailId).delete();
    } catch (e) {
      console.error("Error deleting email", e);
    }
  },
  async renameEmail(uid, emailId, newName) {
    if (!db) return;
    try {
      await db.collection("users").doc(uid).collection("emails").doc(emailId).update({ name: newName });
    } catch (e) {
      console.error("Error renaming email", e);
    }
  },
  async saveSnippetToDb(uid, snippetName, snippetData) {
    if (!db) return;
    try {
      await db.collection("users").doc(uid).collection("snippets").add({
        name: snippetName,
        data: snippetData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.error("Error saving snippet to Firebase", e);
    }
  },
  async loadUserSnippets(uid) {
    if (!db) return [];
    try {
      const snap = await db.collection("users").doc(uid).collection("snippets").orderBy("createdAt", "desc").get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("Error loading user snippets", e);
      return [];
    }
  },
  async deleteSnippet(uid, snippetId) {
    if (!db) return;
    try {
      await db.collection("users").doc(uid).collection("snippets").doc(snippetId).delete();
    } catch (e) {
      console.error("Error deleting snippet", e);
    }
  },
  async renameSnippet(uid, snippetId, newName) {
    if (!db) return;
    try {
      await db.collection("users").doc(uid).collection("snippets").doc(snippetId).update({ name: newName });
    } catch (e) {
      console.error("Error renaming snippet", e);
    }
  }
};

window.fbHelper = fbHelper;
