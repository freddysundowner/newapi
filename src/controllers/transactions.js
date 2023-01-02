const transactionModel = require("../models/transactionSchema");
const mongoose = require("mongoose");
const userModel = require("../models/userSchema");

exports.getUserTransactionsByUserId = async (req, res) => {
	try {
		let transactions = await transactionModel
			.find({
				$or: [{ to: req.params.userId }],
			})
			.sort({date: -1})
			.limit(20)
			.populate("from", ["firstName", "lastName", "bio", "userName", "email"])
			.populate("to", ["firstName", "lastName", "bio", "userName", "email"])
		res
			.status(200)
			.setHeader("Content-Type", "application/json")
			.json(transactions);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};

exports.getUserTransactionsPaginated = async (req, res) => {

	try {
		var pageNumber = req.params.pagenumber
		
		if (pageNumber == 0) {
			pageNumber = 1
		}
		   pageNumber = pageNumber - 1

		const transactions = await transactionModel.aggregate([
			{
				$match: {"to": { $eq: mongoose.Types.ObjectId(req.params.userId) }}
			},
			{
				$sort: { "date": -1 }
			},
			{
				$facet: {
					metadata: [{ $count: "total" }, { $addFields: { page: pageNumber } }],
					data: [
						{
						$lookup: {
							from: "users",
							localField: "from",
							foreignField: "_id",
							as: "from"
							}
						},
						{
							$lookup: {
								from: "users",
								localField: "to",
								foreignField: "_id",
								as: "to"
								}
							},
						{ $skip: pageNumber * 20 }, 
						{ $limit: 20 },
						
					], // add projection here wish you re-shape the docs
				}
			}

		])
		res.statusCode = 200;
		res.setHeader("Content-Type", "application/json");
		res.json(transactions);

	} catch (error) {
		console.log(error + " ")
		res.statusCode = 422;
		res.setHeader("Content-Type", "application/json");
		res.json(error);

	}
};

exports.createTransaction = async (req, res) => {
	let newTransaction = {
		from: req.body.from,
		to: req.body.to,
		reason: req.body.reason,
		amount: req.body.amount,
		type: req.body.type,
		deducting: req.body.deducting,
		status: req.body.status,
		shopId: req.body.shopId,
		stripeBankAccount: req.body.stripeBankAccount ?? "",
		date: Date.now()
	};
	try {
		if (newTransaction.type === "purchase") {
			await userModel.findByIdAndUpdate(req.params.userId, {
				$inc: { wallet: -newTransaction.amount },
			});
		}

		let transaction = await transactionModel.create(newTransaction);
		res
			.status(200)
			.setHeader("Content-Type", "application/json")
			.json(transaction);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};

exports.getTransactionById = async (req, res) => {
	try {
		let trans = await transactionModel.findById(req.params.transId)			
			.populate("from", ["firstName", "lastName", "bio", "userName", "email"])
			.populate("to", ["firstName", "lastName", "bio", "userName", "email"])
			.populate("shopId")
		res.status(200).setHeader("Content-Type", "application/json").json(trans);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};

exports.getTransactionByShopId = async (req, res) => {
   	try {
			let trans = await transactionModel.find({shopId: req.params.shopId}).populate("shopId");
			res.status(200).setHeader("Content-Type", "application/json").json(trans);
		} catch (error) {
			res
				.status(422)
				.setHeader("Content-Type", "application/json")
				.json(error.message);
		}
}


exports.updateTransactionById = async (req, res) => {

	try {
		let transaction = await transactionModel.findByIdAndUpdate(
			req.params.transId,
			{ $set: req.body },
			{ runValidators: true, new: true }
		);
		res
			.status(200)
			.setHeader("Content-Type", "application/json")
			.json({success: true, data: transaction});
	} catch (error) {
		console.log(error + " ")
		res
			.status(422)
			.setHeader("Content-Type", "Application/json")
			.json({success: true, message: error.message + " "});
	}
};
