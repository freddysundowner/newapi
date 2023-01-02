var mongoose = require("mongoose");
var productModel = require("../models/productSchema");
const shopModel = require("../models/shopSchema");
const reviewModel = require("../models/reviews");
var ObjectId = require("mongodb").ObjectID;
exports.getAllProducts = async (req, res) => {
  try {
    let products = await productModel
      .find({ available: { $ne: false }, deleted: { $ne: true } })
      .populate("shopId", ["image", "open","paymentOptions","shippingMethods"])
      .populate("category")
      .populate("reviews")      .populate("ownerId", ["userName", "stripeAccountId","fw_subacoount","fw_id"])
      .sort({ createdAt: -1 });
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(products);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};


exports.categoryProducts = async function (req, res) {
  try {
    const products = await productModel
      .find({
        $and: [
          { category: { $in :req.params.category }},
          { deleted: { $ne: true } }
        ],
      })
      .populate("shopId", ["image", "open", "name","paymentOptions","shippingMethods"])
      .populate("ownerId", ["userName", "stripeAccountId","fw_subacoount","fw_id"])
      .populate("category")
      .populate("reviews")

    res.json(products);
  } catch (error) {
    console.log(error + " ");
    res.status(404).send(error);
  }
};


exports.relatedProducts = async function (req, res) {
  	console.log(req.body.categories);
  try {
    const products = await productModel
      .find({
        $and: [
          { categories: { $in :req.body.categories }},
          { deleted: { $ne: true } },
          { _id: { $ne: req.params.id } },
        ],
      })
     .populate("shopId", ["image", "open", "name","paymentOptions","shippingMethods"])
      .populate("ownerId", ["userName", "stripeAccountId","fw_subacoount","fw_id"])
      .populate("category")
      .populate("reviews")
    res.json(products);
  } catch (error) {
    console.log(error + " ");
    res.status(404).send(error);
  }
};

exports.getAllProductsPaginated = async (req, res) => {
  try {
    const { title, category, price, page, limit, userid, featured  } = req.query;

    const queryObject = {};

    let sortPrice;

    if (title) {
      queryObject.$or = [{ name: { $regex: `${title}`, $options: "i" } }];
    }

    if (userid) {
      queryObject.$or = [{ ownerId: { $eq: userid } }];
    }
    if (price === "Low") {
      sortPrice = 1;
    } else {
      sortPrice = -1;
    }

    if (featured == "true") {
      queryObject.feature = { $eq: true};
    }
    
    if (category) {
      queryObject.parent = { $regex: category, $options: "i" };
    }
    
    console.log(queryObject);

	queryObject.deleted = { $ne: true };
    const pages = Number(page);
    const limits = Number(limit);
    const skip = (pages - 1) * limits;

    try {
      const totalDoc = await productModel.countDocuments(queryObject);
      const products = await productModel
        .find(queryObject)
        .sort(price ? { price: sortPrice } : { _id: -1 })
        .skip(skip)
      .populate("shopId", ["image", "open","paymentOptions","shippingMethods",'name'])
      .populate("ownerId", ["userName", "stripeAccountId","fw_subacoount","fw_id"])
      .populate("category")
      .populate("reviews")
        .limit(limits);

      res.send({
        products,
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


exports.getAllTheProducts = async (req, res) => {
  try {
    console.log(req.body);
    let products = await productModel
      .find({ deleted: { $ne: true } })
      .populate("shopId", ["image", "open","paymentOptions","shippingMethods"])
      .populate("ownerId", ["userName", "stripeAccountId","fw_subacoount","fw_id"])
      .populate("category")
      .populate("reviews")      .sort({ createdAt: -1 });
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(products);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getMyAllProductsByShopId = async (req, res) => {
  try {
    let products = await productModel
      .find({
        $and: [{ shopId: req.params.shopId }, { deleted: { $ne: true } }],
      })
      .populate("shopId", ["image", "open", "name","paymentOptions","shippingMethods"])
      .populate("ownerId", ["userName", "stripeAccountId","fw_subacoount","fw_id"])
      .populate("category")
      .populate("reviews")      .sort({ createdAt: -1 });
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(products);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getAllProductsByShopId = async (req, res) => {
  try {
    let products = await productModel
      .find({
        $and: [
          { shopId: req.params.shopId },
          { available: { $ne: false }, deleted: { $ne: true } },
        ],
      })
      .populate("shopId", ["image", "open", "name","paymentOptions","shippingMethods"])
      .populate("ownerId", ["userName", "stripeAccountId","fw_subacoount","fw_id"])
      .populate("category")
      .populate("reviews")      .sort({ createdAt: -1 });
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(products);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getAllProductsByUserId = async (req, res) => {
  try {
    let products = await productModel
      .find({
        $and: [
          { ownerId: req.params.userId },
          { available: { $ne: false }, deleted: { $ne: true } },
        ],
      })
      .populate("shopId", ["image", "open","paymentOptions","shippingMethods"])
      .populate("category")
      .populate("reviews")      .populate("ownerId", ["userName", "stripeAccountId","fw_subacoount","fw_id"])
      .sort({ createdAt: -1 });
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(products);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.productQtyCheck = async (req, res) => {
  let product = await productModel.findById(req.body.productId);
  if (product.quantity < req.body.quantity) {
    return res.send({ status: false, qty: product.quantity });
  }
  return res.send({ status: true, qty: product.quantity });
};
exports.deleteProductReviewsById = async (req, res) => {
	console.log(req.params.id);

  try {
	let deleted = await reviewModel.findOneAndRemove(req.params.id);
	 res
	      .status(200)
	      .setHeader("Content-Type", "application/json")
	      .json({ success: true, data:deleted });
  } catch (error) {
	  console.log(error)
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};
exports.getProductReviewsByUserId = async (req, res) => {

  try {
	let reviewresponse = await reviewModel.find({userId: req.params.userId, product:req.params.id}).populate({
	      path: "product",
	    }).populate({
	      path: "userId",
	    })
      .populate("reviews");
	 res
	      .status(200)
	      .setHeader("Content-Type", "application/json")
	      .json({ success: true, data:reviewresponse });
  } catch (error) {
	  console.log(error)
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};
exports.getProductReviews = async (req, res) => {

  try {
	let reviewresponse = await reviewModel.find({product:req.params.id}).populate({
	      path: "product",
	    }).populate({
	      path: "userId",
	    })
      .populate("reviews");
	 res
	      .status(200)
	      .setHeader("Content-Type", "application/json")
	      .json({ success: true, data:reviewresponse });
  } catch (error) {
	  console.log(error)
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};
exports.addProductReview = async (req, res) => {
  console.log("addProductReview");
  const review = {
    product: req.params.id,
    userId: req.body.userId,
    review: req.body.review,
    rating: req.body.rating,
  };

  try {
	let reviewresponse = await reviewModel.find({userId: req.body.userId, product:req.params.id});
	if(reviewresponse.length > 0){
		res
	      .status(200)
	      .setHeader("Content-Type", "application/json")
	      .json({ success: false, message: "You have already left a review for this product" });
	}else{
	    let response = await reviewModel.create(review);
	    let data = await reviewModel.findById(response._id)
      .populate("reviews").populate({
	      path: "userId",
	    });
	    	await productModel.findByIdAndUpdate(
		      req.params.id,
		      {
		        $addToSet: { reviews: response._id },
		      },
		      { runValidators: true, new: true, upsert: false }
		    );	
	    res
	      .status(200)
	      .setHeader("Content-Type", "application/json")
	      .json({ success: true, data });
    }
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.addProductToShop = async (req, res) => {
  const newProduct = {
    name: req.body.name,
    price: req.body.price,
    quantity: req.body.quantity,
    images: req.body.images,
    shopId: mongoose.mongo.ObjectId(req.params.shopId),
    ownerId: req.body.ownerId,
    description: req.body.description,
    variations: req.body.variations.split(","),
    categories: req.body.categories,
    category: req.body.category,
    discountedPrice: req.body.discountedPrice,
  };

  try {
    let newProd = await productModel.create(newProduct);
    let product = await productModel.findById(newProd._id).populate({
      path: "ownerId",
      populate: {
        path: "shopId",
      },
    })
      .populate("reviews")      .populate("category");

    newProd.shopId = null;
    newProd.ownerId = null;

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: product });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.searchForProduct = async function (req, res) {
  try {
    var pageNumber = req.params.pagenumber;
    if (pageNumber < 1) {
      pageNumber = 1;
    }

    const products = await productModel.aggregate([
      {
        $match: {
          $and: [
            {
              $expr: {
                $regexMatch: {
                  input: "$name",
                  regex: req.params.name,
                  options: "i",
                },
              },
            },
            { deleted: { $ne: true } },
            { available: { $ne: false } },
          ],
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page: pageNumber } }],
          data: [
            {
              $lookup: {
                from: "shops",
                localField: "shopId",
                foreignField: "_id",
                as: "shopId",
              },
            },
            {
              $lookup: {
                from: "category",
                localField: "category",
                foreignField: "_id",
                as: "category",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "ownerId",
                foreignField: "_id",
                as: "ownerId",
                pipeline: [
                  {
                    $lookup: {
                      from: "shops",
                      localField: "shopId",
                      foreignField: "_id",
                      as: "shopId",
                    },
                  },
                ],
              },
            },
            { $skip: (pageNumber - 1) * 20 },
            { $limit: 20 },
          ], // add projection here wish you re-shape the docs
        },
      },
    ]);

    res.json(products);
  } catch (error) {
    res.status(404).send(error);
  }
};

exports.getProductById = async (req, res) => {
  try {
    let product = await productModel
      .findById(req.params.productId)
      .populate("shopId")
      .populate("category")
      .populate("reviews")
      .populate({
        path: "ownerId",
        populate: {
          path: "payoutmethod",
        },
      });
//       .populate("ownerId", ["userName", "stripeAccountId","fw_subacoount","fw_id"]);
    res.status(200).setHeader("Content-Type", "application/json").json(product);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};





exports.updateProductById = async (req, res) => {
  if (req.body.variations) {
    req.body.variations = req.body.variations.split(",");
  }
  
 
  let newObj = req.body;
  try {
    let newProduct = await productModel
      .findByIdAndUpdate(mongoose.Types.ObjectId(req.params.productId), {
        $set: newObj,
      })
      .populate("shopId", [
        "name",
        "email",
        "location",
        "phoneNumber",
        "image",
        "description",
        "open",
        "ownerId","paymentOptions","shippingMethods"
      ])
      .populate("category")
      .populate("reviews")      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "stripeAccountId","fw_subacoount","fw_id"
      ]);
            
    if(req.body.deleted == true && newProduct.type =="WC"){
	  let updatedShop = await  shopModel
	    .findByIdAndUpdate(
	      newProduct.shopId._id,
	      {
	        $pullAll: { wcIDs: [newProduct.wcid] },
	      },
	      { new: true, runValidators: true }
	    );

    }

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: newProduct });
  } catch (error) {
    console.log(error);
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.updateProductImages = async (req, res) => {
  let newObj = {
    images: req.body.images,
  };
  try {
    let newProduct = await productModel.findByIdAndUpdate(
      req.params.productId,
      { $set: newObj },
      { runValidators: true, new: true }
    )
      .populate("shopId", [
        "name",
        "email",
        "location",
        "phoneNumber",
        "image",
        "description",
        "open",
        "ownerId","paymentOptions","shippingMethods"
      ])
      .populate("category")
      .populate("reviews")      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "stripeAccountId","fw_subacoount","fw_id"
      ]);


//     newProduct.shopId = null;
//     newProduct.ownerId = null;

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: newProduct });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json({ success: false, message: error + " " });
  }
};

exports.deleteProductById = async (req, res) => {
  try {
    let deleted = await productModel.findOneAndRemove({
      _id: req.params.productId,
    });
    res.status(200).setHeader("Content-Type", "application/json").json(deleted);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};
