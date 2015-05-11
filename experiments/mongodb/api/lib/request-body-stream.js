
// Require our core node modules.
var stream = require( "stream" );
var util = require( "util" );
var buffer = require( "buffer" ).Buffer;

// Require our core application modules.
var appError = require( "./app-error" ).createAppError;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// Export the factory function for the stream.
exports.createWriteStream = function() {

	return( new RequestBodyStream() );

};


// I buffer the incoming request stream. Then, when the content has been fully-buffered,
// I emit the "body" event with the parsed JSON object.
function RequestBodyStream() {

	stream.Writable.call( this );

	this._buffers = [];

	// Listen for the finish event, denoting that no more data will be incoming.
	this.once( "finish", this._handleFinish );

}

util.inherits( RequestBodyStream, stream.Writable );


// ---
// PRIVATE METHODS.
// ---


// I handle the end of the incoming stream and emit the "body" event.
RequestBodyStream.prototype._handleFinish = function() {

	// If there was no data, such as with a GET request, just emit an empty hash.
	if ( ! this._buffers.length ) {

		return( this.emit( "body", {} ) );

	}

	try {

		var content = buffer.concat( this._buffers ).toString( "utf8" );

		// CAUTION: For this demo, we're going to assume that if the value is parsable
		// as a JSON value, then it is, in fact, a Hash (as opposed to a simple value 
		// or an array).
		this.emit( "body", JSON.parse( content ) );

	} catch ( error ) {

		this.emit( 
			"error",
			appError({
				type: "App.InvalidBody",
				message: "The request body could not be parsed as JSON.",
				detail: error.message
			})
		);

	}

};


// I move the incoming chunks of data into the internal buffer.
RequestBodyStream.prototype._write = function( chunk, encoding, chunkConsumed ) {

	this._buffers.push( chunk );

	chunkConsumed();

};