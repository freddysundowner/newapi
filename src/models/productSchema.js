const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const decode = require("../shared/base64");

const value = {
  type: String,
  required: [true, "This field is required"],
};

const productSchema = new Schema(
  {
    name: value,
    wcid: { type: Number },
    spId: { type: Number },
    price: {
      type: Number,
      required: "Price field is required",
    },
    discountedPrice: {
      type: Number,
      default: 0.0,
    },
    quantity: {
      type: Number,
      min: 0,
      required: true,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "review",
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },

    available: {
      type: Boolean,
      default: true,
    },
    feature: {
      type: Boolean,
      default: false, 
    },
    images: {
      type: Array,
    },
    variations: {
      type: Array,
    },
    categories: {
      type: Array,
    },
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: "category",
      },
    ],
    description: {
      type: String,
    },
    shopId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "shop",
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    type: {
      type: String,
      default: "tokshop",
    },
  },
  { timestamps: true, autoIndex: true, autoCreate: true }
);


const products = model("product", productSchema);

module.exports = products;
