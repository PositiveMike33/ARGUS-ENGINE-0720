const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const oldLogin = `export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Error during Google authentication popup:', error);
    throw error;
  }
}`;

const newLogin = `let isLoginPopupOpen = false;

export async function loginWithGoogle() {
  if (isLoginPopupOpen) {
    throw new Error('auth/cancelled-popup-request');
  }
  isLoginPopupOpen = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error during Google authentication popup:', error);
    throw error;
  } finally {
    isLoginPopupOpen = false;
  }
}`;

code = code.replace(oldLogin, newLogin);
fs.writeFileSync('src/lib/firebase.ts', code);
console.log('Firebase patched');
