
// Require the node modules.
var stream = require( "stream" );
var util = require( "util" );
var crypto = require( "crypto" );
var buffer = require( "buffer" ).Buffer;


// Export the class constructor.
exports.ETagStream = ETagStream;


// I am a writable stream that generates an ETag after all of the content has been 
// streamed through the incoming pipe. Once the stream is closed, an "etag" event is 
// emitted with the calculated etag value.
function ETagStream() {

	// Call super constructor.
	stream.Writable.call( this );

	// I hold the ETag after it has been generated.
	this._etag = null;

	// I build the content digest, one chunk at a time.
	this._hasher = crypto.createHash( "md5" );

	this._destroyed = false;

	// Listen for the finish event - once the incoming pipe closes the stream, we'll know
	// that we have all the information we need (or can get) to generate the message 
	// digest that is the ETag hash.
	this.once( "finish", this._handleFinish.bind( this ) );

}

util.inherits( ETagStream, stream.Writable );


// ---
// PUBLIC METHODS.
// ---


// I teardown the stream in an attempt to free up memory.
ETagStream.prototype.destroy = function() {

	if ( this._destroyed ) {
		
		return;

	}

	this._etag = null;
	this._hasher = null;

};


// ---
// PRIVATE METHODS.
// ---


// I finalize the ETag once the incoming pipe has closed this writable stream.
ETagStream.prototype._handleFinish = function( event ) {

	if ( this._destroyed ) {

		return;

	}

	this.emit( "etag", ( this._etag = this._hasher.digest( "hex" ) ) );

	this.destroy();

};


// I use the incoming chunk to update the ETag digest.
ETagStream.prototype._write = function( chunk, encoding, writeComplete ) {

	if ( ! buffer.isBuffer( chunk ) ) {

		throw( new Error( "ETagStream can only accept buffers." ) );

	}

	if ( this._destroyed ) {

		return( writeComplete( new Error( "ETagStream has been destroyed." ) ) );

	}

	// Update the ETag hash with the next chunk of content.
	this._hasher.update( chunk );

	writeComplete();

};
