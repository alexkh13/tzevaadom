var soundCounter = 0;
var t;
$(document).ready(function () {
    var a = getPlaySoundPref();
    if(a == null) {
        a = 1;
        setPlaySoundPref(1);
    }

    if(String(a) == '1')
        $('#sound_cb').prop('checked', true);
    else {
        $('#sound_cb').prop('checked', false);
    }
    //var t = setInterval(getJson, 2000);
});

function getJson() {
    $.ajax({
        url: "http://push_test.tzevaadom.com/alert.json?cb="+(+new Date),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        cache: false,
        success: function (data) { checkJson(data); },
        error: function (requestObject, error, errorThrown) { }
    });
}
function checkJson(warnDetails) {
    clearTimeout(t);
    t = setTimeout(clearMarkers, 120000);
    var cities = warnDetails;
    var coords;
    var str = "<ul>";
    if(cities !=null && $.trim(cities)!='') {
        $('#all_good').css('display', 'none');
        var myDate = new Date();
        setLastWarn(myDate.getTime());
        $.each(cities, function(k, v) {
            var city_name = String(v).split(",").join("</li><li>");
            if(k == "Coords")
                drawOnMap(v);
            else if(k != "ID")
                str = str + "<h2><li>" +k + "</li></h2><h3><ul><li>" + city_name + "</li></ul></h3><br />";

        });
        str = str + "</ul>";
        warningStart(str);
    }
    else {
        warningStop();
    }
}

var audio = new Audio();
audio.src="sound.mp3"; //Insert sound here
function warningStart(warnDetails) {
    var date_now = new Date();
    var sec = date_now.getSeconds();
    if(sec % 3 == 1)
        $(document).prop('title', '~אזעקה~~~');
    else if(sec % 3 == 2)
        $(document).prop('title', '~~אזעקה~~');
    else
        $(document).prop('title', 'אזעקה~~~~');

    $('body').css('background-color', 'red');
    $('#data').css('background-color', 'red');
    $('#list').html(warnDetails);
    var a = getPlaySoundPref();
    if(String(a) == '1' && (soundCounter < 5)) {
        audio.play();
        soundCounter = soundCounter + 1;
    }
}
function warningStop() {
    soundCounter = 0;
    var date_now = new Date();
    var diff = date_now.getTime() - getLastWarn();
    if(diff > 30 * 1000) {
        $(document).prop('title', 'צבע אדום - בזמן אמת');
        $('#all_good').css('display', 'block');
        $('body').css('background-color', 'white');
        $('#data').css('background-color', 'white');
        $('#list').html("");
        clearMarkers();
        if(parseInt(getLastWarn()) > 0)
            $('#last_update').html("<h4>אזעקה אחרונה <u>שדווחה למחשב הזה: </u><br />"+new Date(parseInt(getLastWarn()))+"</h4>");
    }
    if(diff < 10 * 1000) {
        document.getElementById('last_alert_if').contentDocument.location.reload(true);
    }
}
function setLastWarn(alertId) {
    document.cookie = "last_warning=" + alertId + ";path=/";
}
function getLastWarn() {
    var arrCookies = document.cookie.split("; ");
    for (var i = 0 ; i < arrCookies.length ; i++) {
        var arrCookie = arrCookies[i].split("=");
        if (arrCookie[0] == "last_warning") {
            return unescape(arrCookie[1]);
        }
    }
}

function setPlaySoundPref(pref) {
    document.cookie = "want_sound=" + pref + ";path=/";
}
function getPlaySoundPref() {
    var arrCookies = document.cookie.split("; ");
    for (var i = 0 ; i < arrCookies.length ; i++) {
        var arrCookie = arrCookies[i].split("=");
        if (arrCookie[0] == "want_sound") {
            return unescape(arrCookie[1]);
        }
    }
}
function handleSetSound(cb) {
    if(cb.checked)
        setPlaySoundPref(1);
    else
        setPlaySoundPref(0);
}





var map;
var markers = [];
function drawOnMap(coords) {
    var c_arr = String(coords).split(",");
    for(var i = 0; i < c_arr.length; i++) {
        coord = c_arr[i].split(";");
        myLatlng = new google.maps.LatLng(coord[0],coord[1]);
        marker = new google.maps.Marker({position: myLatlng, map: window.map, title: String(myLatlng)});
        markers.push(marker);
    }
}

function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

function initialize() {
    var myCenter = new google.maps.LatLng(31.6,34.6542927);
    var mapOptions = {zoom: 10, center: myCenter}
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}

google.maps.event.addDomListener(window, 'load', initialize);
