const express = require("express");
const auctionController = require("../controllers/auction");
const auctionRouter = express.Router();

auctionRouter.route("/").get(auctionController.getAuctions);
auctionRouter.route("/").post(auctionController.createAuction);
auctionRouter.route("/:id").put(auctionController.updateAuction);
auctionRouter.route("/:id").delete(auctionController.deleteAuction);
auctionRouter.route("/:roomid").get(auctionController.getAuctionRoomId);
auctionRouter.route("/:id").post(auctionController.bid);
module.exports = auctionRouter;  