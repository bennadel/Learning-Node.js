angular.module( "MongoDB" ).directive(
	"bnForm",
	function() {

		// Return the directive configuration object.
		return({
			controller: "FormController",
			controllerAs: "formController",
			link: link,
			templateUrl: "app/form/form.view.htm"
		});


		// I bind the JavaScript events to the local scope.
		function link( scope, element, attributes ) {

			element.find( "input" )[ 0 ].focus();

		}

	}
);