var hub = require('../dtalk/hub.js')
  , dtalk = require('../dtalk/dtalk-service.js');
  
function newResponse(request, result) {
	return {
		dtalk: "1.0",
		to: request.from,
		service: request.id,
		result: result,
	};
}

function newErrorResponse(request, code, message, data) {
	return {
		dtalk: "1.0",
		to: request.from,
		service: request.id,
		error: {
			code: code,
			message: message,
			data: data
		}
	};
}

function sendResponse(response) {
	if ('to' in response) {
		hub.emit('$dtalk.onOutgoingMsg', response);
	} else {
		hub.emit(response.service, response);
	}
}

exports.sendResponse = function(request, result) {
	console.log('>>> sendResponse for', request);
	
	if ('id' in request) {
		var response = newResponse(request, result);
		console.log('response: ', response);
		sendResponse(response);
	}
};

exports.sendErrorResponse = function(request, code, message, data) {
	console.log('>>> sendErrorResponse for', request);
	
	if ('id' in request) {
		var response = newErrorResponse(request,  code, message, data);
		console.log('Send error response: ', response);
		sendResponse(response);
	}
}

function createEvent(event, data) {
	return {
		dtalk: "1.0",
		service: event,
		params: data
	}
}

exports.fireEvent = function(/*String*/service, event, data) {
	event = '$' + service + '.' + event;
	hub.emit(event, createEvent(event, data));
}
