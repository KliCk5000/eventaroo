function getReverseGeolocation(latitude, longitude) {
  const googleLatLng = `latlng=${latitude},${longitude}`
  const google_url = "https://maps.googleapis.com/maps/api/geocode/json?";
  const google_api = '&key=' + 'AIzaSyDfecR4U' + 'FalgjCmVA2dLp4' + 'r2OdLAmKczvA';
  const resultType = '&result_type=locality';
  const completeURL = google_url + googleLatLng + resultType + google_api;

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
      $('.js-error-output').text('Could not get address: ' + err);
    });

}

function geoSuccess(position) {
  getReverseGeolocation(position.coords.latitude, position.coords.longitude);
  $('.js-location').val(`...getting location...`);
}

function geoError() {
  $('.js-error-output').text(`Sorry, could not get location`);
}