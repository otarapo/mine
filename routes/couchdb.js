/****************************************************************************************************
 * COUCHDB FUNCTIONS
 ****************************************************************************************************/
// var nano = require('nano-blue')('http://admin:mysecretpassword@127.0.0.1:5984/');

// var nano = require('nano-blue')('http://localhost:5984/')

var nano = require('nano-blue')('https://ezyextension:jeremiah29:11@ezyextension.cloudant.com/');

//Connect to couchdb
exports.couchConnect = function (db_name) {
    var _db = nano.db.use(db_name);
    return _db;
}


//Select from couch view
exports.couchSelect = function (_db, document, view) {

    return _db.view(document, view);

}

//Query
exports.couchQuery = function(query){
    var Cloudant=require('cloudant');
  var cloudant = Cloudant({url: 'https://ezyextension:jeremiah29:11@ezyextension.cloudant.com', plugin:'promises'});
    var mydb = cloudant.db.use('ezyextension');

    return mydb.find(query).then(res=>{
        return res;
    }).catch(err=>{
        return err;
    });
}

//Select from couchdb by key
exports.couchSelectByKey = function (_db, document, view, key_value) {

    return _db.view(document, view, {'key': key_value,include_docs:true});

}

//Insert to mysql table
exports.couchInsert = function (_db, data) {
    var insert = _db.insert(data);
    return insert;
}


//Delete mysql data

exports.couchDelete = function (_db, doc_id, revision_id) {
    _db.destroy(doc_id, revision_id, function (err, body) {
        if (!err) {
            //done deleting
        }
    });
}
