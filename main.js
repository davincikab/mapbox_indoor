mapboxgl.accessToken = 'pk.eyJ1IjoiYmVubnl0cm92YXRvIiwiYSI6ImNrZDcwdTVwbTE4amEyem8yZWdkNHN3ZmoifQ.r3Llqtnwfqqju2zfzE-fvA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [36.962665288208996, -0.399305745003987],
    zoom: 19.99,
    maxZoom:25,
    pitch: 40,
    bearing: 21,
    antialias: true,
    hash:true
});

let images = ['blue', 'cream', 'texture_25', 'tiles', 'magenta'];
var shortestRoute;

var dummyGeojson = {
    "type":"featureCollection",
    "feature":[]
};

map.on('load', function() {
    loadImage(images);

    map.addSource('floorplan', {
        'type': 'geojson',
        'data':
            'ground_floor.geojson'
    });

    map.addLayer({
        'id': 'room-extrusion',
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


    map.addSource('floorone', {
        'type': 'geojson',
        'data':'first_floor.geojson'
    });

    map.addLayer({
        'id': 'floor-one-extrusion',
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

    // 2d second
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

    // second floor
    map.addSource('floortwo', {
        'type': 'geojson',
        'data':
            'second_floor.geojson'
    });

    map.addLayer({
        'id': 'floor-two-extrusion',
        'type': 'fill-extrusion',
        'source': 'floortwo',
        'paint': {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'base_heigh'],
            'fill-extrusion-opacity': 1,
            'fill-extrusion-pattern':"blue"
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
    
    map.addSource('pointstwo', {
        type: 'geojson',
        data: 'points_buffer.geojson'
    });

    map.addLayer({
        'id': 'point-extrusion',
        'type': 'fill-extrusion',
        'filter':['==', ['get', 'level'], 0],
        'source': 'pointstwo',
        'paint': {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'base_heigh'],
            'fill-extrusion-opacity': 1,
        },
        'layout' :{
            'visibility':'visible'
        }
    });

    // load the points
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
            'icon-size':2
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
            'line-color': '#fff',
            'line-width': 8
        }
    });

});

function loadImage(images) {
    images.forEach(imageName => {
        map.loadImage("./"+imageName+".jpg", function(error, image) {
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

// create a mapbox control 
class IndoorLayerControl {
    constructor() {

    }

    toggleLayer() {

    }
    onAdd() {

    }

    remove() {

    }
}

var resultContainer = document.getElementById("list-group");
var startControl = document.getElementById("start")
var destinationControl = document.getElementById("destination");
var noRoute = document.getElementById("no-route");
var directionsTab = document.getElementById("direction-tab");
var activeTab = "";
var routingButton = document.getElementById("route");


var obstacles = JSON.parse(JSON.stringify(polygon));
var pointsClone = JSON.parse(JSON.stringify(points));
var roomPoints = JSON.parse(JSON.stringify(points));
roomPoints.features = roomPoints.features.filter(feature => feature.properties.Name != 'Corridor Point');
roomPoints.features = roomPoints.features.filter(feature => feature.properties.level == 0);

// floor toggler
var toggleFloorButtons = document.querySelectorAll(".floor-toggler");
toggleFloorButtons.forEach(toggleFloorButton => {
    toggleFloorButton.addEventListener("click", function(e) {
        resetRouter();
        floorToggler(e);
    });

});

function floorToggler(e) {
    // get the values
    let value = e.target.value;
    let layers = {
        '0':'ground_2d',
        '1':'floor-one_2d',
        '2':'floor-two_2d'
    };

    let activeLayerId = layers[value];

    console.log("Active: "+ activeLayerId);
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

    console.log(pointsClone);
    console.log(coords);

    // obstacle
    let obstacle = polygon.features.filter(feature => feature.properties.level == value);

    // update the graph and edges object
    myRoute = new CalculateRoute(coords, turf.featureCollection(obstacle), value);
    console.time("Create Graph");
    myRoute.createGraph();
    console.timeEnd("Create Graph");
    

}

routingButton.addEventListener("click", function(e) {
    if(routerInfo.start == "" || routerInfo.destination == "") {
        noRoute.innerHTML = "Select a start and destination"
    } else {
        triggerRounting();
    }
});

startControl.addEventListener("focus", function(e) {
    activeTab = "start";
    resultContainer.innerHTML = "";
    resultContainer.classList.remove("slide-down");
});

startControl.addEventListener("input", function(e) {
    let features = searchAddress(e.target.value);
    updateSearchResultContainer(features);
});

destinationControl.addEventListener("focus", function(e) {
    activeTab = "destionation";
    resultContainer.innerHTML = "";

    resultContainer.classList.add("slide-down");

});

destinationControl.addEventListener("input", function(e) {
    if(!this.value) {
        resultContainer.innerHTML = "";
    }

    let features = searchAddress(e.target.value);
    updateSearchResultContainer(features);
});

function searchAddress(value) {
    let data = JSON.parse(JSON.stringify(roomPoints));
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

        listGroupItem.innerHTML = feature.properties.Name +"<small id='"+feature.properties.fid+"'>, Floor "+feature.properties.level+", "+feature.properties.fid+"</small>"
        listGroupItem.addEventListener("click", function(e) {
            handleClickEvent(e);
            // e.stopPropagation();
        });

        listGroupFragment.append(listGroupItem);
    });

    resultContainer.innerHTML = "";
    resultContainer.append(listGroupFragment);
}


function handleClickEvent(e) {
    let target = e.target;
    let value = target.id;

    console.log(target);
    if(activeTab == "start") {
        routerInfo.setStart(value);
        startControl.value = target.innerText;
    } else {

        console.log("Destionation Control");
        routerInfo.setDestination(value);
        destinationControl.value = target.innerText;
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

    directionsTab.innerHTML = "";
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
var startMarker = new mapboxgl.Marker();
var destinationMarker = new mapboxgl.Marker();

console.time("Create Graph");
myRoute.createGraph();
console.timeEnd("Create Graph");

// trigger routing
function triggerRounting() {
    let startId = routerInfo.getStart();
    let stopId = routerInfo.getDestination();

    console.log(startId, stopId);
    // create markers
    startMarker
        .setLngLat([...coords].find(coord => coord[2] == startId).slice(0, 2))
        .addTo(map);

    destinationMarker 
        .setLngLat([...coords].find(coord => coord[2] == stopId).slice(0, 2))
        .addTo(map);

    // clean the no route text
    noRoute.innerHTML = "";
    directionsTab.innerHTML = "";
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

                console.log(geojsonData);
                shortestRoute = geojsonData;
                map.getSource('route').setData(geojsonData);

                let directions = getDirections(data);
                updateDirectionsTab(directions);
            } else {
                noRoute.innerHTML = data;
            }
           
        })
        .catch(error => {
            console.error(error);
        });
}

function getDirections(data) {
    let directionCoords = data.geometry.coordinates;

    let coordsLength = directionCoords.length - 1;
    // create a direction objects
    let directionObj = [];
    for (let i = 0; i < directionCoords.length; i++) {
        let direction = {};
        if(i == 0) {
            direction.from = getPointName(directionCoords[i][2]);
        }  else if(i == coordsLength) {
            direction.from = getPointName(directionCoords[i][2]);
        } else {
            direction.from = getPointName(directionCoords[i][2]);
            direction.distance = getDistance(directionCoords[i], directionCoords[i+1]);
            direction.bearing = getBearing(directionCoords[i], directionCoords[i+1])
        }   

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
    console.log(fid)
    return points.features.find(feature => feature.properties.fid == fid).properties.Name;
}

function updateDirectionsTab(directions) {
    let docFrag = document.createDocumentFragment();
    directions.forEach((direction, i) => {
        let listItem = document.createElement("li");
        listItem.setAttribute("class", "list-group-item");

        if(i == 0) {
            listItem.innerHTML = "<p><b>"+ direction.from +"</b></p>"+
                "<small>0m</small>"
        } else if(i == directions.length -1) {
            listItem.innerHTML = "<small>Destination: <b>"+ direction.from +"</b></small>"
        }
        else {
            listItem.innerHTML = "<p>"+ direction.from +"</p>"+
                "<small> Head "+direction.bearing +" on  </small>"+
                "<small> "+direction.distance+"m </small>"
        }

        docFrag.append(listItem);
    });

    directionsTab.innerHTML = "";
    directionsTab.append(docFrag);
}

// #F7F6EC', '#707D82'
// tiles color: #FEFAEE, #FEFBEC


// Load more points
// Remove corridor points from search
// update the obstacles layers


// change the 