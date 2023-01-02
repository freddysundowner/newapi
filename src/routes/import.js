const express = require("express");
const importRoute = express.Router();
const importProductsController = require("../controllers/import");

importRoute.post("/", importProductsController.importWcProducts);
importRoute.post("/shopify", importProductsController.importShopifyProducts);

module.exports = importRoute;
