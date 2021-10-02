// Listen for request events
self.addEventListener('fetch', function (event) {

	// Get the request
	let request = event.request;

	// The request MIME type
	let type = request.headers.get('Accept');

	// The request URL
	let url = request.url;


	/**
	 * Examples
	 */

	if (request.headers.get('Accept').includes('image')) {
		// Handle image files
	}

	if (request.url.includes('pt-serif')) {
		// Handle font-files
	}

	if (request.url === 'https://path-to-my-api.com') {
		// Handle request for a specific API
	}

});