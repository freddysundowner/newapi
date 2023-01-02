const roomsModel = require("../models/roomSchema");
const userModel = require("../models/userSchema");
const clubModel = require("../models/clubModel");
const recordingsModel = require("../models/recordingsSchema");




const functions = require("../shared/functions");
require("dotenv").config({ path: ".env" });
const {
  RtcTokenBuilder,
  RtcRole,
  RtmTokenBuilder,
  RtmRole,
} = require("agora-access-token");
const admin = require("firebase-admin");

var axios = require("axios");
var mongoose = require("mongoose");
const arrayToObjectIds = require("../shared/arrayToObjectIds");

exports.createRoom = async (req, res) => {
  try {
	  
    let newObj = {
      ownerId: mongoose.Types.ObjectId(req.params.userId),
      productIds: arrayToObjectIds(req.body.productIds),
      invitedhostIds: arrayToObjectIds(req.body.hostIds),
      hostIds: arrayToObjectIds([req.params.userId]),
      userIds: arrayToObjectIds(req.body.userIds),
      title: req.body.title,
      raisedHands: arrayToObjectIds(req.body.raisedHands),
      speakerIds: arrayToObjectIds(req.body.speakerIds),
      invitedIds: arrayToObjectIds(req.body.invitedIds),
      shopId: mongoose.Types.ObjectId(req.body.shopId),
      productImages: req.body.productImages,
      productPrice: req.body.productPrice,
      discount: req.body.discount,
      event: req.body.event,
      eventDate: req.body.eventDate,
      roomType: req.body.roomType,
      description: req.body.description,
      channel: mongoose.Types.ObjectId(req.body.channel),
      allowrecording: req.body.allowrecording,
      allowchat: req.body.allowchat,
    };
    

    let user = await userModel.findById(req.params.userId);


          
  await userModel.findByIdAndUpdate(
    user._id,
    {
      $inc: { tokshows: 1 },
    },
    { runValidators: true, new: true, upsert: false }
  );
          
    if (user.currentRoom != "" && user.currentRoom != req.params.roomId) {
      let userRoom = await roomsModel.findById(user.currentRoom);

      if (
        userRoom != null &&
        userRoom["ended"] == false &&
        userRoom["event"] != true
      ) {
        if (
          userRoom.hostIds.length < 2 &&
          userRoom.hostIds.includes(req.params.userId)
        ) {
          await roomsModel.findByIdAndUpdate(user.currentRoom, {
            $set: {
              ended: true,
              endedTime: Date.now(),
              productImages: [],
            },
          });
        } else {
          await roomsModel.findByIdAndUpdate(
            user.currentRoom,
            {
              $pullAll: { speakerIds: [req.params.userId] },
            },
            { runValidators: true, new: true, upsert: false }
          );
          await roomsModel.findByIdAndUpdate(
            user.currentRoom,
            {
              $pullAll: { hostIds: [req.params.userId] },
            },
            { runValidators: true, new: true, upsert: false }
          );
          await roomsModel.findByIdAndUpdate(
            user.currentRoom,
            {
              $pullAll: { userIds: [req.params.userId] },
            },
            { runValidators: true, new: true, upsert: false }
          );
          
   
        }
      }
    }

    let newRoom = await roomsModel.create(newObj);

    await userModel.findByIdAndUpdate(req.params.userId, {
      $set: { currentRoom: newRoom._id, muted: true},
    },{ runValidators: true, new: true, upsert: false });
    
    
    let token= await generateRoomToken(newRoom._id)
    let newRoomrees = await roomsModel.findByIdAndUpdate(newRoom._id, {
      $set: {token:token },
    },{ runValidators: true, new: true, upsert: false });
    


    if (req.body.channel != null) {
      await clubModel.findByIdAndUpdate(newObj.channel, {
        $addToSet: { rooms: [newRoom._id] },
      });
    }

    for (let i = 0; i < user.followers.length; i++) {
      functions.saveActivity(
        newRoom._id,
        user.firstName + " " + user.lastName,
        "RoomScreen",
        false,
        null,
        user.followers[i]._id,
        user.firstName + " " + user.lastName + " started a TokShow. Join?.",
        user._id
      );
    }

    for (let i = 0; i < req.body.hostIds.length; i++) {
      functions.saveActivity(
        newRoom._id,
        user.firstName + " " + user.lastName,
        "RoomScreen",
        false,
        null,
        req.body.hostIds[i],
        user.firstName +
          " " +
          user.lastName +
          " has invited you to be a co-host in their TokShow. Join?.",
        user._id
      );
    }

    let hostNotificationTokens = [];

    for (let i = 0; i < req.body.hostIds.length; i++) {
      if (req.params.userId != req.body.hostIds[i]) {
        var host = await userModel.findOne({ _id: req.body.hostIds[i] });

        if (host["notificationToken"] != "") {
          hostNotificationTokens.push(host["notificationToken"]);
        }
      }
    }

    var userNotificationTokens = [];

    if (req.body.roomType != "private") {
      for (let i = 0; i < user.followers.length; i++) {
        if (req.body.hostIds.indexOf(user.followers[i]) < 0) {
          var follower = await userModel.findOne({ _id: user.followers[i] });

          if (
            follower["notificationToken"] != "" &&
            !hostNotificationTokens.includes(follower["notificationToken"])
          ) {
            userNotificationTokens.push(follower["notificationToken"]);
          }
        }
      }
    }

    if (userNotificationTokens.length > 0) {
      functions.sendNotificationOneSignal(
        userNotificationTokens,
        "Join TokShow",
        user.firstName + " " + user.lastName + " started a TokShow. Join?.",
        "RoomScreen",
        newRoom._id
      );
    }
    
	functions.sendNotificationToAll({
	    included_segments: ['Subscribed Users'],
	    data: { screen: "RoomScreen", id: newRoom._id },
	    headings: { en: "Join TokShow" },
	    contents: { en: user.firstName + " " + user.lastName + " started a TokShow. join them?." },
	});

 
    try{
	    if (hostNotificationTokens.length > 0) {
	      functions.sendNotificationOneSignal(
	        hostNotificationTokens,
	        "You've been invited",
	        user.firstName +
	          " " +
	          user.lastName +
	          " has invited you to be a co-host in their TokShow. Join?.",
	        "RoomScreen",
	        newRoom._id
	      );
	    }
    }catch (error) {
	    console.log(error + " sending notification");
	    res
	      .status(422)
	      .setHeader("Content-Type", "application/json")
	      .json(error.message);
	  }

    res.status(200).setHeader("Content-Type", "application/json").json(newRoomrees);
  } catch (error) {
    console.log(error + "");
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.removeFeaturedProduct = async (req, res) => {
  try {
    let roomid = req.params.roomid;
    let productid = req.body.productid;
    

    await roomsModel.findByIdAndUpdate(
      roomid,
      {
        $pullAll: req.body,
      },
      { runValidators: true, new: true, upsert: false }
    );

    res.json({"success":true});
  } catch (error) {
    console.log(error + " ");
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json({ success: false });
  }
};

exports.addProducttoRoom = async (req, res) => {
  try {
    let roomid = req.params.roomid;
    let productid = req.body.productid;
    console.log(req.body);

    await roomsModel.findByIdAndUpdate(
      roomid,
      {
        $addToSet: req.body,
      },
      { runValidators: true, new: true, upsert: false }
    );
    res.json({"success":true});
  } catch (error) {
    console.log(error + " ");
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.json({ success: false });
  }
};



exports.removeFromCurrentRoom = async (req, res) => {
  try {
    let user = await userModel.findById(req.params.userId);

    if (user.currentRoom != "" && user.currentRoom != req.body.newRoomId) {
      let userRoom = await roomsModel.findById(user.currentRoom);

      if (
        userRoom != null &&
        userRoom["ended"] == false &&
        userRoom["event"] != true
      ) {
        if (
          userRoom.hostIds.length < 2 &&
          userRoom.hostIds.includes(req.params.userId)
        ) {
          await roomsModel.findByIdAndUpdate(user.currentRoom, {
            $set: {
              ended: true,
              endedTime: Date.now(),
              productImages: [],
            },
          });

          if (userRoom.channel != null) {
            await clubModel.updateOne(
              { _id: mongoose.Types.ObjectId(userRoom.channel) },
              {
                $pullAll: { rooms: [userRoom._id] },
              }
            );
          }
        } else {
          await roomsModel.findByIdAndUpdate(
            user.currentRoom,
            {
              $pullAll: { speakerIds: [req.params.userId] },
            },
            { runValidators: true, new: true, upsert: false }
          );
          await roomsModel.findByIdAndUpdate(
            user.currentRoom,
            {
              $pullAll: { hostIds: [req.params.userId] },
            },
            { runValidators: true, new: true, upsert: false }
          );
          await roomsModel.findByIdAndUpdate(
            user.currentRoom,
            {
              $pullAll: { userIds: [req.params.userId] },
            },
            { runValidators: true, new: true, upsert: false }
          );

          await roomsModel.findByIdAndUpdate(
            user.currentRoom,
            {
              $pullAll: { raisedHands: [req.params.userId] },
            },
            { runValidators: true, new: true, upsert: false }
          );
        }
      }
    }

    await userModel.findByIdAndUpdate(req.params.userId, {
      $set: { currentRoom: req.body.newRoomId, muted: true },
    });

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true });
  } catch (error) {
    console.log(error + "");
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, message: error });
  }
};

exports.createEvent = async (req, res) => {
  try {
    let newObj = {
      ownerId: mongoose.Types.ObjectId(req.params.userId),
      productIds: arrayToObjectIds(req.body.productIds),
      invitedhostIds: arrayToObjectIds(req.body.hostIds),
      hostIds: arrayToObjectIds([req.params.userId]),
      userIds: arrayToObjectIds(req.body.userIds),
      title: req.body.title,
      raisedHands: arrayToObjectIds(req.body.raisedHands),
      speakerIds: arrayToObjectIds(req.body.speakerIds),
      invitedIds: arrayToObjectIds(req.body.invitedIds),
      shopId: mongoose.Types.ObjectId(req.body.shopId),
      productImages: req.body.productImages,
      productPrice: req.body.productPrice,
      event: req.body.event,
      eventDate: req.body.eventDate,
      roomType: req.body.roomType,
      description: req.body.description,
      channel: mongoose.Types.ObjectId(req.body.channel),
      allowrecording: req.body.allowrecording,
      allowchat: req.body.allowchat,
      discount: req.body.discount,
      token: await generateRoomToken()
    };
    var eventDate = new Date(req.body.eventDate).toLocaleString()


    let user = await userModel.findById(req.params.userId);

    let newRoom = await roomsModel.create(newObj);

    for (let i = 0; i < user.followers.length; i++) {
      functions.saveActivity(
        newRoom._id,
        user.firstName + " " + user.lastName,
        "RoomScreen",
        false,
        null,
        user.followers[i]._id,
        user.firstName + " " + user.lastName + " created an event.",
        user._id
      );
    }
    
    functions.sendNotificationToAll({
	    included_segments: ['Subscribed Users'],
	    data: { screen: "EventScreen", id: newRoom._id },
	    headings: { en: "Upcoming TokShow" },
	    contents: { en: ` ${user.firstName} ${user.lastName} will be live on ${eventDate}, do you want to notified when they are live?.`},
	});

    let hostNotificationTokens = [];

    for (let i = 0; i < req.body.hostIds.length; i++) {
      if (req.params.userId != req.body.hostIds[i]) {
        var host = await userModel.findOne({ _id: req.body.hostIds[i] });

        console.log(host.notificationToken);

        if (host["notificationToken"] != "") {
          console.log(host["notificationToken"]);
          hostNotificationTokens.push(host["notificationToken"]);
        }
      }
    }

    var userNotificationTokens = [];

    if (req.body.roomType != "private") {
      for (let i = 0; i < user.followers.length; i++) {
        if (req.body.hostIds.indexOf(user.followers[i]) < 0) {
          var follower = await userModel.findOne({ _id: user.followers[i] });

          if (
            follower["notificationToken"] != "" &&
            !hostNotificationTokens.includes(follower["notificationToken"])
          ) {
            userNotificationTokens.push(follower["notificationToken"]);
          }
        }
      }
    }

    if (hostNotificationTokens.length > 0) {
      functions.sendNotificationOneSignal(
        hostNotificationTokens,
        "You've been invited",
        user.firstName +
          " " +
          user.lastName +
          " has invited you to be a co-host in their event.",
        "EventScreen",
        newRoom._id
      );
    }


    res.status(200).setHeader("Content-Type", "application/json").json({});
  } catch (error) {
    console.log(error + "");
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};
generateRoomToken = async (channel) => {
  try {
    const uid = 0;
    var channelName = channel;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 84600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    var response = await functions.getSettings();
    console.log(response["agoraAppID"]);
    const token = RtmTokenBuilder.buildToken(
      response["agoraAppID"],
      response["AGORA_CERT"],
      channelName+"", 
      RtmRole,
      privilegeExpiredTs
    );
    return token;
  } catch (error) {
    console.log("error", error);
    return null;
  }
};

exports.generateagoratoken = async (req, res) => {
  try {
    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 84600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    var response = await functions.getSettings();
    const token = RtmTokenBuilder.buildToken(
      response["agoraAppID"],
      response["AGORA_CERT"],
      req.body.channel, 
      RtmRole,
      privilegeExpiredTs
    );
    console.log(token);
    res.json({ token });
  } catch (error) {
    console.log("error ", error);
    res.status(500).send(error);
  }
};
exports.generateRtmToken = async (req, res) => {
  try {
    // get uid
	  let uid = req.params.id;
	  if(!uid || uid === '') {
	    return res.status(500).json({ 'error': 'uid is required' });
	  }
	  // get role 
	    let role = RtmRole.Rtm_User;
	    const expirationTimeInSeconds = 84600;
	    const currentTimestamp = Math.floor(Date.now() / 1000);
	    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
	  var response = await functions.getSettings();
	  const token = RtmTokenBuilder.buildToken(response["agoraAppID"], response["AGORA_CERT"], uid, role, privilegeExpiredTs);
	  res.json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};


//to be removed after updating with shops removed
exports.getALlRoomsPaginated = async (req, res) => {
  try {
    const { title, page, limit } = req.query;

    const queryObject = {};

    if (title) {
      queryObject.$or = [{ title: { $regex: `${title}`, $options: "i" } }];
    }
    

    const pages = Number(page);
    const limits = Number(limit);
    const skip = (pages - 1) * limits;

    try {
      const totalDoc = await roomsModel.countDocuments(queryObject);
      const rooms = await roomsModel
        .find(queryObject)
        .sort({ createdAt: -1 })

        .populate("hostIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("userIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("raisedHands", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("speakerIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("invitedIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate({
          path: "productIds",
          populate: {
            path: "ownerId",

            populate: {
              path: "shopId",
            },
          },
        })
        .populate({
          path: "activeauction",
          populate: {
            path: "product",
            populate: {
              path: "shopId",
            },
          },
        })
        .populate({
          path: "activeauction",
          populate: {
            path: "product",
            path: "winner",
            path: "winning",
            path: "bids",
            populate: {
              path: "shopId",
            },
          },
        })
        .populate({
          path: "productIds",
          populate: {
            path: "category",
          },
        })
        .populate({
          path: "productIds",
          populate: {
            path: "reviews",
          },
        })
        .populate("shopId", ["description", "image"])
        .populate("ownerId", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .skip(skip)
        .limit(limits);

      res.send({
        rooms,
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

exports.getRoomsByUserId = async (req, res) => {
  try {
    let rooms = await roomsModel
      .find({
        $or: [
          {
            roomType: "public",
            event: false,
            ended: false,
          },
          {
            $and: [
              { roomType: "private" },
              {
                $or: [
                  { invitedhostIds: req.params.userId },
                  { invitedIds: req.params.userId },
                ],
              },

              { event: false, ended: false },
            ],
          },
        ],
      })
      .sort({ createdAt: -1 })
      .populate("hostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate("userIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate("raisedHands", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate("speakerIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate("invitedIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate({
        path: "productIds",
        populate: {
          path: "ownerId",

          populate: {
            path: "shopId",
          },
        },
      })
	      .populate({
	        path: "activeauction",
	        populate: {
	          path: "product",
	
	          populate: {
	            path: "shopId",
	          },
	        },
	      })
	      .populate({
	        path: "pin",
	        populate: {
	          path: "ownerId",
	
	          populate: {
	            path: "shopId",
	          },
	        },
	      })
        .populate({
          path: "productIds",
          populate: {
            path: "reviews",
          },
          })
        .populate({
          path: "productIds",
          populate: {
            path: "category",
          },
        })
      .populate("shopId", ["description", "image"])
      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ]);
    res.status(200).setHeader("Content-Type", "application/json").json(rooms);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};


exports.getPaginatedRoomsByUserIdNew = async (req, res) => {
  try {
    const { title, page, limit,userid } = req.query;

    const queryObject = {};

    if (title) {
      queryObject.$or = [{ title: { $regex: `${title}`, $options: "i" } }];
    }
    if (userid) {
	  queryObject.$or = [{ ownerId: { $eq: userid } }];	  
	}
    
    queryObject.$or = [{
              roomType: "public",
              event: false,
              ended: false,
            },]

    const pages = Number(page);
    const limits = Number(limit);
    const skip = (pages - 1) * limits;

    try {
      const totalDoc = await roomsModel.countDocuments(queryObject);
      const rooms = await roomsModel
        .find(queryObject)
        .sort({ createdAt: -1 })

        .populate("hostIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("userIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("raisedHands", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("speakerIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("invitedIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
	      .populate({
          path: "activeauction",
          populate: {
            path: "product",
            populate: {
              path: "shopId",
            },
          },
        })
	      .populate({
	        path: "activeauction",
	        populate: {
	          path: "product",
	          populate: {
	            path: "category",
	          },
	        },
	      })
	      .populate({
          path: "activeauction",
          populate: {
            path: "product",
            populate: {
              path: "ownerId",
            },
          },
        })
        .populate({
          path: "activeauction",
          populate: {
            path: "product",
            path: "winner",
            path: "winning",
            path: "bids",
            populate: {
              path: "shopId",
            },
          },
        })

	      .populate({
	        path: "pin",
	        populate: {
	          path: "ownerId",
	
	          populate: {
	            path: "shopId",
	          },
	        },
	      })
        .populate({
          path: "productIds",
          populate: {
            path: "ownerId",

            populate: {
              path: "shopId",
            },
          },
        })
        .populate({
          path: "productIds",
          populate: {
            path: "category",
          },
        })
        .populate({
          path: "productIds",
          populate: {
            path: "reviews",
          },
        })
        .populate("shopId", ["description", "image"])
        .populate("ownerId", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .skip(skip)
        .limit(limits);

      res.send({
        rooms,
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

exports.getPaginatedRoomsByUserId = async (req, res) => {
  try {
    var pageNumber = req.params.pagenumber;

    if (pageNumber < 1) {
      pageNumber = 1;
    }

    const rooms = await roomsModel.aggregate([
      {
        $match: {
          $or: [
            {
              roomType: "public",
              event: false,
              ended: false,
            },
            {
              $and: [
                { roomType: "private" },
                {
                  $or: [
                    {
                      invitedhostIds: mongoose.Types.ObjectId(
                        req.params.userId
                      ),
                    },
                    { invitedIds: mongoose.Types.ObjectId(req.params.userId) },
                  ],
                },

                { event: false, ended: false },
              ],
            },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page: pageNumber } }],
          data: [
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
            {
              $lookup: {
                from: "users",
                localField: "hostIds",
                foreignField: "_id",
                as: "hostIds",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "userIds",
                foreignField: "_id",
                as: "userIds",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "raisedHands",
                foreignField: "_id",
                as: "raisedHands",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "speakerIds",
                foreignField: "_id",
                as: "speakerIds",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "invitedIds",
                foreignField: "_id",
                as: "invitedIds",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "productIds",
                foreignField: "_id",
                as: "productIds",
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
            {
              $lookup: {
                from: "products",
                localField: "productIds",
                foreignField: "_id",
                as: "productIds",
                pipeline: [
                  {
                    $lookup: {
                      from: "reviews",
                      localField: "review",
                      foreignField: "_id",
                      as: "reviews",
                    },
                  },
                ],
              },
            },
            {
              $lookup: {
                from: "shops",
                localField: "shopId",
                foreignField: "_id",
                as: "shopId",
              },
            },
            { $skip: (pageNumber - 1) * 10 },
            { $limit: 10 },
          ], // add projection here wish you re-shape the docs
        },
      },
    ]);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(rooms);
  } catch (error) {
    console.log(error + " ");
    res.statusCode = 422;
    res.setHeader("Content-Type", "application/json");
    res.json(error);
  }
};

exports.searchForRoom = async function (req, res) {
  try {
    var pageNumber = req.params.pagenumber;

    if (pageNumber < 1) {
      pageNumber = 1;
    }

    const rooms = await roomsModel.aggregate([
      {
        $match: {
          $and: [
            {
              $expr: {
                $regexMatch: {
                  input: "$title",
                  regex: req.params.name,
                  options: "i",
                },
              },
            },
            { event: false },
            { ended: false },
            {
              $or: [
                {
                  roomType: "public",
                },
                {
                  $and: [
                    { roomType: "private" },
                    {
                      $or: [
                        { invitedhostIds: req.params.userId },
                        { invitedIds: req.params.userId },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page: pageNumber } }],
          data: [
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
            {
              $lookup: {
                from: "users",
                localField: "hostIds",
                foreignField: "_id",
                as: "hostIds",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "userIds",
                foreignField: "_id",
                as: "userIds",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "raisedHands",
                foreignField: "_id",
                as: "raisedHands",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "speakerIds",
                foreignField: "_id",
                as: "speakerIds",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "invitedIds",
                foreignField: "_id",
                as: "invitedIds",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "productIds",
                foreignField: "_id",
                as: "productIds",
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
            {
              $lookup: {
                from: "shops",
                localField: "shopId",
                foreignField: "_id",
                as: "shopId",
              },
            },
            { $skip: (pageNumber - 1) * 20 },
            { $limit: 20 },
          ], // add projection here wish you re-shape the docs
        },
      },
    ]);

    res.json(rooms);
  } catch (error) {
    res.status(404).send(error);
  }
};

exports.getMyEvents = async (req, res) => {
  console.log(Date.now());

  try {
    let rooms = await roomsModel
      .find({
        $and: [
          { event: { $eq: true } },
          { ownerId: { $eq: req.params.userId } },
          { eventDate: { $gte: Date.now() * 1 } },
          { ended: false },
        ],
      })
      .sort({ eventDate: 1 })
      .populate("hostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("invitedhostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("userIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("raisedHands", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("speakerIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("invitedIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate({
        path: "productIds",
        populate: {
          path: "category",
        },
      })
      .populate({
        path: "productIds",
        populate: {
          path: "ownerId",

          populate: {
            path: "shopId",
          },
        },
      })
      .populate("channel", ["title", "description", "imageurl"])
      .populate("shopId", ["description", "image"])
      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ]);
    res.status(200).setHeader("Content-Type", "application/json").json(rooms);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getRoomsForMyChannels = async (req, res) => {
  let user = await userModel.findById(req.params.userId);

  try {
    let rooms = await roomsModel
      .find({
        $and: [
          { event: { $eq: false } },
          { channel: { $in: user.joinedclubs } },
          { ended: false },
        ],
      })
      .sort({ createdAt: -1 })
      .populate("hostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("userIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("raisedHands", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("speakerIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("invitedIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate({
        path: "productIds",
        populate: {
          path: "ownerId",

          populate: {
            path: "shopId",
          },
        },
      })
      .populate("shopId", ["description", "image"])
      .populate("channel", ["title", "description", "imageurl"])
      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ]);
    res.status(200).setHeader("Content-Type", "application/json").json(rooms);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getRoomsAllEvents = async (req, res) => {
  try {
    let rooms = await roomsModel
      .find({
        $and: [
          { event: { $eq: true } },
          { ended: false },
          { eventDate: { $gte: Date.now() * 1 } },
          {
            $or: [
              {
                roomType: "public",
              },
/*
              {
                $and: [
                  { roomType: "private" },
                  { invitedhostIds: req.params.userId },
                ],
              },
*/
            ],
          },
        ],
      })
      .sort({ eventDate: 1 })
      .populate("hostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("invitedhostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("userIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("raisedHands", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("speakerIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("invitedIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("channel", ["title", "description", "imageurl"])
      .populate({
        path: "productIds",
        populate: {
          path: "category",
          populate: {
            path: "shopId",
          },
        },
      }).populate({
        path: "productIds",
        populate: {
          path: "reviews"
        },
      })
      .populate({
        path: "productIds",
        populate: {
          path: "ownerId",
          populate: {
            path: "shopId",
          },
        },
      })
      .populate("shopId", ["description", "image"])
      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ]);
    res.status(200).setHeader("Content-Type", "application/json").json(rooms);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getRoomsAllRooms = async (req, res) => {
  try {
    let rooms = await roomsModel
      .find({
        $and: [{ event: { $eq: false } }, { ended: { $eq: false } }],
      })
      .sort({ createdAt: -1 })
      .populate("hostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("userIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("raisedHands", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("speakerIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("invitedIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])

      .populate({
        path: "productIds",
        populate: {
          path: "ownerId",

          populate: {
            path: "shopId",
          },
        },
      })
      .populate("shopId", ["description", "image"])
      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ]);
    res.status(200).setHeader("Content-Type", "application/json").json(rooms);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getEndedRooms = async (req, res) => {
  try {
    var pageNumber = req.params.pagenumber;

    if (pageNumber < 1) {
      pageNumber = 1;
    }
    pageNumber = pageNumber - 1;

    const rooms = await roomsModel.aggregate([
      {
        $match: {
          ended: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page: pageNumber } }],
          data: [
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
            {
              $lookup: {
                from: "users",
                localField: "hostIds",
                foreignField: "_id",
                as: "hostIds",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "userIds",
                foreignField: "_id",
                as: "userIds",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "raisedHands",
                foreignField: "_id",
                as: "raisedHands",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "speakerIds",
                foreignField: "_id",
                as: "speakerIds",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "invitedIds",
                foreignField: "_id",
                as: "invitedIds",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "productIds",
                foreignField: "_id",
                as: "productIds",
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
            {
              $lookup: {
                from: "shops",
                localField: "shopId",
                foreignField: "_id",
                as: "shopId",
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
    res.json(rooms);
  } catch (error) {
    console.log(error + " ");
    res.statusCode = 422;
    res.setHeader("Content-Type", "application/json");
    res.json(error);
  }
};

exports.getRoomsByShopId = async (req, res) => {
  try {
    let rooms = await roomsModel
      .find({
        $and: [
          { event: { $eq: false } },
          { ended: false },
          { shopId: req.params.shopId },
        ],
      })
      .populate({
        path: "productIds",
        populate: {
          path: "ownerId",

          populate: {
            path: "shopId",
          },
        },
      })
      .populate("shopId");
    res.status(200).setHeader("Content-Type", "application/json").json(rooms);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.sendRoomNotifications = async (req, res) => {
  if (req.body.type == "speaking" || req.body.type == "liveposted") {
    let userdata = await userModel
      .findById(req.body.user._id)
      .populate("followers", ["notificationToken", "_id"]);

    userdata.followers.forEach((user) => {
      if (
        user.notificationToken != "" &&
        req.body.room.allUsers.indexOf(user._id) == -1
      ) {
        functions.sendNotificationOneSignal(
          [user.notificationToken],
          userdata.firstName + " is live!",
          userdata.firstName +
            " is live talking about `" +
            req.body.room.productIds[0].name +
            "`. join them.",
          "RoomScreen",
          req.body.room._id
        );
      }
    });

    let respnse = await roomsModel
      .findByIdAndUpdate(
        req.body.room._id,
        {
          $set: { speakersSentNotifications: [req.body.user._id] },
        },
        { new: true, runValidators: true }
      )
      .populate("hostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
      ])
      .populate("userIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
      ])
      .populate("raisedHands", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate("speakerIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
      ])
      .populate("invitedIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
      ])
      .populate({
        path: "productIds",

        populate: {
          path: "ownerId",

          populate: {
            path: "shopId",
          },
        },
      })
      .populate("shopId", ["description", "image"])
      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "agorauid",
        "roomuid",
      ]);
    res.status(200).setHeader("Content-Type", "application/json").json(respnse);
  }
};

exports.updateRoomByIdNew = async (req, res) => {
  try {
    let updatedRoom = await roomsModel
      .findByIdAndUpdate(
        req.params.roomId,
        {
          $set: req.body,
        },
        { new: true, runValidators: true }
      )
      .populate("hostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
      ])
      .populate("userIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
      ])
      .populate("raisedHands", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate("speakerIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
      ])
      .populate("invitedIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate({
        path: "productIds",

        populate: {
          path: "ownerId",

          populate: {
            path: "shopId",
          },
        },
      })
      .populate("shopId", ["description", "image"])
      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ]);

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(updatedRoom);
  } catch (error) {
    console.log(error + " ");
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};



exports.removeProductFromroom = async (req, res) => {
	console.log("removeProductFromroom");
  try {
    await roomsModel.findByIdAndUpdate(
      req.params.roomid,
      {
        $pullAll: { productIds: [req.body.product] },
      },
      { runValidators: true, new: true, upsert: false }
    );
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({"success":true});


  } catch (error) {
    console.log(error + " ");
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};


exports.updateRoomById = async (req, res) => {
  let { title, token, activeTime, ...arrays } = req.body;
  try {
    let updatedRoom = await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $addToSet: arrays,
        $set: { title, token, activeTime },
      },
      { runValidators: true, new: true, upsert: false }
    );
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(updatedRoom);
  } catch (error) {
    console.log(error + " ");
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.addUserToRoom = async (req, res) => {
  try {
    const room = await roomsModel.findById(req.params.roomId);

    let user = await userModel.findById(req.body.users[0]);

    if (user.currentRoom != "" && user.currentRoom != req.params.roomId) {
      let userRoom = await roomsModel.findById(user.currentRoom);

      if (userRoom != null && userRoom["ended"] == false) {
        if (
          userRoom.hostIds.length < 2 &&
          userRoom.hostIds.includes(req.body.users[0])
        ) {
          await roomsModel.findByIdAndUpdate(user.currentRoom, {
            $set: {
              ended: true,
              endedTime: Date.now(),
              productImages: [],
            },
          });
        } else {
          await roomsModel.findByIdAndUpdate(
            user.currentRoom,
            {
              $pullAll: { userIds: [req.body.users] },
              $pullAll: { hostIds: [req.body.users] },
              $pullAll: { speakerIds: [req.body.users] },
            },
            { runValidators: true, new: true, upsert: false }
          );
        }
      }
    }
    await userModel.findByIdAndUpdate(req.body.users[0], {
      $set: { currentRoom: req.params.roomId, muted: true },
    });

    if (
      room.hostIds.includes(req.body.users[0]) ||
      room.speakerIds.includes(req.body.users[0])
    ) {
      res.status(200).setHeader("Content-Type", "application/json").json(room);
    } else {
      let updatedRoom = await roomsModel.findByIdAndUpdate(
        req.params.roomId,
        {
          $addToSet: { userIds: req.body.users },
          $set: { allUsers: req.body.users },
        },
        { runValidators: true, new: true, upsert: false }
      );
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json(updatedRoom);
    }
  } catch (error) {
    console.log(error.message);
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.removeUserFromRoom = async (req, res) => {
  try {
    let updatedRoom = await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { userIds: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { allUsers: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { allUsers: req.body.speakerIds },
      },
      { runValidators: true, new: true, upsert: false }
    );

    await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { allUsers: req.body.raisedHands },
      },
      { runValidators: true, new: true, upsert: false }
    );

    await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { invitedSpeakerIds: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    await userModel.findByIdAndUpdate(req.body.users[0], {
      $set: { currentRoom: "", muted: true },
    });

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(updatedRoom);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.removeUserFromAudienceRoom = async (req, res) => {
  try {
    let updatedRoom = await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { userIds: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { allUsers: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    await userModel.findByIdAndUpdate(req.body.users[0], {
      $set: { currentRoom: "" },
    });

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(updatedRoom);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.removeSpeakerRoom = async (req, res) => {
  try {
    let updatedRoom = await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { speakerIds: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { allUsers: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(updatedRoom);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.removeInvitedSpeakerRoom = async (req, res) => {
  try {
    let updatedRoom = await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { invitedSpeakerIds: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { allUsers: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(updatedRoom);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.removeHostRoom = async (req, res) => {
  try {
    let updatedRoom = await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { hostIds: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { allUsers: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(updatedRoom);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.removeRaisedHandRoom = async (req, res) => {
  try {
    let updatedRoom = await roomsModel.findByIdAndUpdate(
      req.params.roomId,
      {
        $pullAll: { raisedHands: req.body.users },
      },
      { runValidators: true, new: true, upsert: false }
    );

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(updatedRoom);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getEventById = async (req, res) => {
  try {
    let room = await roomsModel
      .findById(req.params.roomId)
      .populate("hostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
      ])
      .populate("userIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
      ])
      .populate("invitedhostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate("raisedHands", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate("speakerIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
      ])
      .populate("invitedIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate("channel", ["title", "description", "imageurl"])
      .populate({
        path: "productIds",

        populate: {
          path: "ownerId",

          populate: {
            path: "shopId",
          },
        },
      })
      .populate("shopId", ["description", "image"])
      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ]);
    res.status(200).setHeader("Content-Type", "application/json").json(room);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getRoomById = async (req, res) => {
  try {
    let room = await roomsModel
      .findById(req.params.roomId)
      .populate("hostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
        "muted",
      ])
      .populate("userIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
        "muted",
      ])
      .populate("raisedHands", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
        "muted",
      ])
      .populate("speakerIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
        "muted",
      ])
	      .populate({
          path: "activeauction",
          populate: {
            path: "product",
            populate: {
              path: "shopId",
            },
          },
        })
	      .populate({
          path: "activeauction",
          populate: {
            path: "product",
            populate: {
              path: "ownerId",
            },
          },
        })
        .populate({
          path: "activeauction",
          populate: {
            path: "winner",
            path: "winning",
            path: "bids",
            populate: {
              path: "shopId",
            },
          },
        })
      .populate("invitedIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
        "muted",
      ])
	      .populate({
	        path: "activeauction",
	        populate: {
	          path: "product",
	          populate: {
	            path: "category",
	          },
	        },
	      })
	      .populate({
	        path: "activeauction",
	        populate: {
	          path: "ownerId",
	
	          populate: {
	            path: "shopId",
	          },
	        },
	      })
	      .populate({
	        path: "pin",
	        populate: {
	          path: "ownerId",
	          populate: {
	            path: "shopId",
	          },
	        },
	      })
      .populate({
        path: "productIds",
        populate: {
          path: "reviews",
        },
      })
      .populate({
        path: "productIds",
        populate: {
          path: "category",
        },
      })
      .populate({
        path: "productIds",
        populate: {
          path: "ownerId",

          populate: {
            path: "shopId",
          },
        },
      })
      .populate("shopId")
      .populate({ path : "ownerId",populate: {
          path: "address",
        }});

    if (room["ended"] == true) {
      res.status(200).setHeader("Content-Type", "application/json").json(null);
    } else {
      res.status(200).setHeader("Content-Type", "application/json").json(room);
    }
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getDeletedRoomById = async (req, res) => {
  try {
    let room = await roomsModel
      .findById(req.params.roomId)
      .populate("hostIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
      ])
      .populate("userIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
      ])
      .populate("raisedHands", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate("speakerIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "followersCount",
        "followingCount",
        "followers",
        "following",
        "roomuid",
          "agorauid",
      ])
      .populate("invitedIds", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ])
      .populate({
        path: "productIds",

        populate: {
          path: "ownerId",

          populate: {
            path: "shopId",
          },
        },
      })
      .populate("shopId")
      .populate("ownerId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
        "profilePhoto",
        "roomuid",
          "agorauid",
      ]);

    if (room == null) {
      res.status(200).setHeader("Content-Type", "application/json").json(null);
    } else {
      if (room["ended"] == false) {
        res
          .status(200)
          .setHeader("Content-Type", "application/json")
          .json(null);
      } else {
        res
          .status(200)
          .setHeader("Content-Type", "application/json")
          .json(room);
      }
    }
  } catch (error) {
    console.log(error);
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.stopRecording = async (req, res) => {
	
	var settingsresponse = await functions.getSettings();
  let plainCredentials =
    (settingsresponse["AGORA_CUSTOMER_KEY"]) +
    ":" +
    (settingsresponse["AGORA_CUSTOMER_SECRET"]);
  let authorizationHeader =
    "Basic " + Buffer.from(plainCredentials).toString("base64");
  const headers = {
    "Content-Type": "application/json;charset=utf-8",
    Authorization: authorizationHeader,
  };

  let sid = req.params.sid;
  let resourceid = req.body.resourceid;
  let uid = req.body.roomuid + "";

  var clientRequest = {
    cname: req.body.channelname,
    uid: uid,
    clientRequest: {
      async_stop: false,
    },
  };

  await roomsModel.findByIdAndUpdate(req.body.channelname, {
    $pullAll: { recordingIds: [uid] },
  });

  axios
    .post(
      `http://api.agora.io/v1/apps/${settingsresponse["agoraAppID"]}/cloud_recording/resourceid/${resourceid}/sid/${sid}/mode/mix/stop`,
      clientRequest,
      {
        headers: headers,
      }
    )
    .then(async (response) => {
      let newRecording = {
        userId: req.body.userId,
        roomId: req.body.roomId,
        resourceId: response.data.resourceId,
        sid: response.data.sid,
        fileList: response.data.sid + "_" + req.body.channelname + ".m3u8",
        date: Date.now(),
      };

      try {
        await recordingsModel.create(newRecording);
        res
          .status(200)
          .setHeader("Content-Type", "application/json")
          .json({ success: true, recording: response.data });
      } catch (e) {
        console.log(e + " ");
      }
    })
    .catch((error) => {
      console.log("error" + error);
      res.json({ success: false, message: error });
    });
};

startRecording = async (
  resourceid,
  uid,
  channelname,
  token,
  toSubscribeVideoUids
) => {
	var settingsresponse = await functions.getSettings();
  var clientRequest = {
    cname: channelname,
    uid: uid,
    clientRequest: {
      token: token,
      recordingConfig: {
        channelType: 0,
        streamTypes: 2,
        audioProfile: 1,
        maxIdleTime: 45,
        transcodingConfig: {
          width: 360,
          height: 640,
          fps: 30,
          bitrate: 600,
          maxResolutionUid: "1",
          mixedVideoLayout: 1,
        },
        recordingFileConfig: {
          avFileType: ["hls", "mp4"],
        },
        subscribeVideoUids: ["#allstream#"],
        subscribeAudioUids: ["#allstream#"],
      },
      storageConfig: {
        vendor: settingsresponse["AWSVENDOR"],
        region: settingsresponse["AWSREGION"],
        bucket: settingsresponse["AWSBUCKET"],
        accessKey: settingsresponse["AWSACCESSKEY"],
        secretKey: settingsresponse["AWSSECRETKEY"],
      },
    },
  };

  let plainCredentials =
    (settingsresponse["AGORA_CUSTOMER_KEY"]) +
    ":" +
    (settingsresponse["AGORA_CUSTOMER_SECRET"]);
  let authorizationHeader =
    "Basic " + Buffer.from(plainCredentials).toString("base64");
  const headers = {
    "Content-Type": "application/json;charset=utf-8",
    Authorization: authorizationHeader,
  };

  return axios
    .post(
      `https://api.agora.io/v1/apps/${settingsresponse["agoraAppID"]}/cloud_recording/resourceid/${resourceid}/mode/mix/start`,
      clientRequest,
      {
        headers: headers,
      }
    )
    .then(async (response) => {
      return await roomsModel.findByIdAndUpdate(channelname, {
        $set: { recordingsid: response.data.sid },
      });
    })
    .catch((error) => {
//       console.log("error", error);
    });
};

exports.recordRoom = async (req, res) => {
	
	var settingsresponse = await functions.getSettings();
	console.log("settingsresponse", settingsresponse);
	
  let plainCredentials =
    (settingsresponse["AGORA_CUSTOMER_KEY"]) +
    ":" +
    (settingsresponse["AGORA_CUSTOMER_SECRET"]);
  let authorizationHeader =
    "Basic " + Buffer.from(plainCredentials).toString("base64");
  const headers = {
    "Content-Type": "application/json",
    Authorization: authorizationHeader,
  };
  let uid = req.body.roomuid + "";
  let channelname = req.params.channelname;
  let token = req.body.token;
  let toSubscribeVideoUids = req.body.toSubscribeVideoUids;

  axios
    .post(
      `https://api.agora.io/v1/apps/${settingsresponse["agoraAppID"]}/cloud_recording/acquire`,
      {
        cname: channelname,
        uid: uid,
        clientRequest: { region: "CN", resourceExpiredHour: 24 },
      },
      {
        headers: headers,
      }
    )
    .then(async (response) => {
      let reee = await startRecording(
        response.data.resourceId,
        uid,
        channelname,
        token,
        toSubscribeVideoUids
      );

      let saved = await roomsModel
        .findByIdAndUpdate(
          channelname,
          {
            $set: {
              resourceId: response.data.resourceId,
              recordingUid: uid,
              recordingIds: [uid],
            },
          },
          { runValidators: true, new: true }
        )
        .populate("hostIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        .populate("userIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        .populate("raisedHands", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate("speakerIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "followersCount",
          "followingCount",
          "followers",
          "following",
          "roomuid",
          "agorauid",
        ])
        .populate("invitedIds", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ])
        .populate({
          path: "productIds",
          populate: {
            path: "category",
          },
        })
        .populate({
          path: "productIds",
          populate: {
            path: "ownerId",

            populate: {
              path: "shopId",
            },
          },
        })
        .populate("shopId", ["description", "image"])
        .populate("ownerId", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
          "profilePhoto",
          "roomuid",
          "agorauid",
        ]);

      res.json(saved);
    })
    .catch((error) => {
//       console.log("error", error);
      res.json(error);
    });
};

exports.deleteRoomById = async (req, res) => {
  try {
    let updatedRoom = await roomsModel.findByIdAndUpdate(req.params.roomId, {
      $set: {
        ended: true,
        endedTime: Date.now(),
        productImages: [],
      },
    });

    if (updatedRoom.channel != null) {
      await clubModel.updateOne(
        { _id: mongoose.Types.ObjectId(updatedRoom.channel) },
        {
          $pullAll: { rooms: [req.params.roomId] },
        }
      );
    }

    const bucket = admin
      .storage()
      .bucket(await functions.getSettings()["FIREBASE_STORAGE_BUCKET"]);
    const folder = "rooms/" + req.params.roomId;

    await bucket.deleteFiles({ prefix: folder });

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(updatedRoom);
  } catch (error) {
    console.log("Error deleting room " + error);
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};
