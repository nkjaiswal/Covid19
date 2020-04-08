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

var html_tbl = {
    Location:"",
    Confirmed:"",
    Death:"",
    Recovered:"",
    total_closed_cases:"",
    death_rate:"",
    recovery_rate:""
}
function refresh_data () {
    client.get(url, function(data, res){
        var cases = data.data;
        var sum_confirmed = 0, sum_death = 0, sum_recovered = 0, predicted_death = 0;
        for(var i=0; i<cases.length; i++){
            sum_confirmed += cases[i].confirmed;
            sum_death += cases[i].dead;
            sum_recovered += cases[i].recovered;

            var total = cases[i].dead + cases[i].recovered;
            cases[i].total_closed_cases = total;
            if(total == 0) {
                cases[i].death_rate = 0;
                cases[i].recovery_rate = 0;
            } else {
                cases[i].death_rate = (cases[i].dead *100)/total;
                cases[i].recovery_rate = (cases[i].recovered *100)/total;
            }

            cases[i].death_prediction = (cases[i].death_rate * cases[i].confirmed)/100;
            predicted_death += cases[i].death_prediction;
        }
        cases.push({
                location: 'TOTAL',
                latitude: 0,
                longitude: 0,
                confirmed: sum_confirmed,
                dead: sum_death,
                recovered: sum_recovered,
                updated: 'N/A',
                total_closed_cases: sum_death + sum_recovered,
                death_rate: sum_death*100 / (sum_death + sum_recovered),
                recovery_rate: sum_recovered*100 / (sum_death + sum_recovered),
                death_prediction: predicted_death
        });
        console.log(cases.length);
        cases.sort(function(a, b){
            return a.location.localeCompare(b.location);
        });
        console.log(cases.length);
        cases_cache = cases;
        html_tbl.Location = build_table(cases);

        cases.sort(function(a, b){
            return b.confirmed - a.confirmed;
        });

        html_tbl.Confirmed = build_table(cases);

        cases.sort(function(a, b){
            return b.dead - a.dead;
        });

        html_tbl.Death = build_table(cases);

        cases.sort(function(a, b){
            return b.recovered - a.recovered;
        });

        html_tbl.Recovered = build_table(cases);

        cases.sort(function(a, b){
            return b.total_closed_cases - a.total_closed_cases;
        });

        html_tbl.total_closed_cases = build_table(cases);

        cases.sort(function(a, b){
            return b.death_rate - a.death_rate;
        });

        html_tbl.death_rate = build_table(cases);

        cases.sort(function(a, b){
            return b.recovery_rate - a.recovery_rate;
        });

        html_tbl.recovery_rate = build_table(cases);

        cases.sort(function(a, b){
            return b.death_prediction - a.death_prediction;
        });

        html_tbl.death_prediction = build_table(cases);
    });
}
function color(i){
    if (i%4==0)
        return "87A09B";
    if (i%4==1)
        return "75B687";
    if (i%4==2)
        return "7975B6";
    if (i%4==3)
        return "B175B6";
}
var html_table = "";
function build_table(cases_cache) {
    html_table = "<a href='/?format=json'>JSON</a> <a href='https://github.com/nkjaiswal/Covid19' target='_blank'>Source Code</a><hr><table border='1'>";
    html_table += "<tr><td><a href='/?format=Location'>Country</td><td><a href='/?format=Confirmed'>Confirmed</td><td><a href='/?format=Death'>Death</td><td><a href='/?format=Recovered'>Recovered</td><td><a href='/?format=total_closed_cases'>Total Closed Cases</td><td><a href='/?format=death_rate'>Death Rate % (Death/Total Closed Cases)</td><td><a href='/?format=recovery_rate'>Recovery Rate % (Recover/Total Closed Cases)</td><td><a href='/?format=death_prediction'>Predicted Death</a></td></tr>";
    for (var i=0; i<cases_cache.length; i++){
        
        
        if(cases_cache[i].location == "India")
            html_table += "<tr bgcolor='RED'>";
        else
            html_table += "<tr bgcolor='" + color(i) + "'>";
        html_table += "<td>" + cases_cache[i].location + "</td>";
        html_table += "<td>" + cases_cache[i].confirmed + "</td>";
        html_table += "<td>" + cases_cache[i].dead + "</td>";
        html_table += "<td>" + cases_cache[i].recovered + "</td>";
        html_table += "<td>" + cases_cache[i].total_closed_cases + "</td>";
        html_table += "<td>" + cases_cache[i].death_rate.toFixed(2) + "</td>";
        html_table += "<td>" + cases_cache[i].recovery_rate.toFixed(2) + "</td>";
        html_table += "<td>" + cases_cache[i].death_prediction.toFixed(0) + "</td>";
        html_table += "</tr>";
        
    }
    html_table += "</table>";
    return html_table;
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
    } else if(req.query.format == "Location") {
        res.send(html_tbl.Location);
    } else if(req.query.format == "Confirmed") {
        res.send(html_tbl.Confirmed);
    } else if(req.query.format == "Death") {
        res.send(html_tbl.Death);
    } else if(req.query.format == "Recovered") {
        res.send(html_tbl.Recovered);
    } else if(req.query.format == "total_closed_cases") {
        res.send(html_tbl.total_closed_cases);
    } else if(req.query.format == "death_rate") {
        res.send(html_tbl.death_rate);
    } else if(req.query.format == "recovery_rate") {
        res.send(html_tbl.recovery_rate);
    } else if(req.query.format == "death_prediction") {
        res.send(html_tbl.death_prediction);
    }else {
        res.send(html_tbl.Location);
    }
});