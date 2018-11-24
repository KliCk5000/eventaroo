const EVENTBRITE_TOKEN = "JRKAA3O73D" + "DJB47QH5OT";
const FETCH_PRICING = false; // Feature to be added in the future
const resultList = {
  currentPage: 0,
  numberOfResults: 12, // How many results to display per page
  events: [] // Where the list of events will be held once fetched.
};

/**
 * watchLandingPage()
 * First event handler that listens for the "submit" and "near me" buttons on the landing page
 */
function watchLandingPage() {
  // Submit Button on Landing Page
  $(".landing-container").submit(event => {
    event.preventDefault();

    // Check to see if user put in a location
    let userLocation;

    // If they did, we can send it to landingPageQuery below
    if ($(".js-location").val()) {
      userLocation = $(".js-location").val();
    }

    let landingPageQuery = {
      location: userLocation, // Location the user wants to search
      isFreeModeChecked: $(".js-free-mode").is(":checked") // Did they check the free-mode box?
    };

    changeToResultPage(landingPageQuery);
  });

  // Near me Button on Landing Page
  $(".landing-container").on("click", ".js-near-me", event => {
    event.preventDefault();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    }
  });

  $(".js-location").keypress(function(event) {
    if (event.which == 13) {
      // User presses enter on form
      event.preventDefault();
      $(".js-form").submit();
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
  $(".landing-container").empty();

  // Unhide the results container
  $(".results-container").toggleClass("hidden");
  $(".js-signon-container").toggleClass("hidden");
  $(".pagination").toggleClass("hidden");

  // Remove the logo background-image
  $(".banner").removeClass("background-image");
  $(".banner").removeClass("banner-landing");
  $(".banner").addClass("banner-results");

  // Update the logo to reflect the new screen
  $(".logo").removeClass("landing-logo");
  $(".logo").addClass("results-logo");

  // Remove any errors you had on the landing page
  $(".js-error-output").empty();

  // Send the landingPageQuery that we got from the landing page and
  // make the API request which will display the data on the results
  // page.
  const queryParams = {
    "location.address": landingPageQuery.location,
    "location.within": "30mi",
    sort_by: "date"
  };

  if (landingPageQuery.isFreeModeChecked) {
    queryParams.price = "free";
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
  watchToTopButton();
}

/**
 * loadResultsPage()
 * This first sets up the HTML for the results page and displays a 'loading...'
 */
function loadResultsPage() {
  // For now, just show a 'loading' screen
  $(".results-container").append(
    `<p class="loading center">Loading.........</p>`
  );
}

/**
 * fetchEventbriteData(queryParams)
 * @param {Object} queryParams is an object that contains all parameters you would like to send with fetch request
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
      $(".js-error-output").text(`Something went wrong: ${err.message}`);
    });
}

/**
 * fetchLocationOfEventBriteData(eventId, venueId)
 * @param eventId ID of current Event
 * @param venueId ID of the current Events Venue
 *
 * This will attempt to grab location data for each event.
 */
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
      $(".js-error.output").text(
        `Something went wrong with location: ${err.message}`
      );
    });
}

/**
 * setLocationOfEventBriteData(responseJson, eventId, venueId)
 * @param responseJson The Json object that we fetched (useful for grabbing various address formats)
 * @param eventId ID of current Event
 * @param venueId ID of the current Events Venue
 *
 * This will attempt to set location data for each event.
 */
function setLocationOfEventBriteData(responseJson, eventId, venueId) {
  // Quickly process the result
  const location = {
    name: responseJson.name,
    venue_id: venueId,
    address: {
      localized_address_display: responseJson.address.localized_address_display,
      localized_multi_line_address_display:
        responseJson.address.localized_multi_line_address_display
    },
    latitude: responseJson.latitude,
    longitude: responseJson.longitude
  };
  // Put the location into the event list
  let eventIndex = resultList.events.findIndex(
    element => element.id === eventId
  );
  resultList.events[eventIndex].location = location;

  // Try to update location of the event on screen
  $(`#${resultList.events[eventIndex].id}`)
    .find(".js-event-location-name")
    .text(`Venue Name: ${resultList.events[eventIndex].location.name}`);
  $(`#${resultList.events[eventIndex].id}`)
    .find(".js-event-location-address")
    .text(
      `Address: ${
        resultList.events[eventIndex].location.address.localized_address_display
      }`
    );

  if (
    resultList.events[eventIndex].location.address.localized_address_display ===
    null
  ) {
    $(`#${resultList.events[eventIndex].id}`)
      .find(".js-event-location")
      .text(`Location: Somewhere far far away...`);
  }
}

/**
 * fetchCostOfEventBriteData(eventId)
 * @param eventId ID of current Event
 *
 * This will attempt to get the cost/price data for an event
 * Note: Currently does not work as intended
 */
function fetchCostOfEventBriteData(eventId) {
  const url = `https://www.eventbriteapi.com/v3/events/${eventId}/ticket_classes/?token=${EVENTBRITE_TOKEN}`;

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
      $(".js-error.output").text(
        `Something went wrong with price: ${err.message}`
      );
    });
}

/**
 * setCostOfEventBriteData(responseJson, eventId)
 * @param responseJson The Json object that we fetched
 * @param eventId ID of current Event
 *
 * This will attempt to set the cost/price data for an event
 * Note: Currently does not work as intended
 */
function setCostOfEventBriteData(responseJson, eventId) {
  // Each event can have more than one price
  const costArray = new Array();
  for (const ticket of responseJson.ticket_classes) {
    if (ticket.cost) {
      // if it has a cost add it,
      costArray.push(ticket.cost);
    } else {
      // else give it a blank value;
      costArray.push({
        display: "Unknown",
        currency: "USD",
        value: 0,
        major_value: "0.00"
      });
    }
  }

  // Take an array of just the values
  const costValuesArray = new Array();
  for (const cost of costArray) {
    costValuesArray.push(parseFloat(cost.major_value) / 100);
  }

  costValuesArray.sort(function(a, b) {
    return a - b;
  });

  // TODO: refactor this conversion
  priceRange = `Min: ${costValuesArray[0]} Max: ${
    costValuesArray[costValuesArray.length - 1]
  }`;

  // Put the cost into the event list
  let eventIndex = resultList.events.findIndex(
    element => element.id === eventId
  );
  resultList.events[eventIndex].costData = costArray;
  resultList.events[eventIndex].costData.priceRange = priceRange;

  // Try to update cost of the event on screen
  $(`#${resultList.events[eventIndex].id}`)
    .find(".js-event-price")
    .text(`Prices: ${priceRange}`);
}

/**
 * formatQueryParams(params)
 * @param {Object} params of keys and values
 *
 * Takes an object of keys and values and turns it into something like:
 * ?location.address=Denver%2C%20co&location.within=10mi&price=free
 */
function formatQueryParams(params) {
  const queryItems = Object.keys(params).map(
    key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
  );
  return queryItems.join("&");
}

/**
 * processResults(responseJson)
 * @param responseJson The Json object that we fetched
 *
 * This function processes the Json Object into my one data object to make it easier
 * to work with
 */
function processResults(responseJson) {
  resultList.currentPage = 0;

  // Take the responseJson object and grab what you need
  // Start with just the events
  const eventArray = responseJson.events;

  // Setup code for Date and time
  const dateOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
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
      event.start.local != null ? event.start.local : "Unknown"
    );
    startDateTime = startDateTime.toLocaleDateString("en-US", dateOptions);
    let endDateTime = new Date(
      event.end.local != null ? event.end.local : "Unknown"
    );
    endDateTime = endDateTime.toLocaleDateString("en-US", dateOptions);

    // Go fetch some additional stuff we need
    fetchLocationOfEventBriteData(event.id, event.venue_id);

    if (FETCH_PRICING) {
      if (event.is_free === false) {
        fetchCostOfEventBriteData(event.id);
      }
    }

    // Create the event entry
    const currentEvent = {
      id: event.id ? event.id : 999,
      venue_id: event.venue_id ? event.venue_id : "Unknown",
      summary: event.name.text != null ? event.name.text : "Unknown",
      location: {
        address: {
          localized_address_display: "",
          localized_multi_line_address_display: ""
        },
        latitude: "",
        longitude: "",
        name: "",
        venu_id: ""
      },
      is_free: event.is_free,
      cost: "...loading...",
      costData: "",
      priceRange: "...loading...",
      description: {
        html:
          event.description.html != null ? event.description.html : "Unknown",
        text:
          event.description.text != null ? event.description.text : "Unknown"
      },
      source: {
        title: event.name.text != null ? event.name.text : "Unknown",
        url: event.url != null ? event.url : "Unknown"
      },
      logoUrl:
        event.logo != null
          ? event.logo.url
          : "https://picsum.photos/400/200?blur",
      start: {
        dateTimeCode: event.start.local != null ? event.start.local : "Unknown",
        dateTimeReadable: startDateTime,
        timeZone:
          event.start.timezone != null ? event.start.timezone : "Unknown"
      },
      end: {
        dateTimeCode: event.end.local != null ? event.end.local : "Unknown",
        dateTimeReadable: endDateTime,
        timeZone: event.end.timezone != null ? event.end.timezone : "Unknown"
      }
    };

    resultList.events.push(currentEvent);
  }

  displayResults(resultList.currentPage, resultList.numberOfResults);
  console.log(resultList);
}

/**
 * displayResults(pageNumber, numOfResults)
 * @param pageNumber Current page that is to be displayed
 * @param numOfResults Number of results per page (example: 12 per page)
 *
 * This will actually display the correct "current" objects on the screen
 */
function displayResults(pageNumber, numOfResults) {
  // Remove any loading screen
  $(".loading").empty();

  // Insert pagination buttons
  $(".pagination").html(`
    <input type="button" class="js-page-previous" value="&laquo;" href="#pagination-top">
    <input type="button" class="js-page-next" value="&raquo;" href="#pagination-top">
  `);

  // Clear any results currently displayed
  $(".results-container").empty();

  // The first Index is the first result that will display
  let firstIndex = pageNumber * numOfResults;

  for (
    let i = firstIndex;
    i < resultList.events.length && i < firstIndex + numOfResults;
    i++
  ) {
    let currentEvent = resultList.events[i];

    // Do some additional logic for free or paid events
    let priceHtml = "";

    if (currentEvent.is_free) {
      priceHtml = '<span class="free-event">Free</span>';
    } else {
      priceHtml = '<i class="fas fa-dollar-sign paid-event"></i>';
    }

    // Get Month and day from currentEvent.start.dateTimeCode
    let currentDate = new Date(currentEvent.start.dateTimeCode);
    $(".results-container").append(`
    <div id="${currentEvent.id}" class="result-listing">
    <div class="result-header">
      <div class="result-image-container">
        <img
          class="result-image"
          src="${currentEvent.logoUrl}"
          alt="${currentEvent.source.title}"
        />
        <div class="js-event-price">${priceHtml}</div>
      </div>
      <div class="result-details">
        <div class="result-details-time">
          <div class="flip-card">
            <div class="flip-card-inner">
              <div class="">
                <div class="calendar-icon flip-card-front">
                  <div class="calendar-icon-month">
                    <p>
                      ${currentDate.toLocaleString("en-us", { month: "short" })}
                    </p>
                  </div>
                  <div class="calendar-icon-day">
                    <p>${currentDate.getDate()}</p>
                  </div>
                </div>
              </div>
              <div class="flip-card-back">
                <p class="js-calendar-success"></p>
                <button class="js-add-to-calendar">
                  <i class="far fa-calendar-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <div class="result-details-content">
          <h2>
            <a href="${currentEvent.source.url}" target="_blank"
              >${currentEvent.source.title}</a
            >
          </h2>
          <p>${currentEvent.start.dateTimeReadable}</p>
          <p>${currentEvent.end.dateTimeReadable}</p>
          <p class="js-event-location-name">${currentEvent.location.name}</p>
          <p class="js-event-location-address">
            ${currentEvent.location.address.localized_address_display}
          </p>
        </div>
      </div>
    </div>
    <div class="result-more-description"></div>
    <div class="result-more-info">
      <p class="open-description">Click here for description</p>
    </div>
  </div>
  `);

    // Remove any unwanted tags
    $(".result-description img").remove();
    $(".result-description object").remove();
  }
}

/**
 * watchDescriptionButtons()
 * This is for the "read more" button that appears on the bottom of each event result
 */
function watchDescriptionButtons() {
  $(".results-container").on("click", ".result-more-info", event => {
    // First we need to find what event target we clicked on and find its Event Index
    const eventId = $(event.target)
      .parent()
      .parent()
      .attr("id");
    let eventIndex = resultList.events.findIndex(
      element => element.id === eventId
    );

    if (
      $(`#${resultList.events[eventIndex].id}`)
        .find(".result-more-info p")
        .hasClass("open-description")
    ) {
      // First close all other descriptions
      $(".result-more-description").empty();
      $(".result-listing").css("flex-basis", "0");
      $(".result-more-info").html(
        '<p class="open-description">Click here for description<p>'
      );
      $(".result-header")
        .addClass("result-closed")
        .removeClass("result-open");

      // Here we can add the description
      $(`#${resultList.events[eventIndex].id}`)
        .find(".result-more-description")
        .append(resultList.events[eventIndex].description.html);

      // Oh no! We need to get rid of the images and objects
      $(".result-more-description img").remove();
      $(".result-more-description object").remove();

      // Allow the result to grow big and stong
      $(`#${resultList.events[eventIndex].id}`).css("flex-basis", "100%");

      // Change the flex on the result header
      $(`#${resultList.events[eventIndex].id}`)
        .find(".result-header")
        .addClass("result-open")
        .removeClass("result-closed");

      // Change the "Close description" text
      $(`#${resultList.events[eventIndex].id}`)
        .find(".result-more-info")
        .html('<p class="close-description">Close description<p>');

      // Scroll User's view
      let ele = $(`#${resultList.events[eventIndex].id}`)[0];
      ele.scrollIntoView(true);
    } else {
      // Empty the description
      $(`#${resultList.events[eventIndex].id}`)
        .find(".result-more-description")
        .empty();

      // Remove the flex growth
      $(`#${resultList.events[eventIndex].id}`).css("flex-basis", "0");

      // Change the flex on the result header
      $(`#${resultList.events[eventIndex].id}`)
        .find(".result-header")
        .addClass("result-closed")
        .removeClass("result-open");

      // Change the "Click here for description" text
      $(`#${resultList.events[eventIndex].id}`)
        .find(".result-more-info")
        .html('<p class="open-description">Click here for description<p>');

      // Scroll User's view
      let ele = $(`#${resultList.events[eventIndex].id}`)[0];
      ele.scrollIntoView(true);
    }
  });
}

/**
 * watchPageButtons()
 * Event listeners for each button on the page
 */
function watchPageButtons() {
  $("#pagination-top").on("click", event => {
    event.preventDefault();

    if ($(event.target).hasClass("js-page-previous")) {
      if (resultList.currentPage > 0) {
        resultList.currentPage--;
      }
      displayResults(resultList.currentPage, resultList.numberOfResults);
    } else if ($(event.target).hasClass("js-page-next")) {
      if (
        resultList.currentPage <=
        resultList.events.length / resultList.numberOfResults - 1
      ) {
        resultList.currentPage++;
      }
      displayResults(resultList.currentPage, resultList.numberOfResults);
    }
  });

  $("#pagination-bottom").on("click", event => {
    event.preventDefault();

    if ($(event.target).hasClass("js-page-previous")) {
      if (resultList.currentPage > 0) {
        resultList.currentPage--;
      }
      displayResults(resultList.currentPage, resultList.numberOfResults);
      document.getElementById("filter-form").scrollIntoView();
    } else if ($(event.target).hasClass("js-page-next")) {
      if (
        resultList.currentPage <=
        resultList.events.length / resultList.numberOfResults - 1
      ) {
        resultList.currentPage++;
      }
      displayResults(resultList.currentPage, resultList.numberOfResults);
      document.getElementById("filter-form").scrollIntoView();
    }
  });
}

/**
 * watchToTopButton()
 * Event listener for when you want to scroll to top.
 */
function watchToTopButton() {
  $("#top-button").on("click", event => {
    event.preventDefault();
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  });
}

/**
 * watchAddToCalendarButton()
 * Event listener for when you want to add an event to Google Calendar
 */
function watchAddToCalendarButton() {
  $(".results-container").on("click", ".js-add-to-calendar", event => {
    event.preventDefault();
    addToCallendar(event);
  });
}

/**
 * insertGoogleEvent(eventIndex)
 * @param eventIndex The index of the selected event
 *
 * This will create the event and attempt to insert it into the users Google Calendar
 */
function insertGoogleEvent(eventIndex) {
  const calId = "primary";
  const calendarEvent = {
    start: {
      dateTime: resultList.events[eventIndex].start.dateTimeCode,
      timeZone: resultList.events[eventIndex].start.timeZone
    },
    end: {
      dateTime: resultList.events[eventIndex].end.dateTimeCode,
      timeZone: resultList.events[eventIndex].end.timeZone
    },
    summary: resultList.events[eventIndex].source.title,
    description: resultList.events[eventIndex].description.text,
    location:
      resultList.events[eventIndex].location.address.localized_address_display
  };

  gapi.client.calendar.events
    .insert({
      calendarId: calId,
      resource: calendarEvent
    })
    .then(function(response) {
      console.log(response);
      if (response.status === 200) {
        $(`#${resultList.events[eventIndex].id}`)
          .find(".js-add-to-calendar")
          .html('<i class="far fa-calendar-check success"></i>');
        $(`#${resultList.events[eventIndex].id}`)
          .find(".calendar-icon-day")
          .html('<i class="far fa-calendar-check success"></i>');
      } else {
        $(`#${resultList.events[eventIndex].id}`)
          .find(".js-add-to-calendar")
          .html('<i class="far fa-calendar-times error"></i>');
        $(`#${resultList.events[eventIndex].id}`)
          .find(".calendar-icon-day")
          .html('<i class="far fa-calendar-times error"></i>');
      }
    });
}

/**
 * addResultsFilterHeader(previousQuery)
 * @param previousQuery The previous query information before the screen changed
 *
 * This is the section of the screen where the user can filter the results in various ways
 */
function addResultsFilterHeader(previousQuery) {
  $(".filter-results").removeClass("hidden");
  $(".filter-results").html(`
  <form id="filter-form" class="js-form">
  <div class="filter-list">
    <div class="search-filters">
      <div>
        <label for="location">Location: </label>
        <input
          type="text"
          name="location"
          class="js-location"
          placeholder="Denver, Co"
        />
      </div>
      <div>
        <label for="query">Search: </label>
        <input
          type="text"
          name="query"
          class="js-query"
          placeholder="Entertainment"
        />
      </div>
      <div><input name="filter" type="submit" value="Go!" /></div>
    </div>
    <div class="quick-filters">
      <div>
        <label for="free-mode">Show only free events</label>
        <input type="checkbox" name="free-mode" class="js-free-mode" />
      </div>
      <div>
        <label for="sort-by">Sort by: </label>
        <select name="sort-by" class="js-sort-by">
          <option value="date">Soonest</option>
          <option value="-date">Latest</option>
          <option value="best">Highest rated</option>
          <option value="-best">Lowest rated</option>
          <option value="distance">Nearest</option>
          <option value="-distance">Furthest</option>
        </select>
      </div>
    </div>
  </div>
</form>
  `);

  $(".js-location").val(previousQuery.location);
  $(".js-free-mode").prop("checked", previousQuery.isFreeModeChecked);
}

/**
 * watchResultsPage()
 * Event handler that listens for the "submit" from the filter header on the results page
 */
function watchResultsPage() {
  $(".filter-results").submit(event => {
    event.preventDefault();

    // Create the query based on what the user put
    const resultQuery = {
      "location.address": $(".js-location").val(),
      q: $(".js-query").val(),
      "location.within": "30mi",
      sort_by: $(".js-sort-by").val()
    };

    if ($(".js-free-mode").is(":checked")) {
      resultQuery.price = "free";
    }

    // Grab the previous values so you can update the next screen
    let isChecked = $(".js-free-mode").is(":checked");
    let previousLocation = $(".js-location").val();

    // Fetch the eventbrite data
    fetchEventbriteData(resultQuery);

    // Empty the results container
    $(".results-container").empty();
    addResultsFilterHeader(previousLocation);

    // Update header with previous info that we grabed above
    if (resultQuery["location.address"].val !== null) {
      $(".js-location").val(resultQuery["location.address"]);
    }
    if (resultQuery.q.val !== null) {
      $(".js-query").val(resultQuery.q);
    }
    $(".js-sort-by").val(resultQuery.sort_by);
    $(".js-free-mode").prop("checked", isChecked);

    // Finally, initialize the Results page (show loading...) until results come in
    loadResultsPage();
  });
}

// When the user scrolls down, we need to display the back to top button
window.onscroll = function() {
  scrollFunction();
};

/**
 * scrollFunction()
 * When the user scrolls down 20px from the top of the document, show the button
 */
function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    document.getElementById("top-button").style.display = "block";
  } else {
    document.getElementById("top-button").style.display = "none";
  }
}

/**
 * Entry point for jQuery to listen to the submit button
 */
$(watchLandingPage);
