
// Export an instance of the mimeTypes singleton.
module.exports = (function() {

	// Return public API.
	return({
		getFromFileExtention: getFromFileExtention,
		getFromFileName: getFromFileName,
		getFromFilePath: getFromFilePath
	});


	// ---
	// PUBLIC METHODS.
	// ---


	// I return the best-guess mime-type based on the given file extension.
	function getFromFileExtention( extension ) {

		switch ( extension.toLowerCase() ) {
			case "css":
				return( "text/css" );
			break;
			case "gif":
				return( "image/gif" );
			break;
			case "htm":
			case "html":
				return( "text/html" );
			break;
			case "jpg":
			case "jpeg":
			case "jpe":
				return( "image/jpeg" );
			break;
			case "js":
				return( "text/javascript" );
			break;
			case "json":
				return( "applicaiton/x-json" );
			break;
			case "png":
				return( "image/png" );
			break;
			case "tiff":
				return( "image/tiff" );
			break;
			case "txt":
				return( "text/plain" );
			break;
			default:
				return( "application/octet-stream" );
			break;
		}

	}


	// I return the best-guess mime-type based on the given file name.
	function getFromFileName( filename ) {

		return( getFromFileExtention( filename.split( "." ).pop() ) );

	}


	// I return the best-guess mime-type based on the given file path.
	// --
	// CAUTION: Assumes the file name is at the end of the path.
	function getFromFilePath( path ) {

		return( getFromFileName( path ) );

	}

})();