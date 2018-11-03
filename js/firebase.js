// Initialize Firebase
const config = {
  apiKey: "AIzaSyBVPLzkLRsHH" + "tXkt4o45W9J2u6XOsW0ozc",
  authDomain: "eventaroo-nd.firebaseapp.com",
  databaseURL: "https://eventaroo-nd.firebaseio.com",
  projectId: "eventaroo-nd",
  storageBucket: "eventaroo-nd.appspot.com",
  messagingSenderId: "477507081723"
};

firebase.initializeApp(config);

let database = firebase.database();
let dbRefUsers = database.ref('users/');

// Google sign-in provider
let provider = new firebase.auth.GoogleAuthProvider();

$('.js-log-out').on('click', e => {
  firebase.auth().signOut();
  console.log('clicked');
});

firebase.auth().onAuthStateChanged(firebaseUser => {
  if (firebaseUser) {
    console.log(firebaseUser);
    $('.username').text(`Hello ${firebaseUser.displayName}`);
  } else {
    console.log('Not signed in');
    $('.username').text(`Not signed-in`);
  }
});

$('.js-google-sign-in').on('click', e => {
  firebase.auth().signInWithPopup(provider)
  .then(function (result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    let token = result.credential.accessToken;
    // The signed-in user info.
    let user = result.user;
    userId = user.uid;
  })
  .catch(function (error) {
    // Handle Errors here.
    let errorCode = error.code;
    let errorMessage = error.message;
    // The email of the user's account used.
    let email = error.email;
    // The firebase.auth.authCredential type that was used.
    let credential = error.credential;
  });
});