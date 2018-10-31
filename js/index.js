/**
 * watchLandingPage()
 * First event handler that listens for the "submit" and "near me" buttons on the landing page
 */
function watchLandingPage() {
  // Submit Button on Landing Page
  $('.landing-container').submit(event => {
    event.preventDefault();

    // Check to see if user put in a location
    let userLocation;

    if ($('.js-location').val()) {
      userLocation = $('.js-location').val();
    } else {
      // Try to put in user's location
    }

    console.log(userLocation);

    let landingPageQuery = [
      userLocation, // Location the user wants to search
      $('.js-free-mode').is(":checked"), // Did they check the free-mode box?
    ];

    changeToResultPage(landingPageQuery);
  });

  // Near me Button on Landing Page
  $('.landing-container').on('click', '.js-near-me', event => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    }
  });
}


function getReverseGeolocation(latitude, longitude) {
  const googleLatLng = `latlng=${latitude},${longitude}`
  const google_url = "https://maps.googleapis.com/maps/api/geocode/json?";
  const google_api = '&key=' + 'AIzaSyDfecR4U' + 'FalgjCmVA2dLp4' + 'r2OdLAmKczvA';
  const resultType = '&result_type=locality';
  const completeURL = google_url + googleLatLng + resultType + google_api;

  console.log(completeURL);

  fetch(completeURL)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => {
      if (responseJson.results[0] !== undefined) {
        let city = responseJson.results[0].address_components[0].short_name;
        let state = responseJson.results[0].address_components[2].short_name;
        $('.js-location').val(`${city}, ${state}`);
      }
    })
    .catch(err => {
      $('.js-error-output').append('Could not get address: ' + err);
    });

}

function geoSuccess(position) {
  getReverseGeolocation(position.coords.latitude, position.coords.longitude);
  $('.js-location').val(`...getting location...`);
}

function geoError() {
  $('.js-error-output').append(`Sorry, could not get location`);
}

/**
 * changeToResultPage(landingPageQuery)
 * ~landingPageQuery is an array with LOCATION, and FREE-MODE [true or false]
 * This changes from the landing page to the results screen
 * and handles any changes between the two screens
 */
function changeToResultPage(landingPageQueryArray) {
  // Remove the landing page
  $('.landing-container').empty();

  $('.results-container').toggleClass('hidden');

  // Update the logo to reflect the new screen
  $('.logo').removeClass('landing-logo');
  $('.logo').addClass('results-logo');

  // Send the landingPageQuery that we got from the landing page and
  // make the API request which will display the data on the results
  // page.
  getLandingPageEventbriteData(landingPageQueryArray);
  // Show the Results Filter Header to let the user change their query
  addResultsFilterHeader(landingPageQueryArray);

  // While we are waiting for the results to come in, we can get the
  // results page ready for all the data.
  initializeResultsPage();

  watchResultsPage();
}

/**
 * initializeResultsPage()
 * This first sets up the HTML for the results page
 */
function initializeResultsPage() {
  $('.results-container').append(
    `
    <p class="loading center">Loading.........</p>
    `
  )
}

/**
 * getLandingPageEventbriteData(landingPageQuery)
 * ~landingPageQuery is an array with LOCATION, and FREE-MODE [true or false]
 * Send the GET request to the Eventbrite API to load our first list of results
 * This function should only get called once, because its the initial data.
 * We will make another GET request from then on out if the user wants to filter
 * or change the results.
 */
function getLandingPageEventbriteData(landingPageQuery) {
  const params = {
    'location.address': landingPageQuery[0],
    'location.within': '10mi',
    price: (landingPageQuery[1] ? 'free' : 'paid'),
    token: "JRKAA3O73D" + "DJB47QH5OT",
  }

  const queryString = formatQueryParams(params);
  const url = `https://www.eventbriteapi.com/v3/events/search/?${queryString}`;

  console.log(url);

  // - GET FETCH request
  fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => displayResults(responseJson))
    .catch(err => {
      $('.js-error-output').append(`Something went wrong: ${err.message}`);
      console.log(err);
    });

}

function getResultsPageEventbriteData(resultPageQuery) {

  const queryString = formatQueryParams(resultPageQuery);
  const url = `https://www.eventbriteapi.com/v3/events/search/?${queryString}`;

  console.log(url);

  // - GET FETCH request
  fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => displayResults(responseJson))
    .catch(err => {
      $('.js-error-output').append(`Something went wrong: ${err.message}`);
      console.log(err);
    });

}

/**
 * formatQueryParams(params)
 * Takes an object of keys and values and turns it into something like:
 * ?location.address=Denver%2C%20co&location.within=10mi&price=free
 */
function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
  return queryItems.join('&');
}

/**
 * displayResults(responseJson)
 * Takes the response from Eventbrite and displays it on the screen depending
 * on what data we need.
 */
// display results from eventbrite
function displayResults(responseJson) {
  $('.loading').remove();
  console.log(responseJson);

  for (let i = 0; i < responseJson.events.length; i++) {
    // Organize all the info I need into variables
    let eventName = responseJson.events[i].name.text;
    let eventUrl = responseJson.events[i].url;
    let eventLogoUrl = (responseJson.events[i].logo != null ? responseJson.events[i].logo.url : 'https://picsum.photos/400/200?blur');
    let eventFree = responseJson.events[i].is_free;
    let eventDescription = responseJson.events[i].description.html;

    // These next two variables change the timestamp to something readable
    let dateOfEvent = new Date(responseJson.events[i].start.local);
    let dateOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    $('.results-container').append(`
    <div class="result-listing clearfix">
    <h2><a href="${eventUrl}" target=”_blank”>${eventName}</a></h2>
    <img class="result-image" src="${eventLogoUrl}" />
    <p>Start time: ${dateOfEvent.toLocaleDateString('en-US', dateOptions)}</p>
    <p>Is free: ${eventFree}</p>
    <div class="result-description small-description clearfix">
    ${eventDescription}
    <br/><br/>
    <a class="read-more description-button read-text">...Read More...</a>
    </div>
    </div>
    `);

  }

  // Remove any unwanted tags
  $('.result-description img').remove();
  $('.result-description object').remove();

  watchDescriptionButtons();
}

/**
 * watchDescriptionButtons()
 * 
 */
function watchDescriptionButtons() {
  $('.results-container').on('click', '.description-button', event => {
    event.preventDefault();
    $(event.target).parent().toggleClass('small-description large-description');
    if ($(event.target).parent().hasClass('large-description')) {
      $(event.target).text('Colapse Description');
    } else {
      $(event.target).text('...Read More...');
    }
  });
}

function addResultsFilterHeader(previousQuery) {
  $('.results-container').append(`
  <div class="results-filter">
        <form class="js-form">
            <div class="form-line">
              <label for="location">Search another location: </label>
              <input type="text" name="location" class="js-location" placeholder="Denver, Co">
            </div>
            <div class="form-line">
              <label for="query">Search term: </label>
              <input type="text" name="query" class="js-query" placeholder="Entertainment">
            </div>
            <div class="form-line">
              <label for="free-mode">Show only free events</label>
              <input type="checkbox" name="free-mode" class="js-free-mode">
            </div>
            <div class="form-line">
              <label for="sort-by">Sort by: </label>
              <select name="sort-by" class="js-sort-by">
                  <option value="date">date decending</option>
                  <option value="-date">date ascending</option>
                  <option value="distance">distance decending</option>
                  <option value="-distance">distance ascending</option>
                  <option value="best">best to worst</option>
                  <option value="-best">worst to best</option>
                </select>
            </div>
            <div class="form-line">
              <input name="filter" type="submit" value="Go!">
            </div>
          </form>
    </div>
  `);

  $('.js-location').val(previousQuery[0]);
  $('.js-free-mode').prop('checked', previousQuery[1]);
}

/**
 * watchResultsPage()
 * Event handler that listens for the "submit" on the results page
 */
function watchResultsPage() {
  $('.results-container').submit(event => {
    event.preventDefault();

    let resultQuery = {
      'location.address': $('.js-location').val(),
      q: $('.js-query').val(),
      'location.within': '10mi',
      sort_by: $('.js-sort-by').val(),
      price: ($('.js-free-mode').is(":checked") ? 'free' : 'paid'),
      token: "JRKAA3O73D" + "DJB47QH5OT",
    };

    let isChecked = $('.js-free-mode').is(":checked");

    getResultsPageEventbriteData(resultQuery);

    let previousLocation = $('.js-location').val();

    $('.results-container').empty();
    addResultsFilterHeader(previousLocation);

    // Update header with previous info
    if (resultQuery["location.address"].val !== null) {
      $('.js-location').val(resultQuery["location.address"]);
    }
    if (resultQuery.q.val !== null) {
      $('.js-query').val(resultQuery.q);
    }
    $('.js-sort-by').val(resultQuery.sort_by);
    console.log(isChecked);
    $('.js-free-mode').prop('checked', isChecked);

    initializeResultsPage();
  })
}

// TODO: list
// listen for click on event to show more events

/**
 * Entry point for jQuery to listen to the submit button
 */
$(watchLandingPage);