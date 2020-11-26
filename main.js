mapboxgl.accessToken = 'pk.eyJ1IjoiYmVubnl0cm92YXRvIiwiYSI6ImNrZDcwdTVwbTE4amEyem8yZWdkNHN3ZmoifQ.r3Llqtnwfqqju2zfzE-fvA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [36.962807572254974,-0.39912086768855204],
    zoom: 19.4,
    maxZoom:25,
    pitch:0,
    bearing: 21,
    antialias: true,
});

// web speech API
var speech = new SpeechSynthesisUtterance();
speech.lang = "en-US";
speech.text = "Home Coming party";
speech.volume = 1.2;
speech.rate = 0.8;
speech.pitch = 1; 

var speechSynth = window.speechSynthesis;


// floor layers
var layers = {
    '0':'ground_2d',
    '1':'floor-one_2d',
    '2':'floor-two_2d'
};

var activeMode = "2D";

// route marker
var routeElement = document.createElement('div');
routeElement.classList.add('route-marker');
var positionMarker = new mapboxgl.Marker({element:routeElement});

// images
let images = ['blue', 'cream', 'texture_25', 'tiles', 'magenta'];
var shortestRoute;

var dummyGeojson = {
    "type":"featureCollection",
    "feature":[]
};

map.on('load', function() {
    console.time("Loading Map");
    loadImage(images);

    map.addSource('floorplan', {
        'type': 'geojson',
        'data':
            'ground_floor.geojson'
    });

    map.addLayer({
        'id': 'ground_3d',
        'type': 'fill-extrusion',
        'source': 'floorplan',
        'paint': {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'base_heigh'],
            'fill-extrusion-opacity': 1,
            // 'fill-extrusion-pattern':"cream"
        },
        'layout' :{
            'visibility':"none"
        }
    });

    // 2d ground floor
    map.addLayer({
        id:"ground_2d",
        source:'floorplan',
        type:"fill",
        paint:{
            'fill-color':['get', 'color']
        },
        'layout' :{
            'visibility':'visible'
        }
    });

    // First Floor
    map.addSource('floorone', {
        'type': 'geojson',
        'data':'first_floor.geojson'
    });

    map.addLayer({
        'id': 'floor-one_3d',
        'type': 'fill-extrusion',
        'source': 'floorone',
        'paint': {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'base_heigh'],
            'fill-extrusion-opacity': 1,
            // 'fill-extrusion-pattern':'magenta',
        },
        'layout' :{
            'visibility':'none'
        }
    });

    // 2d first floor
    map.addLayer({
        'id':"floor-one_2d",
        'source': 'floorone',
        'type':"fill",
        'paint':{
            'fill-color':['get', 'color']
        },
        'layout' :{
            'visibility':'none'
        }
    });

    // === second floor =====
    map.addSource('floortwo', {
        'type': 'geojson',
        'data':
            'second_floor.geojson'
    });

    map.addLayer({
        'id': 'floor-two_3d',
        'type': 'fill-extrusion',
        'source': 'floortwo',
        'paint': {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'base_heigh'],
            'fill-extrusion-opacity': 1,
        },
        'layout' :{
            'visibility':'none'
        }
    });

    // 2d second
    map.addLayer({
        'id':"floor-two_2d",
        'source':'floortwo',
        'type':"fill",
        'paint':{
            'fill-color':['get', 'color']
        },
        'layout':{
            'visibility':'none'
        }
    });

    // Load the points
    map.addSource('points', {
        type:'geojson',
        data:points
    });

    map.addLayer({
        id:"points_2d",
        type:"symbol",
        source:"points",
        filter:["==", ["get", "level"], 0],
        paint:{
            'icon-color':'red'
        },
        layout:{
            'icon-image':'marker-15',
            'icon-size':2,
            'visibility':'none'
        }   
    });

    // line 
    map.addSource("route",{
        'type':'geojson',
        'data': {
            "type": "FeatureCollection",
            "features": []
        }
    });
    
    map.addLayer({
        'id':'shortest-route',
        'type': 'line',
        'source': 'route',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#dc3545',
            'line-width': 5
        }
    });

    console.timeEnd("Loading Map");
});

function loadImage(images) {
    images.forEach(imageName => {
        map.loadImage("./images/"+imageName+".jpg", function(error, image) {
            if(error) {
                console.log(error);
                return;
            }
    
            if(!map.hasImage(imageName) ){
                console.log("updating map image");
                map.addImage(imageName, image);
            }
            
        });
    });
}

// 3d toggler
function toggle2d(mode) {
    let active = layers[activeFloor];

    if(mode == "3D") {
        activeMode = "3D";
        map.setLayoutProperty(active, 'visibility', 'none');

        map.easeTo({
            pitch:60,
            duration:1000
        });

         // hide the 3d layers
         Object.values(layers).forEach(layer => {
            let layer3d = layer.split("_")[0] + "_3d";
            map.setLayoutProperty(layer3d, 'visibility', 'none');
        });

        // update
        let layer3d = active.split("_")[0] + "_3d";
        console.log(layer3d);
        map.setLayoutProperty(layer3d, 'visibility', 'visible');
    } else {
        activeMode = "2D";
        map.easeTo({
            pitch:0,
            duration:1000
        });

        // hide the 3d layers
        Object.values(layers).forEach(layer => {
            let layer3d = layer.split("_")[0] + "_3d";
            map.setLayoutProperty(layer3d, 'visibility', 'none');
        });

        
        // display the active 3d layer
        map.setLayoutProperty(active, 'visibility', 'visible');
    }

}

class DimensionLayerControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl';

        var divContainer = document.createElement('select');
        divContainer.classList.add('dimension-toggler');

        let modes = ["2D", "3D"];
        modes.forEach(mode => {
            let div = document.createElement('option');
            div.setAttribute("value", mode);
            div.innerHTML = mode;

            divContainer.append(div);
        });

        divContainer.addEventListener("change", function(e) {
            // toggle 
            toggle2d(e.target.value);
        });

        this._container.append(divContainer);


        return this._container;
    }
         
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

map.addControl(new DimensionLayerControl(), 'top-right');


// create a mapbox control 
class IndoorLayerControl {
    static setActiveFloor(id) {
        let floorControls = document.querySelectorAll('.floor-control');
        floorControls.forEach(floorControl => {
            floorControl.classList.remove('floor-active');
        });

        let activeFloor = document.getElementById(id);
        activeFloor.classList.add('floor-active');
    }

    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl';

        let floors = [2, 1, 0];

        floors.forEach(floor => {
            let div = document.createElement('div');
            div.setAttribute('id', 'floor-'+floor);
            div.classList.add('floor-control');
            
            if(floor == 0) {
                div.classList.add('floor-active');
            }
            div.innerHTML = floor;

            div.addEventListener('click', function(e) {
                // let floorControls = document.querySelectorAll('.floor-control');
                // floorControls.forEach(floorControl => {
                //     floorControl.classList.remove('floor-active');
                // });

                // update the floor plans
                let value = this.innerText;
                IndoorLayerControl.setActiveFloor('floor-'+value);
                floorToggler(value);

                // this.classList.add('floor-active');
            });

            this._container.appendChild(div);
        });

        return this._container;
    }
         
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

var indoorLayerControl = new IndoorLayerControl();
map.addControl(indoorLayerControl, 'bottom-right');

var carouselContainer = document.getElementById('carousel-container');
var directionCard = document.getElementById("direction-card");
var toggleCarouselContainer = document.getElementById("preview-steps");

var activeFloor = "0";
var resultContainer = document.getElementById("list-group");
var toggleDirectionTab = document.getElementById("toggle-direction");
var toggleRouteTab = document.getElementById("toggle-route-tab");
var searchTab = document.getElementById("search-section");
var routingTab = document.getElementById("routing-section");

var spanClearDestination = document.getElementsByClassName('destination')[0];
var spanClearStart = document.getElementsByClassName('start')[0];

var searchControl = document.getElementById("search");
var searchResultDiv = document.getElementById('list-group-search');

var startControl = document.getElementById("start")
var destinationControl = document.getElementById("destination");

var noRoute = document.getElementById("no-route");
var directionsTab = document.getElementById("direction-tab");
var stepsTab = document.getElementById("steps");
var summaryInfo = document.getElementById("route-summary")
var activeTab = "";


var obstacles = JSON.parse(JSON.stringify(polygon));
var pointsClone = JSON.parse(JSON.stringify(points));
var roomPoints = JSON.parse(JSON.stringify(points));

roomPoints.features = roomPoints.features.filter(feature => feature.properties.use != 'Corridor Point');
roomPoints.features = roomPoints.features.filter(feature => feature.properties.level == 0);

// floor toggler
var toggleFloorButtons = document.querySelectorAll(".floor-toggler");
toggleFloorButtons.forEach(toggleFloorButton => {
    toggleFloorButton.addEventListener("click", function(e) {
        resetRouter();
        floorToggler(e.target.value);
    });

});

function floorToggler(value) {
    // remove the route
    resetRouter();   

    // update active floor
    activeFloor = value;
    let activeLayerId = layers[value];

    // update 
    if(activeMode == "3D") {
        toggle2d("3D");
    } else {

        // set visibility to none
        for (const key in layers) {
            let id = layers[key];
            console.log( map.getLayer(id));

            if(id == activeLayerId) {
                // set visibility to visible
                map.setLayoutProperty(activeLayerId,'visibility', 'visible');
            } else {
                map.setLayoutProperty(id, 'visibility', 'none');
            }
            
        }
    }


    console.log(value);
    // update the filter datasets
    pointsClone = JSON.parse(JSON.stringify(points));
    pointsClone.features = pointsClone.features.filter(feature => feature.properties.level == value);

    // update the points datasets
    coords = pointsClone.features.map(feature => {
        let coord = feature.geometry.coordinates;
    
        coord.push(feature.properties.fid);
    
        return coord;
    });

    roomPoints = JSON.parse(JSON.stringify(pointsClone));
    roomPoints.features = roomPoints.features.filter(feature => feature.properties.Name != 'Corridor Point');

    // obstacle
    let obstacle = polygon.features.filter(feature => feature.properties.level == value);

    // update the graph and edges object
    myRoute = new CalculateRoute(coords, turf.featureCollection(obstacle), value);
    myRoute.edges = edges[activeFloor];


}

function updateActiveLink(value) {
    const json = JSON.stringify(myRoute.edges);
    const dataURL = `data:application/json,${json}`;
    let activeLink = document.getElementById(value);

    activeLink.setAttribute("href", dataURL);

}

spanClearStart.addEventListener("click", function(e) {
    startControl.value = "";
    
    stepsTab.innerHTML = "";
    summaryInfo.innerHTML = ""

    map.getSource('route').setData({
        'type':'FeatureCollection',
        'features':[]
    });

    startMarker.remove();
});

spanClearDestination.addEventListener("click", function(e) {
    destinationControl.value = "";

    stepsTab.innerHTML = "";
    summaryInfo.innerHTML = ""

    map.getSource('route').setData({
        'type':'FeatureCollection',
        'features':[]
    });

    destinationMarker.remove();
});

toggleDirectionTab.addEventListener("click", function(e) {
    searchTab.classList.add('d-none');
    routingTab.classList.remove('d-none');
    directionsTab.classList.remove('d-none');
});

toggleRouteTab.addEventListener("click", function(e) {
    searchTab.classList.remove('d-none');
    routingTab.classList.add('d-none');
    directionsTab.classList.add('d-none');

    resetRouter();

});

// search room, stairway etc
searchControl.addEventListener("input", function(e) {
    // spanClearStart.innerHTML = '<i class="fa fa-times"></i>';

    activeTab = "";
    let features = searchAddress(e.target.value);
    updateSearchResultContainer(features);
});

// start control
startControl.addEventListener("focus", function(e) {
    activeTab = "start";
    resultContainer.innerHTML = "";
    resultContainer.classList.remove("slide-down");

    spanClearStart.innerHTML = '<i class="fa fa-search"></i>';
    spanClearDestination.innerHTML = '';
});

startControl.addEventListener("input", function(e) {
    spanClearStart.innerHTML = '<i class="fa fa-times"></i>';

    // toggle 3d mode
    if(activeMode == "3D") {
        toggle2d("2D");  
    }

    let features = searchAddress(e.target.value);
    updateSearchResultContainer(features);
});

destinationControl.addEventListener("focus", function(e) {
    activeTab = "destionation";
    resultContainer.innerHTML = "";

    resultContainer.classList.add("slide-down");
  

    spanClearStart.innerHTML = '';
    spanClearDestination.innerHTML = '<i class="fa fa-search"></i>';
});

destinationControl.addEventListener("input", function(e) {
    spanClearDestination.innerHTML = '<i class="fa fa-times"></i>';

    // toggle 3d mode
    if(activeMode == "3D") {
        toggle2d("2D");  
    }

    if(!this.value) {
        resultContainer.innerHTML = "";
    }

    let features = searchAddress(e.target.value);
    updateSearchResultContainer(features);
});

function searchAddress(value) {
    let data = activeTab ? JSON.parse(JSON.stringify(roomPoints)) : JSON.parse(JSON.stringify(points));
    console.log(data);

    data.features = data.features.filter(feature =>{
        if(
            feature.properties.Name.toLowerCase().includes(
                value.toLowerCase()
            )
        ) {
            return feature
        }
    });

    data.features = data.features.length > 6 ? data.features.slice(0, 6) : data.features;
    return [...data.features];
}

function updateSearchResultContainer(features){
    var listGroupFragment = document.createDocumentFragment();

    features.forEach(feature => {
        // create a list group item
        let listGroupItem = document.createElement("li");
        listGroupItem.setAttribute("class", "list-group-item");
        listGroupItem.setAttribute("id", feature.properties.fid);

        listGroupItem.innerHTML = feature.properties.Name;
        listGroupItem.innerHTML += "<div class='text-small'>, Floor "+feature.properties.level+"</div>";
        listGroupItem.addEventListener("click", function(e) {
            // console.log();
            handleClickEvent(this.getAttribute('id'), this);
            // e.stopPropagation();
        });

        listGroupFragment.append(listGroupItem);
    });

    if(activeTab != "") {
        resultContainer.innerHTML = "";
        resultContainer.append(listGroupFragment);

        return;
    }

    
    searchResultDiv.innerHTML = "";
    searchResultDiv.append(listGroupFragment);
    
}


function handleClickEvent(value, obj) {
    console.log(value);
    if(activeTab == "") {
        searchControl.value = obj.innerText;

        let featureId = obj.getAttribute('id');
        let feature = [...points.features].find(feature => feature.properties.fid == featureId);
        let coordinates = feature.geometry.coordinates; 

        console.log(feature);
        let level = feature.properties.level;
        IndoorLayerControl.setActiveFloor('floor-'+level);
        // update floor
        floorToggler(level);


        startMarker
            .setLngLat(coordinates)
            .addTo(map);

        map.flyTo({
            center:coordinates,
            zoom:21
        });

        searchResultDiv.innerHTML = "";
        return;
    }

    if(activeTab == "start") {
        routerInfo.setStart(value);
        startControl.value = obj.innerText;

        destinationControl.value !== '' ? triggerRounting() : "";

        // create markers
        let startId = routerInfo.getStart();
        let coordinates = [...coords].find(coord => coord[2] == startId).slice(0, 2)
        startMarker
        .setLngLat(coordinates)
        .addTo(map);

        map.flyTo({
            center:coordinates,
            zoom:21
        });

    } else {

        routerInfo.setDestination(value);
        destinationControl.value = obj.innerText;

        startControl.value !== '' ? triggerRounting() : "";

        // update marker
       
        let stopId = routerInfo.getDestination();
        destinationMarker 
        .setLngLat([...coords].find(coord => coord[2] == stopId).slice(0, 2))
        .addTo(map);
    }


    resultContainer.innerHTML = "";
}

function resetRouter() {
    startMarker.remove();
    destinationMarker.remove();

    map.getSource('route').setData(
        {
            "type": "FeatureCollection",
            "features": []
        }
    );

    stepsTab.innerHTML = "";
    summaryInfo.innerHTML = "<p class='text-danger'>NO ROUTE FOUND</p>";
    noRoute.innerHTML = "";
    startControl.value = "";
    destinationControl.value = "";
}

// load results
function RoutingModule() {
    this.activeTab = "";
    this.start = "";
    this.destination ="";


    this.setDestination = function (destination) {
        this.destination = parseInt(destination)
    }

    this.setStart = function (start) {
        this.start = parseInt(start);
    }

    this.getStart = function() {return this.start };
    this.getDestination = function() {return this.destination };

    // initialize
}

var routerInfo = new RoutingModule();

 // get the coordinates of the 
pointsClone.features = pointsClone.features.filter(feature => feature.properties.level == 0);
var coords = pointsClone.features.map(feature => {
    let coord = feature.geometry.coordinates;

    coord.push(feature.properties.fid);

    return coord;
});

// function 
let obstacle = obstacles.features.filter(feature => feature.properties.level == 0);

var myRoute = new CalculateRoute(coords, turf.featureCollection(obstacle), 0);
myRoute.edges = edges[activeFloor];

let startElement = document.createElement('div');
startElement.innerHTML = "S";
startElement.classList.add("direction-marker","start-marker");

var startMarker = new mapboxgl.Marker({element:startElement});

let destinationElement = document.createElement('div');
destinationElement.innerHTML = "D";
destinationElement.classList.add("direction-marker", "destination-marker");

var destinationMarker = new mapboxgl.Marker({element:destinationElement});

console.time("Create Graph");
// setTimeout(function(e){
//     myRoute.createGraph();
//     updateActiveLink('0');
// }, 100);

console.timeEnd("Create Graph");

// trigger routing
function triggerRounting() {
    let startId = routerInfo.getStart();
    let stopId = routerInfo.getDestination();

    console.log(startId, stopId);

    // clean the no route text
    noRoute.innerHTML = "";
    stepsTab.innerHTML = "";
    summaryInfo.innerHTML = "";
    map.getSource('route').setData(dummyGeojson);

    // get the route
    let routePromise = new Promise((resolve, reject) => {
        try {
            let route = myRoute.getRoute(startId, stopId);
            resolve(route);
        } catch (error) {
            reject(error);
        }
    });

    routePromise
        .then(data => {
            if(data.type) {
                let feature = JSON.parse(JSON.stringify(data));
                feature.geometry.coordinates = feature.geometry.coordinates.map(coord => {
                    coord = coord.slice(0,2);
                    return coord
                });

                console.log(feature);

                let geojsonData = turf.featureCollection([feature]);

                shortestRoute = geojsonData;
                map.getSource('route').setData(geojsonData);
                map.fitBounds(turf.bbox(geojsonData), { padding:50})

                // directions tabs
                let directions = getDirections(data);
                updateDirectionsTab(directions);

                // update summary Information
                let distance = turf.length(geojsonData) * 1000;
                let time = distance / 1.2;

                if(time > 60) {
                    let minutes = Math.floor(time / 60);
                    let seconds = Math.ceil(time % 60);

                    time = minutes + "min " + seconds + "secs"
                } else {
                    let seconds = Math.ceil(time);
                    time =  seconds + "secs"
                }

                summaryInfo.innerHTML = "";
                summaryInfo.innerHTML ="<div><h5><span class='text-success'>"+ time +"   </span>(" + Math.ceil(distance) +" m)</h5><p>Via Main Corridor</p></div>" ;
                summaryInfo.innerHTML += '<button class="btn" id="preview-steps">PREVIEW</button>';

                // event listener
                toggleCarousel();
            } else {
                noRoute.innerHTML = data;
            }
           
        })
        .catch(error => {
            console.error(error);
        });
}

function toggleCarousel() {
    // get the toggleCarousel
    toggleCarouselContainer = document.getElementById("preview-steps");

    toggleCarouselContainer.addEventListener('click', function(e) {
        carouselContainer.classList.toggle("d-none");

        if(carouselContainer.classList.contains("d-none")) {
            this.innerText = "PREVIEW";
            speechSynth.cancel();

            clearInterval(speechInterval);
            return;
        }

        if(!carouselContainer.classList.contains("d-none")) {
            this.innerText = "CANCEL"
            playRoute();
        }
    });
}

function getDirections(data) {
    let directionCoords = data.geometry.coordinates;

    let coordsLength = directionCoords.length - 1;
    // create a direction objects
    let directionObj = [];
    for (let i = 0; i < directionCoords.length; i++) {
        let direction = {};
       
        if(i == coordsLength) {
            direction.from = getPointName(directionCoords[i][2]);
        } else {
            direction.from = getPointName(directionCoords[i][2]);
            direction.distance = getDistance(directionCoords[i], directionCoords[i+1]);
            direction.bearing = getBearing(directionCoords[i], directionCoords[i+1])
        }
        
        direction.coordinates = directionCoords[i];

        directionObj.push(direction);
    }

    console.log(directionObj);
    return directionObj;
}

function getDistance(p1, p2) {
    let from = turf.point([...p1]);
    let to = turf.point([...p2]);
    let options = {units: 'kilometers'};

    let distance = turf.distance(from, to, options);

    return (distance * 1000).toFixed(1);
}

function getBearing(p1, p2) {
    let point1 = turf.point([...p1]);
    let point2 = turf.point([...p2]);
    var bearing = turf.bearing(point1, point2);

    return bearing.toFixed(1);
}

function getPointName(fid) {
    // console.log(fid)
    return points.features.find(feature => feature.properties.fid == fid).properties.Name;
}

function updateDirectionsTab(directions) {
    let docFrag = document.createDocumentFragment();

     // update the preview 
     directionCard.innerHTML = "";
     console.log(docFrag);
     
    directionCard.style.width = directions.length * 100 + "%";
    let distance = 0;
 
    directions.forEach((direction, i) => {
        let listItem = document.createElement("li");
        
        listItem.setAttribute("data-key", direction.from);
        distance = direction.distance ? parseInt(direction.distance) : 0;

        if(i == 0) {
            listItem.innerHTML = "<span class='directions-icon'>"+
                "<div class='marker-small start-marker'>S</div>"+
            "</span>";

            listItem.innerHTML += "<div class='list-direction'>"+ direction.from +"</div>";
            listItem.innerHTML += "<div class='directions-step-distance'>"+ distance +" m</div>";
            // listItem.classList.add('waypoint');

            // directionCard.innerHTML += listItem.innerHTML;
        } else if(i == directions.length -1) {
            listItem.innerHTML = "<span class='directions-icon'>"+
                "<div class='marker-small destination-marker'>D</div>"+
            "</span>";

            listItem.innerHTML += "<div class='list-direction'>"+ direction.from +"</div>";

            listItem.classList.add('waypoint');
            // directionCard.innerHTML += listItem.innerHTML;
        } 
        else {
            let angle = directions[i].bearing - directions[i-1].bearing;
            angle = angle < 0 ? angle + 2 * 180 : angle;
            console.log(angle);

            console.log(!Boolean(angle));
            let turn = !Boolean(angle) ? "Head Straight": angle == 0  ? "Head Straight" : angle < 180 ? 'Turn Left' : "Turn Right";
            let icon = !Boolean(angle) ? "arrow-up": angle == 0  ? "arrow-up" : angle < 180 ? 'arrow-left' : "arrow-right";

            listItem.innerHTML = "<span class='directions-icon'>"+
            "<i class='fa fa-"+ icon +"'></i>"+
            "</span>";

            listItem.innerHTML += "<div class='list-direction'>"+ turn +"</div>";
            listItem.innerHTML += "<div class='directions-step-distance'>"+ distance +" m</div>";
            
            console.log("Card");
            
          
        }

        listItem.setAttribute("data-lat", direction.coordinates[1]);
        listItem.setAttribute("data-lng", direction.coordinates[0]);
        listItem.classList.add('direction-steps');

        directionCard.innerHTML +=  listItem.outerHTML;
        // directionCard.append(listItem);

        // add event listener
        listItem.addEventListener("mouseover", function(e) {
            let lng = this.getAttribute('data-lng');
            let lat = this.getAttribute('data-lat');

            positionMarker.setLngLat([lng, lat]).addTo(map)
            
        });

        listItem.addEventListener("mouseout", function(e) {
           positionMarker.remove();            
        });

        listItem.addEventListener("click", function(e) {
            let lng = this.getAttribute('data-lng');
            let lat = this.getAttribute('data-lat');

            map.flyTo({
                center: [lng, lat],
                zoom: 22
            });
            
        });
        
        docFrag.append(listItem);
    });

    stepsTab.innerHTML = "";
    stepsTab.append(docFrag);

    // directionCard.innerHTML = "";
    // directionCard.append(docFrag);

    listGroupCards = document.querySelectorAll("#direction-card li");
    listGroupCardsLength = listGroupCards.length - 1;
   
}

// #F7F6EC', '#707D82'
// tiles color: #FEFAEE, #FEFBEC


// TODO: path preview, audio,
