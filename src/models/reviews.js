const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const bcrypt = require("bcrypt");
const decode = require("../shared/base64");

const value = {
  type: String,
  required: [true, "This field is required"],
};

const userSchema = new Schema(
  {
    product: 
      {
        type: Schema.Types.ObjectId,
        ref: "product",
      },
    review: 
      {
        type: String,
        default: "",
      },
    rating: 
      {
        type: Number,
        default: 0,
      },
    
    userId: 
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    
  },
  {
    timestamps: true,
    autoCreate: true, // auto create collection
    autoIndex: true, // auto create indexes
  }
);



const users = model("review", userSchema);
module.exports = users;
