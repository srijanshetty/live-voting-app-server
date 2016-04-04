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

Router.route( '/users' )
      .post( function( req, res ) {
          // Create a ACCESS-KEY or just return an existing ACCESS-KEY
          var db = new sqlite.Database( database );
          db.get( 'SELECT * FROM users WHERE user=?', [ req.body.email ], function( err, row ) {
              if( err ) {
                  res.status( 404 ).send();
              }

              var key = null;

              if ( row ) {
                  key = row.key;
              } else {
                  key = uuid.v4();
                  db.run( 'INSERT INTO users VALUES ( ?, ? )', [ req.body.email, key ] );
              }

              console.log( '[ RESPONSE ] sending key: ' + key + ' for user: ' + req.body.email );
              res.send( { "key": key } );
          } );
          db.close();
      } );

Router.route( '/questions' )
      .get( function( req, res ) {
          // Return a list of questions created by the ACCESS-KEY
          var db = new sqlite.Database( database );
          db.all( 'SELECT qid, question FROM questions WHERE creator=?', [ req.headers[ 'x-access-key'] ], function( err, rows) {
              if( err ) {
                  res.status( 404 ).send();
              }

              console.log( '[ RESPONSE ] Questions created by ' + req.headers[ 'x-access-key' ] );
              console.log( rows );
              res.send( rows );
          } );
          db.close();
      } )
      .post( function( req, res ) {
          // Create a question, options with creator ACCESS-KEY
          var qid = shortid.generate();
          var creator = req.headers[ 'x-access-key' ];
          var question = req.body.question;
          var options = JSON.stringify( req.body.options );

          var db = new sqlite.Database( database );
          db.run( 'INSERT INTO questions VALUES( ?, ?, ?, ?, NULL, 0 )', [ qid, creator, question, options ], function( err ) {
              console.log( '[ INSERT ] [ questions ] (' + qid + ',' + creator + ',' + question + ',' + options + ')' );

              if( err === null ) {
                  res.send( { "key": qid } );
              } else {
                  console.log( '[ ERROR ]', err );
                  res.status( 404 ).send();
              }
          } );
          db.close();
      } );

Router.route( '/questions/:id' )
      .get( function( req, res ) {
          var qid = req.params.id;
          var creator = req.headers[ 'x-access-key' ];

          var db = new sqlite.Database( database );
          db.get( 'SELECT * FROM questions WHERE qid=?', [ qid ], function( err, row ) {
              if( err ) {
                  res.status( 404 ).send();
              }

              if( row ) {
                  db.all( 'SELECT * FROM responses WHERE qid=?', [ qid ], function( err, rows ) {
                      var results = {};
                      rows.forEach( function( row ) {
                          results[ row.option ] = ( results[ row.option ] )? ++results[ row.option ] : 1;
                      } );

                      console.log( '[ RESPONSE ]' + JSON.stringify( rows ) ) ;
                      res.send( {
                          "qid": qid,
                          "question": row.question,
                          "options": JSON.parse( row.options ),
                          "stats": results,
                          "next_qid": row.next_qid
                      });
                  } );
              }
          } );
          db.close();
      } )
      .put( function( req, res ) {
          var qid = req.params.id;
          var creator = req.headers[ 'x-access-key' ];

          var next_qid = req.body.next_qid;
          var question = req.body.question;
          var options = req.body.options;

          var db = new sqlite.Database( database );
          db.get( 'SELECT * FROM questions WHERE qid=?', [ qid ], function( err, row ) {
              console.log( '[ QUERY ]', row );

              if( err ) {
                  console.log( '[ ERROR ]', err );
                  res.status( 404 ).send();
              }

              // Only the creator should be allowed to upate
              if( row.creator !== creator ) {
                  console.log( '[ ERROR ] User is not allowed to update' );
                  res.status( 404 ).send();
              }

              if( row ) {
                  if ( !!next_qid ) {
                      db.run( 'UPDATE questions SET next_qid=? WHERE qid=?', [ next_qid, qid ], function( err ) {
                          console.log( '[ UPDATE ] [ questions - next_qid ]' + next_qid ) ;

                          if( err !== null ) {
                              console.log( '[ ERROR ]', err );
                              res.status( 404 ).send();
                          }
                      } );
                  }

                  if ( !!question ) {
                      db.run( 'UPDATE questions SET question=? WHERE qid=?', [ question, qid ], function( err ) {
                          console.log( '[ UPDATE ] [ questions - question ]' + question ) ;

                          if( err !== null ) {
                              console.log( '[ ERROR ]', err );
                              res.status( 404 ).send();
                          }
                      } );
                  }

                  if ( !!options ) {
                      db.run( 'UPDATE questions SET options=? WHERE qid=?', [ options, qid ], function( err ) {
                          console.log( '[ UPDATE ] [ questions - options ]' + options ) ;

                          if( err !== null ) {
                              console.log( '[ ERROR ]', err );
                              res.status( 404 ).send();
                          }
                      } );
                  }

                  res.send();
              }
          } );
          db.close();
      } )
      .delete( function( req, res ) {
          var qid = req.params.id;
          var creator = req.headers[ 'x-access-key' ];

          var db = new sqlite.Database( database );
          db.get( 'SELECT * FROM questions WHERE qid=?', [ qid ], function( err, row ) {
              if( err ) {
                  console.log( '[ ERROR ]', err );
                  res.status( 404 ).send();
              }

              // Only the creator should be allowed to upate
              if( row.creator !== creator ) {
                  res.status( 404 ).send();
              }

              if( row ) {
                  db.run( 'UPDATE questions SET inactive=1 WHERE qid=?', [ qid ], function( err ) {
                      console.log( '[ ARCHIVE ] [ questions ]' + qid ) ;

                      if( err !== null ) {
                          console.log( '[ ERROR ]', err );
                          res.status( 404 ).send();
                      }
                  } );
              }
          } );
          db.close();

      } );

Router.route( '/vote/:id' )
      .post( function( req, res ) {
          // TODO: Check if ACCESS-KEY is allowed to vote

          // Check for duplicate votes using PRIMARY KEY
          // Add vote to id with POST param option
          var qid = req.body.qid;
          var user = req.headers[ 'x-access-key' ];
          var option = req.body.option;

          var db = new sqlite.Database( database );
          db.get( 'SELECT * FROM questions WHERE qid=?', [ qid ], function( err, row ) {
              console.log( '[ QUERY ] ', row );

              if( err ) {
                  console.log( '[ ERROR ]', err );
                  res.status( 404 ).send();
              }

              if( row.inactive === 1 ) {
                  console.log( '[ ERROR ] Question is archived ' );
                  res.status( 404 ).send();
              }

              if( row ) {
                  db.run( 'INSERT INTO responses VALUES( ?, ?, ? )', [ qid, user, option ], function( err ) {
                      console.log( '[ UPDATE ] [ responses ] ' + qid, ',' + user + ',' + option );

                      if( err !== null ) {
                          console.log( '[ ERROR ]', err );
                          res.status( 404 ).send();
                      }
                  } );
              }

              res.send();
          } );
          db.close();
      } );

// Start the server
var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
