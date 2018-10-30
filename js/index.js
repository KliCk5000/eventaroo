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
    // Organize all the info I need into variables
    let eventName = responseJson.events[i].name.text;
    let eventUrl = responseJson.events[i].url;
    let eventLogoUrl = (responseJson.events[i].logo != null ? responseJson.events[i].logo.url : 'https://picsum.photos/400/200?blur');
    let eventFree = responseJson.events[i].is_free;
    let eventDescription = responseJson.events[i].description.html;
    
    // These next two variables change the timestamp to something readable
    let dateOfEvent = new Date(responseJson.events[i].start.local);
    let dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', };
    
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
    $( event.target ).parent().toggleClass('small-description large-description');
    if ($( event.target ).parent().hasClass('large-description')) {
      $( event.target ).text('Colapse Description');
    } else {
      $( event.target ).text('...Read More...');
    }
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