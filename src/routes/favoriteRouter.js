const favController = require("../controllers/favorite");
const express = require("express");
const favoriteRouter = express.Router();


favoriteRouter
	.route("/:userId")
	.post(favController.createFavorite)
	.get(favController.getAllFavoriteByUserId)
	.put(favController.updateFavoriteById)
	.delete(favController.deleteFavoriteById);

module.exports = favoriteRouter;
