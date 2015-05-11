// I provide access to the remote friend repository.
angular.module( "MongoDB" ).factory(
	"friendService",
	function( $http, $q ) {

		// In our demo, the friend repository will be hosted by the Node.js API, backed
		// by the MongoDB database.
		var baseUrl = "http://127.0.0.1:8080"

		// Return the public API.
		return({
			createFriend: createFriend,
			deleteFriend: deleteFriend,
			getFriend: getFriend,
			getFriends: getFriends,
			updateFriend: updateFriend
		});


		// ---
		// PUBLIC METHODS.
		// ---


		// I create a friend with the given properties.
		function createFriend( name, description ) {

			var request = $http({
				method: "post",
				url: baseUrl,
				data: {
					action: "add",
					name: name,
					description: description
				}
			});

			return( unwrapHttpResponse( request ) );

		}


		// I delete the friend with the given ID.
		function deleteFriend( id ) {

			var request = $http({
				method: "post",
				url: baseUrl,
				data: {
					action: "delete",
					id: id
				}
			});

			return( unwrapHttpResponse( request ) );

		}


		// I get the friend with the given ID.
		function getFriend( id ) {

			var request = $http({
				method: "get",
				url: baseUrl,
				params: {
					action: "get",
					id: id
				}
			});

			return( unwrapHttpResponse( request ) );

		}


		// I get all of the friends.
		function getFriends() {

			var request = $http({
				method: "get",
				url: baseUrl,
				params: {
					action: "list"
				}
			});

			return( unwrapHttpResponse( request ) );

		}


		// I update the given friend, setting given properties.
		function updateFriend( id, name, description ) {

			var request = $http({
				method: "post",
				url: baseUrl,
				data: {
					action: "update",
					id: id,
					name: name,
					description: description
				}
			});

			return( unwrapHttpResponse( request ) );

		}


		// ---
		// PRIVATE METHODS.
		// ---


		// I unwrap the HTTP request, resolving only the data relevant to the calling
		// context (ie, removing all of the HTTP-base data).
		function unwrapHttpResponse( httpRequest ) {

			return(
				httpRequest.then(
					function handleResolve( response ) {

						return( response.data );

					},
					function handleReject( response ) {

						return( $q.reject( response.data ) );

					}
				)
			);

		}

	}
);