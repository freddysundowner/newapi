const billingModel = require("../models/billingSchema");

exports.addBilling = async (req, res) => {
	try {
		let newBilling = await billingModel.create(req.body);
		res
			.status(200)
			.setHeader("Content-Type", "application/json")
			.json(newBilling);
	} catch (error) {
		res.status(422).setHeader("Content-Type", "application/json").json(error)
	}
};


exports.getBillingByUserId = async (req, res) => {
	try {
		let billings = await billingModel
			.find({ userId: req.params.userId })
			.populate("userId", [
				"firstName",
				"lastName",
				"bio",
				"userName",
				"email",
			]);
		res
			.status(200)
			.setHeader("Content-Type", "application/json")
			.json(billings);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};


exports.updateBillingById = async (req, res) => {
	try {
		let updatedBilling = await billingModel.findByIdAndUpdate(
			req.params.billingId,
			{ $set: req.body },
			{ runValidators: true, new: true }
		);
		res
			.status(200)
			.setHeader("Content-Type", "application/json")
			.json(updatedBilling);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};

exports.getBillingById = async (req, res) => {
	try {
		let billing = await billingModel
			.findById(req.params.billingId)
			.populate("userId", [
				"firstName",
				"lastName",
				"bio",
				"userName",
				"email",
			]);
		res.status(200).setHeader("Content-Type", "application/json").json(billing);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};

exports.deleteBillingById = async (req, res) => {
	try {
		let deleted = await billingModel.findByIdAndDelete(req.params.billingId);
		res.status(200).setHeader("Content-Type", "application/json").json(deleted);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};
