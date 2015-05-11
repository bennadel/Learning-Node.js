
// Require the core node modules.
var _ = require( "lodash" );
var http = require( "http" );
var url = require( "url" );
var querystring = require( "querystring" );
var Q = require( "q" );
var util = require( "util" );

// Require our core application modules.
var appError = require( "./lib/app-error" ).createAppError;
var friendController = require( "./lib/friend-controller" );
var friendService = require( "./lib/friend-service" );
var mongoGateway = require( "./lib/mongo-gateway" );
var requestBodyStream = require( "./lib/request-body-stream" );


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// Create our server request / response handler.
// --
// NOTE: We are deferring the .listen() call until after we know that we have 
// established a connection to the Mongo database instance.
var httpServer = http.createServer(
	function handleRequest( request, response ) {

		// Always set the CORS (Cross-Origin Resource Sharing) headers so that our client-
		// side application can make AJAX calls to this node app (I am letting Apache serve
		// the client-side app so as to keep this demo as simple as possible).
		response.setHeader( "Access-Control-Allow-Origin", "*" );
		response.setHeader( "Access-Control-Allow-Methods", "OPTIONS, GET, POST, DELETE" );
		response.setHeader( "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept" );

		// If this is the CORS "pre-flight" test, just return a 200 and halt the process. 
		// This is just the browser testing to see it has permissions to make CORS AJAX
		// requests to the node app.
		if ( request.method === "OPTIONS" ) {

			return( 
				response.writeHead( 200, "OK" ),
				response.end()
			);
			
		}

		// For non-GET requests, we will need to accumulate and parse the request body. The
		// request-body-stream will emit a "body" event when the incoming request has been 
		// accumulated and parsed.
		var bodyWriteStream = requestBodyStream.createWriteStream()
			.on(
				"body",
				function haneleBodyEvent( body ) {

					// Now that we have the body, we're going to merge it together with 
					// query-string (ie, search) values to provide a unified "request 
					// collection" that can be passed-around.
					var parsedUrl = url.parse( request.url );

					// Ensure that the search is defined. If there is no query string, 
					// search will be null and .slice() won't exist.
					var search = querystring.parse( ( parsedUrl.search || "" ).slice( 1 ) );

					// Merge the search and body collections into a single collection.
					// --
					// CAUTION: For this exploration, we are assuming that all POST 
					// requests contain a serialized hash in JSON format.
					processRequest( _.assign( {}, search, body ) );

				}
			)
			.on( "error", processError )
		;
		
		request.pipe( bodyWriteStream );


		// Once both the query-string and the incoming request body have been 
		// successfully parsed and merged, route the request into the core application 
		// (via the Controllers).
		function processRequest( requestCollection ) {

			var route = ( request.method + ":" + ( requestCollection.action || "" ) );

			console.log( "Processing route:", route );

			// Default to a 200 OK response. Each route may override this when processing
			// the response from the Controller(s).
			var statusCode = 200;
			var statusText = "OK";

			// Since anything inside of the route handling may throw an error, catch any 
			// error and parle it into an error response.
			try {

				if ( route === "GET:list" ) {

					var apiResponse = friendController.getFriends( requestCollection );

				} else if ( route === "GET:get" ) {

					var apiResponse = friendController.getFriend( requestCollection );

				} else if ( route === "POST:add" ) {

					var apiResponse = friendController.createFriend( requestCollection )
						.tap(
							function handleControllerResolve() {

								statusCode = 201;
								statusText = "Created";
								
							}
						)
					;

				} else if ( route === "POST:update" ) {

					var apiResponse = friendController.updateFriend( requestCollection );

				} else if ( route === "POST:delete" ) {

					var apiResponse = friendController.deleteFriend( requestCollection )
						.tap(
							function handleControllerResolve() {

								statusCode = 204;
								statusText = "No Content";

							}
						)
					;

				// If we made it this far, then we did not recognize the incoming request 
				// as one that we could route to our core application.
				} else {

					throw(
						appError({
							type: "App.NotFound",
							message: "The requested route is not supported.",
							detail: util.format( "The route action [%s] is not supported.", route ),
							errorCode: "server.route.missing"
						})
					);
					
				}

				// Render the controller response. 
				// --
				// NOTE: If the API response is rejected, it will be routed to the error
				// processor as the fall-through reject-binding.
				apiResponse
					.then(
						function handleApiResolve( result ) {

							var serializedResponse = JSON.stringify( result );

							response.writeHead(
								statusCode,
								statusText,
								{
									"Content-Type": "application/json",
									"Content-Length": serializedResponse.length
								}
							);

							response.end( serializedResponse );

						}
					)
					.catch( processError )
				;

			// Catch any top-level controller and routing errors.
			} catch ( controllerError ) {

				processError( controllerError );

			}

		}


		// I try to render any errors that occur during the API request routing.
		// --
		// CAUTION: This method assumes that the header has not yet been committed to the
		// response. Since the HTTP response stream never seems to cause an error, I think
		// it's OK to assume that any server-side error event would necessarily be thrown
		// before the response was committed.
		// --
		// Read More: http://www.bennadel.com/blog/2823-does-the-http-response-stream-need-error-event-handlers-in-node-js.htm 
		function processError( error ) {

			console.error( error );
			console.log( error.stack );

			response.setHeader( "Content-Type", "application/json" );

			switch ( error.type ) {

				case "App.InvalidArgument":

					response.writeHead( 400, "Bad Request" );
					
				break;

				case "App.NotFound":

					response.writeHead( 404, "Not Found" );

				break;

				default:

					response.writeHead( 500, "Server Error" );

				break;

			}

			// We don't want to accidentally leak proprietary information back to the
			// user. As such, we only want to send back simple error information that 
			// the client-side application can use to formulate its own error messages.
			response.end( 
				JSON.stringify({
					type: ( error.type || "" ),
					code: ( error.errorCode || "" )
				})
			);

		}

	}
);

// Establish a connection to our database. Once that is established, we can start
// listening for HTTP requests on the API.
// --
// CAUTION: mongoGateway is a shared-resource module in our node application. Other
// modules will require("mongo-gateway") which exposes methods for getting resources
// out of the connection pool (which is managed automatically by the underlying 
// MongoClient instance). It's important that we establish a connection before other
// parts of the application try to use the shared connection pool.
mongoGateway.connect( "mongodb://127.0.0.1:27017/node_mongodb" )
	.then(
		function handleConnectResolve( mongo ) {

			// Start listening for incoming HTTP requests.
			httpServer.listen( 8080 );

			console.log( "MongoDB connected, server now listening on port 8080." );			

		},
		function handleConnectReject( error ) {

			console.log( "Connection to MongoDB failed." );
			console.log( error );

		}
	)
;
