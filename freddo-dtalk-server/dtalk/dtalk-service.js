var EventEmitter = require('events').EventEmitter
 , WebSocketServer = require('ws').Server
 , http = require('http')
 , express = require('express')
 , dispatcher = require('./dispatcher.js')
 , discovery = require('./discovery.js')
 , announce = require('./announce.js')
 , registry = require('./conn-registry.js')
 , hub = require('./hub.js');

var DTalkService = function() {
	if (arguments.callee._singletonInstance) {
		return arguments.callee._singletonInstance;
	}
	arguments.callee._singletonInstance = this;
	EventEmitter.call(this);
}

DTalkService.prototype.__proto__ = EventEmitter.prototype;

DTalkService.prototype.kINVALID_JSON = -32700;
DTalkService.prototype.kINVALID_REQUEST = -32600;
DTalkService.prototype.kACTION_NOT_FOUND = -32601;
DTalkService.prototype.kINVALID_PARAMS = -32602;
DTalkService.prototype.kINTERNAL_ERROR = -32603;

DTalkService.prototype.start = function(options) {
	console.log("Starting DTalkService: ", JSON.stringify(options));
	
	self = this;
	self.__options = options;
	
	dispatcher.start(this);
	discovery.start(this);
	
	var app = express();
	app.use(express.static(options.www || __dirname + '/..'));
	
	var server = http.createServer(app);
	server.listen(options.port);
	
	console.log("http server listening on %d", options.port);
	
	var wss = new WebSocketServer({server: server, path: '/dtalksrv'});
	wss.on('connection', function(ws) {
		// Add to registry and initialize connection.
		registry._add(ws);
		self.initServerConn(ws);
			
		var id = setInterval(function() {
			ws.send(JSON.stringify(new Date()), function() {})
		}, 1000);
	});
	
	console.log('websocket server created');
	announce.start(options);
};

DTalkService.prototype.getServices = function() {
	return discovery.services;	
}

DTalkService.prototype.initServerConn = function(conn) {
	var self = this;

	conn.on('message', function(data, flags) {
			
		if (flags.binary) {
			broadcastError('[binary data]');
		} else {
			try {
				var dtalkMsg = JSON.parse(data);
				var from = dtalkMsg.from;
				var to = dtalkMsg.to;
				
				if (from && !registry.get(from)) {
					// Server connections are first
					// registered anonymous, re-register
					// with 'from'.
					registry.remove(conn.__key);
					registry.add(from, conn);	
				} else {
					// Fix incomplete message.
					dtalkMsg['from'] = conn.__key;	
				}
				
				if (to && to !== self.__options.name) {
					hub.emit('$dtalk.onOutgoingMsg', dtalkMsg);	
				} else {
					hub.emit('$dtalk.onIncomingMsg', dtalkMsg);
				}
			} catch(e) {
				broadcastError(e + ': ' + data);
			}
		}
	});
	
	conn.on('close', function() {
		console.log('Client #%s disconnected.', this.__key);
		
		// Cleanup registry.
		registry.remove(this.__key);
	});
	
	conn.on('error', function(e) {
		console.error('Client #%s error: %s', this.__key, e.message);
	});
}

function broadcastError(data) {
	var dtalkMsg = {
		dtalk: '1.0',
		service: '$dtalk.onerror',
		params: data
	}
	hub.emit(dtalkMsg.service, dtalkMsg);
};

module.exports = new DTalkService();
