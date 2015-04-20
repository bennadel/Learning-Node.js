
// Require the node modules.
var stream = require( "stream" );
var util = require( "util" );
var buffer = require( "buffer" ).Buffer;


// Export the class constructor.
exports.BufferReadStream = BufferReadStream;


// I provide a Readable stream that will stream the given source buffer. This allows
// in-memory data to be streamed to other destinations. 
function BufferReadStream( source ) {

	if ( ! buffer.isBuffer( source ) ) {

		throw( new Error( "BufferReadStream source must be a buffer." ) );

	}

	// Call super constructor.
	stream.Readable.call( this );

	this._source = source;
	this._index = 0;
	this._length = this._source.length;

}

util.inherits( BufferReadStream, stream.Readable );


// ---
// PUBLIC METHODS.
// ---


// I teardown the stream in an attempt to free-up memory.
BufferReadStream.prototype.destroy = function() {

	this._source = null;
	this._index = null;
	this._length = null;

};


// ---
// PRIVATE METHODS.
// ---

 
// I read chunks from the source buffer into the underlying stream buffer.
BufferReadStream.prototype._read = function( size ) {

	// If we haven't reached the end of the source buffer, push the next chunk onto
	// the internal stream buffer.
	if ( this._index < this._length ) {

		this.push( this._source.slice( this._index, ( this._index += size ) ) );

	}

	// If we've consumed the entire source buffer, close the readable stream.
	if ( this._index >= this._length ) {

		this.push( null );

	}

};
