// Listen for request events
self.addEventListener('fetch', function (event) {

	// Get the request
	let request = event.request;

	// Bug fix
	// https://stackoverflow.com/a/49719964
	if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;

	// Check the cache first
	// If it's not found, send the request to the network
	event.respondWith(
		caches.match(request).then(function (response) {
			return response || fetch(request).then(function (response) {
				return response;
			});
		})
	);

});