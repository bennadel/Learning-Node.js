// Define the MongoDB application module.
angular.module( "MongoDB", [ "ngRoute" ] ).config(
	function( $routeProvider ) {

		// Configure the routing for the application.
		$routeProvider
			.when(
				"/list",
				{
					action: "list"
				}
			)
			.when(
				"/view/:id",
				{
					action: "view"
				}
			)
			.when(
				"/form",
				{
					action: "form"
				}
			)
			.otherwise({
				redirectTo: "/list"
			})
		;

	}
);
