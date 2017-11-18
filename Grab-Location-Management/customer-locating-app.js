var directionsService;
var directionsDisplay;
var geocoder;
var markers = [];
var locatingMap;
var selectedCallDiv;
var selectedCall;
var selectedPointMarker;
var clickListener;


$(function () {
	$('#button-reset-customer-address').click(function() {
		resetCustomerAddress();
	});
	$('#button-geocode-search').click(function() {
		let inputAddress = $('#input-address').val();
		searchGeocode(inputAddress);
	})
})

function searchGeocode(address) {
	setMapOnAll(markers, null);
	markers=[];
	let leftTopPoint = new google.maps.LatLng(11.152055, 106.345369);
	let rightBottomPoint = new google.maps.LatLng(10.558729, 107.043133);
	let northEastPoint = new google.maps.LatLng(11.1602136, 107.0265769);
	let southWestPoint = new google.maps.LatLng(10.3493704, 106.3638784);
	let rectangleBounds = new google.maps.LatLngBounds(leftTopPoint, rightBottomPoint);
	let bounds = new google.maps.LatLngBounds(southWestPoint, northEastPoint);
	let searchObject = {
		address: address,
		bounds: bounds
	};
	geocoder.geocode(searchObject, 
		function(results, status) {
	    if (status === 'OK') {
	        if(results === null) {
	        	alert("Address not found");
	        	return;
	        }
	        showResultsOnMap(results);
	    } else {
	        console.log('Geocode was not successful for the following reason: ' + status);
	    }
	});
}

function showResultsOnMap(results) {
	results.forEach(function (point, index) {
    	let content = createCustomerMarkerInfoLocating(results[index], index);
    	let marker = createMarker(locatingMap, results[index].geometry.location, content, MARKER_CUSTOMER);
		markers.push(marker);
    });
    locatingMap.setCenter(results[0].geometry.location);
}

function createCustomerMarkerInfoLocating(point, index) {
	let res = "";
	res += "<p>"+ point.formatted_address +"</p>";
	res += "<div class=\"text-center div-find-car\">";
	res += "<button type=\"button\" class=\"btn btn-success\" onclick=\"";
	res += "findGrabCar(" + index + "," + point.geometry.location.lat() + "," + point.geometry.location.lng() + ")\">";
	res += "Lưu và bắt đầu tìm xe</button>";
	res += "</div>";

	return res;
}	

function createCustomerMarkerInfoNoCar(point, index) {
	let res = "";
	res += "<p>"+ point.formatted_address +"</p>";
	res += "<div class=\"text-center\">";
	res += "<button type=\"button\" class=\"btn btn-success\" onclick=\"findGrabCar(" + index + "," + point.geometry.location +")\">";
	res += "Lưu và bắt đầu tìm xe</button>";
	res += "</div>";

	return res;
}	

function findGrabCar(index, lat, lng) {
	//remove button find car
	$(".div-find-car").html('');
	//remove all markers except the choosen marker
	let marker = markers[index];
	setMapOnAllExcept(markers, null, index);
	markers = [];
	markers.push(marker);

	//set center of map to this point
	locatingMap.setCenter(marker.position);
	locatingMap.setZoom(16);
	showAvailableCars(locatingMap, marker.position);
}

function showAvailableCars(map, center) {
	let i,j;
	let count = 0;
	for(i = 0; i < 3; i++) {
		for(j = 0; j < vm.cars.length; j++) {
			if(rightType(vm.cars[j]) && inRange(center, vm.cars[j], searchRanges[i])) {
				count++;
				let latLng = new google.maps.LatLng(vm.cars[j].value.latitude, vm.cars[j].value.longitude);
				let marker = createMarker(map, latLng, createGrabCarInfo(vm.cars[j]), MARKER_GRABER);
				markers.push(marker);
			}
			if(count >= 10) break;
		}
		if(count >= 10) break;
	}
	
	let availableCarsInfo = "Có " + count + " xe phù hợp";
	$(".div-find-car").html(availableCarsInfo);
	if(markers.length === 0) {
		alert("Không có xe");
	}
}

function rightType(car) {
	return (car.value.type.indexOf(vm.getCallCarType(selectedCall.value.Type)) !== -1);
}

function inRange(center, car, range) {
	let pointGrab = new google.maps.LatLng(car.value.latitude, car.value.longitude);
	let distance = calculateDistanceFromPointToPoint(pointGrab, center);
	let res = distance <= range;
	if(res === true) {
		res = true;
	}
	return res;
}

var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat() - p1.lat());
  var dLong = rad(p2.lng() - p1.lng());
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

function calculateDistanceFromPointToPoint(pointA, pointB) {
	let deltaX = pointA.lat() - pointB.lat();
	let deltaY = pointA.lng() - pointB.lng();
	//let res = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
	let res = getDistance(pointA , pointB);
	return res;
}

function createGrabCarInfo(car) {
	let res = "";
	res += "<p>ID:&nbsp; " + car.value.carId + "-" + car.value.type + "</p>";
	res += "<button type=\"button\" class=\"btn btn-success\" onclick=\"";
	res += "mapGrabCarToCustomer(" + "'" + car.key + "'" + ")\">Chọn</button>";
	return res;
}

function mapGrabCarToCustomer(carKey) {
	let carPath = GRABCAR + "/" + carKey;
	let carRef = database.ref(carPath);
	carRef.update({
		match: selectedCall.key,
	});

	let callPath = CALL_HISTORY + "/" + selectedCall.key;
	let callRef = database.ref(callPath);
	callRef.update({
		Status: DONE,
	});
	removeClickListener();
	$("#button-reset-customer-address").click();
}

function setSelected(ele) {
	var self = ele;
	if(typeof selectedCallDiv !== 'undefined'){
		$(selectedCallDiv).removeClass("active");
	}
	$(self).addClass("active");
	selectedCallDiv = self;
	let call = JSON.parse(ele.getAttribute("data-call"));
	selectedCall = call;
	$('#input-address').val(call.value.InputAddress);
	//enable click listener
	addClickListener();
}

function resetCustomerAddress() {
	$('#input-address').val("");
	setMapOnAll(markers, null);
	markers=[];
}

function initMapLocatingApp() {
    var hcmus = { lat: 10.7626737, lng: 106.6834609 };
    geocoder = new google.maps.Geocoder;
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;	
    directionsDisplay.suppressMarkers = false;
    locatingMap = new google.maps.Map(document.getElementById('map-locating-app'), {
        zoom: 12,
        center: cityCenter
    });
    directionsDisplay.setMap(locatingMap);
	directionsDisplay.setOptions( { suppressMarkers: true } );
	
}

function addClickListener() {
	clickListener = locatingMap.addListener('click', function (event) {
		let latLng = event.latLng;
		if(typeof selectedPointMarker !== 'undefined') {
			selectedPointMarker.setMap(null);
		}
		geocoder.geocode({'location': latLng}, 
			function(results, status) {
			if (status === 'OK') {
				let point = results[0];
            	if (point) {
            		let content = createCustomerMarkerInfoLocating(point, getMarkersLength());
            		let marker = createMarker(locatingMap, latLng, content, MARKER_CUSTOMER);
            		markers.push(marker);
            		//infowindow.open(locatingMap, marker);
            		selectedPointMarker = marker;
            	}
            }
		});
	});
}

function removeClickListener() {
	locatingMap.removeListener(clickListener);
}

function getMarkersLength() {
	if(markers !== null)
		return markers.length;
	return 0;
}

var vm = new Vue({
	el: '#locating-app',
	data: {
		calls: [],
		cars: [],
	},
	mounted: function(){
		var self = this;
		callsRef.on('child_added', function(childSnapshot, prevChildKey) {
			if(childSnapshot.val().Status === UNLOCATED || childSnapshot.val().Status === FINDING_CAR) {
				self.calls.push({
					key: childSnapshot.key,
					value: childSnapshot.val(),
				});
			}
		});

		grabCarsRef.on('child_added', function(childSnapshot, prevChildKey) {
			if(childSnapshot.val().match === "") {
				self.cars.push({
					key: childSnapshot.key,
					value: childSnapshot.val(),
				});
			}
		});
		grabCarsRef.on('child_changed', function(childSnapshot, prevChildKey) {
			let i;
			for(i = 0; i<self.cars.length; i++) {
				if(self.cars[i].key.indexOf(childSnapshot.key) !== -1) {
					self.cars[i].value = childSnapshot.val();
					if(self.cars[i].value.match !== "") {
						self.cars.splice(i, 1);
					}
					break;
				}
			}
		});

		callsRef.on('child_changed', function(childSnapshot, prevChildKey) {
			let i;
			for(i = 0; i<self.calls.length; i++) {
				if(self.calls[i].key.indexOf(childSnapshot.key) !== -1) {
					self.calls[i].value = childSnapshot.val();
					if(self.calls[i].value.Status === NO_CAR || self.calls[i].value.Status === DONE) {
						self.calls.splice(i, 1);
					}
					break;
				}
			}
		});
	},
	methods: {
		getStatusClass: function(status) {
			switch(status) {
				case UNLOCATED:
					return "unlocated";
				case FINDING_CAR:
					return "finding";
				case NO_CAR:
					return "no-car";
				case DONE:
					return "done";
			};
			return "done";
		},

		getCallStatusColor: function(status) {
			switch(status) {
				case UNLOCATED:
					return "Gray";
				case FINDING_CAR:
					return "Blue";
				case NO_CAR:
					return "Violet";
				case DONE:
					return "Aqua";
			};
			return "Brown";
		},

		getCallCarType: function(typeId) {
			switch(typeId) {
				case 1:
					return "Standard";
				case 2:	
					return "Premium";
			};
		},
	}
});