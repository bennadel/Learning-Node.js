angular.module( "MongoDB" ).controller(
	"HomeController",
	function( $scope, $route ) {

		var vm = this;
		
		vm.subview = null;

		// Whenever the route changes, set up the appropriate subview for rendering.
		$scope.$on(
			"$routeChangeSuccess",
			function handleRouteChangeSuccess() {

				vm.subview = ( $route.current.action || null );

			}
		);

	}
);