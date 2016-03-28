var express = require( 'express' );
var app = express();
var bodyParser = require( 'body-parser' );
var logger = require( 'morgan' );
var cookieParser = require('cookie-parser');
var cors = require( 'cors' );
var sqlite = require( 'sqlite3' ).verbose();
var uuid = require( 'node-uuid' );
var shortid = require( 'shortid' );

var database = 'database.dat';

// Standard plug and play modules
app.use( bodyParser.urlencoded( {extended: true } ) );
app.use( bodyParser.json() );
app.use( logger( 'dev' ) );
app.use( cookieParser() );
app.use( cors() );

// Setup a router to route requests on the /api endpoint
var Router = express.Router();
app.use( '/', Router );

// TODO: Hndle errors

Router.route( '/users' )
      .post( function( req, res ) {
          // Create a ACCESS-KEY or just return an existing ACCESS-KEY
          var db = new sqlite.Database( database );
          db.get( 'SELECT * FROM users WHERE user=?', [ req.body.email ], function( err, row ) {
              var key = null;

              if ( row ) {
                  key = row.key;
              } else {
                  key = uuid.v4();
                  db.run( 'INSERT INTO users VALUES ( ?, ? )', [ req.body.email, key ] );
              }

              console.log( '[ RESPONSE] sending key: ' + key + ' for user: ' + req.body.email );
              res.send( { "key": key } );
          } );
          db.close();
      } );

Router.route( '/questions' )
      .get( function( req, res ) {
          // Return a list of questions created by the ACCESS-KEY
          var db = new sqlite.Database( database );
          db.all( 'SELECT qid, question FROM questions WHERE creator=?', [ req.headers[ 'x-access-key'] ], function( err, rows) {
              console.log( '[ RESPONSE ] Questions created by ' + req.headers[ 'x-access-key' ] );
              console.log( rows );
              res.send( rows );
          } );
          db.close();
      } )
      .post( function( req, res ) {
          // Create a question, options with creator ACCESS-KEY
          var key = shortid.generate();
          var creator = req.headers[ 'x-access-key' ];
          var question = req.body.question;
          var options = JSON.stringify( req.body.options );

          var db = new sqlite.Database( database );
          db.run( 'INSERT INTO questions VALUES( ?, ?, ?, ? )', [ key, creator, question, options ], function( err ) {
              console.log( '[ DB ] (' + key + ',' + creator + ',' + question + ',' + options + ')' );

              if( err === null ) {
                  res.send( { "key": key } );
              } else {
                  res.status( 404 ).send();
              }
          } );
          db.close();
      } );

Router.route( '/questions/:id' )
      .get( function( req, res ) {
          var question = req.params.id;
          var creator = req.headers[ 'x-access-key' ];

          var db = new sqlite.Database( database );
          db.get( 'SELECT * FROM questions WHERE qid=?', [ question ], function( err, row ) {
              var results = {};
              if( row ) {
                  db.each( 'SELECT * FROM responses WHERE qid=?', [ question ], function( err, row ) {
                      results[ row.options ] = ( results[ row.options ] )? results[ row.options ]++ : 1;
                  } );
                  res.send( { "question": row.question, "options": JSON.parse( row.options ), "results": results });
              }
          } );
          db.close();
      } );

Router.route( '/vote/:id' )
      .post( function( req, res ) {
          // Check if USER_KEY is allowed to vote

          // Add vote to id with POST param option
          var qid = req.body.qid;
          var user = req.body.email;
          var option = req.body.option;

          var db = new sqlite.Database( database );
          db.run( 'INSERT INTO responses VALUES( ?, ?, ? )', [ qid, user, option ], function(err) {
              if( err === null ) {
                  res.send();
              } else {
                  res.status(404).send();
              }
          });
          db.close();

      } );

// Start the server
var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
