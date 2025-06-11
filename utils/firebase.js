import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();
// import serviceAccount from '../sensitiveData/firebaseAdmin.json' assert { type: 'json' };
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;
