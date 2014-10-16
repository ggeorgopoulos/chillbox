(function() {

	// Inside the worker, the keywords "self" and "this" 
	// are the same thing and both are the equivalent 
	// to the global WorkerGlobalScope 
	self.window = self;

	window.console = {
		log: function(message) {
			postMessage('' + message);	
		}
	};
	
	window.__listeners = {};
	
	window.addEventListener = function(event, listener) {
		var arr = window.__listeners[event];
		if (!arr) {
			arr = [];
		}
		arr.push(listener);
		window.__listeners[event] = arr;
	};
	
	window.removeEventListener = function(event, listener) {
		var arr = window.__listeners[event];
		if (arr) {
			var index = arr.indexOf(listener);
			if (index > -1) {
				arr.splice(index, 1);
    			}
		}
	};
	
	window.dispatchEvent = function(e) {
		var arr = window.__listeners[e.type];
		if (arr) {
			for(var i = 0, n = arr.length; i < n; i++) {
				try {
					arr[i].call(window, e);
				} catch(err) {
				}
			}
		}
	};

})();