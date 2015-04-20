
// Require the core node modules.
var fileSystem = require( "fs" );
var url = require( "url" );
var stream = require( "stream" );
var util = require( "util" );
var crypto = require( "crypto" );
var Q = require( "q" );

// Require our utility classes.
var mimeTypes = require( "./mime-types" );
var ContentCache = require( "./content-cache" ).ContentCache;
var ETagStream = require( "./etag-stream" ).ETagStream;
var BufferReadStream = require( "./buffer-read-stream" ).BufferReadStream;
var BufferWriteStream = require( "./buffer-write-stream" ).BufferWriteStream;


// I am a convenience method that creates a new static file server.
exports.createServer = function( config ) {

	return( new StaticFileServer( config ) );

};


// Export the constructor as well. 
exports.StaticFileServer = StaticFileServer;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// Set up Q-proxied methods. These will allow the standard callback-oriented methods
// to be used as if they returned promises. 
var fileSystemStat = Q.nbind( fileSystem.stat, fileSystem );


// I provide a static file server that will resolve incoming requests against the given
// document root and stream files to the response.
function StaticFileServer( config ) {

	this._config = config;

	// I cache data associated with the requests. At a minimum, this will be used to 
	// cache ETag values; but, it may also be used to cache full file content.
	this._contentCache = new ContentCache();

}


StaticFileServer.prototype = {

	constructor: StaticFileServer,


	// ---
	// PUBLIC METHODS.
	// ---


	// I stream the request for the associated static file into the response.
	serveFile: function( request, response ) {

		// Setup a reference to "this" within the closure (to help with de-bound methods).
		var server = this;

		// Calculate the file that we are supposed to be accessing.
		var parsedUrl = url.parse( request.url );
		var scriptName = this._resolvePath( parsedUrl.path );

		// Stat the requested file to make sure that it exists. This will resolve with 
		// both the scriptName and the stat of the file.
		// --
		// CAUTION: The resolved scriptName may not be the same value as the original 
		// scriptName if the resolution had to traverse a directory. 
		this._resolveScriptName( scriptName ).then(
			function handleScriptNameResolve( resolution ) {

				// Check to see if we have a cached ETag for this script. 
				// --
				// NOTE: We cache the ETag with the associated mtime (modified date)
				// of the file. This way, if the file is modified, the ETag won't be 
				// returned until the ETag is re-cached.
				var etag = server._contentCache.getETag( resolution.scriptName, resolution.stat.mtime );

				// If we have the ETag, we can set the header and try to compare the
				// ETag against the incoming request.
				if ( etag ) {

					response.setHeader( "ETag", etag );

					// If the incoming ETag matches the one we have cached, we can 
					// stop processing the request and return Not Modified response.
					if ( etag === request.headers[ "if-none-match" ] ) {

						response.writeHead( 304, "Not Modified" );
						
						return( response.end() );

					}

				}

				// Set the headers that we know we always need.
				// --
				// CAUTION: Once we set the content-length, the browser will continue
				// to expect data even if the request dies half-way.
				response.setHeader( "Content-Type", mimeTypes.getFromFilePath( resolution.scriptName ) );
				response.setHeader( "Content-Length", resolution.stat.size );

				// If the user provided a max-age for caching, add the cache header.
				if ( server._config.maxAge ) {

					response.setHeader( "Cache-Control", ( "max-age=" + server._config.maxAge ) );
					
				}

				// Default to a 200 OK response until we catch any errors.
				// --
				// NOTE: This allows us to set the status code without calling the 
				// .writeHead() method which will commit the headers early.
				response.statusCode = 200;

				// Check to see if we have cached file content for this script.
				// --
				// NOTE: We cache the content with the associated mtime (modified date)
				// of the file. This way, if the file is modified, the content won't be
				// returned until the content is re-cached.
				var content = server._contentCache.getContent( resolution.scriptName, resolution.stat.mtime );

				// If we have cached content, we can use it to stream to the file into 
				// request without having to go back to disk.
				if ( content ) {

					// NOTE: I'm not binding to the "error" event here since there is no
					// reason that this stream should raise any error.
					var bufferReadStream = new BufferReadStream( content );

					return( bufferReadStream.pipe( response ) );

				}

				// If we've made it this far, we couldn't reply with a 304 Not Modified
				// and we couldn't stream the file from memory. As such, we'll have to 
				// get the file from the disk and stream it into the response.
				var contentStream = fileSystem.createReadStream( resolution.scriptName )
					.on(
						"open",
						function handleContentReadStreamOpen() {

							contentStream.pipe( response );

						}
					)
					.on(
						"error",
						function handleContentReadStreamError( error ) {

							// NOTE: If an error occurs on the read-stream, it will take
							// care of destroying itself. As such, we only have to worry 
							// about cleaning up the possible down-stream connections 
							// that have been established.
							try {

								response.setHeader( "Content-Length", 0 );
								response.setHeader( "Cache-Control", "max-age=0" );
								response.writeHead( 500, "Server Error" );

							} catch ( headerError ) {

								// We can't set a header once the headers have already 
								// been sent - catch failed attempt to overwrite the 
								// response code.

							} finally {

								response.end( "500 Server Error" );

							}

						}
					)
				;

				// If we didn't have a cached ETag for this script, then ALSO pipe the
				// file content into an ETag stream so we can accumulate the ETag while 
				// we stream the file to the user.
				if ( ! etag ) {

					// The ETagStream is a writable stream that emits an "etag" event
					// once the content pipe closes the stream.
					// --
					// NOTE: I am not binding any error event since there is no reason
					// that the ETag stream should emit an error.
					var etagStream = new ETagStream()
						.on(
							"etag",
							function handleETag( etag ) {

								// When we cache the ETag, cache it with both the script
								// name and the date the file was modified. This way, 
								// when / if the file is modified during the lifetime of
								// the app, the ETag will naturally be expired and replaced.
								server._contentCache.putETag( resolution.scriptName, etag, resolution.stat.mtime );

							}
						)
					;

					// Now that we're dealing with a read-stream that may error (and 
					// cause the etagStream to be unpiped), we have to catch that error 
					// event and use it to destroy the etagStream.
					contentStream
						.on(
							"error",
							function handleContentStreamError( error ) {

								etagStream.destroy();

							}
						)
						.pipe( etagStream )
					;

				}

				// If we made it this far, we couldn't serve the file from memory. As 
				// such, we may need to cache the file in memory for subsequent use. 
				// However, we only want to do this if caching is enabled and the given
				// file is smaller than the maxCacheSize. 
				if ( server._config.maxCacheSize && ( resolution.stat.size <= server._config.maxCacheSize ) ) {

					// The BufferWriteStream is a writable stream that emits a "buffer"
					// event once the content pipe closes the stream.
					// --
					// NOTE: Not binding any error event since I there is no reason that
					// the write-stream will emit an error.
					var bufferWriteStream = new BufferWriteStream()
						.on(
							"buffer",
							function handleBuffer( content ) {

								server._contentCache.putContent( resolution.scriptName, content, resolution.stat.mtime );

							}
						)
					;

					// Now that we're dealing with a read-stream that may error (and 
					// cause the bufferWriteStream to be unpiped), we have to catch that
					// error event and use it to destroy the bufferWriteStream.
					contentStream
						.on(
							"error",
							function handleContentStreamError( error ) {

								bufferWriteStream.destroy();

							}
						)
						.pipe( bufferWriteStream )
					;

				}

			},
			// If the file / directory couldn't be found, return a 404.
			function handleScriptNameReject( error ) {

				response.writeHead( 404, "Not Found" );

				response.end( "404 File Not Found" );

			}
		);

	},


	// ---
	// PRIVATE METHODS.
	// ---


	// I normalize the path and the resolve it against the document root, returning 
	// the full scriptName for the requested file.
	_resolvePath: function( path ) {

		// Unescape the url-encoded characters (must explicitly replace spaces as those
		// are not decoded automatically).
		path = decodeURIComponent( path.replace( /\+/g, " " ) );

		// Normalize the slashes.
		path = path.replace( /\\/g, "/" );

		// If a magic pattern was provided, remove it before normalizing. This will 
		// allow things like build-numbers to be pulled out of the paths before they
		// are mapped onto file name. Example:
		// --
		// ./assets/build-123/header.png --> ./assets/header.png
		// --
		// Notice that "build-123" is replaced out of the path before the script name
		// is resolved against the document-root.
		if ( this._config.magicPattern ) {

			path = path.replace( this._config.magicPattern, "" );

		}

		// Strip out double-slashes.
		path = path.replace( /[/]{2,}/g, "/" );

		// Strip out any leading or trailing slashes.
		path = path.replace( /^[/]|[/]$/g, "" );

		// Strip out any path traversal entities. 
		path = path.replace( /\.\.\//g, "/" );

		// Resolve this against the configured document root.
		return( url.resolve( this._config.documentRoot, path ) );

	},


	// I resolve the script name against what actually exists on the file system. Since
	// this action will attempt to negotiate directories and default documents, the result
	// is an object that contains both the script name and the stat object.
	_resolveScriptName: function( scriptName ) {

		// In the event that we stat a directory, this will be the path to the default
		// document in that directory.
		// --
		// NOTE: Even though we normalized the path, we still need to check for a trailing
		// slash in the event that the root directory was requested.
		var defaultScriptName = ( scriptName.slice( -1 ) === "/" )
			? ( scriptName + this._config.defaultDocument )
			: ( scriptName + "/" + this._config.defaultDocument )
		;

		// But, start off trying to stat the file.
		var promise = fileSystemStat( scriptName ).then(
			function handleFileResolve( stat ) {

				// If the script name is a file, we are done.
				if ( stat.isFile() ) {

					return({
						scriptName: scriptName,
						stat: stat
					});

				}

				// The script name was a directory, try to state the default document
				// within that directory.
				var directoryPromise = fileSystemStat( defaultScriptName ).then(
					function handleDirectoryResolve( stat ) {

						return({
							scriptName: defaultScriptName,
							stat: stat 
						});

					}
				);

				return( directoryPromise );

			}
		);

		return( promise );

	}

};