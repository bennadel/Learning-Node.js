angular.module( "MongoDB" ).directive(
	"bnHome",
	function() {

		// Return the directive configuration object.
		return({
			controller: "HomeController",
			controllerAs: "homeController",
			templateUrl: "app/home/home.view.htm"
		});

	}
);