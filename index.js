/**
 * Created by root on 3/3/17.
 */
var express = require("express");
var bodyParser = require("body-parser");
var app = express();


app.use(express.static(__dirname + '/uploads'));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

var routes = require("./routes/routes.js")(app);

var server = app.listen(process.env.PORT || 5000, function () {
    console.log("Listening on port %s...", server.address().port);
});
