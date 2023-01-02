const stripeController = require("../controllers/stripe");
const express = require("express");
const stripeRouter = express.Router();
stripeRouter.route("/").post(stripeController.createIntent);
stripeRouter.route("/connect").post(stripeController.connect);
module.exports = stripeRouter;