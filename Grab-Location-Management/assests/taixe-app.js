var currentLocation = { lat: 10.7626737, lng: 106.6834609 };
var currentCarKey = "";
var currentCallMatched = "";
var currentCall;
var isLogin = false;
var isProcess = false;
var isStart = false;

var currentCarObject = {request: ""};
var locker = false;

var directionsService;
var directionsDisplay;
var geocoder;
var desMaker;

var  desIcon = {
        icon: './assests/icon/marker-dest.png'
    }

const GRABCAR = "GrabCars";
const CALL_HISTORY = "callHistory";


$(function () {

    // login
    $('#login').show();
    $('#map').hide();
    $('#verifyBox').hide();
    $('#startRun').hide();

    $('#cancel').on('click', function() {
        isProcess = true;
        cancel();
    });

    $('#accept').on('click', function() {
        isProcess = true;
        accept();
        let pathCall = CALL_HISTORY +'/'+ currentCallMatched;
            database.ref(pathCall).update({
                Status: 3
            })
    });

    $('#startRun').on('click', function() {
        if(isStart === false) {
            isStart = true;
            $('#startRun').text("Finish");

            let pathCall = CALL_HISTORY +'/'+ currentCallMatched;
            database.ref(pathCall).update({
                Status: 4
            })

        } else {

            $('#startRun').text("Start");
            $('#startRun').hide();

            let pathCar = GRABCAR +'/'+ currentCarKey;
            database.ref(pathCar).update({
                match: ""
            })

            let pathCall = CALL_HISTORY +'/'+ currentCallMatched;
            database.ref(pathCall).update({
                Status: 5
            })

            //set done
            currentCall = null;
            currentCallMatched = "";
            isStart = false;
            $('#verifyBox').hide();
        }
    });

    $('#Submit').on('click', function() {
        
        let path = GRABCAR;
        var ref = firebase.database().ref(path);

        var username = $('#username').val();
        var password = $('#password').val();

        ref.orderByChild("username").equalTo(username).limitToFirst(1).on("child_added", function(snapshot) {
            var obj = snapshot.val();
            
            if(obj.password == password) {
                currentCarKey = snapshot.key;
                isLogin = true;

                toggleMap();
                toggleLogin();
                initMap();

                
            } else {
                $('#errorMessage').text("Username or Password not match");
            }
        });
    });

    listenCarRequest();

});

function listenCarRequest() {
    let pathListen = GRABCAR+'/'+ currentCarKey; //'-L2LelMWdY__wr5o1_VK';//
    var refListen = firebase.database().ref(pathListen);

    refListen.on('child_changed',function(data){
        var objChanged = data.val();
        // console.log("change");
        if(objChanged.request !== "" && objChanged.request !== "ok" && objChanged.request !== "reject" && objChanged.request !== currentCallMatched && isLogin && data.key === currentCarKey ) {
            currentCallMatched = objChanged.request;
            getCallDetailByKey(currentCallMatched);
        }

    }); 
}

function cancel() {

    let path = GRABCAR +'/'+ currentCarKey;
    database.ref(path).update({
        request: "reject"
    })

    currentCarObject.request = "reject";

    // toggleMessageBox();
    $('#verifyBox').hide();
    $('#verifyBox').hide();
    currentCallMatched = "";
    currentCall = null;
}

function accept() {

    let path = GRABCAR +'/'+ currentCarKey;
    database.ref(path).update({
        request: "ok"
    })
    currentCarObject.request = "ok";

    drawRoute(directionsService, directionsDisplay,geocoder);
    drawDesMaker(geocoder);

    $('#verifyBox').hide();
    $('#verifyBox').hide();
    $('#startRun').show();
}

function drawRoute(directionsService, directionsDisplay, geocoder) {

    var start;

    geocoder.geocode({'location': currentLocation}, function (results,status) {

        if (status === 'OK') {
            start = results[0].formatted_address;

            directionsService.route({
                origin: start,
                destination: currentCall.Address,
                travelMode: 'DRIVING'
                }, function(response, status) {
                  if (status === 'OK') {
                    directionsDisplay.setDirections(response);
                  } else {
                    window.alert('Directions request failed due to ' + status);
                  }
            });
        }

    });

}

function drawDesMaker(geocoder) {

    geocoder.geocode( { 'address': currentCall.Address}, function(results, status) {

    if (status == google.maps.GeocoderStatus.OK) {
        var latitude = results[0].geometry.location.lat();
        var longitude = results[0].geometry.location.lng();
        desLocation = { lat: latitude, lng: longitude};
        desMaker.setPosition(desLocation);
        } 
    }); 

}

function getCallDetailByKey(key) {
    let pathCallHistory = CALL_HISTORY+'/'+currentCallMatched;
    var refCallHistory = firebase.database().ref(pathCallHistory);

    refCallHistory.on('value', function(data) {
        var result = data.val();
        currentCall = result;
        if(currentCall.Status !== 3) {
            $('#verifyBox').show();
            $('#addressInfo').text(result.Address);
            countDown();
        }

    });
}

function countDown() {

        var time = 5;

        var interval = setInterval(function () {

            if(time >= 0){
                $('#timeRemain').text(time);
                time--;
            }

            if($('#timeRemain').text() === '0'){
                // clearInterval(interval);

                // cancel();

                if(isProcess === false){
                    let path = GRABCAR +'/'+ currentCarKey;
                    database.ref(path).update({
                        request: "reject"
                    })
                }
                
                // toggleMessageBox();
                $('#verifyBox').hide();
                $('#verifyBox').hide();
                currentCallMatched = "";
                currentCall = null;

                $('#timeRemain').text('5');
                isProcess = true;
            }

            // if(isProcess === true) {
            //     // clearInterval(interval);
            // }
        },1000);
}


function toggleMessageBox() {
    $('#verifyBox').toggle();
}

function toggleMap() {
    $('#map').toggle();
}

function toggleLogin() {
    $('#login').toggle();
}

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: currentLocation
    });

    geocoder = new google.maps.Geocoder;
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer; 
    directionsDisplay.suppressMarkers = false;
    var marker = new google.maps.Marker({
          position: currentLocation,
          map: map
        });

    desMaker = new google.maps.Marker({
        map:map,
        icon:desIcon.icon
    });


    google.maps.event.addListener(map, "click", function (e) {

        currentLocation = { lat: e.latLng.lat(), lng: e.latLng.lng()};
        if(currentCarKey !== "")
            updateCarLocation(currentCarKey,currentLocation.lat,currentLocation.lng);
            marker.setPosition(currentLocation);
    });

    directionsDisplay.setMap(map);
    directionsDisplay.setOptions( { suppressMarkers: true } );
}

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
var grabCarsRef = database.ref(GRABCAR);


function updateCarLocation(carKey, lat, lng) {
    let path = GRABCAR +'/'+ carKey;
    database.ref(path).update({
        latitude: lat,
        longitude: lng
    })
}

