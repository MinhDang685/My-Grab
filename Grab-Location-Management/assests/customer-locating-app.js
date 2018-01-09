var directionsService;
var directionsDisplay;
var geocoder;
var markers = [];
var infowindows = [];
var locatingMap;
var selectedCallDiv;
var selectedCall;
var selectedPointMarker;
var clickListener = null;
var selectedCarDiv;
var requestedCall = {key: ''};
var procededAddress = "";

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
	//show only first result
	/*results.forEach(function (point, index) {
    	let content = createCustomerMarkerInfo(results[index], index);
    	let marker = createMarker(locatingMap, results[index].geometry.location, content, MARKER_CUSTOMER);
    	marker.infowindow.open(locatingMap, marker);
		markers.push(marker);
    });*/
 	if(results.length === 0){
 		alert("Không tìm thấy địa điểm");
 	}
    let content = createCustomerMarkerInfo(results[0], 0);
	let marker = createMarker(locatingMap, results[0].geometry.location, content, MARKER_CUSTOMER);
	marker.infowindow.open(locatingMap, marker);
	markers.push(marker);
    locatingMap.setCenter(results[0].geometry.location);
}

function setCenterToThisPoint(ele) {
	let car = JSON.parse(ele.getAttribute("data-car"));
	var self = ele;
	if(typeof selectedCarDiv !== 'undefined'){
		$(selectedCarDiv).removeClass("active");
	}
	$(self).addClass("active");
	selectedCarDiv = self;
	let point = new google.maps.LatLng(car.value.latitude, car.value.longitude);
	locatingMap.setCenter(point);
	selectedInfoWindow.close();
	selectedInfoWindow = markers[car.index].infowindow;
	markers[car.index].infowindow.open(locatingMap, markers[car.index]);
}

function createCustomerMarkerInfo(point, index) {
	procededAddress = point.formatted_address;
	let res = "";
	res += "<p>"+ point.formatted_address +"</p>";
	res += "<div class=\"text-center div-find-car\">";
	res += "<button type=\"button\" class=\"btn btn-success\" onclick=\"";
	res += "findGrabCar(" + index + "," + point.geometry.location.lat() + "," + point.geometry.location.lng() + ")\">";
	res += "Lưu và bắt đầu tìm xe</button>";
	res += "</div>";

	return res;
}	

function createCustomerMarkerInfoNoCar() {
	res = "";
	res += "Không có xe nào gần đây <br>";
	res += "<button type=\"button\" class=\"btn btn-success\" onclick=\"";
	res += "setNoCar()\">";
	res += "Cập nhật trạng thái không có xe</button>";
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
	locatingMap.setZoom(15);
	showAvailableCars(locatingMap, marker.position);

	//update call address
	updateCallAddress();
}

function showAvailableCars(map, center) {
	removeClickListener();
	let i,j;
	let count = 0;
	infowindows = [];
	vm.cars = [];

	let url = `${api.getGrabCarsNearThere}`;
	url += `?lat=${center.lat()}&lng=${center.lng()}&type=${vm.getCallCarType(selectedCall.value.Type)}`;

	$.ajax({
	    url: url,
	    dataType: 'json',
	    success: function(result) {
	        result.forEach(function(car, index) {
	            let latLng = new google.maps.LatLng(car.value.latitude, car.value.longitude);
	            let marker = createMarker(map, latLng, createGrabCarInfo(car), MARKER_GRABER);
	            car.index = markers.length;
	            markers.push(marker);
	            vm.cars.push(car);
	        });
	        count = result.length;
	        console.log(`Get cars list success: ${count} cars available`);
			if(count === 0) {
				$(".div-find-car").html(createCustomerMarkerInfoNoCar());
			}else {
				let availableCarsInfo = "Có " + count + " xe đang rảnh";
				$(".div-find-car").html(availableCarsInfo);
			}

	    },
	    type: 'GET'
	});

	
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
	res += "<div class=\"text-center\" id=\""+ car.key + "\">";
	res += "<button type=\"button\" class=\"btn btn-success\" onclick=\"";
	res += "sendRequestToCar(" + "'" + selectedCall.key + "'" + ',' + "'" + car.key + "'" + ")\" style=\"width: 80%;\">Gửi yêu cầu</button>";
	res += "</div>";
	return res;
}

function sendRequestToCar(callId, carId){
	let requestState;
	let carInfo;
	$.ajax({
	    url: `${api.sendRequestToCar}?carId=${carId}&callId=${callId}`,
	    dataType: 'json',
	    success: function(data) {
	        if(data === '') {}
	        else {
	        	//chờ phản hồi
	        	setTimeout(function(){
	        		getCarField(carId).then(function(data){
	        			carInfo = data;
	        			requestState = carInfo.request;
			        	if(requestState === 'ok') {
			        		//đặt xe thành công
			        		mapCarToCustomer(carId, carInfo);	
			        	}
			        	else if(requestState === 'reject'){
			        		alert(`Xe ${carInfo.carId} từ chối`);
			        	}
			        	else {
			        		alert(`Xe ${carInfo.carId} không phản hồi`);
			        	}
			        	setCarField(carId, carInfo, 'request', '');
	        		});
		        	
	        	}, 5000);
	        	
	        	
	        }
	    },
	    type: 'GET'
	});
}

function getCarField(carId, field) {
	return $.ajax({
	    url: `${api.getCarById}?id=${carId}`,
	    dataType: 'json',
	    success: function(data) {
	        if(data === '') {}
	        else {
	        	if(typeof field !== 'undefined')
	        		return data.field;
	        	return data;
	        }
	    },
	    type: 'GET'
	});
}

function setCarField(carId, carInfo, field, value){
	carInfo[field] = value;
	$.ajax({
	    url: `${api.setCarInfo}`,
	    dataType: 'json',
	    data: {
	    	carId,
	    	carInfo
	    },
	    success: function(data) {
	        if(data === 'success') {
	        	
	        }
	    },
	    type: 'POST'
	});
}

function mapCarToCustomer(carKey, carInfo) {
	let carPath = GRABCAR + "/" + carKey;
	let carRef = database.ref(carPath);
	carRef.update({
		match: selectedCall.key,
		request: ''
	});
	let callPath = CALL_HISTORY + "/" + selectedCall.key;
	let callRef = database.ref(callPath);
	callRef.update({
		Status: DONE,
	});
	var car = carInfo;
	// $.ajax({
	//     url: `${api.getCarById}?id=${carKey}`,
	//     dataType: 'json',
	//     success: function(data) {
	//         if(data === '') {}
	//         else {
	//         	car = data;
	//         }
	//     },
	//     type: 'GET'
	// });

	removeClickListener();
	alert(`Đặt xe thành công:
		\n${selectedCall.value.PhoneNumber}
		\nXe: ${car.carId} - Tài xế: ${car.username}`);
	$("#button-reset-customer-address").click();
}

function updateCallAddress() {
	let callPath = CALL_HISTORY + "/" + selectedCall.key;
	let callRef = database.ref(callPath);
	callRef.update({
		Address: procededAddress
	});
}

function setNoCar() {
	let callPath = CALL_HISTORY + "/" + selectedCall.key;
	let callRef = database.ref(callPath);
	callRef.update({
		Status: NO_CAR,
	});
	removeClickListener();
	$("#button-reset-customer-address").click();1
}

function setSelected(ele) {
	resetCustomerAddress();
	vm.cars = [];
	if(clickListener !== null) {
		removeClickListener();
	}
	let call = JSON.parse(ele.getAttribute("data-call"));
	requestedCall = call;
	if(!requestCall(call.key)) {
		alert('Cuộc gọi đã được thành viên khác tiếp nhận');
		return;
	}
	else {
		alert('Nhận cuộc gọi thành công');
	}
	var self = ele;
	if(typeof selectedCallDiv !== 'undefined'){
		$(selectedCallDiv).removeClass("active");
	}
	$(self).addClass("active");
	selectedCallDiv = self;
	
	selectedCall = call;

	if (selectedCall.value.Status === FINDING_CAR) {
		searchGeocode(selectedCall.value.Address);
	}
	else {
		$('#input-address').val(call.value.InputAddress);
		//enable click listener for marker
		addClickListener();
	}
}

function requestCall(key) {
	let url = `${api.requestCall}?key=${key}`;
	return $.ajax({
	    url: url,
	    dataType: 'json',
	    success: function(data) {
	        if(data === 'Reject') {
	        	return false;
	        }
	        else {
	        	return true;
	        }
	    },
	    type: 'GET'
	});
}

function resetCustomerAddress() {
	$('#input-address').val("");
	setMapOnAll(markers, null);
	markers=[];
	vm.cars = [];
	if(clickListener === null) {
		addClickListener();
	}
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
            		// let content = createCustomerMarkerInfo(point, getMarkersLength());
            		// let marker = createMarker(locatingMap, latLng, content, MARKER_CUSTOMER);
            		// markers.push(marker);
            		// selectedPointMarker = marker;
            		createPointMarker(point);
            	}
            }
		});
	});
}

function createPointMarker(point) {
	let content = createCustomerMarkerInfo(point, getMarkersLength());
	let marker = createMarker(locatingMap, point.geometry.location, content, MARKER_CUSTOMER);
	marker.infowindow.open(locatingMap, marker);
	markers.push(marker);
	selectedPointMarker = marker;

}

function removeClickListener() {
	google.maps.event.removeListener(clickListener);
	clickListener = null;
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
			if((childSnapshot.val().Status === UNLOCATED || childSnapshot.val().Status === FINDING_CAR) 
				&& childSnapshot.val().IsLocked === false ) {
				self.calls.push({
					key: childSnapshot.key,
					value: childSnapshot.val(),
				});
			}
		});

		callsRef.on('child_changed', function(childSnapshot, prevChildKey) {
			let i;
			for(i = 0; i<self.calls.length; i++) {
				if(self.calls[i].key.indexOf(childSnapshot.key) !== -1) {
					self.calls[i].value = childSnapshot.val();
					if(self.calls[i].value.Status === NO_CAR || self.calls[i].value.Status === DONE 
						|| (self.calls[i].value.IsLocked === true && self.calls[i].key !== requestedCall.key)) {
						self.calls.splice(i, 1);
					}
					break;
				}
			}
		});

		// grabCarsRef.on('child_added', function(childSnapshot, prevChildKey) {
		// 	if(childSnapshot.val().match === "") {
		// 		self.cars.push({
		// 			key: childSnapshot.key,
		// 			value: childSnapshot.val(),
		// 		});
		// 	}
		// });
		// grabCarsRef.on('child_changed', function(childSnapshot, prevChildKey) {
		// 	let i;
		// 	for(i = 0; i<self.cars.length; i++) {
		// 		if(self.cars[i].key.indexOf(childSnapshot.key) !== -1) {
		// 			self.cars[i].value = childSnapshot.val();
		// 			if(self.cars[i].value.match !== "") {
		// 				self.cars.splice(i, 1);
		// 			}
		// 			break;
		// 		}
		// 	}
		// });
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

		getDisplayAddress: function(inputAddress, address) {
			if(address !== "") {
				return address;
			}
			return inputAddress;
		},
	}
});