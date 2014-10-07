var dtalk = require('../dtalk/dtalk-service.js')
  , api = require('./service-api.js')
  , gpio = require('rpi-gpio');
  
// Using MOD_RPI by default.

var name = 'dtalk.service.GPIO';
exports.name = name;

// Reads the value of a channel.
// channel: reference to the pin in the current mode's scheme.
exports.do_read = function(request) {
	var channel = request.params.channel;
	var cb = function() {
		gpio.read(channel, function(err, /*boolean*/value) {
			if (!err) {
				api.sendResponse(request, value);
			} else {
				api.sendErrorResponse(request, dtalk.kINTERNAL_ERROR, 'Error reading channel: ' + channel, err);	
			}
		});
	};
	gpio.setup(channel, gpio.DIR_IN, cb);
}

// Writes the value of a channel.
// channel: reference to the pin in the current mode's scheme.
// value: boolean value to specify whether the channel will turn on or off.
exports.do_write = function(request) {
	var channel = request.params.channel;
	var value = request.params.value === true;
	var cb = function() {
		gpio.write(channel, value, function(err) {
			if (!err) {
				api.sendResponse(request, true);
			} else {
				api.sendErrorResponse(request, dtalk.kINTERNAL_ERROR, 'Error reading channel: ' + channel, err);	
			}
		});
	}
	gpio.setup(channel, gpio.DIR_OUT, cb);
}

// Monitor the value of a channel.
// channel: reference to the pin in the current mode's scheme.
// event: custom event name suffix.
exports.do_monitor = function(request) {
	var channel = request.params.channel;
	var event = request.params.event; 
	gpio.on('change', function(_channel, /*boolean*/value) {
		if (channel === _channel) {
			api.fireEvent(name, event, value);
		}
	});
	gpio.setup(channel, gpio.DIR_IN);
}
