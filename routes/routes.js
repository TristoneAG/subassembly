const express = require('express');
const router = express.Router();
const routesController = require('./routesController')
const middleware = require('../public/js/middlewares/middleware')


//Routes

router.get('/',routesController.index_GET);
router.get('/login/:id', middleware.loginVerify, routesController.login);
router.get('/acceso_denegado',routesController.accesoDenegado_GET);
router.get('/mainMenu',middleware.verifyToken, routesController.mainMenu_GET);
router.post('/userAccess', routesController.userAccess_POST);

router.post('/verify_hashRedis', routesController.verify_hashRedis_POST);


// ##############subassembly##################
router.get('/consultaSEM',middleware.verifyToken, routesController.consultaSEM_GET);
router.post("/getUbicacionesSEMMaterial",middleware.verifyToken, middleware.macFromIP, routesController.getUbicacionesSEMMaterial_POST);
router.post("/getUbicacionesSEMMandrel",middleware.verifyToken, middleware.macFromIP, routesController.getUbicacionesSEMMandrel_POST);
router.post("/getUbicacionesSEMSerial",middleware.verifyToken, middleware.macFromIP, routesController.getUbicacionesSEMSerial_POST);
router.get('/transferSEM',middleware.verifyToken, middleware.macFromIP, routesController.transferSEM_GET);
router.get('/transferSEMFifo',middleware.verifyToken, middleware.macFromIP, routesController.transferSEMFifo_GET);
router.post('/getTransferFifoList',middleware.verifyToken, middleware.macFromIP, routesController.getTransferFifoList_POST);
router.post('/getSEMFIFO',middleware.verifyToken, middleware.macFromIP, routesController.getSEMFIFO_POST);
router.post('/transferSEM_FIFO',middleware.verifyToken, middleware.macFromIP, routesController.transferSEM_FIFO_POST);
router.post('/transferSEM_Confirmed',middleware.verifyToken, middleware.macFromIP, routesController.transferSEM_Confirmed);
router.get('/auditoriaProduccionSEM', middleware.verifyToken, middleware.macFromIP, routesController.auditoriaProduccion_GET);
router.post('/auditoriaSEM',middleware.verifyToken, middleware.macFromIP, routesController.auditoriaSEM_POST);
router.get('/conteo_ciclico/:storage_type',middleware.verifyToken, middleware.macFromIP, routesController.conteoC_GET);
router.post("/getBinStatusReport",middleware.verifyToken, middleware.macFromIP, routesController.getBinStatusReport_POST);
router.post("/postCycleSU",middleware.verifyToken, middleware.macFromIP, routesController.postCycleSU_POST);
module.exports = router;