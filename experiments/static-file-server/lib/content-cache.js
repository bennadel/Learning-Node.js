
// Export the class constructor.
exports.ContentCache = ContentCache;


// I provide a cache of file content and etags based on the associate references (often
// the scriptName of the file being requested from the server).
function ContentCache() {

	this._cache = Object.create( null );

}


ContentCache.prototype = {

	constructor: ContentCache,


	// ---
	// PUBLIC METHODS.
	// ---


	// I return the content associated with the given scriptName. If the given modifiedAt
	// date is newer than the one in the cache, no value will be returned (null).
	getContent: function( scriptName, modifiedAt ) {

		var item = this._get( scriptName, modifiedAt );

		if ( ! item ) {

			return( null );

		}

		return( item.content );

	},


	// I return the ETag associated with the given scriptName. If the given modifiedAt
	// date is newer than the one in the cache, no value will be returned (null).
	getETag: function( scriptName, modifiedAt ) {

		var item = this._get( scriptName, modifiedAt );

		if ( ! item ) {

			return( null );

		}

		return( item.etag );

	},


	// I store the given content with the given scriptName. The modifiedAt date is also
	// cached to make sure expired values don't get served up from the cache.
	putContent: function( scriptName, content, modifiedAt ) {

		var item = this._get( scriptName, modifiedAt );

		if ( item ) {

			return( item.content = content );

		}

		// Since we don't have a cached item, store the new content with default (null) 
		// ETag value.
		this._cache[ scriptName ] = {
			scriptName: scriptName,
			content: content,
			etag: null,
			modifiedAt: modifiedAt
		};

		return( content );

	},


	// I store the given ETag with the given scriptName. The modifiedAt date is also
	// cached to make sure expired values don't get served up from the cache.
	putETag: function( scriptName, etag, modifiedAt ) {

		var item = this._get( scriptName, modifiedAt );

		if ( item ) {

			return( item.etag = etag );

		}

		// Since we don't have a cached item, store the new ETag with default (null) 
		// content value.
		this._cache[ scriptName ] = {
			scriptName: scriptName,
			content: null,
			etag: etag,
			modifiedAt: modifiedAt
		};

		return( etag );

	},


	// ---
	// PRIVATE METHODS.
	// ---


	// I return the cache item associated with the given scriptName if the item has not
	// expired (based on the modifiedAt date). If it has expired, returns null.
	_get: function( scriptName, modifiedAt ) {

		var item = this._cache[ scriptName ];

		if ( ! item ) {

			return( null );

		}

		if ( item.modifiedAt < modifiedAt ) {

			delete( this._cache[ scriptName ] );

			return( null );

		}

		return( item );

	}

};
