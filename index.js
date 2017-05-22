var Twit = require("twit");
var config = require("./config.js");
var moment = require("moment")
var fs = require('fs');
var Promise = require('bluebird');
var S = require("string");

var MAX_COUNT = 100;

var T = new Twit(config);

//save csv file header
var csvFile = "tweets.csv";
saveCsvHeader();

//prepere twitter query options
var date = moment().subtract(1, 'days').format("YYYY-MM-DD");
var options = {
	q: "airbnb since:"+date,
	lang: "en",
	count: MAX_COUNT
}

getTwitsAsync('search/tweets', options).then(getTwitsHistory);

/**
* This method query twitter API
*
* Params:
*	search - searching tweets
*	options - query params for searching tweets
*/
function getTwitsAsync(search,options) {
  return new Promise(function(resolve,reject){
    T.get(search,options,function(err, data, response){
      resolve(data);
    });
  });
}

/**
* This method check if there are more tweets to read 
*
* Params:
*	data - the returned data from the last API call
*/
function getTwitsHistory(data){
	var counter=0;
	for (i in data.statuses){
  		var twit = data.statuses[i];

  		//varify that the API truely returned tweets contain the string "airbnb"
  		if (S(twit.text.toLowerCase()).contains("airbnb")){
	  		var date = twit.created_at;

	  		//in order to save the tweets in a csv format we have to wrap the text with "" 
	  		//and wrap each "" in the middle of the tweet also with ""
	  		//example - the tweet: testing "twitter" API
	  		//will have to be saved to the csv file as: "testing ""twitter"" API"
	  		var text = S(twit.text).replaceAll('"', '""').collapseWhitespace().s;
	  		text = '"'+text+'"';	

	  		var line = date+","+text+"\n";
	  		fs.appendFileSync(csvFile, line);

	  		counter++;
  		}
  	}

  	console.log("read %d tweets from %s", counter, data.statuses[0].created_at);

	if (data.statuses.length == MAX_COUNT){
		var max_id = data.statuses[data.statuses.length-1].id;
  		options["max_id"] = max_id;
  		getTwitsAsync('search/tweets', options).then(getTwitsHistory);
	}
	else
		console.log(csvFile+' saved');
}

/**
* This method save the csv file header to the local directory
*/
function saveCsvHeader(){
	var header = "date,twit\n";
	if (fs.existsSync(csvFile)) {
	        fs.unlinkSync(csvFile);
	    }
	fs.appendFileSync(csvFile, header);	
}