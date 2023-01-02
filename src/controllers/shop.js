const shopModel = require("../models/shopSchema");
const userModel = require("../models/userSchema");
var productModel = require("../models/productSchema");
var mongoose = require("mongoose");
const functions = require("../shared/functions");
var ObjectId = require('mongodb').ObjectID;

exports.getAllShops = async (req, res) => {
	try {
		let shops = await shopModel.find().limit(50).populate("userId", ["userName"]).sort({ createdAt: -1 });
		res.status(200).setHeader("Content-Type", "application/json").json(shops);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};


exports.getAllShopsPaginated = async (req, res) => {
  try {
    const { title, page, limit } = req.query;

    const queryObject = {};

    let sortPrice;

    if (title) {
      queryObject.$or = [{ name: { $regex: `${title}`, $options: "i" } }];
    }
    const pages = Number(page);
    const limits = Number(limit);
    const skip = (pages - 1) * limits;

    try {
      const totalDoc = await shopModel.countDocuments(queryObject);
      const shops = await shopModel
        .find(queryObject)
        .sort({ _id: -1 })
        .skip(skip).populate("userId", ["userName"])
        .limit(limits);

      res.send({
        shops,
        totalDoc,
        limits,
        pages,
      });
    } catch (err) {
      res.status(500).send({
        message: err.message,
      });
    }
  } catch (error) {
    console.log(error + " ");
    res.statusCode = 422;
    res.setHeader("Content-Type", "application/json");
    res.json(error);
  }
};

exports.unFollowShop = async (req, res) => {
  try {
    let userId = req.params.userId;
    let shopId = req.params.shopId;

    await shopModel.findByIdAndUpdate(
      shopId,
      {
        $pullAll: { followers: [userId] },
      },
      { runValidators: true, new: true, upsert: false }
    );

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({success: true, message: "unfollowed"});
  } catch (error) {
    console.log(error);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json(error);
  }
};

exports.followShop = async (req, res) => {
  try {
    let userId = req.params.userId;
    let shopId = req.params.shopId;

    var response = await shopModel.findByIdAndUpdate(
      shopId,
      {
        $addToSet: { followers: userId },
      },
      { runValidators: true, new: true, upsert: false }
    ).populate("userId");


    functions.saveActivity(
      shopId,
      "Your shop has a new follower",
      "Shop",
      false,
      null,
      userId,
      "Your shop has a new follower",
      shopId
    );
    
    let user = await userModel.findById(userId)
    functions.sendNotificationOneSignal(
          [response.userId.notificationToken],
          "New Shop Follower",
          user.firstName+" has started following your shop",
          response._id
        );


    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({success: true, message: "followed"});
  } catch (error) {
    console.log(error + " ");
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json({ success: false });
  }
};


exports.getAllShopsByUserId = async (req, res) => {
	try {
		let shops = await shopModel
			.findOne({ userId: req.params.userId })
			.populate("userId", [
				"firstName",
				"lastName",
				"bio",
				"userName",
				"email",
			]).sort({ createdAt: -1 });
		res.status(200).setHeader("Content-Type", "application/json").json(shops);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};


exports.searchForShop = async function (req, res) {
	try {

		var pageNumber = req.params.pagenumber
		if (pageNumber < 1) {
			pageNumber = 1
		  }
		  

		const shops = await shopModel.aggregate([
			{
				$match: {
					$expr: {
						$regexMatch: {
							input: "$name",
							regex: req.params.name,
							options: "i"
						}
					}
				}
			},
			{
				$facet: {
					metadata: [{ $count: "total" }, { $addFields: { page: pageNumber } }],
					data: [
						{
							$lookup: {
								from: "users",
								localField: "userId",
								foreignField: "_id",
								as: "userId"
							}
						},
						{ $skip: (pageNumber - 1) * 20 },
						{ $limit: 20 },

					], // add projection here wish you re-shape the docs
				}
			}

		])



		res.json(shops);
	} catch (error) {
		res.status(404).send(error);
	}
};


exports.getShippingMethods = async (req, res) => {
	try {
		
		let data = await  shopModel.find({_id: req.params.id});

		res
			.status(200)
			.setHeader("Content-Type", "application/json")
			.json({ success: true, data });
	} catch (error) {
		if (error.code === 11000) res.status(409);
		else res.status(422);
		res.setHeader("Content-Type", "application/json").json({ "success": false, message: error.message });
	}
};

exports.addShippingMethood = async (req, res) => {

	try {
		console.log(req.body);
		let updatedShop = await  shopModel
	    .findByIdAndUpdate(
	      req.params.id,
	      {
	        shippingMethods: req.body.data,
	      },
	      { new: true, runValidators: true }
	    );

		res
			.status(200)
			.setHeader("Content-Type", "application/json")
			.json({ success: true, updatedShop });
	} catch (error) {
		if (error.code === 11000) res.status(409);
		else res.status(422);
		res.setHeader("Content-Type", "application/json").json({ "success": false, message: error.message });
	}
};

exports.createShop = async (req, res) => {
	const newShop = {
		name: req.body.name,
		location: req.body.location,
		image: req.body.image,
		ownerId: req.body.ownerId,
		description: req.body.description,
		userId: mongoose.mongo.ObjectId(req.params.userId),
	};

	try {
		let brandNew = await shopModel.create(newShop);
		console.log(brandNew._id);
		await userModel
			.findByIdAndUpdate(
				req.params.userId,
				{
					$set: { shopId: mongoose.mongo.ObjectId(brandNew._id) },
				}

			);

		res
			.status(200)
			.setHeader("Content-Type", "application/json")
			.json({ success: true, data: brandNew });
	} catch (error) {
		if (error.code === 11000) res.status(409);
		else res.status(422);
		res.setHeader("Content-Type", "application/json").json({ "success": false, message: error.message });
	}
};

exports.getShopById = async (req, res) => {
	try {
		let shop = await shopModel
			.findById(req.params.shopId)
			.populate("userId", [
				"firstName",
				"lastName",
				"bio",
				"userName",
				"email"
			]);
		res.status(200).setHeader("Content-Type", "application/json").json(shop);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};

//keep the image name consistent through all updates and remember to  save in the files
exports.updateShopById = async (req, res) => {
	let newObj = req.body;
	try {
/*
		let updatedShop = await shopModel.findByIdAndUpdate(
			req.params.shopId,
			newObj,
			{ runValidators: true, new: true }
		);
*/
		
		let updatedShop = await  shopModel
	    .findByIdAndUpdate(
	      req.params.shopId,
	      {
	        $set: newObj,
	      },
	      { new: true, runValidators: true }
	    );
    
	console.log(updatedShop);
		if (req.body.open == false) {
			console.log(req.params.shopId);
			await productModel.updateMany({ shopId: ObjectId(req.params.shopId) }, { $set: { available: false } }, { multi: true })
		}

		if (req.body.open == true) {
			console.log(req.params.shopId);
			await productModel.updateMany({ shopId: ObjectId(req.params.shopId) }, { $set: { available: true } }, { multi: true })
		}

		res
			.status(200)
			.setHeader("Content-Type", "application/json")
			.json({ success: true, data: updatedShop });
	} catch (e) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json({ success: false, message: e.message });
	}
};

exports.deleteShopById = async (req, res) => {
	try {
		let del = await shopModel.findByIdAndDelete(req.params.shopId);
		res.status(200).setHeader("Content-Type", "application/json").json(del);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};
