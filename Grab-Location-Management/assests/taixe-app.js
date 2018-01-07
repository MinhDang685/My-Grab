var currentLocation = { lat: 10.7626737, lng: 106.6834609 };
var currentCarKey = "";
var isLogin = false;
const GRABCAR = "GrabCars";


$(function () {

    $('#login').show();
    $('#map').hide();

    var interval = setInterval(function(){
        if(currentCarKey !== "")
            updateCarLocation(currentCarKey,currentLocation.lat,currentLocation.lng);
    }, 5000);


    $('#Submit').on('click', function() {
        
        let path = GRABCAR;
        var ref = firebase.database().ref(path);

        var username = $('#username').val();
        var password = $('#password').val();

        ref.orderByChild("username").equalTo(username).limitToFirst(1).on("child_added", function(snapshot) {
            var obj = snapshot.val();
            console.log(obj);
            if(obj.password == password) {
                currentCarKey = snapshot.key;
                isLogin = true;

                toggleMap();
                toggleLogin();
                initMap();
            }
        });
    });

})

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

