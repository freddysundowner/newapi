var orderModel = require("../models/orderSchema");
const mongoose = require("mongoose");
const itemModel = require("../models/itemSchema");
const userModel = require("../models/userSchema");
const transactionModel = require("../models/transactionSchema");
const shopModel = require("../models/shopSchema");
var productModel = require("../models/productSchema");
const moment = require("moment");
const addressModel = require("../models/addressSchema");

const axios = require("axios");
const utils = require("../../utils");
const functions = require("../shared/functions");

exports.getAllOrders = async (req, res) => {
  try {
    const { invoice, status, page, limit, day, userid,shopId } = req.query;


    // day count
    let date = new Date();
    const today = date.toString();
    date.setDate(date.getDate() - Number(day));
    const dateTime = date.toString();

    const beforeToday = new Date();
    beforeToday.setDate(beforeToday.getDate() - 1);

    const queryObject = {};

    if (invoice) {
      queryObject.invoice = { $eq: parseInt(invoice) };
    }
    if (userid) {
      queryObject.customerId = { $eq: userid };
    }
    if (shopId) {
      queryObject.shopId = { $eq: shopId };
    }

    if (day) {
      queryObject.createdAt = { $gte: dateTime, $lte: today };
    }

    if (status) {
      queryObject.status = { $regex: `${status}`, $options: "i" };
    }

    const pages = Number(page) || 1;
    const limits = Number(limit) || 8;
    const skip = (pages - 1) * limits;

    try {
      // total orders count
      const totalDoc = await orderModel.countDocuments(queryObject);
      // today order amount

      // query for orders
      const orders = await orderModel
        .find(queryObject)
        .sort({ _id: -1 })
        .skip(skip)
        .populate("customerId", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
        ])
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
	        populate: {
	          path: "category",
	        },
        },
      })
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
	        populate: {
	          path: "reviews",
	        },
        },
      })
        .populate({
          path: "itemId",
          populate: {
            path: "productId",
            populate: {
              path: "ownerId",

              populate: {
                path: "shopId",
              },
            },
          },
        })

        .populate("billingId")
        .populate("shippingId")

        .limit(limits);

      res.send({
        orders,
        limits,
        pages,
        totalDoc,
      });
    } catch (err) {
      res.status(500).send({
        message: err.message,
      });
    }
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.bestSellerProductChart = async (req, res) => {
  try {
	const queryObject = {};
	  const { userid } = req.query;
	      if (userid) {
      queryObject.customerId = { $eq: userid };
    }
    const totalDoc = await orderModel.countDocuments(queryObject);
    const bestSellingProduct = await orderModel.aggregate([
      
      {
        $group: {
          _id: "$productId",

          count: {
            $sum: "$quantity",
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 4, 
      },
    ]);

    res.send({
      totalDoc,
      bestSellingProduct,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

exports.getDashboardOrdersShopOwner = async (req, res) => {
  const { page, limit,userid,shopid } = req.query;
var ObjectID = require('mongodb').ObjectID;

  const pages = Number(page) || 1;
  const limits = Number(limit) || 8;
  const skip = (pages - 1) * limits;

  let week = new Date();
  week.setDate(week.getDate() - 10);

  //   const start = new Date();
  var start = moment().startOf("day");
  const queryObject = {};
   if (userid) {
	   queryObject.$or =  [{ customerId: {$eq: userid} }]
	}
	
   if (shopid) {
	   queryObject.$or =  [{shopId:{$eq: new ObjectID(shopid)}}, { customerId: {$eq: userid} }];
	}
	
	console.log(queryObject)
   
  try {
    const totalDoc = await orderModel.countDocuments(queryObject);
    // query for orders
    const orders = await orderModel
      .find(queryObject)
      .sort({ _id: -1 })
      .skip(skip)

      .populate("customerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ])
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
          populate: {
            path: "ownerId",

            populate: {
              path: "shopId",
            },
          },
        },
      })

      .populate("billingId")
      .populate("shippingId")
      .limit(limits);

    const totalAmount = await orderModel.aggregate([
	    {$match: {$or: [{customerId: new ObjectID(userid)}, {shopId:{$eq: new ObjectID(shopid)}}]}},
      {
        $group: {
          _id: null,
          tAmount: {
            $sum: "$totalCost",
          },
        },
      },
    ]);


    // total order amount
    queryObject.createdAt = { $gte: start };

    const todayOrder = await orderModel.find(queryObject);

    // this month order amount
    const totalAmountOfThisMonth = await orderModel.aggregate([
	    {$match: {$or: [{customerId: new ObjectID(userid)}, {shopId:{$eq: new ObjectID(shopid)}}]}},
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
          },
          total: {
            $sum: "$totalCost",
          },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    // total padding order count
    const totalPendingOrder = await orderModel.aggregate([
      {
        $match: {
          status: "pending",
          $or: [{customerId: new ObjectID(userid)}, {shopId:{$eq: new ObjectID(shopid)}}]
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total delivered order count
    const totalProcessingOrder = await orderModel.aggregate([
      {
        $match: {
          status: "processing",
          $or: [{customerId: new ObjectID(userid)}, {shopId:{$eq: new ObjectID(shopid)}}]
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total delivered order count
    const totalDeliveredOrder = await orderModel.aggregate([
      {
        $match: {
          status: "completed",
          $or: [{customerId: new ObjectID(userid)}, {shopId:{$eq: new ObjectID(shopid)}}]
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    //weekly sale report
    // filter order data
    const weeklySaleReport = await orderModel.find({
      $or: [{customerId: new ObjectID(userid)}, {shopId:{$eq: new ObjectID(shopid)}}],
      createdAt: {
        $gte: week,
      },
      status: "completed"
    });

    res.send({
      totalOrder: totalDoc,
      totalAmount:
        totalAmount.length === 0
          ? 0
          : parseFloat(totalAmount[0].tAmount).toFixed(2),
      todayOrder: todayOrder,
      totalAmountOfThisMonth:
        totalAmountOfThisMonth.length === 0
          ? 0
          : parseFloat(totalAmountOfThisMonth[0].total).toFixed(2),
      totalPendingOrder:
        totalPendingOrder.length === 0 ? 0 : totalPendingOrder[0],
      totalProcessingOrder:
        totalProcessingOrder.length === 0 ? 0 : totalProcessingOrder[0].count,
      totalDeliveredOrder:
        totalDeliveredOrder.length === 0 ? 0 : totalDeliveredOrder[0].count,
      orders,
      weeklySaleReport,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

exports.getDashboardOrdersAdmin = async (req, res) => {
  const { page, limit } = req.query;

  const pages = Number(page) || 1;
  const limits = Number(limit) || 8;
  const skip = (pages - 1) * limits;

  let week = new Date();
  week.setDate(week.getDate() - 10);

  //   const start = new Date();
  var start = moment().startOf("day");

  try {
    const totalDoc = await orderModel.countDocuments({});

    // query for orders
    const orders = await orderModel
      .find({})
      .sort({ _id: -1 })
      .skip(skip)

      .populate("customerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ])
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
          populate: {
            path: "ownerId",

            populate: {
              path: "shopId",
            },
          },
        },
      })

      .populate("billingId")
      .populate("shippingId")
      .limit(limits);

    const totalAmount = await orderModel.aggregate([
      {
        $group: {
          _id: null,
          tAmount: {
            $sum: "$totalCost",
          },
        },
      },
    ]);


    // total order amount
    const todayOrder = await orderModel.find({ createdAt: { $gte: start } });

    // this month order amount
    const totalAmountOfThisMonth = await orderModel.aggregate([
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
          },
          total: {
            $sum: "$totalCost",
          },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    // total padding order count
    const totalPendingOrder = await orderModel.aggregate([
      {
        $match: {
          status: "pending",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total delivered order count
    const totalProcessingOrder = await orderModel.aggregate([
      {
        $match: {
          status: "processing",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // total delivered order count
    const totalDeliveredOrder = await orderModel.aggregate([
      {
        $match: {
          status: "delivered",
        },
      }, 
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    //weekly sale report
    // filter order data
    const weeklySaleReport = await orderModel.find({
      $or: [{ status: { $regex: `delivered`, $options: "i" } }],
      createdAt: {
        $gte: week,
      },
    });

    res.send({
      totalOrder: totalDoc,
      totalAmount:
        totalAmount.length === 0
          ? 0
          : parseFloat(totalAmount[0].tAmount).toFixed(2),
      todayOrder: todayOrder,
      totalAmountOfThisMonth:
        totalAmountOfThisMonth.length === 0
          ? 0
          : parseFloat(totalAmountOfThisMonth[0].total).toFixed(2),
      totalPendingOrder:
        totalPendingOrder.length === 0 ? 0 : totalPendingOrder[0],
      totalProcessingOrder:
        totalProcessingOrder.length === 0 ? 0 : totalProcessingOrder[0].count,
      totalDeliveredOrder:
        totalDeliveredOrder.length === 0 ? 0 : totalDeliveredOrder[0].count,
      orders,
      weeklySaleReport,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

exports.getAllOrdersByUserId = async (req, res) => {
  try {
    let orders = await orderModel
      .find({
        customerId: req.params.userId,
      })
      .populate("customerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ])
     
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
	        populate: {
	          path: "category",
	        },
        },
      })
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
	        populate: {
	          path: "reviews",
	        },
        },
      })
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
          populate: {
            path: "ownerId",

            populate: {
              path: "shopId",
            },
          },
        },
      })

      .populate("billingId")
      .populate("shippingId")
      .limit(10)
      .sort({ date: -1 });

    res.status(200).setHeader("Content-Type", "application/json").json(orders);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getPaginatedOrdersByUserId = async (req, res) => {
  try {
    var pageNumber = req.params.pagenumber;

    if (pageNumber < 1) {
      pageNumber = 1;
    }

    pageNumber = pageNumber - 1;

    const orders = await orderModel.aggregate([
      {
        $match: {
          customerId: { $eq: mongoose.Types.ObjectId(req.params.userId) },
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page: pageNumber } }],
          data: [
            {
              $lookup: {
                from: "users",
                localField: "customerId",
                foreignField: "_id",
                as: "customerId",
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
            {
              $lookup: {
                from: "billings",
                localField: "billingId",
                foreignField: "_id",
                as: "billingId",
              },
            },
            {
              $lookup: {
                from: "addresses",
                localField: "shippingId",
                foreignField: "_id",
                as: "shippingId",
              },
            },
            {
              $lookup: {
                from: "items",
                localField: "itemId",
                foreignField: "_id",
                as: "itemId",
                pipeline: [
                  {
                    $lookup: {
                      from: "products",
                      localField: "productId",
                      foreignField: "_id",
                      as: "productId",
                      pipeline: [
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
                      ],
                    },
                  },
                ],
              },
            },
            { $skip: pageNumber * 10 },
            { $limit: 10 },
          ], // add projection here wish you re-shape the docs
        },
      },
    ]);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(orders);
  } catch (error) {
    res.statusCode = 422;
    res.setHeader("Content-Type", "application/json");
    res.json(error);
  }
};

exports.getOrderByProductId = async (req, res) => {
  try {
    let orders = await orderModel
      .find({ productIds: req.params.productId })
      .populate("productId").populate("reviews");
    res.status(200).setHeader("Content-Type", "application/json").json(orders);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getOrderByShopId = async (req, res) => {
  try {
    let orders = await orderModel
      .find({ shopId: req.params.shopId })
      .populate("customerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ])
     
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
	        populate: {
	          path: "category",
	        },
        },
      })
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
	        populate: {
	          path: "reviews",
	        },
        },
      })
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
          populate: {
            path: "ownerId",

            populate: {
              path: "shopId",
            },
          },
        },
      })

      .populate("billingId")
      .populate("shippingId")
      .sort({ createdAt: -1 });
    res.status(200).setHeader("Content-Type", "application/json").json(orders);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getPaginatedOrdersByShopId = async (req, res) => {
  try {
    var pageNumber = req.params.pagenumber;

    if (pageNumber < 1) {
      pageNumber = 1;
    }
    pageNumber = pageNumber - 1;

    const orders = await orderModel.aggregate([
      {
        $match: { shopId: { $eq: mongoose.Types.ObjectId(req.params.shopId) } },
      },
      {
        $sort: { date: -1 },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page: pageNumber } }],
          data: [
            {
              $lookup: {
                from: "users",
                localField: "customerId",
                foreignField: "_id",
                as: "customerId",
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
            {
              $lookup: {
                from: "billings",
                localField: "billingId",
                foreignField: "_id",
                as: "billingId",
              },
            },
            {
              $lookup: {
                from: "addresses",
                localField: "shippingId",
                foreignField: "_id",
                as: "shippingId",
              },
            },
            {
              $lookup: {
                from: "items",
                localField: "itemId",
                foreignField: "_id",
                as: "itemId",
                pipeline: [
                  {
                    $lookup: {
                      from: "products",
                      localField: "productId",
                      foreignField: "_id",
                      as: "productId",
                      pipeline: [
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
                      ],
                    },
                  },
                ],
              },
            },
            { $skip: pageNumber * 10 },
            { $limit: 10 },
          ], // add projection here wish you re-shape the docs
        },
      },
    ]);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(orders);
  } catch (error) {
    res.statusCode = 422;
    res.setHeader("Content-Type", "application/json");
    res.json(error);
  }
};


async function createWOrder(userId, productid, quantity,shopId) {
  var address = await addressModel.findOne({ userId: userId }).populate("userId",["firstName", "lastName","bio","userName","email"]);
  var wData = {
    payment_method: "bacs",
    payment_method_title: "TokShop",
    set_paid: true,
    billing: {
      first_name: address.userId.firstName,
      last_name: address.userId.lastName,
      address_1: address.addrress1,
      address_2: address.addrress2,
      city: address.city,
      state: address.state,
      postcode: "0",
      country: "US",
      email: address.userId.email,
      phone: address.phone,
    },
    shipping: {
      first_name: address.userId.firstName,
      last_name: address.userId.lastName,
      address_1: address.addrress1,
      address_2: address.addrress2,
      city: address.city,
      state: address.state,
      postcode: "0",
      country: "US",
    },
    line_items: [
      {
        product_id: productid,
        quantity: quantity,
      },
    ],
    shipping_lines: [
      {
        method_id: "flat_rate",
        method_title: "Flat Rate",
        total: "00.00",
      },
    ],
  };
  console.log(`${shop.wcUrl}/orders?consumer_key=${shop.wcConsumerKey}&consumer_secret=${shop.wcSecretKey}`);
  let shop = await shopModel
			.findById(shopId);
  var order = await axios.post(`${shop.wcUrl}/orders?consumer_key=${shop.wcConsumerKey}&consumer_secret=${shop.wcSecretKey}`, wData);
  return order;
}

exports.addOrder = async (req, res) => {
  let newOrder;
  let newItem;

  try {
    let buyer = await userModel.findById(req.params.userId);

    let userBalance = buyer.wallet;
    

    Promise.all(
      req.body.order.map(async (item) => {
        let orderId = new mongoose.Types.ObjectId();
        let itemId = new mongoose.Types.ObjectId();

        let productShop = await shopModel.findById(item.shopId);
        let total =
          parseFloat(item.tax) +
          parseFloat(item.shippingFee) +
          parseFloat(item.subTotal);
          
          {
          /*......................................
					*reduce product qty
				......................................*/
        }

        let product = await productModel.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: parseInt(item.quantity) * -1 } },
          { runValidators: true, new: true }
        );
        
        
        

        //If buyer has enough coins, then continue, if not cancel

        {
          /*......................................
				   *
				......................................*/
        }
        newOrder = await orderModel.create({
          _id: orderId,
          customerId: req.params.userId,
          shippingId: item.shippingId,
          shippingAddress: item.shippingAddress, //to be removed afteer update of ui
          paymentMethod: item.paymentMethod,
          shopId: item.shopId,
          subTotal: item.subTotal,
          tax: item.tax,
          shippingFee: item.shippingFee,
          servicefee: item.servicefee,
          total,
          itemId,
          productId: item.productId,
          ordertype: product.type,
          quantity: item.quantity,
		  shippingMethd: item.shippingMethd,
          date: Date.now(),
        });
        
        
/*
        if (product.type == "WC") { 
          let order = await createWOrder(req.params.userId, product.wcid, item.quantity,item.shopId);
          console.log(order.data);
          if(order.data){
		  	await orderModel.findByIdAndUpdate(
		       orderId,
		      { $set: {wcOrderId : order.data.id} },
		      { runValidators: true, new: true }
		    );
		  }
        }
*/
        
        {
          /*......................................
					*
				......................................*/
        }
        newItem = await itemModel.create({
          _id: itemId,
          productId: item.productId,
          quantity: item.quantity,
          orderId,
          variation: item.variation ?? "",
        });
        
        

        {
          /*......................................
					*save transaction to the customer
				......................................*/
        }
        let newTransaction = {
          from: item.productOwnerId,
          to: req.params.userId,
          reason: utils.Transactionreasons.PURCHASED,
          amount: total,
          type: "purchase",
          status: "Completed",
          deducting: true,
          shopId: item.shopId,
          orderId: orderId,
          date: Date.now(),
        };
        let t1 = new transactionModel(newTransaction);
        await t1.save();
        {
          /*......................................
					  *save transaction to the product owner
				......................................*/
        }
        let newTransaction1 = {
          from: req.params.userId,
          to: item.productOwnerId,
          reason: utils.Transactionreasons.PURCHASE,
          amount: total,
          status: "Pending",
          type: "order",
          deducting: false,
          shopId: item.shopId,
          orderId: orderId,
          date: Date.now(),
        };

        let t2 = new transactionModel(newTransaction1);
        await t2.save();

       
        {
          /*......................................
						 *update seller's wallet
				   ......................................*/
        }
        await userModel.findByIdAndUpdate(
          item.productOwnerId,
          { $inc: { pendingWallet: parseFloat(total) } },
          { runValidators: true, new: true }
        );

        /*......................................
					 *save activity for seller
			   ......................................*/

        functions.saveActivity(
          orderId,
          "New order",
          "OrderScreen",
          false,
          null,
          item.productOwnerId,
          "You just got an order",
          req.params.userId
        );

        /*......................................
						 *save activity for buyer
				   ......................................*/

        functions.saveActivity(
          orderId,
          "New order",
          "OrderScreen",
          false,
          null,
          req.params.userId,
          "You ordered a product from shop " + productShop.name,
          item.productOwnerId
        );
        userBalance = buyer.wallet - parseInt(total);

	    
      })
    )
      .then(() => {
        res.status(200).setHeader("Content-Type", "application/json").json({
          success: true,
          newOrder,
          newItem,
          user_balance: userBalance,
        });
      })
      .catch((e, s) => {
        res
          .status(422)
          .setHeader("Content-Type", "application/json")
          .json({ success: false, message: e });
      });
  } catch (e) {
	  console.log(e);
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json({ success: false, message: "Something went wrong" });
  }
};
async function updateWoocomerceOrder(orderId, data, shopId) {
  let shop = await shopModel
			.findById(shopId);

  var wooData = await axios.post(`${shop.wcUrl}orders/${orderId}?consumer_key=${shop.wcConsumerKey}&consumer_secret=${shop.wcSecretKey}`, data);
  return wooData;
}
exports.updateOrderById = async (req, res) => {
  let { productIds, ...setter } = req.body;

  try {
    let newOrder = await orderModel.findByIdAndUpdate(
      req.params.orderId,
      { $set: req.body },
      { runValidators: true, new: true }
    );
    console.log(newOrder);
    if(newOrder.ordertype == "WC"){
	    await updateWoocomerceOrder(newOrder.wcOrderId, {status:req.body.status}, req.body.shopId);
    }
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(newOrder);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "Application/json")
      .json(error.message + " ");
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    let order = await orderModel
      .findById(req.params.orderId)
      .populate("customerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ])
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
	        populate: {
	          path: "reviews",
	        },
        },
      })
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
          populate: {
            path: "ownerId",

            populate: {
              path: "shopId",
            },
          },
        },
      });

    {
      /*......................................
		*save transaction to the customer
	......................................*/
    }
    let newTransaction = {
      from: order.itemId.productId.ownerId._id,
      to: order.customerId._id,
      reason: utils.Transactionreasons.REFUND + order.itemId.productId.name,
      amount: order.totalCost,
      type: "refund",
      status: "Completed",
      deducting: false,
      shopId: order.shopId,
      orderId: req.params.orderId,
      date: Date.now(),
    };
    let t1 = new transactionModel(newTransaction);
    await t1.save();
    {
      /*......................................
		  *save transaction to the product owner
	......................................*/
    }
    let newTransaction1 = {
      from: order.customerId._id,
      to: order.itemId.productId.ownerId._id,
      reason: utils.Transactionreasons.REFUNDED + order.itemId.productId.name,
      amount: order.totalCost,
      type: "refund",
      status: "Completed",
      deducting: true,
      shopId: order.shopId,
      orderId: req.params.orderId,
      date: Date.now(),
    };

    let t2 = new transactionModel(newTransaction1);
    await t2.save();

    {
      /*......................................
			*update buyer's wallet
	......................................*/
    }
    await userModel.findByIdAndUpdate(
      order.customerId._id,
      { $inc: { wallet: parseInt(order.totalCost) } },
      { runValidators: true }
    );
    {
      /*......................................
			 *update seller's wallet
	   ......................................*/
    }
    await userModel.findByIdAndUpdate(
      order.itemId.productId.ownerId._id,
      { $inc: { pendingWallet: order.totalCost * -1 } },
      { runValidators: true }
    );

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "Application/json")
      .json({ success: false, message: error });
  }
};

exports.finishOrderAfterShipping = async (req, res) => {
  try {
    let order = await orderModel
      .findById(req.params.orderId)
      .populate("customerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ])
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
	        populate: {
	          path: "reviews",
	        },
        },
      })
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
          populate: {
            path: "ownerId",

            populate: {
              path: "shopId",
            },
          },
        },
      });


    /*......................................
		*get order transaction for product owner
	......................................*/
    let productOwnerTransaction = await transactionModel.find({
      $and: [
        { to: order.itemId.productId.ownerId._id },
        {
          orderId: req.params.orderId,
        },
      ],
    });


    /*......................................
		*update order transaction status for product owner to completed and move funds from pending wallet to wallet
	......................................*/
    await transactionModel.findByIdAndUpdate(
      productOwnerTransaction[0]["_id"],
      {
        $set: { status: "Completed" },
      }
    );

    let user1 = await userModel.findByIdAndUpdate(
      order.itemId.productId.ownerId._id,
      {
        $inc: { wallet: order.totalCost },
      }
    );


    await userModel.findByIdAndUpdate(order.itemId.productId.ownerId._id, {
      $inc: { pendingWallet: order.totalCost * -1 },
    });

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "Application/json")
      .json({ success: false, message: error + " " });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    let order = await orderModel
      .findById(req.params.orderId)
      .populate("customerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ])
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
          populate: {
            path: "category",
          },
        },
      })
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
	        populate: {
	          path: "reviews",
	        },
        },
      })
      .populate({
        path: "itemId",
        populate: {
          path: "productId",
          populate: {
            path: "ownerId",

            populate: {
              path: "shopId",
            },
          },
        },
      })
      .populate("billingId")
      .populate("shippingId")
      .sort({ createdAt: -1 });
    // .populate("productId");
    res.status(200).setHeader("Content-Type", "application/json").json(order);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "Application/json")
      .json(error.message);
  }
};

exports.deleteProductById = async (req, res) => {
  try {
    let deleted = await orderModel.findByIdAndDelete(req.params.orderId);
    res.status(200).setHeader("Content-Type", "application/json").json(deleted);
  } catch (e) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(e.message);
  }
};
