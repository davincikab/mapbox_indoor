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

var listGroupCards = document.querySelectorAll("#direction-card .list-group-item");

var currentDisplacement = 0;
var listGroupCardsLength = listGroupCards.length -1;
var direction = "right";

setInterval(function(e) {
    // slideContent();
}, 3000);

slideNextButton.addEventListener("click", function(e) {
    e.preventDefault();
    slideContent();
    
});

slidePrevButton.addEventListener("click", function(e) {
    e.preventDefault();
    slideContent();
});

function slideContent() {
    if(direction == "right") {
        currentDisplacement = currentDisplacement - 100;
        if(-100 * listGroupCardsLength > currentDisplacement) {
            currentDisplacement = -100 * listGroupCardsLength + 100;
            direction = "left"
        }
    } else {
        currentDisplacement = currentDisplacement + 100;
        if(currentDisplacement > 0) {
            currentDisplacement = -100;
            direction = "right";
        }
    }
    

    console.log(currentDisplacement);
    directionCard.style.left = currentDisplacement + "%"
}


// 36.962970301764045, -0.399318876687972;
// 36.96300300356657, -0.399213763245354;
// 36.963009574144, -0.398987878934506;
// 36.962979488212724, -0.398958981768112;
// 36.96284748381025, -0.398952233960397;
// 36.96279032589487, -0.398918295380938