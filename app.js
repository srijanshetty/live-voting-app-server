var express = require( 'express' );
var app = express();
var bodyParser = require( 'body-parser' );
var logger = require( 'morgan' );
var cookieParser = require('cookie-parser');

// Standard plug and play modules
app.use( bodyParser.urlencoded( {extended: true } ) );
app.use( bodyParser.json() );
app.use( logger( 'dev' ) );
app.use( cookieParser() );

// A friendly message to anyone using our API
app.get( '/', function(req, res) {
    res.send( "Welcome to the Voting App" );
} );

app.get( '/profile', function( req, res ) {
    res.send( { "response": "Welcome to the Voting App" } );
} );

// Setup a router to route requests on the /api endpoint
var Router = express.Router();
app.use( '/api', Router );

// The users end point
// Router.route( '/users' )

// The questions end point
// Router.route( '/questions' )

// The response end point
// Router.route( '/responses' )

// Start the server
var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
