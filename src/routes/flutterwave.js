const flutterWaveController = require("../controllers/flutterwave");
const express = require("express");
const flutterWaveRouter = express.Router();

flutterWaveRouter
  .route("/:id")
  .get(flutterWaveController.getSubAccount)
  .post(flutterWaveController.createSubAccount);

flutterWaveRouter.route("/banks/:country").get(flutterWaveController.getBanks);
module.exports = flutterWaveRouter;
