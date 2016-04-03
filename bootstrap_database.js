/*
 * Copyright (c) 2016 Srijan R Shetty
 * Author: Srijan R Shetty <srijan.shetty+code@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var sqlite = require( 'sqlite3' ).verbose();
var db = new sqlite.Database( 'database.dat' );

db.serialize( function() {
    db.run( 'CREATE TABLE users ( user TEXT, key TEXT )')
    db.run( 'CREATE TABLE questions ( qid TEXT NOT NULL, creator TEXT, question TEXT, options TEXT, next_qid TEXT )');
    db.run( 'CREATE TABLE validation ( qid TEXT, user TEXT )');
    db.run( 'CREATE TABLE responses ( qid TEXT, user TEXT, option TEXT, PRIMARY KEY( qid, user ) )');
});

db.close();
