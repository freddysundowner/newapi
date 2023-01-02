const mongoose = require("mongoose");
const { Schema, model } = mongoose;



const favoriteSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "user",
		},
		productId: [{
			type: Schema.Types.ObjectId,
			default: [],
			ref: "product",
		}]
	},
	{ timestamps: true, autoCreate: true, autoIndex: true }
);


const favorite = model("favorite", favoriteSchema);

module.exports = favorite;
