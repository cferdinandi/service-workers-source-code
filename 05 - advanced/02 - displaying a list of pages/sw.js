let coreAssets = [
	'/offline.html'
];

// On install, activate immediately
self.addEventListener('install', function (event) {

	// Activate immediately
	self.skipWaiting();

	// Cache core assets
	event.waitUntil(caches.open('core').then(function (cache) {
		for (let asset of coreAssets) {
			cache.add(new Request(asset));
		}
		return cache;
	}));

});

// Listen for request events
self.addEventListener('fetch', function (event) {

	// Get the request
	let request = event.request;

	// Bug fix
	// https://stackoverflow.com/a/49719964
	if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;

	// HTML files
	// Network-first
	if (request.headers.get('Accept').includes('text/html')) {
		event.respondWith(
			fetch(request).then(function (response) {

				// Create a copy of the response and save it to the cache
				let copy = response.clone();
				event.waitUntil(caches.open('pages').then(function (cache) {
					return cache.put(request, copy);
				}));

				// Return the response
				return response;

			}).catch(function (error) {

				// If there's no item in cache, respond with a fallback
				return caches.match(request).then(function (response) {
					return response || caches.match('/offline.html');
				});

			})
		);
		return;
	}

	// Images & Fonts
	// Offline-first
	if (request.headers.get('Accept').includes('image') || request.url.includes('pt-serif')) {
		event.respondWith(
			caches.match(request).then(function (response) {
				return response || fetch(request).then(function (response) {

					// If the request is for an image, save a copy of it in cache
					if (request.headers.get('Accept').includes('image')) {
						let copy = response.clone();
						event.waitUntil(caches.open('img').then(function (cache) {
							return cache.put(request, copy);
						}));
					}

					// Return the response
					return response;

				});
			})
		);
	}
});