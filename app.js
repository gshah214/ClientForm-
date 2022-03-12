var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require("express-rate-limit");

var app = express();
var server = http.createServer(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

server.listen(3000,function(){ 
    console.log("Server listening on port: 3000");
})
var db = new sqlite3.Database('./database/clients.db');


app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./public')));
app.use(helmet());
app.use(limiter);

db.run('CREATE TABLE IF NOT EXISTS client(name TEXT, phone TEXT, email TEXT, squarefootage TEXT, build TEXT, bedrooms TEXT, bathrooms TEXT)');

app.get('/', function(req,res){
    res.sendFile(path.join(__dirname,'./public/index.html'));
  });

  // Insert
app.post('/add', function(req,res){
    db.serialize(()=>{
      db.run('INSERT INTO client(name, phone, email, squarefootage, build, bedroom, bathroom) VALUES(?,?,?,?,?,?,?)', [req.body.name, req.body.phone, req.body.email, req.body.squarefootage, req.body.build, req.body.bedrooms, req.body.bathrooms], function(err) {
        if (err) {
          return console.log(err.message);
        }
        console.log("New client has been added");
        res.send("New client has been added into the database with name = "+req.body.name+ ", number = "+req.body.number+ ", email = "+req.body.email+", squarefootage = "+req.body.squarefootage+", build = "+req.body.build+", bedrooms = "+req.body.bedroom+", and bathrooms "+req.body.bathroom+"");
      });
  });
  });


// View
app.post('/view', function(req,res){
    db.serialize(()=>{
      db.each('SELECT name NAME, phone PHONE, email EMAIL FROM client WHERE name =?', [req.body.name], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
        if(err){
          res.send("Error encountered while displaying");
          return console.error(err.message);
        }
        res.send(` Name: ${row.NAME},    Phone: ${row.PHONE}, Email: ${row.EMAIL}`);
        console.log("Entry displayed successfully");
      });
    });
  });


//UPDATE
app.post('/update', function(req,res){
    db.serialize(()=>{
      db.run('UPDATE emp SET name = ? phone = ? email = ? squarefootage = ? build = ? bedrooms = ? bathrooms = ? WHERE name = ? ', [req.body.name,req.body.phone,req.body.email,req.body.squarefootage,req.body.build,req.body.bedrooms,req.body.bathrooms], function(err){
        if(err){
          res.send("Error encountered while updating");
          return console.error(err.message);
        }
        res.send("Entry updated successfully");
        console.log("Entry updated successfully");
      });
    });
  });