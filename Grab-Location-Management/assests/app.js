const GRABCAR = 'GrabCars';
const CALL_HISTORY = 'callHistory';
const UNLOCATED = 0;
const FINDING_CAR = 1;
const NO_CAR = 2;
const DONE = 3;
const COMPLETE = 4;
const MARKER_CUSTOMER = "customerIcon";
const MARKER_GRABER = "graberIcon";
var BreakException = {};
var circle;
var map;
var cars = [];
var infowindow;
var selectedInfoWindow;
var icons = {
    customerIcon: {
        icon: './assests/icon/marker-dest.png'
    },
    graberIcon: {
        icon: './assests/icon/marker-start.png'
    },
};
var api = {
    getCarById: 'https://us-central1-my-grab.cloudfunctions.net/getCarById',
    setCarInfo: 'https://us-central1-my-grab.cloudfunctions.net/setCarInfo',
    sendRequestToCar: 'https://us-central1-my-grab.cloudfunctions.net/sendRequestToCar',
    requestCall: 'https://us-central1-my-grab.cloudfunctions.net/requestCall',
    getGrabCarsNearThere: 'https://us-central1-my-grab.cloudfunctions.net/getGrabCarsNearThere',
    getCarByCallId: 'https://us-central1-my-grab.cloudfunctions.net/getCarByCallId',
};
var searchRanges = [500, 1000, 10000];
var cityCenter = {lat: 10.8043382, lng: 106.6565154};

function initializeMap() {
	infowindow = new google.maps.InfoWindow({});
	var geocoder = new google.maps.Geocoder;
    var map = new google.maps.Map(document.getElementById("initgrab-map"), {
        zoom: 16,
        center: cityCenter,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    circle = new google.maps.Circle({
        center: map.getCenter(),
        radius: 8000, // meters
        strokeColor: "#0000FF",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#0000FF",
        fillOpacity: 0.26
    });

    circle.setMap(map);

    var bounds = circle.getBounds();
    map.fitBounds(bounds);
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
    let i = 0;
    let carIndex = 0;
    while (carIndex < 100) {
        var ptLat = Math.random() * (ne.lat() - sw.lat()) + sw.lat();
        var ptLng = Math.random() * (ne.lng() - sw.lng()) + sw.lng();
        var point = new google.maps.LatLng(ptLat, ptLng);
        if (google.maps.geometry.spherical.computeDistanceBetween(point, circle.getCenter()) < circle.getRadius()) {
        	let carTypeId = randomGrabType(i);
        	let carType = parseCarTypeId(carTypeId);
        	let car = buildCar(carIndex, ptLat, ptLng, carType);
        	addCarToGrabList(car);
        	addCarToDB(car);
            createMarker(map, point, "Grab " + carType + " " + carIndex);
            carIndex++;
            // break;
        }
        i++;
    }

}

function randomGrabType(index) {
	return (index % 2);
}

function parseCarTypeId(index) {
	switch(index) {
		case 0:
			return "Standard";
		case 1:
			return "Premium";
		default: 
			return "Spaceship";
	}
}

function buildCar(grabCarId, lat, lng, type) {
	var car = {
		carId: grabCarId,
        username: "Driver_" + grabCarId,
        password: "123",
		match: "",
		latitude: lat,
		longitude: lng,
		type: type,
        request: ""
	};
	return car;
}

function addCarToGrabList(car) {
	cars.push(car);
}

function createMarker(map, point, content, iconId, infoList) {
    var iconPath = "http://maps.google.com/mapfiles/kml/shapes/heliport.png";
    if(typeof iconId !== 'undefined') {   
        iconPath = icons[iconId].icon;
    }
    var marker = new google.maps.Marker({
            position: point,
            map: map,
            icon: iconPath
        });
    
    marker.infowindow = new google.maps.InfoWindow();
    selectedInfoWindow = marker.infowindow;
    marker.infowindow.setContent(content + "<br>" + marker.getPosition().toUrlValue(6));
    if(typeof selectedInfoWindow !== 'undefined') {
            selectedInfoWindow.close();
        }
    google.maps.event.addListener(marker, "click", function(evt) {
        if(typeof selectedInfoWindow !== 'undefined') {
            selectedInfoWindow.close();
        }
        marker.infowindow.open(map, marker);
        selectedInfoWindow = marker.infowindow;
    });
    return marker;
}

function createMarkerWithoutInfowindow(map, point, content, iconId) {
    var iconPath = "http://maps.google.com/mapfiles/kml/shapes/heliport.png";
    if(typeof iconId !== 'undefined') {   
        iconPath = icons[iconId].icon;
    }
    var marker = new google.maps.Marker({
            position: point,
            map: map,
            icon: iconPath
        });
    
    return marker;
}

function addInfoWindowToMarker(marker, map) {
    infowindow = new google.maps.InfoWindow();
    google.maps.event.addListener(marker, "click", function(evt) {
        infowindow.setContent(content + "<br>" + marker.getPosition().toUrlValue(6));
        infowindow.open(map, marker);
    });
    selectedInfoWindow = infowindow;
}

function setMapOnAll(markers, map) {
    if(markers === null) return;
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

function setMapOnAllExcept(markers, map, index) {
    if(markers === null) return;
    for (var i = 0; i < markers.length; i++) {
        if(i !== index) {
            markers[i].setMap(map);
        }
    }
}
//google.maps.event.addDomListener(window, 'load', initialize);

// Initialize Firebase
var firebaseConfig = {
	apiKey: "AIzaSyDh7WAhJnaIcpUEGiPaMQrzOjQwuzWw1RA",
	authDomain: "my-grab.firebaseapp.com",
	databaseURL: "https://my-grab.firebaseio.com",
	projectId: "my-grab",
	storageBucket: "my-grab.appspot.com",
	messagingSenderId: "155666237539"
};
firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var callsRef = database.ref(CALL_HISTORY);
var grabCarsRef = database.ref(GRABCAR);

function addCarToDB(car) {
	let newCar = database.ref().child(GRABCAR).push();
    newCar.set(car);
}

function updateCarStatus(carKey, customerPhoneNumber) {
	let path = GRABCAR + carKey;
	database.ref(path).update({
		'match' : customerPhoneNumber
	})
}

//return promise
function isKeyExist(path, key) {
	if(path === '') {
		return database.ref().once('value')
	  	.then(function(snapshot) {
			return snapshot.hasChild(key);
	  	});
	}
	else {
		return database.ref(path).once('value')
	  	.then(function(snapshot) {
			return snapshot.hasChild(key);
	  	});
	}
  	
}

function loadNode(path, key) {
	return database.ref(path).once('value')
  	.then(function(snapshot) {
		return snapshot.val();
  	});
}

function formatDate(strDate) {
    var date = new Date(strDate);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear() + " " + strTime;
}




