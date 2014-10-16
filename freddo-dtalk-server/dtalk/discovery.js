var hub = require('./hub.js')
  , mdns = require('mdns');
  
var browser = mdns.createBrowser(mdns.tcp('http'));

var services = {};

var running = false;
exports.start = function(/*DTalkService*/ dtalk) {
	
	if (running) {
		return;
	}
	
	running = true;
	
	browser.on('serviceUp', function(service) {
		if (dtalk.__options.name !== service.name) {
			console.log('service up: ', service);
			if (service.name in services) {
				var s = services[service.name];
				if (s && s.host == service.host && s.port === service.port) {
					return;	
				}
			}
			
			services[service.name] = service;
			setTimeout(function() {
				var params = service.txtRecord || {};
				params['name'] = service.name;
				params['host'] = service.host;
				params['port'] = service.port;
				
				var event = {
					dtalk: '1.0',
					service: '$dtalk.service.Presence.onresolved',
					params: params
				}
				
				// Broadcast event
				console.log('broadcast', event);
				hub.emit(event.service, event);
			}, 0);
		}
	});
	
	browser.on('serviceDown', function(service) {
		if (dtalk.__options.name !== service.name) {
			console.log('service down: ', service);
			if (!(service.name in services)) {
				return;
			}
			
			delete services[service.name];
			setTimeout(function() {	
				var event = {
					dtalk: '1.0',
					service: '$dtalk.service.Presence.onremoved',
					params: service.name
				}
				
				// Broadcast event
				console.log('broadcast', event);
				hub.emit(event.service, event);
			}, 0);
		}
	});
	
	browser.start();
};

exports.stop = function() {
	
	if (!running) {
		return;
	}
	
	running = false;
	
	browser.removeAllListeners();
	
	browser.stop();
};

exports.services = services;
