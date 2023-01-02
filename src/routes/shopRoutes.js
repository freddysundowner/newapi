const express = require("express");
const shopRouter = express.Router();
const shopController = require("../controllers/shop");

const passport = require("passport");

require("../services/authenticate");



const multer = require("multer");

const storage = multer.memoryStorage();



const fileFilter = (req, file, cb) => {
	const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
	allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(null, false);
};

let upload = multer({ storage, fileFilter });

shopRouter.route("/").get(shopController.getAllShops);

shopRouter
	.route("/:userId")
	.get(
		passport.authenticate("jwt", { session: false }),
		shopController.getAllShopsByUserId
	)
	.post(
// 		upload.single("image"),
		passport.authenticate("jwt", { session: false }),
		shopController.createShop
	);

shopRouter
	.route("/shop/:shopId")
	.get(shopController.getShopById)
	.put(
		upload.single("image"),
		passport.authenticate("jwt", { session: false }),
		shopController.updateShopById
	)
	.delete(
		passport.authenticate("jwt", { session: false }),
		shopController.deleteShopById
	);
	
shopRouter
	.route("/search/:name/:pagenumber")
	.get(shopController.searchForShop)


	
shopRouter
	.route(`/allshops/paginated`)
	.get(
		passport.authenticate("jwt", { session: false }),
		shopController.getAllShopsPaginated
	);
	

	

shopRouter
	.route(`/shippingmethods/add/:id`)
	.post(
		passport.authenticate("jwt", { session: false }),
		shopController.addShippingMethood
	);
	
	
	
shopRouter
	.route(`/shippingmethods/:id`)
	.get(
		passport.authenticate("jwt", { session: false }),
		shopController.getShippingMethods
	);
	
	
	shopRouter
	.route(`/shop/follow/:shopId/:userId`)
	.put(
		passport.authenticate("jwt", { session: false }),
		shopController.followShop
	);
	shopRouter
	.route(`/shop/unfollow/:shopId/:userId`)
	.put(
		passport.authenticate("jwt", { session: false }),
		shopController.unFollowShop
	);	
module.exports = shopRouter;
