const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const value = {
  type: String,
  required: true,
};

const categorySchema = new Schema(
  {
    name: value,
  },
  { timestamps: true, autoIndex: true, autoCreate: true }
);

const addressModel = model("category", categorySchema);
module.exports = addressModel;
