import admin from "firebase-admin";

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

if (!admin.apps.length) {
  // console.log(
  //   "Initializing Firebase Admin with project ID:",
  //   process.env.FIREBASE_PROJECT_ID
  // );
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    // console.log("Firebase Admin initialized");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }
} else {
  // console.log("Using existing Firebase Admin app");
}

const adminAuth = admin.auth();
const adminFirestore = admin.firestore();

export { adminAuth, adminFirestore };
