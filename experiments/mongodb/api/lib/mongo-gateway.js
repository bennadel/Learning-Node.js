
// Require the core node modules.
var MongoClient = require( "mongodb" ).MongoClient;
var Q = require( "q" );

// Require our core application modules.
var appError = require( "./app-error" ).createAppError;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// I am the shared MongoClient instance for this process.
var sharedMongoClient = null;

// Export the public methods.
exports.connect = connect;
exports.getResource = getResource;


// ---
// PUBLIC METHODS.
// ---


// I connect to the given MongoDB and store the database instance for use by any context
// that requires this module. Returns a promise.
function connect( connectionString ) {

	var deferred = Q.defer();

	MongoClient.connect( 
		connectionString,
		function handleConnected( error, mongo ) {

			if ( error ) {

				deferred.reject( error );

			}

			deferred.resolve( sharedMongoClient = mongo );

		}
	);

	return( deferred.promise );

}


// I get the shared MongoClient resource.
function getResource() {

	if ( ! sharedMongoClient ) {

		throw(
			appError({
				type: "App.DatabaseNotConnected",
				message: "The MongoDB connection pool has not been established."
			})
		);

	}

	return( Q( sharedMongoClient ) );

}