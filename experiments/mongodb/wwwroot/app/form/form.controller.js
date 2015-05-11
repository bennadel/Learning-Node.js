angular.module( "MongoDB" ).controller(
	"FormController",
	function( $scope, $routeParams, $location, friendService ) {

		var vm = this;

		vm.id = ( $routeParams.id || null );

		vm.form = {
			name: "",
			description: ""
		};

		loadRemoteData();

		// Expose the public methods on the view-model.
		vm.processForm = processForm;


		// ---
		// PUBLIC METHODS.
		// ---


		// I process the form data, adding or updating the current friend.
		function processForm() {

			if ( ! vm.form.name ) {

				return( alert( "Please enter a name." ) );

			}

			if ( ! vm.form.description ) {

				return( alert( "Please enter a description." ) );

			}

			if ( vm.id ) {

				var promise = friendService.updateFriend(
					vm.id,
					vm.form.name,
					vm.form.description
				);

			} else {

				var promise = friendService.createFriend(
					vm.form.name,
					vm.form.description
				);

			}

			promise.then(
				function handleResolve( id ) {

					$location
						.path( "/view/" + id )
						.search( "id", null )
					;

				},
				function handleReject( error ) {

					alert( "Something went wrong!" );
					console.log( error );

				}
			);

		}

		
		// ---
		// PRIVATE METHODS.
		// ---	


		// I apply the remove data to the local view-model.
		function applyRemoteData( friend ) {

			vm.form.name = friend.name;
			vm.form.description = friend.description;

		}


		// I load the remote data from the server.
		function loadRemoteData() {

			// If we are not dealing with an existing friend, just return out and let the
			// form load with the default data.
			if ( ! vm.id ) {

				return;

			}

			friendService.getFriend( vm.id )
				.then( 
					applyRemoteData,
					function handleReject() {

						$location.path( "/list" );

					}
				)
			;

		}	

	}
);