$("#buttonLoadMap").click(function(){
	isKeyExist('', GRABCAR).then(function(res){
		if(res === true) {
			database.ref().child(GRABCAR).set(null, function(result){
				initializeMap();
			});
		}
		else {
			initializeMap();
		}
	});
});

