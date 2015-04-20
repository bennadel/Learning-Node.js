
// Require node modules.
var http = require( "http" );
var staticFileServer = require( "./lib/static-file-server" );
var chalk = require( "chalk" );

// Create an instance of our static file server.
var fileServer = staticFileServer.createServer({

	// I tell the static file server which directory to use when resolving paths.
	documentRoot: ( __dirname + "/wwwroot/" ),

	// I tell the static file server which default document to use when the user requests
	// a directory instead of a file.
	defaultDocument: "index.htm",

	// I tell the static file server the max-age of the Cache-Control header.
	maxAge: 604800, // 7 days.

	// I tell the static file server which portions of the URL path to strip out before
	// resolving the path against the document root. This allows parts of the URL to serve
	// as a cache-busting mechanism without having to alter the underlying file structure.
	magicPattern: /build-[\d.-]+/i,

	// I tell the static file server the maximum size of the file that can be cached in
	// memory (larger files will be piped directly from the file system).
	maxCacheSize: ( 1024 * 100 ) // 100Kb.
	
});

// Create an instance of our http server.
var httpServer = http.createServer(
	function handleRequest( request, response ) {

		// For now, just pass the incoming request off to the static file server; we'll
		// assume that all requests to this app are for static files.
		fileServer.serveFile( request, response );

	}
);

httpServer.listen( 8080 );

console.log( chalk.cyan( "Server running on port 8080" ) );