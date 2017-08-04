/**
 * Created by root on 3/3/17.
 */

var couchdb = require('./couchdb');
const nodemailer = require('nodemailer');
var RandExp = require('randexp'); // must require on node
var multer = require('multer');
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    }
});
// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
    host: 'akorion.com',
    port: '465',
    secure: true,
    tls: {
        rejectUnauthorized: false
    },
    auth: {
        user: 'isaacobella@akorion.com',
        pass: '2015isaac2015'
    }
});


var appRouter = function (app) {
    app.get("/", function (req, res, next) {
        res.send('<h1>The whole problem with the world is that fools and fanatics are always so certain of themselves, and wiser people so full of doubts</h1>')
    });

    app.post('/forgot_password', function (req, res, next) {
        var email = req.body.email;
        var db = couchdb.couchConnect('ezyextension');
        couchdb.couchSelectByKey(db, 'accounts', 'email', req.body.email).spread((body, header) => {
            if (body.rows.length > 0) {
                var newpassword = new RandExp(/[0-9]{5}$/).gen();
                var newacc = body.rows[0].doc;
                newacc['password'] = new Buffer(newpassword).toString('base64');
                couchdb.couchInsert(db, newacc).then(result => {

                    if (result) {
                        res.send({"result": result[0], "status": result[1].statusCode});
                        var mailOptions = {
                            from: '"EzyExtension"<isaacobella@akorion.com>', // sender address
                            to: req.body.email, // list of receivers
                            subject: 'Change password', // Subject line
                            html: '<b>' + newacc.name + '</b>,your temporary password is: <b>' + newpassword + '</b>. Use it to set your prefered password on app settings.<br/>Thanks for using ezy extension' //, // plaintext body
                            // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
                        };
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                // console.log(error);

                            } else {
                            }
                            ;
                        });
                    }
                }).catch(err => {

                })
            } else {
                res.send({enexists: true});
            }
        });
    });

    app.post("/changepassword", (req, res) => {
        req.body.opassword = new Buffer(req.body.opassword).toString('base64');
        let newPassword = new Buffer(req.body.password).toString('base64');
        var key = [req.body.username, req.body.opassword];
        var db = couchdb.couchConnect('ezyextension');
        couchdb.couchSelectByKey(db, 'accounts', 'accounts', key).spread(function (body, header) {
            if (body.rows.length == 1) {
                let acc = body.rows[0].doc;
                acc.password = newPassword;
                couchdb.couchInsert(db, acc).then(result => {
                    res.send({"result": result[0], "status": result[1].statusCode});
                }).catch(err => {
                    }
                );
            } else {
                res.send({exist: false});
            }
        });
    });

    app.post("/signupnew", function (req, res) {
        var eexists = false;
        var cexists = false;
        var db = couchdb.couchConnect('ezyextension');

        couchdb.couchSelectByKey(db, 'accounts', 'email', req.body.email).spread((body, header) => {
            if (body.rows.length > 0
            ) {
                res.send({eexists: true});
            }
            else {
                couchdb.couchSelectByKey(db, 'accounts', 'contact', req.body.contact).spread((body, header) => {
                    if (body.rows.length > 0
                    ) {
                        res.send({cexists: true});
                    }
                    else {
                        req.body['type'] = 'account';
                        req.body['date'] = new Date().toLocaleString();
                        req.body.password = new Buffer(req.body.password).toString('base64');
                        var db = couchdb.couchConnect('ezyextension');
                        var insert = couchdb.couchInsert(db, req.body);
                        insert.then(result => {
                            res.send({"result": result[0], "status": result[1].statusCode});
                        }).catch(err => {
                            }
                        )
                    }
                })
            }
        });
    });


    app.post("/signupverify", function (req, res) {
        let data = req.body.acc_data;
        let request_id = req.body.request_id;
        let code = req.body.code;
// console.log(data,request_id,code);
        var exec = require('child_process').exec;

        let cmd = 'curl -X POST  https://api.nexmo.com/verify/check/json \\\n' +
            '-d api_key=ea7ac9ed \\\n' +
            '-d api_secret=75bda21dec4d3bd2 \\\n' +
            '-d request_id="' + request_id + '" \\\n' +
            '-d code=' + code;

        child = exec(cmd);

        child.stderr.on('data', function (data, err) {


        });

        child.stdout.on('data', (out) => {
            out = JSON.parse(out);
            console.log(out);
            if (out.request_id == request_id && out.event_id != null) {
                var db = couchdb.couchConnect('ezyextension');
                data['type'] = 'account';
                data['date'] = new Date().toLocaleString();
                data.password = new Buffer(data.password).toString('base64');
                var db = couchdb.couchConnect('ezyextension');
                var insert = couchdb.couchInsert(db, data);
                insert.then(result => {
                    res.send({"result": result[0], "status": result[1].statusCode});
                }).catch(err => {
                })
            } else {
                res.send({status: 0});
            }
        })
        ;

        child.on('close', (code) => {

        });


    });

    app.post("/loginnew", function (req, res) {
        req.body.password = new Buffer(req.body.password).toString('base64');
        var key = [req.body.username, req.body.password];
        var db = couchdb.couchConnect('ezyextension');
        couchdb.couchSelectByKey(db, 'accounts', 'accFix', key).spread(function (body, header) {
            if (body.rows.length == 1) {
                res.send({
                    exist: true,
                    user_id: body.rows[0].id,
                    contact: body.rows[0].value.contact,
                    user_type: body.rows[0].value.enterprise,
                    name: body.rows[0].value.name
                });
            } else {
                res.send({exist: false});
            }
        }).catch(err => {
            }
        )

    });

    app.post("/rain", function (req, res) {
        if (req.body) {
            var db = couchdb.couchConnect('ezyextension');
            req.body['type'] = 'weather';
            var insert = couchdb.couchInsert(db, req.body).then(result => {
                res.send({"result": result[0], "status": result[1].statusCode});
            }).catch(err => {

            });
        }
    });


    app.post("/upload", multer({storage: storage}).single('file'), (req, res) => {

        if (req.file && req.body) {
            var db = couchdb.couchConnect('ezyextension');
            req.body['photo_url'] = req.file.filename;
            req.body['type'] = 'enquiry';
            req.body['status'] = 'new';
            req.body['action'] = '';
            var insert = couchdb.couchInsert(db, req.body).then(result => {
                res.send({"result": result[0], "status": result[1].statusCode});
            }).catch(err => {

            });
        }
    });


    app.post("/signup", function (req, res) {
        req.body['type'] = 'account';
        req.body['date'] = new Date().toLocaleString();
        req.body.password = new Buffer(req.body.password).toString('base64');
        var db = couchdb.couchConnect('ezyextension');
        var insert = couchdb.couchInsert(db, req.body);
        insert.then(result => {
            res.send({"result": result[0], "status": result[1].statusCode});
        }).catch(err => {
        })
    });

    app.post("/login", function (req, res) {
        req.body.password = new Buffer(req.body.password).toString('base64');
        var key = [req.body.username, req.body.password];
        var db = couchdb.couchConnect('ezyextension');
        couchdb.couchSelectByKey(db, 'accounts', 'accounts', key).spread(function (body, header) {
            if (body.rows.length == 1) {
                res.send({
                    exist: true,
                    user_id: body.rows[0].id,
                    contact: body.rows[0].value.contact,
                    user_type: body.rows[0].value.enterprise,
                    name: body.rows[0].value.name
                });
            } else {
                res.send({exist: false});
            }
        }).catch(err => {
            }
        )

    });

    app.post("/orders", function (req, res) {
        var data = {
            "type": "order",
            "vaId": req.body.vaId,
            "status": req.body.status,
            "payment": req.body.payment,
            "details": req.body.details,
            "order": req.body.cart
        };

        //    console.log(res);
        var db = couchdb.couchConnect('ezyextension');
        var insert = couchdb.couchInsert(db, data).then(result => {
            res.send({"result": result[0], "status": result[1].statusCode});
            couchdb.couchSelect(db, 'inputs', 'allInputs').then(result => {
                result.docs = filterCouchResponse(result[0].rows);
                if (result.docs) {
                    var newStock = [];
                    for (var i = 0; i < data.order.length; i++) {
                        for (var j = 0; j < result.docs.length; j++) {
                            if (data.order[i].product === result.docs[j].name) {
                                var qty = result.docs[j].quantity - data.order[i].qty;
                                result.docs[j].quantity = (qty < 1 ? 0 : qty);
                                newStock.push(result.docs[j]);
                            }
                        }
                    }

                    var db = couchdb.couchConnect('ezyextension');
                    for (var k = 0; k < newStock.length; k++) {
                        couchdb.couchInsert(db, newStock[k]).then(result => {
                        });
                    }
                }

            }).catch(err => {
                console.log(err);
            });
        });
    });

    app.post("/cancel_order", function (req, res) {
        var id = req.body.id;
        var db = couchdb.couchConnect('ezyextension');
        couchdb.couchSelectByKey(db, 'orders', 'pending', id).spread(function (body, header) {
            var order = body.rows[0].value;
            order['status'] = 'canceled';

            couchdb.couchInsert(db, order).then(result => {
                res.send({"result": result[0], "status": result[1].statusCode});
            })
            ;
        }).catch(function (err) {

        });
    });

    app.get("/orders", function (req, res) {
        var db = couchdb.couchConnect('ezyextension');
        couchdb.couchSelect(db, 'orders', 'all').spread(function (body, header) {
            res.send(body.rows);
        }).catch(function (err) {

        });

    });

    function filterCouchResponse(rows) {
        var value = [];
        for (var i = 0; i < rows.length; i++) {
            value.push(rows[i].value);
        }
        return value;
    }

    app.post("/beyonic/webhooks", function (req, res) {
        var db = couchdb.couchConnect('ezyextension');
        var hook = req.body.hook;
        var data = req.body.data;
        var id = data.metadata.order_id;

        if (id) {
            switch (hook.event) {
                case 'payment.status.changed':
                    var status = data.state;
                    couchdb.couchSelectByKey(db, 'orders', 'pending', id).spread(function (body, header) {
                        var order = body.rows[0].value;
                        order['status'] = (status === 'processed' ? 'successful' : 'failed');

                        couchdb.couchInsert(db, order).then(result => {
                            // res.send({"result":result[0],"status":result[1].statusCode});
                            res.send(200);
                        })
                        ;
                    }).catch(function (err) {

                    });
                    break;
                case 'collection.received':
                    var collection_id = data.collection_request;
                    var status;
                    var order_id;
                    var collection = 'curl https://app.beyonic.com/api/collectionrequests/' + collection_id + ' -H "Authorization: Token 3fdf752436c1c33b88a7acff4f6d5984fd65e675"';

                    exec(collection, (err, stdout, stderr) => {
                            stdout = JSON.parse(stdout);
                            status = stdout.status;
                            order_id = stdout.metadata.order_id;
                            if (order_id) {
                                couchdb.couchSelectByKey(db, 'orders', 'pending', order_id).spread(function (body, header) {
                                    var order = body.rows[0].value;
                                    order['status'] = (status === 'successful' ? 'pending delivery' : 'failed');

                                    couchdb.couchInsert(db, order).then(result => {
                                        res.send(200);
                                    });
                                }).catch(function (err) {
                                });
                            }
                        }
                    );
                    break;
                case
                'contact.created'
                :
                    break;
            }
        }
    })

    app.post("/verifyPhone", (req, res) => {
        console.log(req.body);
        var db = couchdb.couchConnect('ezyextension');
        couchdb.couchSelectByKey(db, 'accounts', 'email', req.body.email).spread((body, header) => {
            if (body.rows.length > 0
            ) {
                res.send({eexists: true});
            }
            else {
                couchdb.couchSelectByKey(db, 'accounts', 'contact', req.body.contact).spread((body, header) => {
                    if (body.rows.length > 0
                    ) {
                        res.send({cexists: true});
                    }
                    else {
                        let phone = req.body.contact.substr(1);

                        var exec = require('child_process').exec;

                        var command = 'curl -X POST  https://api.nexmo.com/verify/json \\\n' +
                            '-d api_key=0815e48a ' +
                            '-d api_secret=309141c3649594d6 ' +
                            '-d number=' + phone + ' ' +
                            '-d brand="EzyAgric"';

                        child = exec(command);
                        console.log(command);

                        child.stderr.on('data', function (data, err) {
                            console.log(err);
                            console.log(data);


                        });

                        child.stdout.on('data', (data) => {
                            console.log(data);
                            data = JSON.parse(data);
                            res.send(data);
                        });

                        child.on('close', (code) => {

                        });
                    }
                })
            }
        })

    });

    app.post("/beyonic/initiate", function (req, res) {
        var util = require('util');
        var exec = require('child_process').exec;
        //Input variables

        var amount = req.body.cost;
        var phonenumber = req.body.phone;
        var order = req.body.order;

        while (String(phonenumber).charAt(0) === '0') {
            phonenumber = phonenumber.substr(1);
        }

        phonenumber = '+256' + phonenumber;


        var command = 'curl https://app.beyonic.com/api/collectionrequests -H "Authorization: Token 3fdf752436c1c33b88a7acff4f6d5984fd65e675" -d phonenumber=' + phonenumber + ' -d currency=UGX -d amount=' + amount + ' -d metadata.order_id="' + order + '" -d send_instructions=True' + " -d instructions='Akorion has requested a payment of " + amount + " for your inputs order on EzyExtension.'";
        var collection_id;
        console.log(command);
        child = exec(command);

        child.stderr.on('data', function (data, err) {
        });

        child.stdout.on('data', (data) => {
            data = JSON.parse(data);
            collection_id = data.id;
        })
        ;

        child.on('close', (code) => {
            if (code == 0
            ) {
                var collection = 'curl https://app.beyonic.com/api/collectionrequests/' + collection_id + ' -H "Authorization: Token 3fdf752436c1c33b88a7acff4f6d5984fd65e675"';
                execution = function () {
                    exec(collection, (err, stdout, stderr) => {
                        stdout = JSON.parse(stdout);
                        res.send({status: code, error_message: stdout.error_message});
                    })
                    ;
                }
                setTimeout(execution, 3000);
            }
            else {
                res.send({status: code});
            }
        })
        ;


    });
}


module.exports = appRouter;
