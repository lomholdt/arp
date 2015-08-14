chrome.runtime.onMessage.addListener(function (message) {
	if (message.name == 'location_replace') {
		window.location.replace(message.data)
	}
})
if (document.URL.indexOf('blank.html') > -1)
	window.history.back();