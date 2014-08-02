/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var SERVER = "http://10.0.0.9:8080";
var app = {
    // Application Constructor
    initialize: function() {
        this.pushNotification = window.plugins.pushNotification;
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        try
        {
            if (device.platform == 'android' || device.platform == 'Android' ||
                device.platform == 'amazon-fireos' ) {
                app.pushNotification.register(app.successHandler, app.errorHandler, {"senderID":"1076381262677","ecb":"onNotification"});		// required!
            } else {
                app.pushNotification.register(app.tokenHandler, app.errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});	// required!
            }
        }
        catch(err)
        {
            alert(err.message);
        }

    },
    // Update DOM on a Received Event
    successHandler: function(id) {

    },
    tokenHandler: function() {

    },
    errorHandler: function(err) {
        alert(err);
    }
};

// handle APNS notifications for iOS
function onNotificationAPN(e) {
    if (e.alert) {
        $("#app-status-ul").append('<li>push-notification: ' + e.alert + '</li>');
        // showing an alert also requires the org.apache.cordova.dialogs plugin
        navigator.notification.alert(e.alert);
    }

    if (e.sound) {
        // playing a sound also requires the org.apache.cordova.media plugin
        var snd = new Media(e.sound);
        snd.play();
    }

    if (e.badge) {
        pushNotification.setApplicationIconBadgeNumber(successHandler, e.badge);
    }
}

// handle GCM notifications for Android
function onNotification(e) {

    switch( e.event )
    {
        case 'registered':
            if ( e.regid.length > 0 )
            {
                // Your GCM push server needs to know the regID before it can push to this device
                // here is where you might want to send it the regID for later use.
                $.ajax( {
                    url: SERVER + "/register",
                    type: 'POST',
                    data: {
                        registrationId: e.regid
                    },
                    success: function(res) {
                        if(!res.status) {
                            alert(res.message);
                        }
                    },
                    error: function(xhr, status) {
                        alert(status + ":" + xhr.xhr.responseText);
                    }
                });
            }
            break;

        case 'message':
            // if this flag is set, this notification happened while we were in the foreground.
            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
            if (e.foreground)
            {
                // on Android soundname is outside the payload.
                // On Amazon FireOS all custom attributes are contained within payload
                var soundfile = e.soundname || e.payload.sound;
                // if the notification contains a soundname, play it.
                // playing a sound also requires the org.apache.cordova.media plugin
                var my_media = new Media("/android_asset/www/"+ soundfile);

                my_media.play();
            }
            else
            {	// otherwise we were launched because the user touched a notification in the notification tray.
                if (e.coldstart) {
//                            $("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
                }
                else {
//                            $("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
                }
            }

            checkJson(e.payload.data);

            break;

        case 'error':
            alert("error: " + e.msg);
            break;

        default:
            alert("unknown event");
            break;
    }
}


app.initialize();