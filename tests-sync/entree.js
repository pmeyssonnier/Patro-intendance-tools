import { getAuth as _ga, connectAuthEmulator } from "firebase/auth";
import { getFirestore as _gf, connectFirestoreEmulator } from "firebase/firestore";
export * from "firebase/app";
export * from "firebase/auth";
export * from "firebase/firestore";
export function getAuth(...a) {
  const x = _ga(...a);
  if (!x.__em) {
    connectAuthEmulator(x, "http://127.0.0.1:9099", { disableWarnings: true });
    x.__em = true;
  }
  return x;
}
export function getFirestore(...a) {
  const x = _gf(...a);
  if (!x.__em) {
    connectFirestoreEmulator(x, "127.0.0.1", 8080);
    x.__em = true;
  }
  return x;
}
