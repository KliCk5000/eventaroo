const clientId = '477507081723-usun9dj8n45iigbaehgue90c2potbgnr.apps.googleusercontent.com';
//const clientSecret = 'fmeCxS3TFgm0S3N4zDwdMQXF';
const googleCalendarApiKey = 'AIzaSyBNU3Iogt_KZL8VY_GsyUdNXKouq-uk2Ns';
const scopes = 'https://www.googleapis.com/auth/calendar.events';

// POST https://www.googleapis.com/calendar/v3/calendars/calendarId/events

let calendarId = 'primary';

// Scope - https://www.googleapis.com/auth/calendar.events

// Request body

const calendarEvent = {
  start: '',
  end: '',

  summary: 'Testing',
  description: 'Just testing something out',
  location: 'Denver, CO',
}

var request = gapi.client.calendar.events.insert({
  'calendarId': 'primary',
  'resource': resource
});

function handleClientLoad() {
  gapi.client.setApiKey(apiKey);
  window.setTimeout(checkAuth, 1);
  checkAuth();
};

function checkAuth() {
  gapi.auth.authorize({
    client_id: clientId,
    scope: scopes,
    immediate: true,
  }, handleAuthResult);
};

function handleAuthResult(authResult) {
  var authorizeButton = document.getElementById('author')
};