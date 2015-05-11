
// Require our core node modules.
var Q = require( "q" );

// Require our core application modules.
var friendService = require( "./friend-service" );


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


// I create a new friend.
function createFriend( requestCollection ) {

	var name = requestCollection.name;
	var description = requestCollection.description;

	return( friendService.createFriend( name, description ) );

}


// I delete the given friend.
function deleteFriend( requestCollection ) {

	var id = requestCollection.id;

	return( friendService.deleteFriend( id ) );

}


// I return the given friend.
function getFriend( requestCollection ) {

	var id = requestCollection.id;

	return( friendService.getFriend( id ) );

}


// I return all of the friends.
function getFriends( requestCollection ) {

	return( friendService.getFriends() );

}


// I update the given friend.
function updateFriend( requestCollection ) {

	var id = requestCollection.id;
	var name = requestCollection.name;
	var description = requestCollection.description;

	return( friendService.updateFriend( id, name, description ) );

}