// Version number
let version = '1.0.0';

// Cache IDs
let coreID = `${version}_core`;
let pageID = `${version}_pages`;
let imgID = `${version}_img`;
let cacheIDs = [coreID, pageID, imgID];

// Max number of files in cache
let limits = {
	pages: 35,
	imgs: 20
};

// Core assets to cache
let coreAssets = [
	'/css/main.css',
	'/css/fonts.css',
	'/img/logo.svg',
	'/img/favicon.ico',
	'/menu.html',
	'/contact.html',
	'/offline.html'
];

// Font files
let fonts = [
	'/fonts/pt-serif-v11-latin-700.woff',
	'/fonts/pt-serif-v11-latin-700.woff2',
	'/fonts/pt-serif-v11-latin-700italic.woff',
	'/fonts/pt-serif-v11-latin-700italic.woff2',
	'/fonts/pt-serif-v11-latin-italic.woff',
	'/fonts/pt-serif-v11-latin-italic.woff2',
	'/fonts/pt-serif-v11-latin-regular.woff',
	'/fonts/pt-serif-v11-latin-regular.woff2'
];

/**
 * Remove cached items over a certain number
 * @param  {String}  key The cache key
 * @param  {Integer} max The max number of items allowed
 */
function trimCache (key, max) {
	caches.open(key).then(function (cache) {
		cache.keys().then(function (keys) {
			if (keys.length <= max) return;
			cache.delete(keys[0]).then(function () {
				trimCache(key, max);
			});
		});
	});
}

// On install, activate immediately
self.addEventListener('install', function (event) {

	// Activate immediately
	self.skipWaiting();

	// Cache core assets
	event.waitUntil(caches.open(coreID).then(function (cache) {
		for (let asset of [...coreAssets, ...fonts]) {
			cache.add(new Request(asset));
		}
		return cache;
	}));

});

// On version update, remove old cached files
self.addEventListener('activate', function (event) {
	event.waitUntil(caches.keys().then(function (keys) {

		// Get the keys of the caches to remove
		let keysToRemove = keys.filter(function (key) {
			return !cacheIDs.includes(key);
		});

		// Delete each cache
		let removed = keysToRemove.map(function (key) {
			return caches.delete(key);
		});

		return Promise.all(removed);

	}).then(function () {
		return self.clients.claim();
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
				event.waitUntil(caches.open(pageID).then(function (cache) {
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
						event.waitUntil(caches.open(imgID).then(function (cache) {
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

// Trim caches over a certain size
self.addEventListener('message', function (event) {

	// Make sure the event was from a trusted site
	// if (event.origin !== 'https://your-awesome-website.com') return;

	// Only run on cleanUp messages
	if (event.data !== 'cleanUp') return;

	// Trim the cache
	trimCache('pages', limits.pages);
	trimCache('img', limits.imgs);

});