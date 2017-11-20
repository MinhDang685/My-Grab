const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const GRABCAR = 'GrabCars';
const CALL_HISTORY = 'callHistory';
const radius = 2500; //radius in meters
var BreakException = {};
const cors = require('cors')({origin: true});

exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase & VSCode! ");
});

exports.getCustomerCallHistoryByPhoneNumber = functions.https.onRequest((request, response) => {
    let phoneNumber = request.query.phoneNumber;
    return admin.database().ref(CALL_HISTORY)
        .orderByChild('PhoneNumber').equalTo(phoneNumber)
        .once('value', function (snapshot) {
            let calls = snapshot.val();
            console.log(`Phone number: ${phoneNumber} have been call ${Object.keys(calls).length} time(s)`);
            response.status(200);
            response.json(calls);
            response.end();
        });
});

var rad = function (x) {
    return x * Math.PI / 180;
};

var getDistance = function (p1, p2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat - p1.lat);
    var dLong = rad(p2.lng - p1.lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d; // returns the distance in meter
};

exports.getGrabCarsNearThere = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let carRequestType = request.query.type;
        let center = {
            lat: request.query.lat,
            lng: request.query.lng,
        };
        let count = 0;
        let carsList = [];
        return admin.database().ref(GRABCAR).orderByChild('match').equalTo('').once('value')
            .then(snapshot => {
                try {
                    snapshot.forEach(car => {
                        let point = {
                            lat: car.val().latitude,
                            lng: car.val().longitude
                        };
                        if (getDistance(center, point) <= radius && car.val().type === carRequestType) {
                            if (count < 10) {
                                let carObject = {
                                    key: car.key,
                                    value: car.val(),
                                };
                                carsList.push(carObject);
                                count++;
                            } else {
                                throw BreakException;
                            }
                        }
                    });
                } catch (e) {
                    if (e !== BreakException) throw e;
                }
                console.log(`There are ${count} available cars near the point (${center.lat}, ${center.lng})`);
                response.status(200);
                response.json(carsList);
                response.end();
            });
    });
    
});

exports.resetGrabCarState = functions.database.ref(GRABCAR + "/{carID}")
    .onUpdate(event => {
        let car = event.data.val();
        if (car.match === "") {
            return true;
        }
        console.log(`Reset car ${car.carId}'s state after 120s`);
        setTimeout(() => {
            updateCarState(event.data.ref, car);
        }, 5000);
        return true;
});

var updateCarState = function(ref, car) {
    console.log('Start to reset');
    let updateDb = ref.update({
        match: "",
    }).then(function(){
        console.log(`GrabCar Id = ${car.carId} is available now`);
    });
    return Promise.all([updateDb]);
};

exports.requestCall = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let callId = request.query.key;
        let ref = admin.database().ref(CALL_HISTORY + `/${callId}`);
        return ref.once('value').then(snapshot => {
            if(snapshot.val().IsLocked === false) {
                ref.update({
                    IsLocked: true,
                }).then(function(result){
                    response.status(200).send('Accept').end();
                });
            }
            else {
                response.status(403).send('Reject').end();
            }
        });
    });
});