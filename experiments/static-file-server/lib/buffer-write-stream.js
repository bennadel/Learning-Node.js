
// Require the node modules.
var stream = require( "stream" );
var util = require( "util" );
var buffer = require( "buffer" ).Buffer;


// Export the class constructor.
exports.BufferWriteStream = BufferWriteStream;


// I create a Writable stream that will aggregate the binary content that is piped into
// it. When the stream is ended / finished, it will emit an "buffer" event that will 
// publish the aggregated content. After this event, the stream will automatically destroy
// itself in an attempt to free up memory.
function BufferWriteStream() {

	// Call super constructor.
	stream.Writable.call( this );

	// I hold each written chunk as a new item in the buffers array. This keeps things 
	// simple and we can just concat all the values in the end.
	this._buffers = [];

	this._destroyed = false;

	// When the stream is ended (and the finish event is emitted), we'll need to emit
	// the buffer event and publish the aggregated data.
	this.once( "finish", this._handleFinish.bind( this ) );

}

util.inherits( BufferWriteStream, stream.Writable );


// ---
// PRIVATE METHODS.
// ---


// I teardown the stream in an attempt to free up memory.
BufferWriteStream.prototype.destroy = function() {

	this._destroyed = true;

	this._buffers = null;

};


// ---
// PRIVATE METHODS.
// ---


// When the finish event is emitted, I emit the "buffer" event in order to publish the 
// aggregated buffer.
// --
// NOTE: The stream automatically destroys itself.
BufferWriteStream.prototype._handleFinish = function( event ) {

	if ( this._destroyed ) {

		return;

	}

	this.emit( "buffer", buffer.concat( this._buffers ) );

	this.destroy();

};


// I append the incoming chunks to the aggregate buffer collection.
BufferWriteStream.prototype._write = function( chunk, encoding, writeComplete ) {

	if ( ! buffer.isBuffer( chunk ) ) {

		throw( new Error( "BufferWriteStream can only accept buffers." ) );

	}

	if ( this._destroyed ) {

		return( writeComplete( new Error( "BufferWriteStream has been destroyed." ) ) );

	}

	this._buffers.push( chunk );

	writeComplete();

};
