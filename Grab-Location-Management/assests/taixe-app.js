var currentLocation = { lat: 10.7626737, lng: 106.6834609 };
var currentCarKey = "";
var currentCallMatched = "";
var currentCall;
var isLogin = false;
var isProcess = false;
var isStart = false;

var directionsService;
var directionsDisplay;
var geocoder;


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
    });

    $('#startRun').on('click', function() {
        if(isStart === false) {
            isStart = true;
            $('#startRun').text("Finish");
        } else {

            $('#startRun').text("Start");
            $('#startRun').hide();

            let pathCar = GRABCAR +'/'+ currentCarKey;
            database.ref(pathCar).update({
                request: ""
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

    //listen call assigned
    let pathListen = GRABCAR+'/'+currentCarKey;
    var refListen = firebase.database().ref(pathListen);

    refListen.on('child_changed',function(data){
        var objChanged = data.val();
        if(objChanged.request !== "" && objChanged.request !== "ok" && objChanged.request !== "reject" && objChanged.request !== currentCallMatched) {
            currentCallMatched = objChanged.request;
            
            getCallDetailByKey(currentCallMatched);
    
        }
    });

});

function cancel() {

    let path = GRABCAR +'/'+ currentCarKey;
    database.ref(path).update({
        request: "reject"
    })

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

    drawRoute(directionsService, directionsDisplay,geocoder);
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

function getCallDetailByKey(key) {
    let pathCallHistory = CALL_HISTORY+'/'+currentCallMatched;
    var refCallHistory = firebase.database().ref(pathCallHistory);

    refCallHistory.on('value', function(data) {
        var result = data.val();
        currentCall = result;

        toggleMessageBox();
        $('#addressInfo').text(result.Address);

        var time = 5;

        var interval = setInterval(function () {
            $('#timeRemain').text(time);
            time--;

            if($('#timeRemain').text() === '0'){
                clearInterval(interval);
                cancel();
                isProcess = true;
            }

            if(isProcess === true) {
                clearInterval(interval);
            }
        },1000);

    });
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

    google.maps.event.addListener(map, "click", function (e) {

        currentLocation = { lat: e.latLng.lat(), lng: e.latLng.lng()};
        if(currentCarKey !== "")
            updateCarLocation(currentCarKey,currentLocation.lat,currentLocation.lng);

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

