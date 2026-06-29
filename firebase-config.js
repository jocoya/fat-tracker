/* ===== Firebase 設定 =====
 * 雲端備份是「選用」功能。沒填這裡，App 仍可純本機離線使用。
 *
 * 啟用步驟：
 * 1. 到 https://console.firebase.google.com 建立專案
 * 2. 專案設定 → 一般 → 你的應用程式 → 新增 Web App，複製 firebaseConfig
 * 3. 把下面的值換成你的（apiKey 等）
 * 4. Authentication → Sign-in method → 啟用「Google」
 * 5. Firestore Database → 建立資料庫（正式或測試模式皆可）
 * 6. Firestore 規則貼上（只允許本人讀寫自己的資料）：
 *
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /users/{uid} {
 *          allow read, write: if request.auth != null && request.auth.uid == uid;
 *        }
 *      }
 *    }
 */

window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
