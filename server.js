'use strict';

const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
require('dotenv').config();
const methodOverride = require('method-override');
const { response } = require('express');
const app = express();
app.use(cors());
app.use(express.static('public'));
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(express.urlencoded({extended: true}));
const client = new pg.Client(DATABASE_URL);
client.connect().then(() => {
    app.listen(PORT, () => console.log(`App is listening to PORT ${PORT}`));
}).catch(handleError);

function handleError(){
    response.status(500).send('Something Went Wrong!');
}

//--- Routes ---//
app.get('/', homePage);
app.post('/', addToFavFacts);
app.get('/facts', getFavFacts);
app.get('/facts:factId', showOneFact);
app.put('/facts:factId', updateFact);
app.delete('/facts:factId', deleteFact);
//-------------//


function homePage(req, res){
    let url = 'https://cat-fact.herokuapp.com/facts';
    superagent.get(url).then(data => {
        data.body.all.map(fact => {
            new Facts(fact);
        });
    }).catch(handleError);
    res.render('pages/index', {facts: factsArr});
}

function addToFavFacts(req, res){
    let insertQuery = 'Insert into facts (type, text) values ($1, $2)';
    let safeValues = [req.body.type, req.body.text];
    client.query(insertQuery, safeValues).then (() => {
        res.redirect ('/facts');
    }).catch(handleError);
}

function getFavFacts(req, res){
    let selectQuery = 'SELECT * FROM facts;';
    client.query(selectQuery).then(data => {
        res.render('pages/favFacts', {favFacts: data.rows});
    }).catch(handleError);
}

function showOneFact(req, res){
    let factId = req.params.factId;
    let selectQuery = `select * from facts where id=${factId};`;
    client.query(selectQuery).then(data => {
        res.render('pages/showFact', {fact: data.rows[0]});
    }).catch(handleError);
}

function updateFact(req, res){
    let updateQuery = 'update facts set type=$1, text=$2 where id=$3;';
    let safeValues = [req.body.type, req.body.text, req.params.factId];
    client.query(updateQuery, safeValues).then( () => {
        res.redirect(`/facts${req.params.factId}`)
    }).catch(handleError);
}

function deleteFact(req, res){
    let factId = req.params.factId;
    let deleteQuery = `Delete from facts where id=${factId};`;
    client.query(deleteQuery).then(() =>{
        res.redirect('/facts');
    }).catch(handleError);
}


let factsArr = [];
function Facts(fact){
    this.type = fact.type;
    this.text = fact.text;
    factsArr.push(this);
}