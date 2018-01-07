var currentLocation = { lat: 10.7626737, lng: 106.6834609 };
var currentCarKey = "";
var currentCallMatched = "";
var currentCall;
var isLogin = false;

var isStart = false;

var directionsService;
var directionsDisplay;
var geocoder;


const GRABCAR = "GrabCars";
const CALL_HISTORY = "callHistory";


$(function () {

    //loop 5s
    var interval = setInterval(function(){
        if(currentCarKey !== "")
            updateCarLocation(currentCarKey,currentLocation.lat,currentLocation.lng);
    }, 5000);


    // login
    $('#login').show();
    $('#map').hide();
    $('#verifyBox').hide();
    $('#startRun').hide();

    $('#cancel').on('click', function() {
        cancel();
    });

    $('#accept').on('click', function() {
        toggleMessageBox();
        accept();
    });

    $('#startRun').on('click', function() {
        if(isStart == false) {
            isStart = true;
            $('#startRun').text("Finish");
        } else {
            $('#startRun').hide();

            let pathCar = GRABCAR +'/'+ currentCarKey;
            database.ref(pathCar).update({
                match: ""
            })

            let pathCall = CALL_HISTORY +'/' + currentCallMatched;
            database.ref(pathCall).update({
                Status: 4
            })

            //set done
            currentCall = null;
            // currentCallMatched = "";
            isStart = false;
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
        if(objChanged.match !== "" && objChanged.match !== currentCallMatched) {
            currentCallMatched = objChanged.match;
            
            getCallDetailByKey(currentCallMatched);
    
        }
    });

});

function cancel() {

    let path = GRABCAR +'/'+ currentCarKey;
    database.ref(path).update({
        match: ""
    })

    toggleMessageBox();
    currentCallMatched = "";
    currentCall = null;
}

function accept() {

    let path = CALL_HISTORY +'/' + currentCallMatched;
    database.ref(path).update({
        Status: 3
    })

    drawRoute(directionsService, directionsDisplay,geocoder);

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

