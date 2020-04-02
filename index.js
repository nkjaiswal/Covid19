var express    = require('express');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session');
var app = express();


app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.set('trust proxy', 1);
app.use(cookieSession({
	name: 'session',
	keys: ['niszx', 'xzsin']
}));
var port = process.env.PORT || 3000;
var server = app.listen(port, function(){
    console.log('Listening at http://127.0.0.1:' + port);    
});
var Client = require('node-rest-client').Client;
 
var client = new Client();
var url = "https://www.trackcorona.live/api/countries/";
var cases_cache = [];
function refresh_data () {
    client.get(url, function(data, res){
        var cases = data.data;
        for(var i=0; i<cases.length; i++){
            var total = cases[i].dead + cases[i].recovered;
            cases[i].total_closed_cases = total;
            if(total == 0) {
                cases[i].death_rate = 0;
                cases[i].recovery_rate = 0;
            } else {
                cases[i].death_rate = (cases[i].dead *100)/total;
                cases[i].recovery_rate = (cases[i].recovered *100)/total;
            }
        }
        cases_cache = cases;
        build_table();
    });
}
var html_table = "";
function build_table() {
    html_table = "<table border='1'>";
    html_table += "<tr><td>Country</td><td>Confirmed</td><td>Death</td><td>Recovered</td><td>Total Closed Cases</td><td>Death Rate % (Death/Total Closed Cases)</td><td>Recovery Rate % (Recover/Total Closed Cases)</td></tr>";
    for (var i=0; i<cases_cache.length; i++){
        console.log(cases_cache[i]);
        html_table += "<tr>";
        html_table += "<td>" + cases_cache[i].location + "</td>";
        html_table += "<td>" + cases_cache[i].confirmed + "</td>";
        html_table += "<td>" + cases_cache[i].dead + "</td>";
        html_table += "<td>" + cases_cache[i].recovered + "</td>";
        html_table += "<td>" + cases_cache[i].total_closed_cases + "</td>";
        html_table += "<td>" + cases_cache[i].death_rate.toFixed(2) + "</td>";
        html_table += "<td>" + cases_cache[i].recovery_rate.toFixed(2) + "</td>";
        html_table += "</tr>";
    }
    html_table += "</table>";
}

function timeout() {
    setTimeout(function () {
        refresh_data();
        console.log("Refreshed");
        timeout();
    }, 60 * 1000);
}
refresh_data();
timeout();

app.all("/*", function(req, res){
    if(req.query.format == 'json') {
        res.json(cases_cache);
    } else {
        res.send(html_table);
    }
});