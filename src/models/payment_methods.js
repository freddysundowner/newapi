const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const value = {
  type: String,
  required: [true, "This field is required"],
};

const paymentMethodSchema = new Schema(
  {
  	name: {
      type: String,
      default: "",
  	},
  	
  	type: {
      type: String,
      default: "",
  	},
  	last4: {
      type: String,
      default: "",
  	},
  	cardid: {
      type: String,
      default: "",
  	},
  	token: {
      type: String,
      default: "",
  	},
  	customerid: {
	  	type: String,
      default: "",
  	},
  	 userid: 
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
  	primary: {
      type: Boolean,
      default: false,
  	},
  }
);
const users = model("paymentMethod", paymentMethodSchema);
module.exports = users;