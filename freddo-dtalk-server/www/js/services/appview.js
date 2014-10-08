(function() {
	window.AppView = {
		name: 'dtalk.service.AppView',
		
		set_url: function(value) {
			var iframe = document.getElementById('appview');
			if (value && value !== 'about:blank') {
				iframe.setAttribute('src', value);
			} else {
				iframe.setAttribute('src', 'startpage.html');
			}
		}
	};
})();