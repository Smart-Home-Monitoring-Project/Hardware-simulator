import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAmJOpB_wruQtHpfxfDq9LE8K3pK6ZIRAs",
  authDomain: "smart-home-monitoring-84ea7.firebaseapp.com",
  databaseURL:
    "https://smart-home-monitoring-84ea7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-home-monitoring-84ea7",
  storageBucket: "smart-home-monitoring-84ea7.firebasestorage.app",
  messagingSenderId: "1064687779027",
  appId: "1:1064687779027:web:8c9710296285266e3d6826",
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);