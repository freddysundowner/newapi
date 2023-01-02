const express = require("express");
const categoriesController = require("../controllers/categories");
const categoriesRouter = express.Router();

categoriesRouter
  .route("/:id")
  .put(categoriesController.updateCategoryById)
  .delete(categoriesController.deleteCategoryById);
categoriesRouter.route("/").post(categoriesController.addCategory);
categoriesRouter.route("/").get(categoriesController.getAllCategories);
categoriesRouter.route("/id/:id").get(categoriesController.getCategoryById);

module.exports = categoriesRouter;
