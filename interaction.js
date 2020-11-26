var stepsToggler = document.getElementById("steps-toggler");
stepsToggler.addEventListener("click", function(e) {
    if(directionsTab.classList.contains("open")) {
        directionsTab.classList.remove("open");
        stepsToggler.innerHTML = "<span>&#x2630; Steps</span>"
    } else {
        stepsToggler.innerHTML = "<span>&#x2630; SHOW MAP</span>"
        directionsTab.classList.add("open");
    }
});

// Carousel
var slidePrevButton = document.querySelector(".carousel-control-prev");
var slideNextButton = document.querySelector(".carousel-control-next");

var listGroupCards = document.querySelectorAll("#direction-card li");

var currentDisplacement = 0;
var listGroupCardsLength = listGroupCards.length -1;
var direction = "right";
var speechInterval;

function playRoute() {
    direction = 'right';
    currentDisplacement = 100;
    slideContent();

    speechInterval = setInterval(function(e) {
        if(currentDisplacement == (-100 * listGroupCardsLength)) {
            clearInterval(speechInterval);
        } else{
            slideContent();
        }

    }, 5000);
}


slideNextButton.addEventListener("click", function(e) {
    clearInterval(speechInterval);

    direction = 'right';
    e.preventDefault();
    slideContent();
    
});

slidePrevButton.addEventListener("click", function(e) {
    clearInterval(speechInterval);
    e.preventDefault();

    direction = 'left';
    slideContent();
});

function slideContent() {
    if(direction == "right") {
        currentDisplacement = currentDisplacement - 100;
        if(-100 * listGroupCardsLength > currentDisplacement) {
            currentDisplacement = 0;
            // direction = "right"
        }
    } else {
        currentDisplacement = currentDisplacement + 100;
        if(currentDisplacement > 0) {
            currentDisplacement = -100 * listGroupCardsLength + 100;
            // direction = "right";
        }
    }
    
    // get the active 
    let activeItemIndex = currentDisplacement / -100;
    let activeItem = (listGroupCards[activeItemIndex]);

    console.log(currentDisplacement);
    console.log(direction);
    directionCard.style.left = currentDisplacement + "%";

    // update speech text
    let element = activeItem.querySelector(".list-direction");
    let distance = activeItem.querySelector(".directions-step-distance");

    let distanceText = distance ? distance.innerText.replace("m", "metres") : "";

    if(activeItemIndex == 0) {
        speech.text = "From " + element.innerText + " walk " + distanceText;
    } else if( activeItemIndex == listGroupCardsLength) {
        speech.text = 'You have arrived at your destination: ' + element.innerText;

    } else {
        speech.text = element.innerText + "and Walk " + distanceText;
    }
    
    speechSynth.speak(speech);

    // zoom to the point
    let lng = activeItem.getAttribute('data-lng');
    let lat = activeItem.getAttribute('data-lat');

    if(lng && lat) {
        map.flyTo({
            center: [lng, lat],
            zoom: 22
        });

        positionMarker.setLngLat([lng, lat]).addTo(map);
    }
    
            
}