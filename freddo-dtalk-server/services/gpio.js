var dtalk = require('../dtalk/dtalk-service.js')
  , api = require('./service-api.js')
  , forAllAsync = require('forallasync').forAllAsync
  , gpio = require('rpi-gpio');
  
/*
try {
	console.log(rpiRevision());
	var gpio = require('rpi-gpio');
} catch(e) {
	var gpio = {
		setup: function(pin, dir, cb) {
			console.log('>>> gpio.open: ', pin, dir);
			!cb || setTimeout(function() { cb.call(gpio); }, 0);
		},
		read: function(pin, value, cb) {
			console.log('>>> gpio.write: ', pin, value);
			!cb || setTimeout(function() { cb.call(gpio, true); }, 0);	
		},
		write: function(pin, value, cb) {
			console.log('>>> gpio.write: ', pin, value);
			!cb || setTimeout(function() { cb.call(gpio); }, 0);
		},
	};
}

function rpiRevision() {
	var rev = fs.readFileSync("/proc/cpuinfo").toString().split("\n").filter(function(line) {
		return line.indexOf("Revision") == 0;
	})[0].split(":")[1].trim();
	
	rev = parseInt(rev, 16) < 3 ? 1 : 2; // http://elinux.org/RPi_HardwareHistory#Board_Revision_History
}
*/

// Using MOD_RPI by default.

var name = 'dtalk.service.GPIO';
exports.name = name;

exports.do_setup = function(request) {
	if (Array.isArray(request.params)) {
		var pins = request.params;
		
		var result = [];
		function onEach(complete, item, i) {
			gpio.setup(item.pin, item.dir, function(err) {
				result.push(!err);
				complete();
			});
		}
		
		var maxCallsAtOnce = pins.length;
		forAllAsync(pins, onEach, maxCallsAtOnce).then(function() {
			api.sendResponse(request, result);
		});
		
	} else {
		var item = request.params;
		gpio.setup(item.pin, item.dir, function(err) {
			api.sendResponse(request, !err);	
		});
	}
}
/*
exports.do_close = function(request) {
	var pins = request.params;

	if (Array.isArray(pins)) {
		
		var result = [];
		
		function onEach(complete, item, i) {
			gpio.close(item, function(err) {
				result.push(!err);
				complete();
			});
		}
		
		var maxCallsAtOnce = pins.length;
		forAllAsync(pins, onEach, maxCallsAtOnce).then(function() {
			api.sendResponse(request, result);
		});
		
	} else {
		
		var item = pins;
		gpio.close(item, function(err) {
			api.sendResponse(request, !err);	
		});
	}
}

exports.do_setDirection = function(request) {
	var pins = request.params;
	
	if (Array.isArray(pins)) {
		
		var result = [];
		function onEach(complete, item, i) {
			gpio.setDirection(item.pin, item.dir, function(err) {
				result.push(!err);
				complete();
			});
		}
		
		var maxCallsAtOnce = pins.length;
		forAllAsync(pins, onEach, maxCallsAtOnce).then(function() {
			api.sendResponse(request, result);
		});
		
	} else {
		
		var item = pins;
		gpio.setDirection(item.pin, item.dir, function(err) {
			api.sendResponse(request, !err);	
		});
	}
}

exports.do_getDirection = function(request) {
	var pins = request.params;

	if (Array.isArray(pins)) {
		
		var result = [];
		
		function onEach(complete, item, i) {
			gpio.getDirection(item, function(err, dir) {
				result.push(!err ? dir : 'error');
				complete();
			});
		}
		
		var maxCallsAtOnce = pins.length;
		forAllAsync(pins, onEach, maxCallsAtOnce).then(function() {
			api.sendResponse(request, result);
		});
		
	} else {
		
		var item = pins;
		gpio.getDirection(item, function(err, dir) {
			api.sendResponse(request, !err ? dir : 'error');	
		});
	}
}
*/
exports.do_read = function(request) {
	if (Array.isArray(request.params)) {
		var pins = request.params;
		
		var result = [];
		function onEach(complete, item, i) {
			gpio.read(item, function(err, /*boolean*/value) {
				result.push(!err ? value : -1);
				complete();
			});
		}
		
		var maxCallsAtOnce = pins.length;
		forAllAsync(pins, onEach, maxCallsAtOnce).then(function() {
			api.sendResponse(request, result);
		});
		
	} else {
		var item = request.params;
		gpio.read(item, function(err, /*boolean*/value) {
			api.sendResponse(request, !err ? value : -1);	
		});
		
	}
}

exports.do_write = function(request) {
	if (Array.isArray(request.params)) {
		var pins = request.params;
		
		var result = [];
		function onEach(complete, item, i) {
			gpio.write(item.pin, item.value, function(err) {
				result.push(!err ? value : -1);
				complete();
			});
		}
		
		var maxCallsAtOnce = pins.length;
		forAllAsync(pins, onEach, maxCallsAtOnce).then(function() {
			api.sendResponse(request, result);
		});
		
	} else {
		var item = request.params;
		gpio.write(item.pin, item.value, function(err, /*boolean*/value) {
			api.sendResponse(request, !err ? value : -1);	
		});
	}
}
