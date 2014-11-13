(function(){

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Dashboard Settings
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var settings = {
    ssl           : true,
    subscribe_key : 'sub-c-44d3418c-4855-11e4-8a5b-02ee2ddab7fe',
    publish_key   : 'pub-c-eae49ba3-b1ee-46c4-8674-27ce042e7ab3',
    channel       : urlsetting()
};

var pubnub       = PUBNUB(settings);
var starttime    = now();
var genstarttime = now();
var salebellwait = 3000;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Startup Metrics Default Dashboard Position
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var startupmetrics = JSON.parse(PUBNUB.db.get(settings.channel)) || {

    // Whitelable
    title            : "Max T's",
    subtitle         : "I'm So Fancy",
    logo_img         : "img/pubnub.png",

    // Vanity Labels
    vanity_one       : 'MENTIONS',
    vanity_two       : 'FOLLOWERS',
    vanity_three     : 'COMMENTS',
    vanity_four      : 'STACKOVERFLOW',

    // Acquisition
    acquisition      : 55,
    acquisition_goal : 100,

    // Activation
    activation       : 10,
    activation_goal  : 20,

    // Retention
    retention        : 289,
    retention_goal   : 250,

    // Revenue
    revenue          : 890,
    revenue_goal     : 1200,

    // Referrals
    mentions         : 342,
    attendees        : 89,
    articles         : 45,
    stackoverflow    : 8

};

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Bootstrap Startup Metrics
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
pubnub.history({
    limit    : 1,
    channel  : settings.channel,
    callback : function(msgs) { save(msgs[0][0] || {}) }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Live Startup Metrics
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
pubnub.subscribe({
    channel : settings.channel,
    message : function(msg) { save(msg) }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Update Startup Metrics
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
update_metrics(startupmetrics);
function update_metrics(startup) {
    PUBNUB.each( startup, function( metric, value ) {
        // Update Metric Display
        var display = PUBNUB.$(metric);
        if (!display) return;

        // Logo Whitelabel
        if (metric.indexOf('_img') > 0) return PUBNUB.css( display, {
            'background-image' : 'url('+value+')'
        } );

        // Revenue Money Sales Bell
        if (
            metric === 'revenue'           &&
            +value                         &&
            +display.innerHTML             &&
            +value != (+display.innerHTML) &&
            +value != (+PUBNUB.attr( display, 'upcoming' ))
        ) ring_bell( +value < (+display.innerHTML) );

        // Set Display for Awesome?
        update_display( display, value );

        // Generic Update Sound
        update_sound(metric);

        // Percentage Display if Relevant
        if (metric.indexOf('_goal') < 0) return;

        var metric_name  = metric.split('_goal')[0]
        ,   metric_value = startup[metric_name]
        ,   metric_goal  = value;

        // Update GUI Percent Circle Metrics
        update_circle_metrics( metric_name, metric_value, metric_goal );
    } );
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Visually Update Startup Metrics with Maybe Animations
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function update_display( display, value ) {
    var original = display.innerHTML
    ,   upcoming = PUBNUB.attr( display, 'upcoming' );

    // Save Upcoming Value
    if (upcoming == value) return;
    PUBNUB.attr( display, 'upcoming', value );

    // Render Display
    if (!!(+original+ +value) && original != value) (function(){
        var frame = 1.0
        ,   total = 15
        ,   ori   = +original
        ,   val   = +value;

        function updater(frame) { setTimeout( function() {
            display.innerHTML = Math.floor(
                ori + (val - ori) * (frame / total)
            );
        }, frame * 180 ) }

        while (frame <= total) updater(frame++);

    })(); else display.innerHTML = value;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Save Startup Metrics
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function save( modification, broadcast ) {
    PUBNUB.each( modification, function( k, v ) { startupmetrics[k] = v } );
    PUBNUB.db.set( settings.channel, JSON.stringify(startupmetrics) );
    update_metrics(startupmetrics);

    if (!broadcast) return;
    pubnub.publish({ channel : settings.channel, message : startupmetrics });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Update Startup Metrics Circles
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function update_circle_metrics( name, value, goal ) {
    var circle  = PUBNUB.$('pc_'+name)
    ,   percent = PUBNUB.$('percent_'+name)
    ,   result  = Math.floor( (+value / (+goal||1)) * 100 )
    ,   resmax  = (result > 999 ? 999 : result)
    ,   pclass  = ' p' + (result > 100 ? 100 : result);

    circle.className = circle.className.replace( / p[^ ]+/, ' p00' );
    circle.className = circle.className.replace( / p[^ ]+/, pclass );

    update_display( percent, resmax )
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Change UI Element - Update the Values Visually
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
PUBNUB.bind( 'mousedown,touchstart', document, function(element) {
    var target = (element.target || element.srcElement)
    ,   id     = PUBNUB.attr( target, 'id' )
    ,   input  = PUBNUB.$('editor-input')
    ,   editor = PUBNUB.$('editor');

    // Ignore Clicking Editor Controls
    if (!id || id.indexOf('editor') >= 0) return true;

    // Show Editor GUI
    PUBNUB.attr( input, 'directive', id );
    show_editor(true);

    input.value = startupmetrics[id] ||
        target.innerHTML.replace(/^\s+|\s+$/g,'');

    setTimeout( function(){input.focus();input.select()}, 250 );

    return true;
} );

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Show Editor
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function show_editor(yes) {
    PUBNUB.css( PUBNUB.$('editor'), { display : (yes ? 'block' : 'none') } );
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Generic Update Sound
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function update_sound(metric) {
    if (genstarttime + salebellwait > now()) return;
    if (
        metric === 'acquisition' ||
        metric === 'activation'  ||
        metric === 'retention'   ||
        metric === 'mentions'    ||
        metric === 'attendees'   ||
        metric === 'articles'    ||
        metric === 'stackoverflow'
    ) {
        sounds.play( 'sounds/success', 2000 );
        genstarttime = now();
    }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Sales Bell
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
window.ring_bell = ring_bell;
function ring_bell(downd) {
    // Prevent Early Sales Bell on Boot
    if (starttime + salebellwait > now()) return;
    starttime = now();

    // Play Sales Bell Sound "money.mp3" or "money.ogg"
    if (!downd) sounds.play( 'sounds/money',    16000 );
    else return sounds.play( 'sounds/decrement', 2000 );

    // Display Animation
    var bell = PUBNUB.$('salesbell');

    PUBNUB.css( bell, { opacity : 0.0, display : 'block' } );
    setTimeout( function() {
        PUBNUB.css( bell, { opacity : 1.0 } );
    }, 500 );

    setTimeout( function() {
        PUBNUB.css( bell, { opacity : 0.0 } );
    }, 12000 );
    setTimeout( function() {
        PUBNUB.css( bell, { display : 'none' } );
    }, 14000 );
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Editor Controls - SAVE
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
PUBNUB.bind( 'click', PUBNUB.$('editor-save'), save_edits );
PUBNUB.bind( 'keydown', PUBNUB.$('editor-input'), function(e) {
    var charcode = (e.keyCode || e.charCode);

    if (charcode === 27) return show_editor(false);
    if (charcode !== 13) return true;

    return save_edits();
} );

function save_edits() {
    var input  = PUBNUB.$('editor-input')
    ,   id     = PUBNUB.attr( input, 'directive' )
    ,   target = PUBNUB.$(id)
    ,   value  = PUBNUB.$('editor-input').value
    ,   modify = {};

    if (!value) return;

    // Save Change
    modify[id] = value;
    save( modify, true );

    show_editor(false);
    return false;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Editor Controls - CANCEL
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
PUBNUB.bind( 'click', PUBNUB.$('editor-cancel'), function() {
    show_editor(false);
} );

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Offset
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function offset( node, what ) {
    var pos  = 0
    ,   what = what || 'Top';

    while (node) {
        pos += node['offset'+what];
        node = node.offsetParent;
    }

    return pos;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Right Now
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function now() { return+new Date() }

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// URL Param Setting
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function urlsetting() {
    var standard = 'standard-' + now()
    ,   spliter  = '?company=';

    if (location.href.indexOf(spliter) < 0) return standard;
    return location.href.split(spliter)[1].split('&')[0] || standard;
}


})();
