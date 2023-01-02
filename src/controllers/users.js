const userModel = require("../models/userSchema");
const clubModel = require("../models/clubModel");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: `${__dirname}/../../.env` });
const functions = require("../shared/functions");
const withdrawModel = require("../models/withdraw");
const transactionModel = require("../models/transactionSchema");
const favoriteModel = require("../models/favorite");
const utils = require("../../utils");
const shopModel = require("../models/shopSchema");
var orderModel = require("../models/orderSchema");
const upgradeAmount = 200;
const roomsModel = require("../models/roomSchema");
var productModel = require("../models/productSchema");
var paymentmethodModel = require("../models/payment_methods");
var payouthodModel = require("../models/payout_methods");


exports.getProfileSummary = async (req, res) => {
    var ObjectID = require('mongodb').ObjectID;
    
    const totalSales = await orderModel.aggregate([
      {
        $match: {
          $or: [{shopId:{$eq: new ObjectID(req.params.shopid)}}]
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
    
    const rooms = await roomsModel.aggregate([
      {
        $match: {
          $or: [{shopId:{$eq: new ObjectID(req.params.shopid)}}]
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    const products = await productModel.aggregate([
      {
        $match: {
          $or: [{deleted : {$eq : false}, shopId:{$eq: new ObjectID(req.params.shopid)}}]
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    
    
    res.send({ 
      totalSales:totalSales.length ===0 ? 0 : totalSales[0],
      rooms:rooms.length ===0 ? 0 : rooms[0]['count'],
      products:products.length === 0 ? 0 : products[0]['count']
    });

	
}

exports.getAllUsers = (req, res, next) => {
  userModel
    .find({ accountDisabled: { $ne: true } })
    .populate("shopId", [
      "name",
      "email",
      "location",
      "phoneNumber",
      "image",
      "description",
      "open",
      "ownerId",
      "paymentOptions",
    ])
    .populate("following", [
      "firstName",
      "lastName",
      "bio",
      "userName",
      "email",
      "accountDisabled",
    ])
    .populate("followers", [
      "firstName",
      "lastName",
      "bio",
      "userName",
      "email",
      "accountDisabled",
    ])
    .populate("joinedclubs", ["title", "imageurl"])
    .sort("-_id")
    .then(
      (workers) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(workers);
      },
      (err) => next(err)
    )
    .catch((err) => next(err));
};

exports.createPayoutMethod = async (req, res, next) => {
 	let response = await payouthodModel.find({'userid':req.body.userid,});
 	if(response.length > 0){
	 	await payouthodModel.findByIdAndDelete(response[0]._id);
 	}
	let cardresponse = await payouthodModel.create(req.body)
	.then(
      async (reponse) => {
        res.json(reponse);
      },
      (err) => {
        res.status(422).setHeader("Content-Type", "application/json").json(err);
      }
    )
    .catch((e) => {
      res.statusCode = 401; 
      res.setHeader("Content-Type", "application/json");
      res.json(e);
    });
}	

exports.getPayoutmethodByUserId = async (req, res, next) => {
	let response = await payouthodModel.find({'userid':req.params.id,})
	res.json(response);
}	


exports.deletePayoutmethod = async (req, res, next) => {
	let cardresponse = await payouthodModel.findByIdAndDelete(req.params.id).then((response) => {
	    res.json(response);
	  });
}


exports.createPaymentMethod = async (req, res, next) => {
	var response = await functions.getSettings();
	const stripe = require("stripe")(
	  response["stripeSecretKey"]
	);
 
	let cardresponse = await paymentmethodModel.create(req.body)
	.then(
      async (reponse) => {
	      
	      let response = await stripe.customers
		        .update(req.body.customerid, {
		          source: req.body.token,
		        });

    
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(reponse);
      },
      (err) => {
        res.status(422).setHeader("Content-Type", "application/json").json(err);
      }
    )
    .catch((e) => {
      res.statusCode = 401; 
      res.setHeader("Content-Type", "application/json");
      res.json(e);
    });
}	

exports.getPaymentmethodByUserId = async (req, res, next) => {
	let cardresponse = await paymentmethodModel.find({'userid':req.params.id,})
	res.json(cardresponse);
}	


exports.deletePaymentmethod = async (req, res, next) => {
	let cardresponse = await paymentmethodModel.findByIdAndDelete(req.params.id).then((response) => {
	    res.json(response);
	  });
}	
	
exports.getAllTheUsers = async (req, res, next) => {
  const { title, category, price, page, limit } = req.query;

  const queryObject = {};

  let sortPrice;

  if (title) {
    queryObject.$or = [{ firstName: { $regex: `${title}`, $options: "i" } }];
  }

  if (price === "Low") {
    sortPrice = 1;
  } else {
    sortPrice = -1; 
  }
 
  if (category) {
    queryObject.parent = { $regex: category, $options: "i" };
  }

  const pages = Number(page);
  const limits = Number(limit);
  const skip = (pages - 1) * limits;

  try {
    const totalDoc = await userModel.countDocuments(queryObject);
    const users = await userModel
      .find(queryObject)
      .skip(skip)
      .populate("shopId", [
        "name",
        "email",
        "location",
        "phoneNumber",
        "image",
        "description",
        "open",
        "ownerId",
        "paymentOptions",
      ])
      .populate("following", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "accountDisabled",
      ])
      .populate("followers", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "accountDisabled",
      ])
      .populate("joinedclubs", ["title", "imageurl"])
      .sort("-_id")
      .limit(limits);

    res.send({
      users,
      totalDoc,
      limits,
      pages,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

exports.getAllUsersPaginated = async (req, res) => {
  try {
    var pageNumber = req.params.pagenumber;
    if (pageNumber < 1) {
      pageNumber = 1;
    }

    const users = await userModel.aggregate([
      {
        $match: { accountDisabled: { $ne: true } },
      },
      {
        $sort: { _id: 1 },
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
                from: "users",
                localField: "following",
                foreignField: "_id",
                as: "following",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "followers",
                foreignField: "_id",
                as: "followers",
              },
            },
            { $skip: (pageNumber - 1) * 20 },
            { $limit: 20 },
          ], // add projection here wish you re-shape the docs
        },
      },
    ]);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(users);
  } catch (error) {
    console.log(error + " ");
    res.statusCode = 422;
    res.setHeader("Content-Type", "application/json");
    res.json(error);
  }
};

exports.getUserByAgora = (req, res, next) => {
  userModel
    .find({agoraId: req.params.agorauid})
    .populate("shopId", [
      "name",
      "email",
      "location",
      "phoneNumber",
      "image",
      "description",
      "open",
      "ownerId",
        "paymentOptions",
    ])
    .populate("following", [
      "firstName",
      "lastName",
      "bio",
      "userName",
      "email",
      "accountDisabled",
    ])
    .populate("followers", [
      "firstName",
      "lastName",
      "bio",
      "userName",
      "email",
      "accountDisabled",
    ])
    .populate("joinedclubs", ["title", "imageurl"])

    .then(
      (user) => {
        user.followersCount = user.followers.length;
        user.followingCount = user.following.length;

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(user);
      },
      (err) => {
        res.statusCode = 422;
        res.setHeader("Content-Type", "application/json");
        res.json(err.errors);
      }
    )
    .catch((err) => {
      console.log(err + " ");
      res.statusCode = 422;
      res.setHeader("Content-Type", "application/json");
      res.json(err + " ");
    });
};
exports.getUserById = (req, res, next) => {
  userModel
    .findById(req.params.userId)
    .populate("shopId", [
      "name",
      "email",
      "location",
      "phoneNumber",
      "image",
      "description",
      "open",
      "ownerId",
        "paymentOptions",
    ])
    .populate("following", [
      "firstName",
      "lastName",
      "bio",
      "userName",
      "email",
      "accountDisabled",
    ])
    .populate("followers", [
      "firstName",
      "lastName",
      "bio",
      "userName",
      "email",
      "accountDisabled",
    ])
	      .populate("defaultpaymentmethod")
	      .populate("payoutmethod")
	      .populate({
	        path: "address",
	        populate: {
	          path: "userId",
	        },
	      })
	      .populate({
	        path: "address",
	        populate: {
	          path: "userId",
	        },
	      })
    .populate("joinedclubs", ["title", "imageurl"])

    .then(
      (user) => {
        user.followersCount = user.followers.length;
        user.followingCount = user.following.length;

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(user);
      },
      (err) => {
        res.statusCode = 422;
        res.setHeader("Content-Type", "application/json");
        res.json(err);
      }
    )
    .catch((err) => {
      console.log(err + " ");
      res.statusCode = 422;
      res.setHeader("Content-Type", "application/json");
      res.json(err + " ");
    });
};
exports.userFollowersFollowing = async function (req, res) {
  try {
    const users = await userModel
      .find({
        $and: [
          { following: req.params.userId },
          { followers: req.params.userId },
          { accountDisabled: { $ne: true } },
        ],
      })
      .populate("shopId", [
        "name",
        "email",
        "location",
        "phoneNumber",
        "image",
        "description",
        "open",
        "ownerId",
        "paymentOptions",
      ])
      .populate("joinedclubs", ["title", "imageurl"]);

    res.json(users);
  } catch (error) {
    console.log(error + " ");
    res.status(404).send(error);
  }
};

exports.getUpgradedUsers = (req, res, next) => {
  userModel
    .find({
      memberShip: 1,
    })
    .populate("shopId", [
      "name",
      "email",
      "location",
      "phoneNumber",
      "image",
      "description",
      "open",
      "ownerId",
        "paymentOptions",
    ])
    .populate("joinedclubs", ["title", "imageurl"])
    .then(
      (user) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(user);
      },
      (err) => {
        res.statusCode = 422;
        res.setHeader("Content-Type", "application/json");
        res.json(err.errors);
      }
    )
    .catch((err) => {
      res.statusCode = 422;
      res.setHeader("Content-Type", "application/json");
      res.json(err.errors);
    });
};

exports.userFollowers = async function (req, res) {
  try {
    const users = await userModel.find({
      $and: [
        { accountDisabled: { $ne: true } },
        { following: req.params.userId },
      ],
    });

    res.json(users);
  } catch (error) {
    console.log(error + " ");
    res.status(404).send(error);
  }
};

exports.userByUsername = async function (req, res) {
  try {
    const users = await userModel.find({
      $and: [
        { accountDisabled: { $ne: true } },
        { userName: req.params.userName },
      ],
    });

    res.json(users.length);
  } catch (error) {
    console.log(error + " ");
    res.status(404).send(error);
  }
};

exports.userFollowing = async function (req, res) {
  try {
    const users = await userModel.find({
      $and: [
        { accountDisabled: { $ne: true } },
        { followers: req.params.userId },
      ],
    });

    res.json(users);
  } catch (error) {
    console.log(error + " ");
    res.status(404).send(error);
  }
};
exports.searchForAllUsers = async function (req, res) {
  try {
    const users = await userModel
      .find({
        $and: [
          {
            $expr: {
              $regexMatch: {
                input: {
                  $concat: ["$firstName", " ", "$lastName"],
                },
                regex: req.params.name,
                options: "i",
              },
            },
          },
        ],
      })
      .populate("shopId", [
        "name",
        "email",
        "location",
        "phoneNumber",
        "image",
        "description",
        "open",
        "paymentOptions",
        "ownerId",
      ])
      .populate("joinedclubs", ["title", "imageurl"])
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(404).send(error);
  }
};

exports.searchForUserFriends = async function (req, res) {
  try {
    const users = await userModel
      .find({
        $and: [
          {
            $expr: {
              $regexMatch: {
                input: {
                  $concat: ["$firstName", " ", "$lastName"],
                },
                regex: req.params.name,
                options: "i",
              },
            },
          },
          { accountDisabled: { $ne: true } },
          { following: req.params.userId },
          { followers: req.params.userId },
          { blocked: "62e66023ccdb405316d17185" },
        ],
      })
      .populate("shopId", [
        "name",
        "email",
        "location",
        "phoneNumber",
        "image",
        "description",
        "open",
        "ownerId",
        "paymentOptions",
      ])
      .populate("joinedclubs", ["title", "imageurl"])
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(404).send(error);
  }
};
exports.searchForUserv2 = async function (req, res) {
  try {
    var pageNumber = 1;

    const users = await userModel.aggregate([
      {
        $match: {
          $and: [
            { accountDisabled: { $ne: true } },
            {
              $expr: {
                $regexMatch: {
                  input: {
                    $concat: ["$firstName", " ", "$lastName"],
                  },
                  regex: req.params.name,
                  options: "i",
                },
              },
            },
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
                from: "users",
                localField: "following",
                foreignField: "_id",
                as: "following",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "followers",
                foreignField: "_id",
                as: "followers",
              },
            },
            { $skip: (pageNumber - 1) * 20 },
            { $limit: 20 },
          ], // add projection here wish you re-shape the docs
        },
      },
    ]);

    res.json(users);
  } catch (error) {
    res.status(404).send(error);
  }
};
exports.searchForUser = async function (req, res) {
  try {
    var pageNumber = req.params.pagenumber;
    if (pageNumber < 1) {
      pageNumber = 1;
    }

    const users = await userModel.aggregate([
      {
        $match: {
          $and: [
            { accountDisabled: { $ne: true } },
            {
              $expr: {
                $regexMatch: {
                  input: {
                    $concat: ["$firstName", " ", "$lastName"],
                  },
                  regex: req.params.name,
                  options: "i",
                },
              },
            },
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
                from: "users",
                localField: "following",
                foreignField: "_id",
                as: "following",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "followers",
                foreignField: "_id",
                as: "followers",
              },
            },
            { $skip: (pageNumber - 1) * 20 },
            { $limit: 20 },
          ], // add projection here wish you re-shape the docs
        },
      },
    ]);

    res.json(users);
  } catch (error) {
    res.status(404).send(error);
  }
};

exports.addUserFavorite = (req, res) => {
  const newFav = {
    userId: req.body.userid,
    productid: req.body.productid,
  };

  favoriteModel
    .create(newUser)
    .then(
      (newUser) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(newUser);
      },
      (err) => {
        res.status(422).setHeader("Content-Type", "application/json").json(err);
      }
    )
    .catch((e) => {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.json(err.errors);
    });
};

exports.addUser = (req, res) => {
  const newUser = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    department: req.body.department,
    title: req.body.title,
    email: req.body.email,
    type: req.body.type,
    password: req.body.password,
    profilePhoto: req.body.profilePhoto,
  };
  if(req.body.type == "apple"){
	  
  }

  userModel
    .create(newUser)
    .then(
      (savedUser) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(savedUser);
      },
      (err) => {
        res.status(422).setHeader("Content-Type", "application/json").json(err);
      }
    )
    .catch((e) => {
      console.log(e + " ");
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.json(e + " ");
    });
};

exports.getAllWithdraws = async (req, res) => {
  withdrawModel
    .find({})
    .populate("userId", [
      "firstName",
      "lastName",
      "bio",
      "userName",
      "email",
      "profilePhoto",
      "_id",
    ])
    .populate("joinedclubs", ["title", "imageurl"])
    .then(
      (workers) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(workers);
      },
      (e) => {
        console.log(e + " ");
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.json(e + " ");
      }
    )
    .catch((e) => {
      console.log(e + " ");
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.json(e + " ");
    });
};

exports.updateWithdraw = async (req, res) => {
  withdrawModel
    .findByIdAndUpdate(
      req.params.withdrawId,
      { $set: { status: req.body.status } },
      { runValidators: true }
    )
    .populate("userId", [
      "firstName",
      "lastName",
      "bio",
      "userName",
      "email",
      "profilePhoto",
      "_id",
      "notificationToken",
    ])
    .populate("joinedclubs", ["title", "imageurl"])
    .then(
      (workers) => {
        console.log(workers.userId);
        functions.sendNotificationOneSignal(
          [workers.userId.notificationToken],
          "Withdraw request status",
          "You're withdraw request of " +
            workers.amount +
            " status has changed to " +
            req.body.status,
          workers.userId
        );

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(workers);
      },
      (e) => {
        console.log(e + " ");
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.json(e + " ");
      }
    )
    .catch((e) => {
      console.log(e + " ");
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.json(e + " ");
    });
};

exports.getWithdraw = async (req, res) => {
  withdrawModel
    .findById(req.params.withdrawId)
    .populate("userId", [
      "firstName",
      "lastName",
      "bio",
      "userName",
      "email",
      "profilePhoto",
      "_id",
    ])
    .populate("joinedclubs", ["title", "imageurl"])
    .then(
      (workers) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(workers);
      },
      (e) => {
        console.log(e + " ");
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.json(e + " ");
      }
    )
    .catch((e) => {
      console.log(e + " ");
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.json(e + " ");
    });
};

exports.deleteWithdraw = async (req, res) => {
  withdrawModel
    .findByIdAndDelete(req.params.withdrawId)
    .then(
      (workers) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(workers);
      },
      (e) => {
        console.log(e + " ");
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.json(e + " ");
      }
    )
    .catch((e) => {
      console.log(e + " ");
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.json(e + " ");
    });
};

exports.withdraw = async (req, res) => {
  try {
    const userId = req.body.userId;
    const amount = req.body.amount;
    const userdata = await userModel.findById(userId);
    if (userdata.wallet >= amount) {
      let withCode = "WC_" + Math.floor(100000000 + Math.random() * 900000000);
      const newWith = {
        userId: userId,
        amount: amount,
        withdrawCode: withCode,
      };

      await userModel.findByIdAndUpdate(
        userId,
        { $inc: { wallet: parseInt(amount) * -1 } }
        // 			{ runValidators: true, new: true }
      );

      await withdrawModel.create(newWith);

      functions.saveActivity(
        userId,
        "withdraw request",
        "WalletScreen",
        false,
        userdata.profilePhoto,
        userId,
        "You have requested to withdraw GP " + amount,
        userId
      );

      functions.sendNotificationOneSignal(
        [userdata["notificationToken"]],
        "👋👋👋👋",
        "You have requested to withdraw GP " +
          amount +
          ", you will be notified when it has been approved",
        userId
      );

      let newTransaction2 = {
        from: userId,
        to: userId,
        reason:
          "(" + withCode + ") " + utils.Transactionreasons.WITHDRAWREQUEST,
        amount: amount,
        status: "Pending",
        type: "withdraw",
        deducting: true,
        date: Date.now(),
      };

      let t2 = new transactionModel(newTransaction2);
      await t2.save();

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({
        status: true,
        message:
          "withdraw request is successfully initiated, you will be nofitified when it has been approved",
      });
    } else {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.json({ status: false, message: "you dont have enough GistPoint" });
    }
  } catch (e) {
    console.log(e + " ");
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json({ status: false, message: "something went wrong" });
  }
};

exports.sendGift = async (req, res) => {
  const from = req.body.fromuser;
  const to = req.body.touser;
  const amount = req.body.amount;
  const fromuser = await userModel.findById(from);
  console.log(fromuser);
  if (fromuser.wallet > amount) {
    const touser = await userModel.findByIdAndUpdate(
      to,
      { $inc: { wallet: parseInt(amount) * 1 } },
      { runValidators: true, new: true }
    );

    await userModel
      .findByIdAndUpdate(
        from,
        { $inc: { wallet: parseInt(amount) * -1 } },
        { runValidators: true, new: true }
      )
      .then(
        async (user) => {
          functions.saveActivity(
            from,
            "Received a Gift!",
            "WalletScreen",
            false,
            user.profilePhoto,
            to,
            "You have received a gift of GP " +
              amount +
              " from " +
              user.firstName,
            from
          );

          functions.saveActivity(
            user._id,
            "Sent a Gift!",
            "WalletScreen",
            false,
            touser.profilePhoto,
            user._id,
            "You have sent a gift of GP " + amount + " to " + touser.firstName,
            touser._id
          );

          functions.sendNotificationOneSignal(
            [touser["notificationToken"]],
            "You have received a gift of GP " +
              amount +
              " from " +
              user.firstName,
            "👋👋👋👋",
            "ProfileScreen",
            user._id
          );
          functions.sendNotificationOneSignal(
            [user["notificationToken"]],
            "You have sent a gift of GP " + amount + " to " + touser.firstName,
            "👋👋👋👋",
            "ProfileScreen",
            touser._id
          );

          let newTransaction2 = {
            from: to,
            to: from,
            reason: utils.Transactionreasons.SENTGIFT,
            amount: amount,
            type: "gift",
            deducting: true,
            date: Date.now(),
          };

          let t2 = new transactionModel(newTransaction2);
          await t2.save();

          let newTransaction1 = {
            from: from,
            to: to,
            reason: utils.Transactionreasons.RECEIVEDGIFT,
            amount: amount,
            type: "gift",
            deducting: false,
            date: Date.now(),
          };

          let t1 = new transactionModel(newTransaction1);
          await t1.save();

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json({ user, status: true, message: "gift successfully sent" });
        },
        (err) => {
          console.log(err);
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.json({ status: false, message: err.errors });
        }
      )
      .catch((err) => {
        console.log(err);
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.json({ status: false, message: err.errors });
      });
  } else {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json({ status: false, message: "you dont have enough GistPoint" });
  }
};

exports.editUserById = (req, res) => {
  userModel
    .findByIdAndUpdate(
      req.params.userId,
      {
        $set: req.body,
      },
      { new: true, runValidators: true }
    )
    .populate("shopId", [
      "name",
      "email",
      "location",
      "phoneNumber",
      "image",
      "description",
      "open",
      "ownerId",
        "paymentOptions",
    ])
    .populate("following", [
      "firstName",
      "lastName",
      "bio",
      "userName",
      "email",
      "accountDisabled",
    ])
    .populate("followers", [
      "firstName",
      "lastName",
      "bio",
      "userName",
      "email",
      "accountDisabled",
    ])
	      .populate("defaultpaymentmethod")
	      .populate("payoutmethod")
	      .populate({
	        path: "address",
	        populate: {
	          path: "userId",
	        },
	      })
	      .populate({
	        path: "address",
	        populate: {
	          path: "userId",
	        },
	      })
    .populate("joinedclubs", ["title", "imageurl"])

    .then(
      (user) => {
        console.log(user);
        const token = jwt.sign(user.email, process.env.secret_key);
        const {
          _id,
          firstName,
          lastName,
          email,
          userName,
          bio,
          profilePhoto,
          phonenumber,
          wallet,
        } = user;
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json({ user, token, success: true });
      },
      (err) => {
        console.log(err);
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.json({ err, success: false });
      }
    )
    .catch((err) => {
      console.log(err);
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.json({ err, success: false });
    });
};

exports.deleteUserById = (req, res, next) => {
  userModel.findByIdAndDelete(req.params.userId).then((user) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(user);
  });
};

exports.upgradeAccount = async (req, res) => {
  try {
    let user = await userModel.findById(req.params.userId);

    if (user.wallet > upgradeAmount) {
      let updateBody = {
        wallet: user.wallet - upgradeAmount,
        memberShip: 1,
        upgradedDate: Date.now(),
      };

      await userModel
        .findByIdAndUpdate(req.params.userId, {
          $set: updateBody,
        })
        .then(
          async (user) => {
            let newTransaction = {
              from: process.env.GISTSHOPUSER,
              to: req.params.userId,
              reason: utils.Transactionreasons.UPGRADE,
              amount: upgradeAmount,
              type: "upgrade",
              deducting: true,
              date: Date.now(),
            };
            await transactionModel.create(newTransaction);

            let newTransaction2 = {
              to: process.env.GISTSHOPUSER,
              from: req.params.userId,
              reason: utils.Transactionreasons.UPGRADE,
              amount: upgradeAmount,
              type: "upgrade",
              deducting: true,
              date: Date.now(),
            };
            await transactionModel.create(newTransaction2);

            const token = jwt.sign(user.email, process.env.secret_key);
            const { _id, firstName, lastName, email, userName, bio } = user;
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({ token, _id, firstName, lastName, email, userName, bio });
          },
          (err) => {
            console.log(err);
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.json(err.errors);
          }
        )
        .catch((err) => {
          console.log(err);
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.json(err.errors);
        });
    } else {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.json("You do not have enough coins");
    }
  } catch (error) {
    console.log(error);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json(error);
  }
};

exports.blockUser = async (req, res) => {
  try {
    let myUid = req.params.myUid;
    let toBlockUid = req.params.toBlockUid;

    /*

		await userModel.findByIdAndUpdate(
			toBlockUid,
			{
				$addToSet: { blocked: myUid },

			},
			{ runValidators: true, new: true, upsert: false }
		);
*/

    let myUpdatedUser = await userModel.findByIdAndUpdate(
      myUid,
      {
        $addToSet: { blocked: toBlockUid },
      },
      { runValidators: true, new: true, upsert: false }
    );

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    myUpdatedUser["success"] = true;
    res.json(myUpdatedUser);
  } catch (error) {
    console.log(error + " ");
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json({ success: false });
  }
};

exports.followUser = async (req, res) => {
  try {
    let myUid = req.params.myUid;
    let toFollowUid = req.params.toFollowUid;

    await userModel.findByIdAndUpdate(
      toFollowUid,
      {
        $addToSet: { followers: myUid },
      },
      { runValidators: true, new: true, upsert: false }
    );

    let myUpdatedUser = await userModel.findByIdAndUpdate(
      myUid,
      {
        $addToSet: { following: toFollowUid },
      },
      { runValidators: true, new: true, upsert: false }
    );

    functions.saveActivity(
      toFollowUid,
      "New follower",
      "ProfileScreen",
      false,
      null,
      myUid,
      "You have a new follower",
      toFollowUid
    );

    console.log(myUpdatedUser + " ");

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    myUpdatedUser["success"] = true;
    res.json(myUpdatedUser);
  } catch (error) {
    console.log(error + " ");
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json({ success: false });
  }
};
exports.unblockUser = async (req, res) => {
  try {
    let myUid = req.params.myUid;
    let toBlockUid = req.params.toBlockUid;

    let myUpdatedUser = await userModel.findByIdAndUpdate(
      myUid,
      {
        $pullAll: { blocked: [toBlockUid] },
      },
      { runValidators: true, new: true, upsert: false }
    );

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(myUpdatedUser);
  } catch (error) {
    console.log(error);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json(error);
  }
};

exports.unFollowUser = async (req, res) => {
  try {
    let myUid = req.params.myUid;
    let toFollowUid = req.params.toFollowUid;

    await userModel.findByIdAndUpdate(
      toFollowUid,
      {
        $pullAll: { followers: [myUid] },
      },
      { runValidators: true, new: true, upsert: false }
    );

    let myUpdatedUser = await userModel.findByIdAndUpdate(
      myUid,
      {
        $pullAll: { following: [toFollowUid] },
      },
      { runValidators: true, new: true, upsert: false }
    );

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(myUpdatedUser);
  } catch (error) {
    console.log(error);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json(error);
  }
};

exports.updateWallet = async (req, res) => {
  try {
    let amount = req.body.amount;
    let user = req.params.userId;

    console.log(amount);
    await userModel.findByIdAndUpdate(
      user,
      { $inc: { wallet: amount } },
      { runValidators: true, new: true, upsert: false }
    );

    functions.saveActivity(
      process.env.GISTSHOPUSER,
      "Deposited",
      "deposit",
      false,
      null,
      user,
      "You have successfully deposited GP " + amount,
      process.env.GISTSHOPUSER
    );

    let newTransaction = {
      from: process.env.GISTSHOPUSER,
      to: user,
      reason: utils.Transactionreasons.DEPOSIT,
      amount: amount,
      type: "deposit",
      deducting: false,
      date: Date.now(),
    };
    await transactionModel.create(newTransaction);

    let newTransaction2 = {
      to: process.env.GISTSHOPUSER,
      from: user,
      reason: utils.Transactionreasons.DEPOSIT,
      amount: amount,
      type: "deposit",
      deducting: false,
      date: Date.now(),
    };
    await transactionModel.create(newTransaction2);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({ Success: true });
  } catch (error) {
    console.log(error);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json({ Success: false, message: error + " " });
  }
};
