/*******************************************************************************
 * dtalk.js
 * 
 * Reference implementation of DTalk client, as specified by DTalk
 * specification.
 * 
 * Copyright 2013-2014 ArkaSoft LLC. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at http://www.apache.org/licenses/LICENSE-2.0 . Unless required
 * by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS
 * OF ANY KIND, either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 * 
 ******************************************************************************/

/*******************************************************************************
 * VERSION: 0.9.3
 * 
 *  - Added: DTalk.subscribe() & DTalk.unsubscribe()
 *  - WebPresence support added
 *  - Use always DTalk.connect(); by default this connects to the given 'ws' url
 *    parameter.
 * 
 ******************************************************************************/
(function() {
	window.DTalk = {

		/**
		 * Debug flag; set to 'false' in production environment.
		 */
		debug: true,

		_ws: null,
		_connect: function(url) {
			DTalk._ws = new WebSocket(url || DTalk.getURLParameter("ws"));
		},

		/** Connect to WebSocket url. */
		connect: function(url) {
			if (window.XDTalk) {
				try {
					DTalk.getReadyState = function() {
						return 1;
					};
					DTalk.send = function(message) {
						XDTalk.send(message);
					};
					DTalk.subscribe = function(topic, target) {
						DTalk._subscribeTo(topic, target);
					};
					DTalk.unsubscribe = function(topic, from) {
						DTalk._unsubscribeFrom(topic, from);
					};

					// call onopen
					setTimeout(function() {
						if (DTalk.onopen) {
							DTalk.onopen.apply(DTalk, arguments);
						}
						
						// fire 'dtalk.onopen' event.
						DTalk.publish("dtalk.onopen", {
							dtalk: "1.0",
							service: "dtalk.onopen"
						});
					}, 0);

				} catch (e) {
					console.log(e);
				}
			} else if (window.AndroidDTalk) {
				try {
					DTalk.getReadyState = function() {
						return 1;
					};
					DTalk.send = function(message) {
						AndroidDTalk.send(message);
					};
					DTalk.subscribe = function(topic, target) {
						AndroidDTalk.subscribe(topic);
						DTalk._subscribeTo(topic, target);
					};
					DTalk.unsubscribe = function(topic, from) {
						AndroidDTalk.unsubscribe(topic);
						DTalk._unsubscribeFrom(topic, from);
					};

					// call onopen
					setTimeout(function() {
						if (DTalk.onopen) {
							DTalk.onopen.apply(DTalk, arguments);
						}
						
						// fire 'dtalk. onopen' event.
						DTalk.publish("dtalk.onopen", {
							dtalk : "1.0",
							service : "dtalk.onopen"
						});
					}, 0);

				} catch (e) {
					console.log(e);
				}
			} else {
				if (!window.WebSocket) {
					// Workaround for Mozilla (Gecko).
					window.WebSocket = window.MozWebSocket;
				}
				if (window.WebSocket) {
					try {
						DTalk._connect(url);
						DTalk._ws.onopen = function() {
							if (DTalk.onopen) {
								DTalk.onopen.apply(DTalk, arguments);
							}
							
							// fire 'dtalk. onopen' event.
							DTalk.publish("dtalk.onopen", {
								dtalk : "1.0",
								service : "dtalk.onopen"
							});
						};
						DTalk._ws.onmessage = function(evt) {
							try {
								var msg = JSON.parse(evt.data);
								DTalk.publish(msg.service, msg);
							} catch (e) {
								console.log(e);
							}
						};
						DTalk._ws.onclose = function() {
							DTalk._ws = null;

							if (DTalk.onclose) {
								DTalk.onclose.apply(DTalk, arguments);
							}
						};
						DTalk._ws.onerror = function() {
							// TODO
						};
						DTalk.getReadyState = function() {
							return DTalk._ws.readyState;
						};
						DTalk.send = function(message) {
							try {
								DTalk._ws.send(message);
							} catch (e) {
								console.log(e);
							}
						};
						DTalk.subscribe = function(topic, target) {
							var subscribe = {
								dtalk : "1.0",
								service : "dtalk.Dispatcher",
								action : "subscribe",
								params : topic
							};
							DTalk.send(JSON.stringify(subscribe));

							// subscribe also to target...
							DTalk._subscribeTo(topic, target);
						};
						DTalk.unsubscribe = function(topic, target) {
							var unsubscribe = {
								dtalk : "1.0",
								service : "dtalk.Dispatcher",
								action : "unsubscribe",
								params : topic
							};
							DTalk.send(JSON.stringify(unsubscribe));

							// un-subscribe also from target...
							DTalk._unsubscribeFrom(topic, target);
						};
					} catch (e) {
						console.log(e);
					}
				} else {
					alert("Your browser seems to not support WebSocket !");
				}
			}
		},

		/**
		 * An event listener to be called when the WebSocket connection's
		 * readyState changes to OPEN; this indicates that the connection is
		 * ready to send and receive data. The event is a simple one with the
		 * name "open".
		 */
		onopen: null,

		/**
		 * An event listener to be called when the WebSocket connection's
		 * readyState changes to CLOSED. The listener receives a CloseEvent
		 * named "close".
		 */
		onclose: null,

		/**
		 * Return WebSocket connection state:
		 * 
		 * <pre>
		 *  0: The connection is not yet open.
		 *  1: The connection is open and ready to communicate.
		 *  2: The connection is in the process of closing.
		 *  3: The connection is closed or couldn't opened.
		 * </pre>
		 */
		getReadyState: function() {
			return 3;
		},

		/**
		 * Creates a Document Object Model (DOM) event of the specified type.
		 * <p>
		 * In the code the old fashioned way is used:
		 * https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Events/Creating_and_triggering_events
		 * <p>
		 * The reason for doing this is to support Internet Explorer as well.
		 * 
		 * @param type
		 *            A user-defined custom event type.
		 * @param data
		 *            Custom data.
		 */
		_createEvent: function(type, data) {

			// Create the event.
			var event = document.createEvent('Event');

			// Initializes a new event that the createEvent method created:
			// eventType: type, canBubble: false, cancelable: false.
			event.initEvent(type, false, false);

			if (data) {
				event['data'] = data;
			}

			return event;
		},

		/**
		 * Publish a message to a topic (used by android WebView).
		 * <p>
		 * NOTE: Android's WebView does not support the WebSocket.
		 */
		_publish: function(topic, data) {
			setTimeout(function() {
				try {
					// DTalk.publish(topic, JSON.parse(DTalk.decode(data)));
					DTalk.publish(topic, JSON.parse(data));
				} catch (e) {
					console.log(e);
				}
			}, 0);
		},

		/**
		 * Publish a JSON message, to a topic.
		 * <p>
		 * DOM event dispatching is used; this method allows the dispatch of
		 * events into the implementations event model. Events dispatched in
		 * this manner will have capturing and bubbling behavior disabled.
		 * <p>
		 * The target of the event is {@code window}.
		 */
		publish: function(topic, data) {
			try {
				window.dispatchEvent(DTalk._createEvent(topic, data));
			} catch (e) {
				console.log(e);
			}
		},

		/** Send text message. */
		send: function(message) {
			console.log("DTalk.send() is called before DTalk.connect().");
		},

		/**
		 * A convenience method to send a notification event that is internally
		 * stringify'd
		 */
		sendNotification: function(message) {
			DTalk.send(JSON.stringify(message));
		},

		/** Send request. */
		sendRequest : function(message, callback, timeout) {
			if (!message.id) {
				message.id = DTalk.createUniqueId(message.service);
			}

			var timerH, target = ('to' in message) ? message.to : null;

			var eventH = function(event) {
				try {
					if (timerH) {
						clearTimeout(timerH);
					}
					DTalk.removeEventListener(message.id, eventH, true, target);
					// callback.call(this, event.data);
					callback.call(this, event);
				} catch (e) {
					console.log(e);
				}
			};

			DTalk.addEventListener(message.id, eventH, true, target);

			timerH = setTimeout(function() {
				DTalk.removeEventListener(message.id, eventH, true, target);
				var event = DTalk._createEvent(message.id, {
					dtalk : "1.0",
					service : message.id,
					error : "timeout"
				});
				callback.call(this, event);
			}, timeout || 33333);

			DTalk.send(JSON.stringify(message));
		},

		/**
		 * Registers the specified DOM event listener.
		 * <p>
		 * If an event listener is added while it is processing an event, it
		 * will not be triggered by the current actions but may be triggered
		 * during a later stage of event flow.
		 * <p>
		 * If multiple identical event listeners are registered on the same
		 * EventTarget with the same parameters, the duplicate instances are
		 * discarded. They do not cause the EventListener to be called twice,
		 * and since the duplicates are discarded, they do not need to be
		 * removed manually with the removeEventListener method.
		 * 
		 * @param type
		 *            A string representing the event type to listen for. The a
		 *            valid XML Name:
		 *            http://www.w3.org/TR/1998/REC-xml-19980210#NT-Name
		 * 
		 * @param listener
		 *            The object that receives a notification when an event of
		 *            the specified type occurs. This must be an object
		 *            implementing the EventListener interface:
		 *            http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventListener,
		 *            or simply a JavaScript function.
		 * 
		 * @param register,
		 *            target (optional)
		 * 
		 * @see removeEventListener
		 */
		addEventListener : function(event, listener) {
			var register=false, target;

			try {
				window.addEventListener(event, listener, false);

				if (arguments.length >= 3 && (typeof arguments[2] === "boolean")) {
					register = arguments[2];
					if (arguments.length > 3) {
						target = arguments[3];
					}
				}

				if (register && (DTalk.getReadyState() === 1))
					DTalk.subscribe(event, target);

			} catch (e) {
				console.log(e);
			}
			
			return {
				remove: function() {
					DTalk.removeEventListener(event, listener, register, target);
				}
			};
		},

		/** Remove event listener. */
		removeEventListener: function(event, listener) {
			var unregister=false, target;

			try {
				window.removeEventListener(event, listener, false);

				if (arguments.length >= 3 && (typeof arguments[2] === "boolean")) {
					unregister = arguments[2];
					if (arguments.length > 3)
						target = arguments[3];
				}

				if (unregister && (DTalk.getReadyState() === 1))
					DTalk.unsubscribe(event, target);

			} catch (e) {
				console.log(e);
			}
		},

		// TODO documentation
		subscribe: function(topic, target) {
			console.log("First open a connection before sending a message !");
		},

		_subscribeTo: function(topic, target) {
			if (target) {
				var subscribe = {
					dtalk: "1.0",
					to: target,
					service: "dtalk.Dispatcher",
					action: "subscribe",
					params: topic
				};
				DTalk.send(JSON.stringify(subscribe));
			}
		},

		// TODO documentation
		unsubscribe: function(topic, target) {
			console.log("First open a connection before sending a message !");
		},

		_unsubscribeFrom: function(topic, target) {
			if (target) {
				var unsubscribe = {
					dtalk: "1.0",
					to: target,
					service: "dtalk.Dispatcher",
					action: "unsubscribe",
					params: topic
				};
				DTalk.send(JSON.stringify(unsubscribe));
			}
		},
		
		/** Register JS service. */
		registerService: function(service) {
			if (service && service.name) {
				return DTalk.addEventListener(service.name, function(e) {
					var e = e.data;
					if (e && e.action) {
						var action = e.action;
						switch(action) {
						case 'get':
							var getter = 'get_' + e.params;
							if (getter in service) {
								try {
									service[getter].call(service, e);
								} catch(e) {
									// TODO api.sendErrorResponse(e,  dtalk.kINTERNAL_ERROR, e);
								}
							} else {
								// TODO api.sendErrorResponse(e, dtalk.kINVALID_REQUEST, 'The property is not available');	
							}
							break;
						case 'set':
							var properties = e.params;
							for (var p in properties) {
								var setter = 'set_' + p;
								if (setter in service) {
									try {
										service[setter].call(service, properties[p]);
									} catch(e) {
										console.log(e);	
									}
								}
							}
							// NOTE: 'set' does not return errors
							break;
						default:
							var method = 'do_' + e.action;
							if (method in service) {
								try {
									service[method].call(service, e);
								} catch(e) {
									// TODO api.sendErrorResponse(e,  dtalk.kINTERNAL_ERROR, e);
								}
							} else {
								// TODO api.sendErrorResponse(e, dtalk.kACTION_NOT_FOUND, 'The action is not available');	
							}
							break;
						}
					}
				}, true);
			}
		},

		/** Base64 encoding. */
		encode: function(str) {
			return window.btoa(window.unescape(window.encodeURIComponent(str)));
		},

		/** Base64 decoding. */
		decode: function(str) {
			return window.decodeURIComponent(window.escape(window.atob(str)));
		},

		/** Create unique ID. */
		_uniqueId: null,
		createUniqueId : function(prefix) {
			if (!DTalk._uniqueId) {
				DTalk._uniqueId = (new Date()).getTime();
			}
			return (prefix || 'id') + (DTalk._uniqueId++);
		},

		/** Get URL parameter: 2 different implementations to test. */
		getURLParam: function(name) {
			name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
			var regexS = "[\\?&]" + name + "=([^&#]*)";
			var regex = new RegExp(regexS);
			var results = regex.exec(window.location.href);
			if (results == null)
				return "";
			else
				return decodeURIComponent(results[1]);
		},
		getURLParameter: function(name) {
			return decodeURIComponent(((new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)")).exec(location.search) || [ , "" ])[1].replace(/\+/g, "%20")) || null;
		}
	};
	
	// iOS reconnect event...
	DTalk.addEventListener("freddo.websocket.reconnect", function(event) {
		DTalk.connect("ws://localhost:" + parseInt(event.data.port) + "/dtalksrv");
	}, false);
	
})();