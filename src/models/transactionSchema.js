const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const value = {
	type: String,
	required: true,
};


const transactionSchema = new Schema(
	{
		from: {
			type: Schema.Types.ObjectId,
			ref: "user",
		},
		to: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "user",
		},
		shopId: {
			type: Schema.Types.ObjectId,
			ref: "shop"
		},
		orderId: {
			type: Schema.Types.ObjectId,
			ref: "order"
		},
		reason: value,

		amount: {
			type: Number,
			required: true,
		},
		type: {
			type: String,
			enum: ["purchase", "sending", "order", "upgrade","gift", "withdraw","newaccountaward", "upgrade_renewal", "referral", "refund", "deposit"],
			required: true,
		},
		status: {
			type: String,
			enum: ["Pending", "Completed", "Failed"],
			required: true,
		},
		deducting: {
			type: Boolean,
			required: true,
		},
		date: {
			type: Number,
			default: 0
		},
		stripeBankAccount: {
			type: String,
			required: false,
		},
	},
	{ timestamps: true, autoIndex: true, autoCreate: true }
);

const transactionModel = model("transaction", transactionSchema);

module.exports = transactionModel