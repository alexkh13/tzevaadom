var HTTP_DATA_API = "http://www.tzevaadom.com/alert.json";
var APPLICATION_LISTEN_PORT = 8080;

var _ = require('underscore');
var sqlite = require('sqlite3').verbose();
var request = require('superagent');
var app = require('express')();
var gcm = require('node-gcm');
var bodyParser = require('body-parser'); // express middle-ware

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use( bodyParser.urlencoded({
    extended: true
}) ); // to support URL-encoded bodies

//API Server Key
var sender = new gcm.Sender('AIzaSyDMmPbjxvdS0TTp6bAYw7YGCuMlm50LMz8');

var db = new sqlite.Database('db.sqlite', initializeApplication);

function broadcastMessage(msg, data) {

    var message = new gcm.Message();

    // Value the payload data to send...
    message.addData('message', msg);
    message.addData('title','התראת צבע אדום' );
    message.addData('data', JSON.stringify(data));
//    message.addData('msgcnt','3'); // Shows up in the notification in the status bar
    //message.collapseKey = 'demo';
    //message.delayWhileIdle = true; //Default is false
    message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.

    getRegistrationIds(function(registrationIds) {
        /**
         * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
         */
        if(registrationIds.length) {
            sender.send(message, registrationIds, 4, function(result) {

            });
        }
    });

}

function initializeApplication() {
    app['post']('/debug', function(req,res){
        parse({
            'עוטף עזה 230': ['כיסופים'],
            'Coords': '31.373266;34.399188',
            'ID': ''
        });
        res.send("OK");
    });
    app['post']('/register', function(request, response) {
        var registrationId = request.body['registrationId'];
        if(registrationId) {
            var message = "";
            register(registrationId, function(err, success) {
                if(!err) {
                    if(!success) {
                        console.log(message = "Client with registrationId " + registrationId + " already exists");
                    }
                    else {
                        console.log(message = "Successfully registered " + registrationId);
                    }
                }
                else {
                    console.log("Error: " + err);
                    message = "Could not register " + registrationId;
                }
                response.send({
                    status: !err,
                    message: message
                });
            });
        }
        else {
            response.send({
                status: false,
                message: "Invalid registrationId " + registrationId
            })
        }
    });

    getRegistrationIds(function(ids){
        console.log("Clients: " + ids);
    });

    app.listen(APPLICATION_LISTEN_PORT);
}

function getRegistrationIds(callback) {
    var result = [];
    db.all("SELECT registrationId FROM Clients", function(err, rows) {
        _.each(rows, function(row) {
            result.push(row['registrationId']);
        });
        callback(result);
    });
}

function isRegistrationIdExists(id, callback) {
    db.get("SELECT registrationId FROM Clients WHERE registrationId = ?", id, function(err, rows) {
        callback(!!rows);
    });
}

function register(id, callback) {
    isRegistrationIdExists(id, function(exist) {
        if(!exist) {
            db.run("INSERT INTO Clients(registrationId) VALUES(?)", id, callback);
        }
        else {
            callback(null, false);
        }
    })
}

var currentAreas = {};

function parse(data) {
    var areas = [];
    var now = {};
    var newData = {};
    _.each(data, function(value, key) {
        if(key != "Coords" && key != "ID") {
            now[key] = true;
            if(!currentAreas[key]) {
                areas.push(key);
                currentAreas[key] = true;
                newData[key] = value;
            }
        }
        else {
            newData[key] = value;
        }
    });
    _.each(currentAreas, function(area) {
        if(!now[area]) {
            delete currentAreas[area];
        }
    });
    if(areas.length){
        broadcastMessage(areas.join(','), newData);
    }
}

function poll() {
    request
        .get(HTTP_DATA_API)
        .end(function(err, res){
            if(!err) {
                parse(res.body);
            }
            else {
                console.log(err);
            }
        });
}

setInterval(poll, 2000);

