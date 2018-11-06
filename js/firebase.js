// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBVPLzkLRsHH" + "tXkt4o45W9J2u6XOsW0ozc",
  authDomain: "eventaroo-nd.firebaseapp.com",
  databaseURL: "https://eventaroo-nd.firebaseio.com",
  projectId: "eventaroo-nd",
  storageBucket: "eventaroo-nd.appspot.com",
  messagingSenderId: "477507081723",
};

firebase.initializeApp(firebaseConfig);

// Calendar Config
const calendarConfig = {
  'apiKey': 'AIzaSyBNU3Iogt_K' + 'ZL8VY_GsyUdNXKouq-uk2Ns',
  'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  'clientId': '477507081723-usun9dj8n45iigbae' + 'hgue90c2potbgnr.apps.googleusercontent.com',
  'scope': 'https://www.googleapis.com/auth/calendar.events',
};

let database = firebase.database();
let dbRefUsers = database.ref('users/');

// Google sign-in provider
let provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.setCustomParameters({
  'prompt': 'consent',
})

// Log Out button
$('.js-log-out').on('click', e => {
  firebase.auth().signOut();
  console.log('User chose to log out');
});

// When Authorization state changes
firebase.auth().onAuthStateChanged(firebaseUser => {
  if (firebaseUser) {
    // If the firebase user exists, initialize the calendar client
    gapi.client.init(calendarConfig)
      .then(function () {
        // Check to see if google has your authenitcation
        if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
          console.log('Google OAuth2 is signed in');
          $('.js-add-to-calendar').removeAttr('disabled');
        } else {
          $('.js-add-to-calendar').attr('disabled','disabled');
          console.log('Something went wrong with Google Authentication, so you cant add to google calander');
        }
      });
    // Display on the screen that the user is logged in or not
    $('.username').text(`Hello ${firebaseUser.displayName}`);
  } else {
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

function addTestButtonWatch() {
  $('.js-test-button').on('click', event => {
    event.preventDefault();
    console.log('clicked test button');

    firebase.auth().currentUser.getIdToken()
      .then(insertTestEvent())
      .then(function (response) {
        console.log(response);
      });
  });
}

function insertTestEvent() {
  const calId = 'primary';
  const testEvent = {
    'start': {
      'dateTime': '2018-11-04T09:00:00-07:00',
      'timeZone': 'America/Los_Angeles'
    },
    'end': {
      'dateTime': '2018-11-04T17:00:00-07:00',
      'timeZone': 'America/Los_Angeles'
    },
    summary: 'Testing',
    description: 'Just testing something out',
    location: 'Denver, CO',
  }

  console.log(testEvent);

  gapi.client.calendar.events.insert({
      'calendarId': calId,
      'resource': testEvent,
    })
    .then(function (response) {
      console.log(response);
    });

  console.log('event added!');
}