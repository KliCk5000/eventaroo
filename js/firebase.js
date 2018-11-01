// Initialize Firebase
var config = {
  apiKey: "AIzaSyBVPLzkLRsHH" + "tXkt4o45W9J2u6XOsW0ozc",
  authDomain: "eventaroo-nd.firebaseapp.com",
  databaseURL: "https://eventaroo-nd.firebaseio.com",
  projectId: "eventaroo-nd",
  storageBucket: "eventaroo-nd.appspot.com",
  messagingSenderId: "477507081723"
};

firebase.initializeApp(config);

var database = firebase.database();
var dbRefUsers = database.ref('users/');

// Google sign-in provider
var provider = new firebase.auth.GoogleAuthProvider();

// Log in variables
const btnGoogle = $('.js-google-sign-in');
const btnLogout = $('.js-log-out');
const btnLogin = $('.js-log-in');

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
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    userId = user.uid;
  })
  .catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.authCredential type that was used.
    var credential = error.credential;
  });
});