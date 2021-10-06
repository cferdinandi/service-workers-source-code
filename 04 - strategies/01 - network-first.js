// Listen for request events
self.addEventListener('fetch', function (event) {

	// Get the request
	let request = event.request;

	// Bug fix
	// https://stackoverflow.com/a/49719964
	if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;

	// Send the request to the network first
	// If it's not found, look in the cache
	event.respondWith(
		fetch(request).then(function (response) {
			return response;
		}).catch(function (error) {
			return caches.match(request).then(function (response) {
				return response;
			});
		})
	);

});