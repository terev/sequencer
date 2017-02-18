// server.js
// load the things we need
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const fs = require('fs');

const sequencer = require('../index');

app.use(express.static(__dirname + '/../ace'));
app.use('/axios', express.static(__dirname + '/../node_modules/axios'));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file

// index page
app.get('/', function (req, res) {
    let initial = fs.readFileSync('../test.seq');

    sequencer.parse(initial.toString())
        .then(seq => {
            res.render(__dirname + '/../views/index.ejs', {
                sequence: initial.toString(),
                image: sequencer.draw(seq, 800, 600).toDataURL()
            });
        })
});

app.post('/diagram', function (req, res) {
    sequencer.parse(req.body.interaction)
        .then((seq) => {
            res.setHeader('Content-Type', 'image/png');
            res.send(sequencer.draw(seq, req.body.width, req.body.height).toDataURL());
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send('failed');
        });
});

app.listen(8080);
console.log('8080 is the magic port');