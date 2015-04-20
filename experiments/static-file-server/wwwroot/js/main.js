
angular.module( "HankHill", [] );
	
angular.module( "HankHill" ).controller(
	"HankHillController",
	function( $scope ) {

		// Source: http://www.hankhillquotes.com/quotes/Hank-Hill/
		var quotes = [
			"Nobody likes a know it all who sits around talking about their genitalia.",
			"Bobby, from now on when I ask you how your day was, what I mean is 'how was shop'?",
			"I can't enjoy a party until I know where the bathroom is. You knew that when you married me.",
			"If Bobby doesn't love football, he won't lead a fulfilling life, and then he'll die.",
			"Peg, I'm trying to control an outbreak, and you're driving the monkey to the airport!",
			"Bobby, you go pick something from the adventure section....anything about a boy with gumption should be fine.",
			"You can't just pick and choose which laws to follow. Sure I'd like to tape a baseball game without the express written consent of major league baseball, but that's just not the way it works.",
			"With the joys of responsibility comes the burden of obligation.",
			"I think they're starting to like me. But more importantly, I think they're starting to like shop.",
			"A poodle? Why don't you just get me a cat and a sex change operation?",
			"I wasn't flirting with her! I didn't even mention that I worked in propane.",
			"I sell propane and propane accessories.",
			"Ginseng tea?? I'm not gonna get hopped up on dope!"
		];

		var index = Math.floor( Math.random() * quotes.length );

		$scope.quote = quotes[ index ];


		// ---
		// PUBLIC METHODS.
		// ---


		$scope.nextQuote = function() {

			if ( ++index >= quotes.length ) {

				index = 0;

			}

			$scope.quote = quotes[ index ];

		};

		
		$scope.prevQuote = function() {

			if ( --index < 0 ) {

				index = ( quotes.length - 1 );

			}

			$scope.quote = quotes[ index ];

		};

	}
);