angular.module( "MongoDB" ).directive(
	"bnList",
	function() {

		// Return the directive configuration object.
		return({
			controller: "ListController",
			controllerAs: "listController",
			templateUrl: "app/list/list.view.htm"
		});

	}
);