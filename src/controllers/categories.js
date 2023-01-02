const categoryModel = require("../models/categorySchema");

exports.addCategory = async (req, res) => {
  try {
    let newCategory = await categoryModel.create(req.body);
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: newCategory });
  } catch (error) {
    res.status(422).json({ success: false, error: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    let category = await categoryModel.findById(req.params.id);
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(category);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.updateCategoryById = async (req, res) => {
  try {
    let updatedCategory = await categoryModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { runValidators: true, new: true }
    );
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: updatedCategory });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json({ success: false, message: error.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    let category = await categoryModel.find().sort({ createdAt: -1 });
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(category);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.deleteCategoryById = async (req, res) => {
  try {
    let deleted = await categoryModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json({ success: false });
  }
};
