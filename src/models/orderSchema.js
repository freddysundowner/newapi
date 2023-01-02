const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const orderSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, required: true, ref: "user" },

    shippingId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "address",
    },
    //to be removed afteer update of ui
    shippingAddress: {
      type: String,
      default: "",
    },
	auctionid: {
      type: String,
      default: null,
    },
	ordertype: {
      type: String,
      default: "tokshop",
    },
     invoice: {
      type: Number,
      required: false,
    },
    wcOrderId: {
      type: Number,
      default: null,
    },
    
    servicefee: {
	    
      type: Number,
      default: 0.0,
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "cancelled", "shipped", "delivered", "processed","on-hold", "completed", "processing","refunded"],
      default: "processing",
    },
    shopId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "shop", 
    },
    productId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "product",    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    date: {
      type: Number,
      default: Date.now(),
      required: true
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "item",
    },
    shippingMethd: {
      default: '',
      type: String,
	    
    },
    subTotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    totalCost: {
      type: Number,
      default: function () {
        return this.subTotal + this.tax + this.shippingFee;
      },
    },
  },
  {
    timestamps: true,
    autoIndex: true,
    autoCreate: true,
  }
);

// const orders = model("order", orderSchema);

/*......................................
   *pre hook that saves the objectId of the order Schema in the quantity schema
   *
   *
   ......................................*/
const Order =
  mongoose.models.Order ||
  mongoose.model(
    'order',
    orderSchema.plugin(AutoIncrement, {
      inc_field: 'invoice',
      start_seq: 10000,
    })
  );
  
module.exports = Order;
