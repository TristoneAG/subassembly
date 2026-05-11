//Conexion a base de datos
const controller = {};
var amqp = require('amqplib/callback_api');
const jwt = require('jsonwebtoken');
//Require Redis
const redis = require('redis');
//Require Funciones
const funcion = require('../public/js/functions/controllerFunctions');
//Require Axios
const axios = require("axios")

controller.index_GET = (req, res) => {
    user = req.connection.user
    res.render('index.ejs', {
        user
    });
}

controller.login = (req, res) => {
    res.render('login.ejs', {
    });
}

controller.accesoDenegado_GET = (req, res) => {
    user = req.connection.user
    res.render('acceso_denegado.ejs', {
        user
    });
}



controller.mainMenu_GET = (req, res) => {

    let user_id = req.res.locals.authData.id.id
    let user_name = req.res.locals.authData.id.username
    res.render('main_menu.ejs', {
        user_id,
        user_name
    })
}

controller.userAccess_POST = (req, res) => {
    let user_id = req.body.user
    funcion.getUsers(user_id)
        .then((result) => {
            if (result.length == 1) {
                emp_nombre = result[0].emp_name

                accessToken(user_id, emp_nombre)
                    .then((result) => {
                        cookieSet(req, res, result)
                    })
                    .catch((err) => { res.json(err); })

            } else {
                res.json("unathorized")
            }
        })
        .catch((err) => {
            console.error(err);
            res.json(err)
        })
}

function accessToken(user_id, user_name) {
    return new Promise((resolve, reject) => {
        const id = { id: `${user_id}`, username: `${user_name}` }
        jwt.sign({ id }, `tristone`, {/*expiresIn: '1h'*/ }, (err, token) => {
            resolve(token)
            reject(err)
        })
    })
}


function cookieSet(req, res, result) {

    let minutes = 15;
    const time = minutes * 60 * 1000;
    res.cookie('accessToken', result,
        {
            maxAge: time,
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
            path: '/'
        })
    res.json(result)

}


controller.auditoriaProduccion_GET = (req, res) => {
    let estacion = req.res.locals.macIP.mac
    let user_id = req.res.locals.authData.id.id
    let user_name = req.res.locals.authData.id.username
    res.render('auditoria_produccion.ejs', {
        user_id,
        user_name,
        estacion
    });
}

controller.auditoriaSEM_POST = (req, res) => {
    let estacion = req.res.locals.macIP.mac
    let serial = req.body.serial
    let proceso = req.body.proceso
    let user_id = req.res.locals.authData.id.id

    let send = `{
            "station":"${estacion}",
            "serial":"${serial}",
            "process":"${proceso}", 
            "user_id":"${user_id}"
        }`
    axios({
        method: 'post',
        url: `http://${process.env.API_ADDRESS}:5000/auditoriaSEM`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: send
    })
        .then(result => { res.send(result.data) })
        .catch(err => { res.json(JSON.stringify(err)) })
}


controller.verify_hashRedis_POST = (req, res) => {

    let estacion_hash = (req.body.estacion).replace(/:/g, "-")
    async function getStatus() {
        const redis_client = redis.createClient({ host: `${process.env.DB_REDIS_SERVER}` });
        redis_client.on('error', err => (console.error("error", err)))
        redis_client.get(estacion_hash, function (err, reply) { res.json(reply) });
        redis_client.quit()

    }
    getStatus()
}

controller.consultaSEM_GET = (req, res) => {
    let user_id = req.res.locals.authData.id.id
    let user_name = req.res.locals.authData.id.username
    let api_address = process.env.API_ADDRESS
    res.render('consulta_SEM.ejs', {
        user_id,
        user_name
    })
}

controller.getUbicacionesSEMMaterial_POST = (req, res) => {
    let estacion = (req.res.locals.macIP.mac).replace(/:/g, "-")
    let material = req.body.material
    let proceso = req.body.proceso
    let user_id = req.res.locals.authData.id.id
    let send = `{
        "estacion":"${estacion}",
        "material": "${material}",
        "process":"${proceso}", 
        "user_id":"${user_id}"
    }`
    axios({
        method: 'post',
        url: `http://${process.env.API_ADDRESS}:5000/getUbicacionesSEMMaterial`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: send
    })
        .then(result => { res.send(result.data) })
        .catch(err => { res.json(JSON.stringify(err)) })
}

controller.getUbicacionesSEMMandrel_POST = (req, res) => {
    let estacion = (req.res.locals.macIP.mac).replace(/:/g, "-")
    let mandrel = req.body.mandrel
    let proceso = req.body.proceso
    let user_id = req.res.locals.authData.id.id
    let material = ""
    let send = `{
        "estacion":"${estacion}",
        "mandrel": "${mandrel}",
        "process":"${proceso}", 
        "user_id":"${user_id}"
    }`
    axios({
        method: 'post',
        url: `http://${process.env.API_ADDRESS}:5000/getUbicacionesSEMMandrel`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: send
    })
        .then(result => { res.send(result.data) })
        .catch(err => { res.json(JSON.stringify(err)) })
}

controller.getUbicacionesSEMSerial_POST = (req, res) => {
    let estacion = (req.res.locals.macIP.mac).replace(/:/g, "-")
    let serial = req.body.serial
    let proceso = req.body.proceso
    let user_id = req.res.locals.authData.id.id
    let material = ""
    let send = `{
        "estacion":"${estacion}",
        "serial": "${serial}",
        "process":"${proceso}", 
        "user_id":"${user_id}"
    }`
    axios({
        method: 'post',
        url: `http://${process.env.API_ADDRESS}:5000/getUbicacionesSEMSerial`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: send
    })
        .then(result => { res.send(result.data) })
        .catch(err => { res.json(JSON.stringify(err)) })
}


controller.transferSEM_GET = (req, res) => {
    let estacion = req.res.locals.macIP.mac
    let user_id = req.res.locals.authData.id.id
    let user_name = req.res.locals.authData.id.username
    res.render('transfer_SEM.ejs', {
        user_id,
        user_name,
        estacion
    })
}

controller.transferSEMFifo_GET = (req, res) => {
    let estacion = req.res.locals.macIP.mac
    let user_id = req.res.locals.authData.id.id
    let user_name = req.res.locals.authData.id.username
    res.render('transfer_sem_fifo.ejs', {
        user_id,
        user_name,
        estacion
    })
}

controller.getTransferFifoList_POST = (req, res) => {
    axios({
        method: 'get',
        url: `http://${process.env.API_ADDRESS}:5000/SEMgetTransferFifoList`,
        headers: { 'Content-Type': 'application/json' }
    })
        .then(result => { res.send(result.data) })
        .catch(err => { res.json(JSON.stringify(err)) })
}

controller.getSEMFIFO_POST = (req, res) => {
    let material = req.body.material
    let user_id = req.body.user_id
    let storage_type = req.body.storage_type
    let estacion = req.body.estacion

    let send = `{
        "material":"${material}",
        "user_id":"${user_id}",
        "storage_type":"${storage_type}",
        "estacion":"${estacion}"
    }`

    axios({
        method: 'post',
        url: `http://${process.env.API_ADDRESS}:5000/getSEMFIFO`,
        headers: { 'Content-Type': 'application/json' },
        data: send
    })
        .then(result => { res.send(result.data) })
        .catch(err => { res.json(JSON.stringify(err)) })
}

controller.transferSEM_FIFO_POST = (req, res) => {
    let send = {
        station: req.res.locals.macIP.mac,
        estacion: req.body.estacion,
        user_id: req.body.user_id,
        serial: req.body.serial,
        storage_type: req.body.storage_type,
        serials_obsoletos: req.body.serials_obsoletos,
        proceso: req.body.proceso,
        storage_bin: req.body.storage_bin,
        request_id: req.body.request_id,
        area: req.body.area
    }

    axios({
        method: 'post',
        url: `http://${process.env.API_ADDRESS}:5000/transferSEM_FIFO`,
        headers: { 'Content-Type': 'application/json' },
        data: send
    })
        .then(result => { res.json(result.data) })
        .catch(err => { res.json(JSON.stringify(err)) })
}

controller.transferSEM_Confirmed = (req, res) => {
    let estacion = req.res.locals.macIP.mac
    let serial = req.body.serial
    let proceso = req.body.proceso
    let storage_bin = req.body.storage_bin
    let user_id = req.res.locals.authData.id.id

    let send = `{
            "station":"${estacion}",
            "serial":"${serial}",
            "process":"${proceso}", 
            "storage_bin": "${storage_bin}", 
            "user_id":"${user_id}"
        }`

    // amqpRequest(send, "rpc_SEM")
    //     .then((result) => { res.json(result) })
    //     .catch((err) => { res.json(err) })

    axios({
        method: 'post',
        url: `http://${process.env.API_ADDRESS}:5000/transferSEM_Confirmed`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: send
    })
        .then(result => { res.json(result.data) })
        .catch(err => { res.json(err) })
}

controller.conteoC_GET = (req, res) => {
    let estacion = req.res.locals.macIP.mac
    let storage_type = req.params.storage_type
    let user_id = req.res.locals.authData.id.id
    let user_name = req.res.locals.authData.id.username
    res.render('conteoC.ejs', {
        user_id,
        user_name,
        storage_type,
        estacion
    })
}

controller.getBinStatusReport_POST = (req, res) => {
    let estacion = req.res.locals.macIP.mac

    let proceso = req.body.proceso
    let storage_bin = req.body.storage_bin
    let user_id = req.res.locals.authData.id.id
    let storage_type = req.body.storage_type

    let send = `{
        "estacion":"${estacion}",
        "process":"${proceso}",  
        "storage_bin": "${storage_bin}", 
        "user_id":"${user_id}",
        "storage_type":"${storage_type}" 
    }`

    axios({
        method: 'post',
        url: `http://${process.env.API_ADDRESS}:5000/getBinStatusReportSEM`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: send
    })
        .then(result => { res.send(result.data) })
        .catch(err => { res.json(JSON.stringify(err))})

    // amqpRequest(send, "rpc_cycle")
    //     .then((result) => { res.json(result) })
    //     .catch((err) => { res.json(err) })
}

controller.postCycleSU_POST = (req, res) => {
    let estacion = req.res.locals.macIP.mac

    let storage_bin = req.body.storage_bin
    let user_id = req.body.user_id
    let storage_type = req.body.storage_type
    let listed_storage_units = req.body.listed_storage_units
    let unlisted_storage_units = req.body.unlisted_storage_units
    let not_found_storage_units = req.body.not_found_storage_units

    let send = `{
        "estacion":"${estacion}", 
        "storage_bin": "${storage_bin}", 
        "user_id":"${user_id}",
        "storage_type":"${storage_type}",
        "listed_storage_units":"${listed_storage_units}",
        "unlisted_storage_units":"${unlisted_storage_units}",
        "not_found_storage_units":"${not_found_storage_units}" 
    }`

    axios({
        method: 'post',
        url: `http://${process.env.API_ADDRESS}:5000/postCycleSUSEM`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: send
    })
        .then(result => { res.send(result.data) })
        .catch(err => { res.json(JSON.stringify(err))})

    // amqpRequest(send, "rpc_cycle")
    //     .then((result) => { res.json(result) })
    //     .catch((err) => { res.json(err) })
}

function amqpRequest(send, queue) {
    return new Promise((resolve, reject) => {
        var args = process.argv.slice(2);
        if (args.length == 0) {
            // console.log("Usage: rpc_client.js num");
            // process.exit(1);
        }

        amqp.connect(`amqp://${process.env.RMQ_USER}:${process.env.RMQ_PASS}@${process.env.RMQ_SERVER}`, function (error0, connection) {
            if (error0) {
                // throw error0;
                reject(error0)
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    // throw error1;
                    reject(error1)
                }
                channel.assertQueue('', {
                    exclusive: true
                }, function (error2, q) {
                    if (error2) {
                        // throw error2;
                        reject(error2)
                    }
                    var correlationId = send.estacion;
                    console.log(' [x] Requesting: ', send);

                    channel.consume(q.queue, function (msg) {
                        if (msg.properties.correlationId == correlationId) {
                            console.log(' [x] Response:   ', msg.content.toString());
                            resolve(msg.content.toString())
                            setTimeout(function () {
                                connection.close();
                                // process.exit(0)
                            }, 500);

                        }
                    }, {
                        noAck: true
                    });

                    channel.sendToQueue(queue, Buffer.from(send.toString()), {
                        correlationId: correlationId,
                        replyTo: q.queue
                    });
                });
            });
        });
    })
}


module.exports = controller;