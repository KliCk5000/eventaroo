// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBVPLzkLRsHH" + "tXkt4o45W9J2u6XOsW0ozc",
  authDomain: "eventaroo-nd.firebaseapp.com",
  databaseURL: "https://eventaroo-nd.firebaseio.com",
  projectId: "eventaroo-nd",
  storageBucket: "eventaroo-nd.appspot.com",
  messagingSenderId: "477507081723"
};

firebase.initializeApp(firebaseConfig);

let database = firebase.database();
let dbRefUsers = database.ref("users/");

// Google sign-in provider
let provider = new firebase.auth.GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/calendar.events");
provider.setCustomParameters({
  prompt: "consent"
});

// Log Out button
$(".js-log-out").on("click", e => {
  firebase.auth().signOut();
  $(".js-google-sign-in").removeClass("hidden");
  $(".js-log-out").addClass("hidden");
  console.log("User chose to log out");
});

// When Authorization state changes
firebase.auth().onAuthStateChanged(firebaseUser => {
  if (firebaseUser) {
    $(".username").text(`Hello ${firebaseUser.displayName}`);
    $(".js-google-sign-in").addClass("hidden");
    $(".js-log-out").removeClass("hidden");
  } else {
    $(".username").text(`Not signed-in`);
    $(".js-google-sign-in").removeClass("hidden");
    $(".js-log-out").addClass("hidden");
  }
});

$(".js-google-sign-in").on("click", e => {
  firebase
    .auth()
    .signInWithPopup(provider)
    .then(function(result) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      let token = result.credential.accessToken;
      // The signed-in user info.
      let user = result.user;
      userId = user.uid;
    })
    .catch(function(error) {
      // Handle Errors here.
      let errorCode = error.code;
      let errorMessage = error.message;
      // The email of the user's account used.
      let email = error.email;
      // The firebase.auth.authCredential type that was used.
      let credential = error.credential;
    });
});

/**
 * addToCallendar(event)
 * @param {Object} event - Click event object
 * Attempts to add an even to users primary calendar
 */
function addToCallendar(event) {
  // Calendar Config
  const calendarConfig = {
    apiKey: "AIzaSyBNU3Iogt_K" + "ZL8VY_GsyUdNXKouq-uk2Ns",
    discoveryDocs: [
      "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
    ],
    clientId:
      "477507081723-usun9dj8n45iigbae" +
      "hgue90c2potbgnr.apps.googleusercontent.com",
    scope: "https://www.googleapis.com/auth/calendar.events"
  };

  // Get the event they clicked on
  const eventId = $(event.target)
    .parents(".result-listing")
    .attr("id");
  let eventIndex = resultList.events.findIndex(
    element => element.id === eventId
  );

  var currentEvent = event;
  // check if signed into google
  if (firebase.auth().currentUser) {
    console.log(`User ${firebase.auth().currentUser.displayName} is logged in`);
    if (gapi.auth2.getAuthInstance()) {
      if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        console.log("Google OAuth2 is signed in");
        insertEvent(event);
      } else {
        gapi.auth2
          .getAuthInstance()
          .signIn(calendarConfig)
          .then(function() {
            // Check to see if google has your authenitcation
            if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
              console.log("Google OAuth2 is signed in");
              insertEvent(currentEvent);
            } else {
              $(`#${resultList.events[eventIndex].id}`)
                .find(".js-add-to-calendar")
                .html('<i class="far fa-calendar-times error"></i>');
              $(`#${resultList.events[eventIndex].id}`)
                .find(".calendar-icon-day")
                .html('<i class="far fa-calendar-times error"></i>');
              console.log(
                "Something went wrong with Google Authentication, so you cant add to google calander"
              );
            }
          });
      }
      console.log("Google OAuth2 is signed in");
    } else {
      gapi.client.init(calendarConfig).then(function() {
        // Check to see if google has your authenitcation
        if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
          console.log("Google OAuth2 is signed in");
          insertEvent(currentEvent);
        } else {
          gapi.auth2
            .getAuthInstance()
            .signIn(calendarConfig)
            .then(function() {
              // Check to see if google has your authenitcation
              if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
                console.log("Google OAuth2 is signed in");
                insertEvent(currentEvent);
              } else {
                $(`#${resultList.events[eventIndex].id}`)
                  .find(".js-add-to-calendar")
                  .html('<i class="far fa-calendar-times error"></i>');
                $(`#${resultList.events[eventIndex].id}`)
                  .find(".calendar-icon-day")
                  .html('<i class="far fa-calendar-times error"></i>');
                console.log(
                  "Something went wrong with Google Authentication, so you cant add to google calander"
                );
              }
            });
        }
      });
    }
  } else {
    firebase
      .auth()
      .signInWithPopup(provider)
      .then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        let token = result.credential.accessToken;
        // The signed-in user info.
        let user = result.user;
        userId = user.uid;

        gapi.client.init(calendarConfig).then(function() {
          // Check to see if google has your authenitcation
          if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
            console.log("Google OAuth2 is signed in");
            insertEvent(currentEvent);
          } else {
            $(`#${resultList.events[eventIndex].id}`)
              .find(".js-add-to-calendar")
              .html('<i class="far fa-calendar-times error"></i>');
            $(`#${resultList.events[eventIndex].id}`)
              .find(".calendar-icon-day")
              .html('<i class="far fa-calendar-times error"></i>');
            console.log(
              "Something went wrong with Google Authentication, so you cant add to google calander"
            );
          }
        });
      })
      .catch(function(error) {
        // Handle Errors here.
        let errorCode = error.code;
        let errorMessage = error.message;
        // The email of the user's account used.
        let email = error.email;
        // The firebase.auth.authCredential type that was used.
        let credential = error.credential;
      });
  }
}

function insertEvent(event) {
  // Get the event they clicked on
  const eventId = $(event.target)
    .parents(".result-listing")
    .attr("id");
  let eventIndex = resultList.events.findIndex(
    element => element.id === eventId
  );

  // Insert into google calendar
  firebase
    .auth()
    .currentUser.getIdToken()
    .then(insertGoogleEvent(eventIndex))
    .then(function(response) {});
}
