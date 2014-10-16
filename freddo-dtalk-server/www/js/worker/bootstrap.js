importScripts('window.js');
importScripts('../dtalk.js');

// XXX Workaround for DTalk.publish.
DTalk.publish = function(topic, data) {
	dispatchEvent({
		type: topic,
		data: data
	});
};

// --------------------------------------------------------------------------

var __timeoutH;

DTalk.connect();
DTalk.onopen = function() {
	postMessage({
		status: 'ready'		
	});
}

DTalk.onclose = function() {
	disconnected();	
}

DTalk.onerror = function(e) {
	disconnected();	
}

function disconnected() {
	if (__timeoutH) {
		clearTimeout(__timeoutH);
		delete __timeoutH;
	}
	
	__timeoutH = setTimeout(function() {
		DTalk.connect();
	}, 3333);
}

// -------------------------------------------------------------------------
// Global API
// -------------------------------------------------------------------------

const HIGH = true
    , LOW = false
    , INPUT = 'in'
    , OUTPUT = 'out';
    
// Digital I/O

const GPIO = 'dtalk.service.GPIO';

/**
 * Configures the specified pin to behave either as an input or an output.
 */
function pinMode(pin, mode, cb) {
	DTalk.doAction(GPIO, 'setup', {
		pin: pin,
		dir: mode
	}, cb);	
}

/**
 * Reads the value from a specified digital pin, either HIGH or LOW. 
 */
function digitalRead(pin, cb) {
	DTalk.doAction(GPIO, 'read', pin, cb);
}

/**
 * Write a HIGH or a LOW value to a digital pin.
 */
function digitalWrite(pin, value, cb) {
	DTalk.doAction(GPIO, 'write', {
		pin: pin,
		value: value
	}, cb);
}

//--------------------------------------------------------------------------
onmessage = function(event) {
	
	try {
		eval(event.data);
	} catch(e) {
		console.log(e);
	}
	
};