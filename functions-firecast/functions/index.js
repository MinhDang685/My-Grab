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
            if(calls !== null) {
                console.log(`Phone number: ${phoneNumber} have been call ${Object.keys(calls).length} time(s)`);
                response.status(200);
                response.json(calls);
                response.end();
            }
            else {
                console.log(`This phone number ${phoneNumber} does not have call history`);
                response.status(200);
                response.send("");
                response.end();
            }
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
                        let distance = getDistance(center, point);
                        if (distance <= radius && car.val().type === carRequestType) {
                            if (count < 10) {
                                let carObject = {
                                    key: car.key,
                                    distance: distance,
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
                response.json(carsList.sort(sortByDistance));
                response.end();
            });
    });
    
});

var sortByDistance = function(a, b) {
    return a.distance > b.distance;
}

exports.resetGrabCarState = functions.database.ref(GRABCAR + "/{carID}/match")
    .onUpdate(event => {
        if (event.data.val() === "") {
            return;
        }
        let car = event.data.adminRef.parent().val();
        console.log(`Reset car ${car.carId}'s state after 120s`);
        setTimeout(() => {
            setCarState(event.data.ref, car);
        }, 30000);
        return;
});

var setCarState = function(carRef, car) {
    //set call state = complete
    let callRef = admin.database().ref(CALL_HISTORY + `/${car.match}`);
    let updateCallDb = callRef.update({
        Status: 4,
    }).then(function(){
        console.log(`Call Id = ${car.match} is complete now`);
    });
    //reset grab car state
    let updateCarDb = carRef.update({
        match: "",
    }).then(function(){
        console.log(`GrabCar Id = ${car.carId} is available now`);
    });
    
    return Promise.all([updateCarDb, updateCallDb]);
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

exports.getCarByCallId = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let callId = request.query.key;
        let ref = admin.database().ref(GRABCAR);
        return ref.once('value').then(snapshot => {
            snapshot.forEach(function(car, index){
                if(car.val().match === callId) {
                    response.status(200).json(car).end();
                }
            });
            response.status(200).json("").end();
        });
    });
});

exports.getCarByUsername = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let username = request.query.username;
        let ref = admin.database().ref(GRABCAR);
        return ref.once('value').then(snapshot => {
            snapshot.forEach(function(car, index){
                if(car.val().username === username) {
                    response.status(200).json(car).end();
                }
            });
            response.status(200).json("").end();
        });
    });
});

exports.getCarById = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let key = request.query.id;
        let ref = admin.database().ref(GRABCAR + `/${key}`);
        return ref.once('value').then(snapshot => {
            response.status(200).json(snapshot).end();
        });
        response.status(200).json("").end();
    });
});

exports.getCallById = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let callId = request.query.id;
        let ref = admin.database().ref(CALL_HISTORY + `/${callId}`);
        return ref.once('value').then(snapshot => {
            response.status(200).json(snapshot).end();
        });
        response.status(200).json("").end();
    });
});

exports.setCarInfo = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let carId = request.body.carId;
        let carInfo = request.body.carInfo;
        let carsRef = admin.database().ref(GRABCAR);
        let updatedCar = {
            [carId] : carInfo
        };
        console.log(updatedCar);
        return carsRef.update({
            [carId] : carInfo
        }).then(function(){
            console.log(`Car Id = ${carId} has been updated`);
            response.status(200).json("success").end();
        });
        response.status(404).end();
    });
});

exports.sendRequestToCar = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let carId = request.query.carId;
        let callId = request.query.callId;
        let carInfo = {
            request: callId,
        };
        let carRef = admin.database().ref(GRABCAR + `/${carId}`);
        return carRef.update({
            request: callId
        }).then(function(){
            console.log(`Car Id = ${carId} has been request for call Id = ${callId}`);
            response.status(200).json("success").end();
        });
        response.status(404).end();
    });
});