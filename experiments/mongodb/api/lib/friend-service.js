
// Require our core node modules.
var ObjectID = require( "mongodb" ).ObjectID;
var Q = require( "q" );
var util = require( "util" );

// Require our core application modules.
var appError = require( "./app-error" ).createAppError;
var mongoGateway = require( "./mongo-gateway" );


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// Export the public methods.
exports.createFriend = createFriend;
exports.deleteFriend = deleteFriend;
exports.getFriend = getFriend;
exports.getFriends = getFriends;
exports.updateFriend = updateFriend;


// ---
// PUBLIC METHODS.
// ---


// I create a new friend with the given properties. Returns a promise that will resolve
// to the newly inserted friend ID.
function createFriend( name, description ) {

	// Test inputs (will throw error if any of them invalid).
	testName( name );
	testDescription( description );

	var promise = getDatabase()
		.then(
			function handleDatabaseResolve( mongo ) {

				var deferred = Q.defer();

				mongo.collection( "friend" ).insertOne(
					{
						name: name,
						description: description
					},
					deferred.makeNodeResolver()
				);

				return( deferred.promise );

			}
		)
		// When we insert a single document, the resulting object contains metadata about
		// the insertion. We don't want that information leaking out into the calling 
		// context. As such, we want to unwrap that result, and return the inserted ID.
		// --
		// - result: Contains the operation result.
		// - + ok: 1
		// - + n: 1 
		// - ops: Contains the documents inserted with added _id fields.
		// - insertedCount: 1
		// - insertedId: xxxxxxxxxxxx
		// - connection: Contains the connection used to perform the insert.
		.get( "insertedId" )
	;

	return( promise );

};


// I delete the friend with the given ID. Returns a promise.
// --
// CAUTION: If the given friend does not exist, promise will be rejected.
function deleteFriend( id ) {

	// Test inputs (will throw error if any of them invalid).
	testId( id );

	var promise = getDatabase()
		.then(
			function handleDatabaseResolve( db ) {

				var deferred = Q.defer();

				db.collection( "friend" ).deleteOne(
					{
						_id: ObjectID( id )
					},
					deferred.makeNodeResolver()
				);

				return( deferred.promise );

			}
		)
		// When we remove a document, the resulting object contains meta information 
		// about the delete operation. We don't want that information to leak out into
		// the calling context; so, let's examine the result and unwrap it.
		// --
		// - result: Contains the information about the operation:
		// - + ok: 1
		// - + n: 1
		// - connection: Contains the connection used to perform the remove.
		// - deletedCount: 1
		.then(
			function handleResultResolve( result ) {

				// If the document was successfully deleted, just echo the ID.
				if ( result.deletedCount ) {

					return( id );

				}

				throw(
					appError({
						type: "App.NotFound", 
						message: "Friend could not be deleted.",
						detail: util.format( "The friend with id [%s] could not be deleted.", id ),
						extendedInfo: util.inspect( result.result )
					})
				);

			}
		)
	;

	return( promise );

};


// I get the friend with the given id. Returns a promise.
function getFriend( id ) {

	// Test inputs (will throw error if any of them invalid).
	testId( id );

	var promise = getDatabase()
		.then(
			function handleDatabaseResolve( mongo ) {

				var deferred = Q.defer();

				mongo.collection( "friend" ).findOne(
					{
						_id: ObjectID( id )
					},
					deferred.makeNodeResolver()
				);

				return( deferred.promise );

			}
		)
		// If the read operation was a success, the result object will be the document
		// that we retrieved from the database. Unlike the WRITE operations, the result
		// of a READ operation doesn't contain metadata about the operation.
		.then(
			function handleResultResolve( result ) {

				if ( result ) {

					return( result );

				}

				throw( 
					appError({
						type: "App.NotFound", 
						message: "Friend could not be found.",
						detail: util.format( "The friend with id [%s] could not be found.", id )
					})
				);

			}
		)
	;

	return( promise );

};


// I get all the friends. Returns a promise.
function getFriends() {

	var promise = getDatabase().then(
		function handleDatabaseResolve( mongo ) {

			var deferred = Q.defer();

			mongo.collection( "friend" )
				.find({})
				.toArray( deferred.makeNodeResolver() )
			;

			return( deferred.promise );

		}
	);

	return( promise );

};


// I update the given friend, assigning the given properties.
// --
// CAUTION: If the given friend does not exist, promise will be rejected.
function updateFriend( id, name, description ) {

	// Test inputs (will throw error if any of them invalid).
	testId( id );
	testName( name );
	testDescription( description );

	var promise = getDatabase()
		.then(
			function handleDatabaseResolve( mongo ) {

				var deferred = Q.defer();

				mongo.collection( "friend" ).updateOne(
					{
						_id: ObjectID( id )
					},
					{
						$set: {
							name: name,
							description: description
						}
					},
					deferred.makeNodeResolver()
				);

				return( deferred.promise );

			}
		)
		// When we update a document, the resulting object contains meta information 
		// about the update operation. We don't want that information to leak out into
		// the calling context; so, let's examine the result and unwrap it.
		// --
		// - result: Contains the information about the operation:
		// - + ok: 0
		// - + nModified: 0
		// - + n: 0
		// - connection: Contains the connection used to perform the update.
		// - matchedCount: 0
		// - modifiedCount: 0
		// - upsertedId: null
		// - upsertedCount: 0
		.then(
			function handleResultResolve( result ) {

				// If the document was successfully modified, just echo the ID.
				// --
				// CAUTION: If the update action doesn't result in modification of the
				// document (ie, the document existed, but not values were changed), then
				// the modifiedCount:0 but n:1. As such, we have to check n.
				if ( result.result.n ) {

					return( id );

				}

				throw(
					appError({
						type: "App.NotFound", 
						message: "Friend could not be updated.",
						detail: util.format( "The friend with id [%s] could not be updated.", id ),
						extendedInfo: util.inspect( result.result )
					})
				);

			}
		)
	;

	return( promise );

};


// ---
// PRIVATE METHODS.
// ---


// I get a MongoDB connection from the resource pool. Returns a promise.
function getDatabase() {

	return( mongoGateway.getResource() );

}


// I test the given description for validity.
function testDescription( newDescription ) {

	if ( ! newDescription ) {

		throw(
			appError({
				type: "App.InvalidArgument",
				message: "Description must be a non-zero length.",
				errorCode: "friend.description.short"
			})
		);

	}

}


// I test the given ID for validity.
function testId( newId ) {

	if ( ! ObjectID.isValid( newId ) ) {

		throw(
			appError({
				type: "App.InvalidArgument",
				message: "Id is not valid.",
				detail: util.format( "The id [%s] is not a valid BSON ObjectID.", newId ),
				errorCode: "friend.id"
			})
		);

	}

}


// I test the given name for validity.
function testName( newName ) {

	if ( ! newName ) {

		throw(
			appError({
				type: "App.InvalidArgument",
				message: "Name must be a non-zero length.",
				errorCode: "friend.name.short"
			})
		);

	}

	if ( newName.length > 30 ) {

		throw(
			appError({
				type: "App.InvalidArgument",
				message: "Name must be less than or equal to 30-characters.",
				detail: util.format( "The name [%s] is too long.", newName ),
				errorCode: "friend.name.long"
			})
		);

	}

}