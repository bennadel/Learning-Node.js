angular.module( "MongoDB" ).directive(
	"bnDetail",
	function() {

		// Return the directive configuration object.
		return({
			controller: "DetailController",
			controllerAs: "detailController",
			templateUrl: "app/detail/detail.view.htm"
		});

	}
);