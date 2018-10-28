/**
 * watchLandingPage()
 * First event handler that listens for the "submit" on the landing page
 */
function watchLandingPage() {
  $('.landing-container').submit(event => { 
    event.preventDefault();
    
    let landingPageQuery = [
      $('.js-location').val(), // Location the user wants to search
      $('.js-free-mode').is(":checked"), // Did they check the free-mode box?
    ];

    changeToResultPage(landingPageQuery);
  });
}

/**
 * changeToResultPage(landingPageQuery)
 * ~landingPageQuery is an array with LOCATION, and FREE-MODE [true or false]
 * This changes from the landing page to the results screen
 * and handles any changes between the two screens
 */
function changeToResultPage(landingPageQuery) {
  // Remove the landing page
  $('.landing-container').empty();

  // Update the logo to reflect the new screen
  $('.logo').removeClass('landing-logo');
  $('.logo').addClass('results-logo');

  // Send the landingPageQuery that we got from the landing page and
  // make the API request which will display the data on the results
  // page.
  getLandingPageEventbriteData(landingPageQuery);
  // While we are waiting for the results to come in, we can get the
  // results page ready for all the data.
  initializeResultsPage();
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
      $('.results-container').append(`<p class="error">Something went wrong: ${err.message}</p>`);
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
    let name = responseJson.events[i].name.text;
    let logoUrl = (responseJson.events[i].logo != null ? responseJson.events[i].logo.url : 'https://picsum.photos/400/200?blur');


    $('.results-container').append(`
    <div class="result-listing clearfix">
      <h2>Name: ${name}</h2>
      <img class="result-image" src="${logoUrl}" />
      <p>Start time: ${responseJson.events[i].start.local}</p>
      <p>Url: ${responseJson.events[i].url}</p>
      <p>Is free: ${responseJson.events[i].is_free}</p>
      <button class="description-button">Click for Description</button>
      <div class="result-description hidden">
        ${responseJson.events[i].description.html}
      </div>
    </div>
    `);
  }
  watchDescriptionButtons();
}

/**
 * watchDescriptionButtons()
 * 
 */
function watchDescriptionButtons() {
  $('.results-container').on('click', '.description-button', event => {
    event.preventDefault();
    $( event.target ).next().toggleClass('hidden');
  });
}


// TODO: list
// listen for more results buttons
// display filter results?
// listen for submit on filter?
// listen for click on event to show more events

/**
 * Entry point for jQuery to listen to the submit button
 */
$(watchLandingPage);