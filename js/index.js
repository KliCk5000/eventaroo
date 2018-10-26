function watchLandingPage() {
  $('.landing-container').submit(event => { 
    event.preventDefault();
    
    let location = $('.js-location').val();
    let freeMode = $('.js-free-mode').is(":checked");

    changeToResultPage(location, freeMode);
  });
}

function changeToResultPage(location, freeMode) {
  $('.landing-container').empty();

  $('.logo').removeClass('landing-logo');
  $('.logo').addClass('results-logo');
}

$(watchLandingPage);