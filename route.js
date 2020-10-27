class CalculateRoute {
    constructor(coords, obstacle, floor) {
        // this.start = start;
        // this.stop = stop;
        this.floor = floor;
        this.path = [];
        this.graph = {};
        this.edges = {};
        this.coords = coords;
        this.obstacle = obstacle;
    }

    createGraph() {
        // this.coords = this.nameCoords(this.coords);
        var graph = {};
        var edges = {};
        var obstactleCount = this.obstacle.features.length;

        for (let current of this.coords) {
            graph[current[2].toString()] = [];
            edges[current[2].toString()] = {};
            for(let comparer of this.coords) {
                if(comparer == current) {
                    continue;
                }else {
                

                    // tailor the graph.
                    var path = turf.lineString([current, comparer]);

                    // let booleanCrossesArray = this.obstacle.features.map(feature => turf.booleanCrosses(path, feature));
                    let booleanCrosses = false;

                    console.time("Crosses");
                    for (let index = 0; index < obstactleCount; index++) {
                        let feature = this.obstacle.features[index];

                        if(turf.booleanCrosses(path, feature)) {
                            // console.log(index);
                            booleanCrosses = true;
                            break;
                        }
                        
                    }
                    
                    console.timeEnd("Crosses");
                    // console.log(booleanCrossesArray);
                    // let booleanCrosses = booleanCrossesArray.find(bcross => bcross);
                    if(booleanCrosses) {
                        // console.log("Object:" + [current, comparer]);
                        continue
                    }else {
                        let weight = this.distanceBetweenNodes(current, comparer);
                        graph[current[2].toString()].push(comparer[2]);

                        edges[current[2].toString()][comparer[2].toString()] = weight;
                    }
                    

                }
            }
        }

        this.graph = graph;
        this.edges = edges;

        console.log(edges);
        return [graph, edges];
    }

    distanceBetweenNodes(start, stop) {
        // get the distance
        var start = start;
        var end = stop;

        var options = {
            obstacles: polygon
        };

        let radius = 63710000;
        const lat1 = start[0] * Math.PI / 180;
        const lat2 = end[0] * Math.PI / 180;
        const lng1 = start[1] * Math.PI / 180;
        const lng2 = end[1] * Math.PI / 180;

        const dlat = lat1 - lat2;
        const dlng = lng1 - lng2;

        let a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlng / 2), 2);

        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        let distance = radius * c;
        // console.log(distance);

        return distance;
    }

    nameCoords(coords) {
        coords.forEach((element, i) => {
            element.push(i);
            return element;
        });
    
        return coords;
    }

    getShortestPath(graph, startNode, endNode) {
        // track distances
        let distances = {};
        distances[endNode] = "Infinity";
        distances[startNode] = Object.assign(distances, graph[startNode]);

        console.log(distances);

        // track paths using hash object
        let parents = {endNode:null};
        for (let child in graph[startNode]) {
            parents[child] = startNode;
        }

        console.log(parents);
        // collect visited node
        let visited = [];

        // find the nearest node
        let node = this.shortestDistanceNode(distances, visited);    

        console.log(node);
        // for that node
        while(node) {
            // find its distance from the start node & its child nodes
            let distance = distances[node];
            let children = graph[node];

            // for each child nodes
            for (let child in children) {
                // make sure the nodes is not startNode
                if(String(child) == String(startNode))  {
                    continue;
                } else {
                    // save distances from start to end node
                    let newDistance = distance + children[child];

                    // if there's no recorded distance from the start node to the child node in the distances object
                    // or if the recorded distance is shorter than the previously stored distance from the start node to the child node
                    if(!distances[child] || distances[child] > newDistance){
                        distances[child] = newDistance;
                        parents[child] = node;
                    }
                }   
            }

            // move the current node to the visited set
            visited.push(node);
            node = this.shortestDistanceNode(distances, visited);

        }

        console.log(parents);
        // using the stored paths from start node to end node
        // record the shortest path
        let shortestPath = [endNode];
        let parent = parents[endNode];

        while(parent) {
            shortestPath.push(parent);
            parent = parents[parent];
        }

        shortestPath.reverse();

        let results = {
            distances:distances[endNode],
            path:shortestPath
        };

        console.log(results);

        return results;
    }


    shortestDistanceNode(distances, visited) {
        let shortest = null;
        for (const node in distances) {
            let currentIsShortest = shortest === null || distances[node] < distances[shortest];

            if(currentIsShortest && !visited.includes(node)){
                shortest = node;
            }
        }

        return shortest;
    }

    getRoute(start, stop, edges) {
        // let [graph, edges] = this.createGraph();
        console.time("graph");
        if(edges) {
            this.edges = edges;
        }
        
        console.timeEnd("graph");

        console.time("ShortestPath");   
        let {distances, path} = this.getShortestPath(this.edges, start, stop);
        console.timeEnd("ShortestPath");

        let pt = path.map(pt => parseInt(pt));

        let stpCoord = pt.reduce((pv,ac, i) => {
            let coord = this.coords.find(cod => cod[2] == ac)
            if(coord) {
                pv.push(coord);
            }
            return pv;
        }, []);

        console.log(stpCoord);

        if(stpCoord.length < 2) {
            return "No path found";
        }
        let shortestPath = turf.lineString(stpCoord);

        // add path to map
        return shortestPath;
    }

    getDirections() {
        let dir = "Walk towards ";

        return dir;
    }
}


// explore ansynchronous code
// cache the edges: 