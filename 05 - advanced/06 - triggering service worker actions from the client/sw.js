/**
 * Check if cached API data is still valid
 * @param  {Object}  response The response object
 * @param  {Number}  goodFor  How long the response is good for, in milliseconds
 * @return {Boolean}          If true, cached data is valid
 */
function isValid (response, goodFor) {
	if (!response) return false;
	let fetched = response.headers.get('sw-fetched-on');
	if (fetched && (parseFloat(fetched) + goodFor) > new Date().getTime()) return true;
	return false;
}

// On install, activate immediately
self.addEventListener('install', function (event) {

	// Activate immediately
	self.skipWaiting();

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
		return;
	}

	// API Calls
	// Network-first
	if (request.url.includes('/skwak.json')) {
		event.respondWith(
			caches.match(request).then(function (response) {

				// If there's a cached API and it's still valid, use it
				let cachedAPI = response;
				if (isValid(response)) {
					return response;
				}

				// Otherwise, make a fresh API call
				return fetch(request).then(function (response) {

					// Create a copy of the response and save it to the cache
					let copy = response.clone();
					event.waitUntil(caches.open('apis').then(function (cache) {
						let headers = new Headers(copy.headers);
						headers.append('sw-fetched-on', new Date().getTime());
						return copy.blob().then(function (body) {
							return cache.put(request, new Response(body, {
								status: copy.status,
								statusText: copy.statusText,
								headers: headers
							}));
						});
					}));

					// Return the response
					return response;

				}).catch(function (error) {
					return cachedAPI;
				});

			})
		);
	}

});

// Listen for message events
self.addEventListener('message', function (event) {

	// Make sure the event was from a trusted site
	// if (event.origin !== 'https://your-awesome-website.com') return;

	// Only run on logOut messages
	if (event.data !== 'logOut') return;

	// Delete cached APIs
	caches.delete('apis');

});