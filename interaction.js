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