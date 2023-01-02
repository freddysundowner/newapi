const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const decode = require("../shared/base64");

const value = {
  type: String,
  required: [true, "This field is required"],
};

const auctionSchema = new Schema(
  {
    higestbid: {
      type: Number,
      default: 0,
    },
    
    winner:
      {
        type: Schema.Types.ObjectId,
        ref: "user",
    },
    winning:
      {
        type: Schema.Types.ObjectId,
        ref: "user",
    },
    bids: [
      {
        type: Schema.Types.ObjectId,
        ref: "bids",
      },
    ], 
    product: {
      type: Schema.Types.ObjectId,
      ref: "product",    
      default: null,
    },
    tokshow: {
      type: Schema.Types.ObjectId,
      ref: "rooms",    
    },
    baseprice: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    startedTime: {
      type: Number,
      default: 0,
    },
    sudden: {
      type: Boolean,
      default: false,
    },
    started: {
      type: Boolean,
      default: false,
    },
    ended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, autoCreate: true, autoIndex: true }
);

const auction = model("auction", auctionSchema);

module.exports = auction;
