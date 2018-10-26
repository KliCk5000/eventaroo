function watchLandingPage() {
  $('.landing-container').submit(event => { 
    event.preventDefault();
    
    let landingPageQuery = [
      $('.js-location').val(),
      $('.js-free-mode').is(":checked"),
    ];

    changeToResultPage(landingPageQuery);
  });
}

function changeToResultPage(landingPageQuery) {
  $('.landing-container').empty();

  $('.logo').removeClass('landing-logo');
  $('.logo').addClass('results-logo');

  getLandingPageEventbriteData(landingPageQuery);
  initializeResultsScreen();
}

// initialize results screen
function initializeResultsScreen() {
  $('.results-container').append(
    `<p>Results will show here</p>
    <p class="loading">Loading.........</p>
    `
  )
}
// send GET request to Eventbrite
function getLandingPageEventbriteData(landingPageQuery) {
  const params = {
    'location.address': landingPageQuery[0],
    'location.within': '10mi',
    token: "JRKAA3O73D" + "DJB47QH5OT",
  }

  const queryString = formatQueryParams(params);
  const url = `https://www.eventbriteapi.com/v3/events/search/?${queryString}`;

  console.log(url);

  // -FETCH
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
    });

}

function formatQueryParams(params) {
  const queryItems = Object.keys(params)
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
  return queryItems.join('&');
}

// display results from eventbrite
function displayResults(responseJson) {
  $('.loading').remove();
  $('.results-container').append(`Response loaded succesfully!`);
  console.log(responseJson);

  for (let obj in responseJson.events) {
    $('.results-container').append(`
    <div class="result-listing">
      <img src="${responseJson.events[obj].logo.url}" />
      <h2>Name: ${responseJson.events[obj].name.text}</h2>
      <p>Start time: ${responseJson.events[obj].start.local}</p>
      <p>Url: ${responseJson.events[obj].url}</p>
      <p>Is free: ${responseJson.events[obj].is_free}</p>
      <p>Description: ${responseJson.events[obj].description.text}</p>
    </div>
    `);
  }


}
// listen for more results buttons
// display filter results?
// listen for submit on filter?
// listen for click on event to show more events

$(watchLandingPage);