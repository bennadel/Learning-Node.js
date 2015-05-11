angular.module( "MongoDB" ).controller(
	"DetailController",
	function( $scope, $routeParams, $location, friendService ) {

		var vm = this;

		vm.friend = null;

		loadRemoteData();

		
		// ---
		// PRIVATE METHODS.
		// ---	


		// I apply the remove data to the local view-model.
		function applyRemoteData( friend ) {

			vm.friend = friend;

		}


		// I load the remote data from the server.
		function loadRemoteData() {

			friendService.getFriend( $routeParams.id )
				.then( 
					applyRemoteData,
					function handleReject( error ) {

						alert( "We could not find your friend." );

						$location.path( "/list" );

					}
				)
			;

		}	

	}
);