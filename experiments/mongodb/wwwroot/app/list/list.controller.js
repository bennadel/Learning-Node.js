angular.module( "MongoDB" ).controller(
	"ListController",
	function( $scope, $window, friendService ) {

		var vm = this;

		vm.friends = [];

		loadRemoteData();

		// Expose the public methods on the view-model.
		vm.deleteFriend = deleteFriend;
		

		// ---
		// PUBLIC METHODS.
		// ---


		// I delete the given friend, upon confirmation.
		function deleteFriend( friend ) {

			if ( ! $window.confirm( "Delete friend?" ) ) {

				return;

			}

			// Once the friend is deleted, simply reload the list.
			friendService.deleteFriend( friend._id )
				.then(
					loadRemoteData,
					function handleReject( error ) {

						alert( "Friend could not be deleted." );

					}
				)
			;

		}

		
		// ---
		// PRIVATE METHODS.
		// ---	


		// I apply the remove data to the local view-model.
		function applyRemoteData( friends ) {

			vm.friends = friends;

		}


		// I load the remote data from the server.
		function loadRemoteData() {

			friendService.getFriends()
				.then( applyRemoteData )
			;

		}	

	}
);