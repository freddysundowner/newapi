const express = require("express");
const transRouter = express.Router();
const transController = require("../controllers/transactions");


transRouter.route(`/`)
   .post(transController.createTransaction);

transRouter.route("/:userId")
   .get(transController.getUserTransactionsByUserId);
   
transRouter.route("/paginated/:userId/:pagenumber")
   .get(transController.getUserTransactionsPaginated);

transRouter.route("/transactions/:transId")
   .get(transController.getTransactionById);

transRouter.route("/:userId/shop/:shopId")
   .get(transController.getTransactionByShopId);

transRouter.route("/:transId")
   .put(transController.updateTransactionById);
   
module.exports = transRouter;