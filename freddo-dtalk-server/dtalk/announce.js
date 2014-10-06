var hub = require('./hub.js')
  , mdns = require('mdns');

var ad = null;
exports.start = function(options, errorHandler) {
	if (ad != null) {
		return;
	}
	
	var txtRecord = {
		dtalk: '1',
		dtype: options.dtype
	};
	
	// Start the advertisement.
	ad = d = mdns.createAdvertisement(mdns.tcp('http'), options.port, {
		name: options.name,
		txtRecord: txtRecord
	});
	ad.on('error', errorHandler || function(error) {
		console.error(error);		
	});
	ad.start();
};

exports.stop = function() {
	if (ad == null) {
		return;
	}
	
	// Stop the advertisement.
	ad.stop();
	ad = null;
};
