// random_story.js
// p75
// 単純なアプリケーションで実装したシリアルフロー制御

var fs = require('fs');
var request = require('request');
var htmlparser = require('htmlparser');
var configFilename = './rss_feeds.txt';
var result, next;
var DEBUG = false;

function checkForRSSFile () {
  fs.exists( configFilename, function( exists) {
    if (!exists) {
      return next( new Error( 'Missing RSS file: ' + configFilename));
	}
    next( null, configFilename );
  });
}

function readRSSFile( configFilename ) {
  fs.readFile( configFilename, function( err, feedList ) {
    if (err) { return next( err ); }
    feedList = feedList
      .toString()
      .replace( /^\s+|\s+$/g, '')   // 先頭・末尾の空白・タブを取り除く
      .split("\n");
    var random = Math.floor(Math.random() * feedList.length );

    if ( DEBUG ) { console.log(feedList[random]); }
    
    next( null, feedList[random] );
  });
}

function downloadRSSFeed( feedUrl ) {
  request( { uri: feedUrl }, function( err, res, body ) {
    if (err) {return next(err);}
    if (res.statusCode !== 200) {
      return  next( new Error( 'Abnormal response status code' ));
	}

    next( null, body );
  });
}

function parseRSSFeed (rss) {
  var items;
  var handler = new htmlparser.RssHandler();
  var parser = new htmlparser.Parser( handler );
  parser.parseComplete( rss );

  if ( !handler.dom.items.length ) {
    return next( new Error( 'No RSS items found.' ));
  }

  // var item = handler.dom.items.shift();
  items = handler.dom.items;
  items.forEach ( function (item) {
	console.log( item.title );
	console.log( item.link );
  });
}

var tasks = [ checkForRSSFile,
              readRSSFile,
              downloadRSSFeed,
              parseRSSFeed ];

// このnext関数を呼び出すと、次のタスクが実行される
next = function ( err, result ) {
  if (err) { throw err; }

  var currentTask = tasks.shift();

  if ( DEBUG ) { console.log('RESULT NOW: ' + result); }
  
  if (currentTask) {
    currentTask( result );    // 現在のタスクを実行
  }
};

next();    // タスクのシリアル実行を開始
