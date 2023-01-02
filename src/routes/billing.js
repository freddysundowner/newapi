const express = require("express");
const billingController = require("../controllers/billing");
const billingRouter = express.Router();

billingRouter.route("/").post(billingController.addBilling);

billingRouter
	.route("/:billingId")
	.get(billingController.getBillingById)
	.put(billingController.updateBillingById)
	.delete(billingController.deleteBillingById);

billingRouter
	.route("/all/:userId")
	.get(billingController.getBillingByUserId);
module.exports = billingRouter;
