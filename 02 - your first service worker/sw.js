// Listen for the install event
self.addEventListener('install', function (event) {

	// Activate immediately
	self.skipWaiting();

	// Cache the offline.html page
	event.waitUntil(caches.open('app').then(function (cache) {
		cache.add(new Request('offline.html'));
		return cache;
	}));

});

// Listen for the activate event
self.addEventListener('activate', function (event) {
	// Do stuff...
});

// Listen for request events
self.addEventListener('fetch', function (event) {

	// Get the request
	let request = event.request;

	// Bug fix
	// https://stackoverflow.com/a/49719964
	if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;

	// HTML files
	if (request.headers.get('Accept').includes('text/html')) {
		event.respondWith(
			fetch(request).then(function (response) {
				return response;
			}).catch(function (error) {
				return caches.match('offline.html');
			})
		);
	}

});