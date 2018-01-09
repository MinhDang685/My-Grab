$(function() {

});

var selectedCall;
var markers = [];
var managementMap;

function setSelected(ele) {
	var self = ele;
	if(typeof selectedCall !== 'undefined'){
		$(selectedCall).removeClass("active");
	}
	$(self).addClass("active");
	selectedCall = self;
	
	showOnMap(ele);
}

function showOnMap(callElement) {
	directionsDisplay.set('directions', null);
	setMapOnAll(markers, null);
	markers=[];
	let call = JSON.parse(callElement.getAttribute("data-call"));
	if(call.value.Status === DONE) {
		let url = `${api.getCarByCallId}?key=${call.key}`;
		$.ajax({
			    url: url,
			    dataType: 'json',
			    success: function(result) {
			    	if(result !== ""){
			    		drawDirectionForThisCar(result, call);
			    	}
			    },
			    type: 'GET'
			});

		// try {
		// 	vm.cars.forEach(function(car, index) {
		// 		let carMatch = car.value.match;
		// 		if(carMatch.indexOf(call.key) !== -1) {
		// 			drawDirectionForThisCar(car, call);
		// 			throw BreakException;
		// 		}
		// 	});
		// } catch (e) {
		// 	if (e !== BreakException) throw e;
		// }
	}
	else {
		
		geocoder.geocode({ 'address': call.value.Address }, function(results, status) {
		    if (status === 'OK') {
		        managementMap.setCenter(results[0].geometry.location);
		        var content = call.value.PhoneNumber + '<br/>' + call.value.Address;
				let marker = createMarker(managementMap, results[0].geometry.location, content, MARKER_CUSTOMER);
				markers.push(marker);
		    } else {
		        console.log('Geocode was not successful for the following reason: ' + status);
		    }
		});


	}

}

function geocodeAddress(geocoder, address, resultsMap) {
	geocoder.geocode({ 'address': address }, function(results, status) {
	    if (status === 'OK') {
	        resultsMap.setCenter(results[0].geometry.location);
	        var marker = new google.maps.Marker({
	            map: resultsMap,
	            position: results[0].geometry.location
	        });

	    } else {
	        console.log('Geocode was not successful for the following reason: ' + status);
	    }
	});
}

function drawDirectionForThisCar(car, call) {
	var start = new google.maps.LatLng(car.latitude, car.longitude);
	var end = call.value.Address;
    var request = {
        origin: start,
        destination: end,
        travelMode: 'DRIVING'
    };
    var service = new google.maps.places.PlacesService(managementMap);
    var destinationPlaceId;
    directionsService.route(request, function(result, status) {
        if (status == 'OK') {
            directionsDisplay.setDirections(result);
            destinationPlaceId = result.geocoded_waypoints[1].place_id;
            service.getDetails({
			    placeId: destinationPlaceId
			}, function (result, status) {
			    let marker = new google.maps.Marker({
			        map: managementMap,
			        place: {
			            placeId: destinationPlaceId,
			            location: result.geometry.location,
			        },
			        icon: icons[MARKER_CUSTOMER].icon
			    });
			    markers.push(marker);
			});
			var content = "Grab " + car.type + " " + car.carId;
			let marker = createMarker(managementMap, start, content, MARKER_GRABER);
			markers.push(marker);
        }
    });
    
	
}
var directionsService;
var directionsDisplay;
var geocoder;
function initMapManagementApp() {
    var hcmus = { lat: 10.7626737, lng: 106.6834609 };
    geocoder = new google.maps.Geocoder;
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;	
    directionsDisplay.suppressMarkers = false;
    managementMap = new google.maps.Map(document.getElementById('map-management-app'), {
        zoom: 10,
        center: cityCenter
    });
    directionsDisplay.setMap(managementMap);
	directionsDisplay.setOptions( { suppressMarkers: true } );

}

var vm = new Vue({
	el: '#management-app',
	data: {
		calls: [],
		cars: [],
	},
	mounted: function(){
		var self = this;
		callsRef.on('child_added', function(childSnapshot, prevChildKey) {
			if (childSnapshot.val().Status !== 4) {
			    self.calls.push({
			        key: childSnapshot.key,
			        value: childSnapshot.val(),
			    });
			}
		});

		callsRef.on('child_changed', function(childSnapshot, prevChildKey) {
			let i;
			for(i=0; i<self.calls.length; i++) {
				if(self.calls[i].key.indexOf(childSnapshot.key) !== -1) {
					self.calls[i].key = childSnapshot.key;
					self.calls[i].value = childSnapshot.val();
					if(self.calls[i].value.Status === COMPLETE){
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
					return "finding car";
				case NO_CAR:
					return "no-car";
				case DONE:
					return "done";
			};
			return "done";
		},

		getStatusName: function(status) {
			switch(status) {
				case UNLOCATED:
					return "Unlocated";
				case FINDING_CAR:
					return "Searching";
				case NO_CAR:
					return "No car";
				case DONE:
					return "Done";
			};
			return "Done";
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

		getDisplayAddress: function(inputAddress, address) {
			if(address !== "") {
				return address;
			}
			return inputAddress;
		},
	}
});

