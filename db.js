var express = require('express');
var router = express.Router();
var mysql=require('promise-mysql');


var mydb={
    host: "remotemysql.com",
    user: "qXdzByLoJg",
    password: "exW2T8r4xh",
    database: "qXdzByLoJg",

    // host: '35.244.6.28',
    // user: 'root',
    // password: 'abcd',
    // database: 'qms1',

    multipleStatements: true,
    connectionLimit: 100
};


var pool;
//pool==db
function connectDatabase() {
    if (!pool) {
        pool = mysql.createPool(mydb);
        console.log(__dirname);

        // Test the connection
        pool.query('SELECT 1', [], function(err,rows) {
            if (err)
             {
              console.log('Please Check !Why DB not connected')
              console.log(err)
              if (err.code === 'PROTOCOL_CONNECTION_LOST') {
              console.error('Database connection was closed.')
              }
              if (err.code === 'ER_CON_COUNT_ERROR') {
                  console.error('Database has too many connections.')
              }
              if (err.code === 'ECONNREFUSED') {
                  console.error('Database connection was refused.')
              }
            }
            else  
            console.log('DB Connection is ok');
        });

        //The pool will emit a connection event when a new connection is made within the pool. If you need to set session variables on the connection before it gets used, you can listen to the connection event.

          pool.on('connection', function (connection) {
          console.log('DB Connection established');

          connection.on('error', function (err) {
            console.error(new Date(), 'MySQL error', err.code);
          });
          connection.on('close', function (err) {
            console.error(new Date(), 'MySQL close', err);
          });

        });
        // The pool will emit an acquire event when a connection is acquired from the pool. This is called after all acquiring activity has been performed on the connection, right before the connection is handed to the callback of the acquiring code.

        pool.on('acquire', function (connection) {
          console.log('Connection %d acquired', connection.threadId);
        });

        // The pool will emit an enqueue event when a callback has been queued to wait for an available connection.

        pool.on('enqueue', function () {
          console.log('Waiting for available connection slot');
        });

        //The pool will emit a release event when a connection is released back to the pool. This is called after all release activity has been performed on the connection, so the connection will be listed as free at the time of the event.

        pool.on('release', function (connection) {
          console.log('Connection %d released', connection.threadId);
        });
    }
    return pool;
}





module.exports = connectDatabase();

// pool.end(function (err) {
//   // all connections in the pool have ended
// });
