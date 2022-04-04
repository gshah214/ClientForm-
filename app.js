var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require("express-rate-limit");
var fs = require('fs');

var app = express();
var server = http.createServer(app);
const port = 3000;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

server.listen(port, function () {
    console.log(`Server listening to port ${port}`);
})

var db = new sqlite3.Database('./database/client.db');

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, './public')));
app.use(helmet());
app.use(limiter);

db.run('CREATE TABLE IF NOT EXISTS client(name TEXT, phone TEXT, email TEXT, sqfoot TEXT, bedrooms TEXT, bathrooms, TEXT)');

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, './public/index.html'));
});

//ADD
app.post('/add', function (req, res) {
    db.serialize(() => {
        db.run('INSERT INTO client(name,phone,email,sqfoot,bedrooms,bathrooms) VALUES(?,?,?,?,?,?)', [req.body.name, req.body.phone, req.body.email, req.body.sqfoot, req.body.bedrooms, req.body.bathrooms], function (err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("New client has been added");
            res.send("New client has been added into the database with Name = " + req.body.name +
                " , Phone = " + req.body.phone +
                " , Email = " + req.body.email +
                " , Sq. Footage = " + req.body.sqfoot +
                " , Bedrooms = " + req.body.bedrooms +
                " , Bathrooms = " + req.body.bathrooms);

            fs.writeFile('clientinfo.txt', "New client has been added into the database with Name = " + req.body.name +
                " , Phone = " + req.body.phone +
                " , Email = " + req.body.email +
                " , Sq. Footage = " + req.body.sqfoot +
                " , Bedrooms = " + req.body.bedrooms +
                " , Bathrooms = " + req.body.bathrooms, (err) => {
                    if (err) throw err;
                })
        });
    });
});

//VIEW
app.post('/view', function (req, res) {
    db.serialize(() => {
        db.each('SELECT name NAME, phone PHONE, email EMAIL, sqfoot SQFOOT, bedrooms BEDROOMS, bathrooms BATHROOMS FROM client WHERE name = ?', [req.body.name], function (err, row) { //db.each() is only one which is funtioning while reading data from the DB
            if (err) {
                res.send("Error encountered while displaying");
                return console.error(err.message);
            }
            console.log("view res: ")
            res.send(` NAME: ${row.NAME},    PHONE: ${row.PHONE},    EMAIL: ${row.EMAIL},    SQ. FOOT: ${row.SQFOOT},    BEDROOMS: ${row.BEDROOMS},    BATHROOMS: ${row.BATHROOMS}`);
            console.log("Entry displayed successfully");
        });
    });
});

//UPDATE
app.post('/update', function (req, res) {
    console.log("sqfoot: ", req.body.sqfoot + ", " + "bedrooms: ", req.body.bedrooms + ", " + "bathrooms: ", req.body.bathrooms + ", " + "name: ", req.body.name);
    console.log([req.body.sqfoot, req.body.bedrooms, req.body.bathrooms]);
    db.serialize(() => {
        db.run('UPDATE client SET sqfoot=?, bedrooms=?, bathrooms=? WHERE name=?', [req.body.sqfoot, req.body.bedrooms, req.body.bathrooms], function (err) {
            if (err) {
                res.send("Error encountered while updating");
                return console.error(err.message);
            }
            res.send("Entry updated successfully");
            console.log("Entry updated successfully");
        });
    });
});


//DELETE
app.post('/delete', function (req, res) {
    db.serialize(() => {
        db.run('DELETE FROM client WHERE name = ?', req.body.name, function (err) {
            if (err) {
                res.send("Error encountered while deleting");
                return console.error(err.message);
            }
            res.send("Entry deleted");
            console.log("Entry deleted");

            var data = fs.readFileSync('clientinfo.txt', 'utf-8');
            console.log("data: ", data);
            var ip = "New client has been added into the database with Name = " + req.body.name;
            console.log("ip: ", ip);

            var newValue = data.replace(new RegExp(ip), '');
            console.log("newValue: ", newValue);
            fs.writeFileSync('clientinfo.txt', newValue, 'utf-8');
        });
    });
});