const express = require("express");
const addressController = require("../controllers/address");
const addressRouter = express.Router();


addressRouter
	.route("/:addressId")
	.get(addressController.getAddressById)
	.put(addressController.updateAddressById)
	.delete(addressController.deleteAddressById);
addressRouter.route("/").post(addressController.addAddress);
   
addressRouter.route("/all/:userId")
   .get(addressController.getAddressByUserId);
module.exports = addressRouter; 