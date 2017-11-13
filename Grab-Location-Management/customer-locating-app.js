var directionsService;
var directionsDisplay;
var geocoder;
var markers = [];
var locatingMap;
var selectedCallDiv;
var selectedCall;
var selectedPointMarker;

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
    	let content = createMarkerInfo(results[index].formatted_address, index);
    	let marker = createMarker(locatingMap, results[index].geometry.location, content, MARKER_CUSTOMER);
		markers.push(marker);
    });
}

function createMarkerInfo(address, index) {
	let res = "";
	res += "<p>"+ address +"</p>";
	res += "<div class=\"text-center\">";
	res += "<button type=\"button\" class=\"btn btn-success\" onclick=\"findGrabCar(" + index + ")\">";
	res += "Lưu và bắt đầu tìm xe</button>";
	res += "</div>";

	return res;
}	

function findGrabCar(index) {
	//remove all markers except the choosen marker
	let marker = markers[index];
	setMapOnAllExcept(markers, null, index);
	markers = [];
	markers.push(marker);

	//set center of map to this point
	locatingMap.setCenter(marker.position);
	locatingMap.setZoom(16);
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
	locatingMap.addListener('click', function (event) {
		let latLng = event.latLng;
		if(typeof selectedPointMarker !== 'undefined') {
			selectedPointMarker.setMap(null);
		}
		geocoder.geocode({'location': latLng}, 
			function(results, status) {
			if (status === 'OK') {
				let point = results[0];
            	if (point) {
            		let content = createMarkerInfo(point.formatted_address, getMarkersLength());
            		let marker = createMarker(locatingMap, latLng, content, MARKER_CUSTOMER);
            		markers.push(marker);
            		selectedPointMarker = marker;
            	}
            }
		});
          

	})
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
			if(childSnapshot.val().Status === 0 || childSnapshot.val().Status === 1) {
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
					self.cars[i].key = childSnapshot.key;
					self.cars[i].value = childSnapshot.val();
					break;
				}
			}
		});

		callsRef.on('child_changed', function(childSnapshot, prevChildKey) {
			let i;
			for(i = 0; i<self.calls.length; i++) {
				if(self.calls[i].key.indexOf(childSnapshot.key) !== -1) {
					self.calls[i].key = childSnapshot.key;
					self.calls[i].value = childSnapshot.val();
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