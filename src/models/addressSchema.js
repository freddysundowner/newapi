const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const value = {
	type: String,
	required: true,
};

const addressSchema = new Schema(
	{
		name: value,
		addrress1: value,
		addrress2: {
	      type: String,
	      default: "",
	    },
		city: value,
		state: {
	      type: String,
	      default: "",
	    },
		country: {
	      type: String,
	      default: "",
	    },
		phone: value,
		userId: {
			type: Schema.Types.ObjectId,
			ref: "user",
         required: true
		},
	},
	{ timestamps: true, autoIndex: true, autoCreate: true }
);

const addressModel = model("address", addressSchema);
module.exports = addressModel;


