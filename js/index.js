const EVENTBRITE_TOKEN = "JRKAA3O73D" + "DJB47QH5OT";
const FETCH_ADDITIONAL = true;
const resultList = {
  currentPage: 0,
  events: [],
};

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

    // If they did, we can send it to landingPageQuery below
    if ($('.js-location').val()) {
      userLocation = $('.js-location').val();
    }

    let landingPageQuery = {
      location: userLocation, // Location the user wants to search
      isFreeModeChecked: $('.js-free-mode').is(":checked"), // Did they check the free-mode box?
    };

    changeToResultPage(landingPageQuery);
  });

  // Near me Button on Landing Page
  $('.landing-container').on('click', '.js-near-me', event => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    }
  });
}

/**
 * changeToResultPage(landingPageQuery)
 * ~landingPageQuery is an object with 'location', and 'isFreeModeChecked' [true or false]
 * This changes from the landing page to the results screen
 * and handles any changes between the two screens
 */
function changeToResultPage(landingPageQuery) {
  // Remove the landing page
  $('.landing-container').empty();

  // Unhide the results container
  $('.results-container').toggleClass('hidden');
  $('.js-signon-container').toggleClass('hidden');

  // Update the logo to reflect the new screen
  $('.logo').removeClass('landing-logo');
  $('.logo').addClass('results-logo');

  // Send the landingPageQuery that we got from the landing page and
  // make the API request which will display the data on the results
  // page.
  const queryParams = {
    'location.address': landingPageQuery.location,
    'location.within': '10mi',
    price: (landingPageQuery.isFreeModeChecked ? 'free' : 'paid'),
  }
  fetchEventbriteData(queryParams);

  // Show the Results Filter Header to let the user change their query
  addResultsFilterHeader(landingPageQuery);

  // While we are waiting for the results to come in, we can get the
  // results page ready for all the data.
  loadResultsPage();

  // watch for any inputs on the result page
  watchResultsPage();
  watchAddToCalendarButton();
  watchDescriptionButtons();
  watchPageButtons();
}

/**
 * loadResultsPage()
 * This first sets up the HTML for the results page and displays a 'loading...'
 */
function loadResultsPage() {
  // For now, just show a 'loading' screen
  $('.results-container').append(
    `<p class="loading center">Loading.........</p>`
  )
}

/**
 * fetchEventbriteData(queryParams)
 * ~queryParams is an object that contains all parameters you would like to send with fetch request
 * Send the GET request to the Eventbrite API to load our first list of results
 * This function should only get called once, because its the initial data.
 * We will make another GET request from then on out if the user wants to filter
 * or change the results.
 */
function fetchEventbriteData(queryParams) {
  // You'll want a fresh Results List each time
  resultList.events.length = 0;

  // Take the queryParams Object and turn it into a string we can put in the URL
  queryParams.token = EVENTBRITE_TOKEN;
  const queryString = formatQueryParams(queryParams);
  const url = `https://www.eventbriteapi.com/v3/events/search/?${queryString}`;
  // - GET FETCH request
  console.log(url);
  fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => {
      console.log(responseJson);
      processResults(responseJson);
    })
    .catch(err => {
      $('.js-error-output').text(`Something went wrong: ${err.message}`);
    });
}

function fetchLocationOfEventBriteData(eventId, venueId) {
  const url = `https://www.eventbriteapi.com/v3/venues/${venueId}/?token=${EVENTBRITE_TOKEN}`;

  fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => {
      setLocationOfEventBriteData(responseJson, eventId, venueId);
    })
    .catch(err => {
      $('.js-error.output').text(`Something went wrong with location: ${err.message}`);
    });
}

function setLocationOfEventBriteData(responseJson, eventId, venueId) {
  // Quickly process the result
  const location = {
    'name': responseJson.name,
    'venue_id': venueId,
    'address': {
      'localized_address_display': responseJson.address.localized_address_display,
      'localized_multi_line_address_display': responseJson.address.localized_multi_line_address_display,
    },
    'latitude': responseJson.latitude,
    'longitude': responseJson.longitude,
  }
  // Put the location into the event list
  let eventIndex = resultList.events.findIndex(element => element.id === eventId);
  resultList.events[eventIndex].location = location;

  // Try to update location of the event on screen
  $(`#${resultList.events[eventIndex].id}`).find('.js-event-location-name').text(`Venue Name: ${resultList.events[eventIndex].location.name}`);
  $(`#${resultList.events[eventIndex].id}`).find('.js-event-location-address').text(`Location: ${resultList.events[eventIndex].location.address.localized_address_display}`);

  if (resultList.events[eventIndex].location.address.localized_address_display === null) {
    $(`#${resultList.events[eventIndex].id}`).find('.js-event-location').text(`Location: Somewhere far far away...`);
  }
}

function fetchCostOfEventBriteData(eventId) {
  const url = `https://www.eventbriteapi.com/v3/events/${eventId}/ticket_classes/?token=${EVENTBRITE_TOKEN}`

  fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => {
      setCostOfEventBriteData(responseJson, eventId);
    })
    .catch(err => {
      $('.js-error.output').text(`Something went wrong with price: ${err.message}`);
    });
}

function setCostOfEventBriteData(responseJson, eventId) {
  // Each event can have more than one price
  const costArray = new Array;
  for (const ticket of responseJson.ticket_classes) {
    if (ticket.cost) {
      // if it has a cost add it,
      costArray.push(ticket.cost);
    } else {
      // else give it a blank value;
      costArray.push({
        "display": "Unknown",
        "currency": "USD",
        "value": 0,
        "major_value": "0.00"
      });
    }
  }

  // Take an array of just the values
  const costValuesArray = new Array;
  for (const cost of costArray) {
    costValuesArray.push(parseFloat(cost.major_value) / 100);
  }

  costValuesArray.sort(function (a, b) {
    return a - b;
  });

  console.log(costValuesArray);

  // TODO: refactor this conversion
  priceRange = `Min: ${costValuesArray[0]} Max: ${costValuesArray[costValuesArray.length-1]}`;



  // Put the cost into the event list
  let eventIndex = resultList.events.findIndex(element => element.id === eventId);
  resultList.events[eventIndex].costData = costArray;
  resultList.events[eventIndex].costData.priceRange = priceRange;

  // Try to update cost of the event on screen
  $(`#${resultList.events[eventIndex].id}`).find('.js-event-price').text(`Prices: ${priceRange}`);
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

function processResults(responseJson) {
  // Take the responseJson object and grab what you need
  // Start with just the events
  const eventArray = responseJson.events;

  // Setup code for Date and time
  const dateOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  // Things I need:
  // unique ID
  // summary (Title of event)
  // location
  // cost
  // description html (Description of event)
  // description text (Description of event) [for google]
  // source: url
  // source: title
  // start dateTime
  // start timeZone
  // end dateTime
  // end timeZone

  for (const event of eventArray) {
    // Translate date/time
    let startDateTime = new Date(
      (event.start.local != null ? event.start.local : 'Unknown')
    );
    startDateTime = startDateTime.toLocaleDateString('en-US', dateOptions)
    let endDateTime = new Date(
      (event.end.local != null ? event.end.local : 'Unknown')
    );
    endDateTime = endDateTime.toLocaleDateString('en-US', dateOptions);

    // Go fetch some additional stuff we need
    if (FETCH_ADDITIONAL) {
      fetchLocationOfEventBriteData(event.id, event.venue_id);
      if (event.is_free === false) {
        // fetchCostOfEventBriteData(event.id);
      };
    }


    // Create the event entry
    const currentEvent = {
      'id': (event.id ? event.id : 999),
      'venue_id': (event.venue_id ? event.venue_id : 'Unknown'),
      'summary': (event.name.text != null ? event.name.text : 'Unknown'),
      'location': {
        address: {
          localized_address_display: '',
          localized_multi_line_address_display: '',
        },
        latitude: '',
        longitude: '',
        name: '',
        venu_id: '',
      },
      'is_free': event.is_free,
      'cost': '...loading...',
      'costData': '',
      'priceRange': '...loading...',
      'description': {
        'html': (event.description.html != null ? event.description.html : 'Unknown'),
        'text': (event.description.text != null ? event.description.text : 'Unknown'),
      },
      'source': {
        'title': (event.name.text != null ? event.name.text : 'Unknown'),
        'url': (event.url != null ? event.url : 'Unknown'),
      },
      'logoUrl': (event.logo != null ? event.logo.url : 'https://picsum.photos/400/200?blur'),
      'start': {
        'dateTimeCode': (event.start.local != null ? event.start.local : 'Unknown'),
        'dateTimeReadable': startDateTime,
        'timeZone': (event.start.timezone != null ? event.start.timezone : 'Unknown'),
      },
      'end': {
        'dateTimeCode': (event.end.local != null ? event.end.local : 'Unknown'),
        'dateTimeReadable': endDateTime,
        'timeZone': (event.end.timezone != null ? event.end.timezone : 'Unknown'),
      }
    };

    resultList.events.push(currentEvent);
  }

  displayResults(resultList.currentPage, 5);
  console.log(resultList);

}

function displayResults(firstIndex, numOfResults) {
  $('.loading').empty();

  $('.pagination').html(`
    <input type="button" class="js-page-previous" value="&laquo;" href="#pagination-top">
    <input type="button" class="js-page-next" value="&raquo;" href="#pagination-top">
  `);

  $('.results-container').empty();

  if (firstIndex < 0) {
    resultList.currentPage = 0;
    firstIndex = resultList.currentPage;
  }
  if (firstIndex >= resultList.events.length - 5) {
    resultList.currentPage = resultList.events.length - (resultList.events.length - firstIndex) - 5;
    firstIndex = resultList.currentPage;
  }

  const maxSearchResults = firstIndex + numOfResults;

  firstIndex < resultList.events.length ? firstIndex : resultList.events.length - 1;

  for (let i = firstIndex; i < resultList.events.length && i < maxSearchResults; i++) {
    let currentEvent = resultList.events[i];
    $('.results-container').append(`
    <div id="${currentEvent.id}" class="result-listing clearfix">
      <h2>
        <a href="${currentEvent.source.url}" target=”_blank”>${currentEvent.source.title}</a>
      </h2>
      <img class="result-image" src="${currentEvent.logoUrl}" alt="${currentEvent.source.title}"/>
      <p>Start time: ${currentEvent.start.dateTimeReadable}</p>
      <p>End time: ${currentEvent.end.dateTimeReadable}</p>
      <p class="js-event-location-name">Location name: ${currentEvent.location.name}</p>
      <p class="js-event-location-address">Address: ${currentEvent.location.address.localized_address_display}</p>
      <p class="js-event-price">Is free: ${currentEvent.is_free}</p>
      <p class="js-calendar-success"></p>
      <input type="button" class="js-add-to-calendar" value="Add to Google Calendar">
      <div class="result-description small-description clearfix">
        ${currentEvent.description.html}
        <br/><br/>
        <a class="read-more description-button read-text">Read More...</a>
      </div>
    </div>`);

    // Remove any unwanted tags
    $('.result-description img').remove();
    $('.result-description object').remove();
  }
}

/**
 * watchDescriptionButtons()
 * This is for the "read more" button that appears on the bottom of each event result
 */
function watchDescriptionButtons() {
  $('.results-container').on('click', '.description-button', event => {
    event.preventDefault();
    // Once clicked, toggle between the two modes
    $(event.target).parent().toggleClass('small-description large-description');
    // Change the text depending on which is displayed
    if ($(event.target).parent().hasClass('large-description')) {
      $(event.target).text('Colapse Description');
    } else {
      $(event.target).text('...Read More...');
      let ele = $(event.target).closest('.result-listing')[0];
      ele.scrollIntoView(true);
    }
  });
}

/**
 * watchPageButtons()
 * Event listeners for each button on the page
 */
function watchPageButtons() {
  $('#pagination-top').on('click', event => {
    event.preventDefault();

    if ($(event.target).hasClass('js-page-previous')) {
      resultList.currentPage -= 5;
      displayResults(resultList.currentPage, 5);
    } else if ($(event.target).hasClass('js-page-next')) {
      resultList.currentPage += 5;
      displayResults(resultList.currentPage, 5);
    }
  })

  $('#pagination-bottom').on('click', event => {
    event.preventDefault();

    if ($(event.target).hasClass('js-page-previous')) {
      resultList.currentPage -= 5;
      displayResults(resultList.currentPage, 5);
      document.getElementById("pagination-top").scrollIntoView();
    } else if ($(event.target).hasClass('js-page-next')) {
      resultList.currentPage += 5;
      displayResults(resultList.currentPage, 5);
      document.getElementById("pagination-top").scrollIntoView();
    }
  })

}

function watchAddToCalendarButton() {
  $('.results-container').on('click', '.js-add-to-calendar', event => {
    event.preventDefault();
    console.log('click');
    addToCallendar(event);
  });
}

function insertGoogleEvent(eventIndex) {
  const calId = 'primary';
  const calendarEvent = {
    'start': {
      'dateTime': resultList.events[eventIndex].start.dateTimeCode,
      'timeZone': resultList.events[eventIndex].start.timeZone,
    },
    'end': {
      'dateTime': resultList.events[eventIndex].end.dateTimeCode,
      'timeZone': resultList.events[eventIndex].end.timeZone,
    },
    summary: resultList.events[eventIndex].source.title,
    description: resultList.events[eventIndex].description.text,
    location: resultList.events[eventIndex].location.address.localized_address_display,
  }

  gapi.client.calendar.events.insert({
      'calendarId': calId,
      'resource': calendarEvent,
    })
    .then(function (response) {
      console.log(response);
      if (response.status === 200) {
        $(`#${resultList.events[eventIndex].id}`).find('.js-calendar-success').text('Successfully added to Calendar!');
      } else {
        $(`#${resultList.events[eventIndex].id}`).find('.js-calendar-success').text('Unfortunately, something bad happened.');
      }
    });


}

/**
 * addResultsFilterHeader(previousQuery)
 * Show the filter header at the top of the page
 */
function addResultsFilterHeader(previousQuery) {
  $('.filter-results').html(`
  <div class="results-filter center">
    <form class="js-form">
      <ul>
        <li class="form-line">
          <label for="location">Search another location: </label>
          <input type="text" name="location" class="js-location" placeholder="Denver, Co">
        </li>
        <li class="form-line">
          <label for="query">Search term: </label>
          <input type="text" name="query" class="js-query" placeholder="Entertainment">
        </li>
        <li class="form-line">
          <label for="free-mode">Show only free events</label>
          <input type="checkbox" name="free-mode" class="js-free-mode">
        </li>
        <li class="form-line">
          <label for="sort-by">Sort by: </label>
          <select name="sort-by" class="js-sort-by">
              <option value="best">Highest rated</option>
              <option value="-best">Lowest rated</option>
              <option value="date">Soonest</option>
              <option value="-date">Latest</option>
              <option value="distance">Nearest</option>
              <option value="-distance">Furthest</option>
            </select>
        </li>
        <li class="form-line">
          <input name="filter" type="submit" value="Go!">
        </li>
      </ul>
    </form>
  </div>
  `);

  $('.js-location').val(previousQuery.location);
  $('.js-free-mode').prop('checked', previousQuery.isFreeModeChecked);
}

/**
 * watchResultsPage()
 * Event handler that listens for the "submit" from the filter header on the results page
 */
function watchResultsPage() {
  $('.filter-results').submit(event => {
    event.preventDefault();

    // Create the query based on what the user put
    const resultQuery = {
      'location.address': $('.js-location').val(),
      q: $('.js-query').val(),
      'location.within': '10mi',
      sort_by: $('.js-sort-by').val(),
      price: ($('.js-free-mode').is(":checked") ? 'free' : 'paid'),
    };

    // Grab the previous values so you can update the next screen
    let isChecked = $('.js-free-mode').is(":checked");
    let previousLocation = $('.js-location').val();

    // Fetch the eventbrite data
    fetchEventbriteData(resultQuery);

    // Empty the results container
    $('.results-container').empty();
    addResultsFilterHeader(previousLocation);

    // Update header with previous info that we grabed above
    if (resultQuery["location.address"].val !== null) {
      $('.js-location').val(resultQuery["location.address"]);
    }
    if (resultQuery.q.val !== null) {
      $('.js-query').val(resultQuery.q);
    }
    $('.js-sort-by').val(resultQuery.sort_by);
    $('.js-free-mode').prop('checked', isChecked);

    // Finally, initialize the Results page (show loading...) until results come in
    loadResultsPage();
  })
}

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
  scrollFunction()
};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    document.getElementById("top-button").style.display = "block";
  } else {
    document.getElementById("top-button").style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

/**
 * Entry point for jQuery to listen to the submit button
 */
$(watchLandingPage);