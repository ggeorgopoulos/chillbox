var hub = require('./hub.js')
  , registry = require('./conn-registry.js')
  , dtalk = require('./dtalk-service.js')
  , WebSocket = require('ws');

/* Subscribers mapped by (sender + topic). */
var subscribers = {};

var _dtalk; 
exports.start = function(/*DTalkService*/dtalk) {
	if (_dtalk) {
		return;
	}
	_dtalk = dtalk;

	hub.on('$dtalk.onIncomingMsg', function(e) {	
		if (e.service === 'dtalk.Dispatcher') {
		
			if (e.action === 'subscribe') {
				handleSubscribe(e);	
			} else if (e.action === 'unsubscribe') {
				handleUnsubscribe(e);
			}
			
		} else {
			hub.emit(e.service, e);
		}
	});
	
	hub.on('$dtalk.onOutgoingMsg', function(e) {
		handleOutgoingMsg(e);
	});
	
	hub.on('$dtalk.onError', function(e) {
		console.error(JSON.stringify(e));		
	});
}

function handleSubscribe(e) {
	const from = e.from;
	var topic = e.params;
	if (topic) {
		topic = from + topic;
		console.log('handleSubscribe: ', topic);
		if (!(topic in subscribers)) {
			// create new
			var subscriber = function(e) {
				// DO NOT publish as '$dtalk.onOutgoingMsg',
				// its an event that has been already published.
				e['to'] = from;
				handleOutgoingMsg(e)
			};
			subscriber['__refCnt'] = 1;
			subscribers[topic] = subscriber;
			
			console.log('subscribe to', e.params);
			hub.on(e.params, subscriber);
		} else {
			// increace refCnt
			var subscriber = subscribers[topic];
			++subscriber.__refCnt;
		}
	}
}

function handleUnsubscribe(e) {
	var topic = e.params;
	if (topic) {
		topic = e.from + topic;
		console.log('handleUnsubscribe: ', topic);
		if (topic in subscribers) {
			// decrease refCnt
			var subscriber = subscribers[topic];
			if (--subscriber.__refCnt === 0) {
				delete subscribers[topic];
				hub.remove(e.params, subscriber);
			}
		}
	}
}

function handleOutgoingMsg(e) {
	var to = e.to;
	if (!to) return;
	
	// Get connection by name (recipient).
	var conn = registry.get(to);
	
	// TODO for WebSocket.CONNECTING state use a queue to cache
	// outgoing messages...
	if (conn && conn.readyState !== WebSocket.OPEN) {

		// Cleanup registry.
		registry.remove(to);
		
		// Immediate shuts down the connection.
		conn.terminate();
		delete conn;
	}
	
	if (!conn) {
		
		//
		// Create a new client WebSocket instance.
		//
		
		var serviceInfo = dtalk.getServiceInfo(to);
		if (!serviceInfo) {
			console.error('No service info for: ', to);
			return;
		}
		
		conn = new WebSocket(serviceInfo.addr);
		
		conn.on('open', function() {
			// Add to registry and initialize connection.
			registry.add(to, conn);
			initClientConnection(conn);
			
			// Send message.
			sendTo(conn, e);
		});
		
	} else {
		
		// Send message.
		sendTo(conn, e);
		
	}
}

function initClientConn(conn) {
	conn.on('message', function(e) {
		if (flags.binary) {
			broadcastError('[binary data]');
		} else {
			try {
				var dtalkMsg = JSON.parse(data);
				var from = dtalkMsg.from;
				
				if ('to' in dtalkMsg) {
					// We do NOT support message forwarding in 
					// client connections...
					delete dtalkMsg.to;
				}
				
				if (!from) {
					// Fix incomplete message.
					dtalkMsg['from'] = conn.__key;	
				}
				
				hub.emit('$dtalk.onIncomingMsg', dtalkMsg);
				
			} catch(e) {
				broadcastError(e + ': ' + data);
			}
		}
	});
	
	conn.on('close', function(e) {
		// Cleanup registry.
		registry.remove(to);
	});
		
	conn.on('error', function(e) {
		console.error(e);	
	});
}

function sendTo(conn, e) {
	
	// ensure 'from' is set...
	if (!('from' in e)) {
		e['from'] = _dtalk.__options.name;
	}
	
	try {
		
		conn.send(JSON.stringify(e), function(error) {
			// if error is null, the send has been complited,
			// otherwise the rror object will indicate what failed.
			console.error(error);
		});
		
	} catch(e) {

		// Immediate errors... 
		console.error(e);
		
	}
	
}

// XXX doublicate in dtalk-service.js
function broadcastError(data) {
	var dtalkMsg = {
		dtalk: '1.0',
		service: '$dtalk.onerror',
		params: data
	}
	hub.emit(dtalkMsg.service, dtalkMsg);
};