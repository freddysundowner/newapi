const express = require("express");
const roomController = require("../controllers/rooms");
const roomRouter = express.Router();
const roomsModel = require("../models/roomSchema");
const userModel = require("../models/userSchema");

const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
	allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(null, false);
};

let upload = multer({ storage, fileFilter });


roomRouter.route("/").get(roomController.getRoomsAllRooms);
roomRouter.route("/events/:userId").get(roomController.getRoomsAllEvents);
roomRouter.route("/event/:roomId").get(roomController.getEventById);
roomRouter.route("/myevents/:userId").get(roomController.getMyEvents);
roomRouter.route("/mychannelrooms/:userId").get(roomController.getRoomsForMyChannels);
roomRouter.route("/rooms/roomnotifications").post(roomController.sendRoomNotifications);
roomRouter.route("/removecurrentroom/:userId").put(roomController.removeFromCurrentRoom);

roomRouter.route("/:userId").post(
	upload.any("productImages"),
	roomController.createRoom);
	
	
roomRouter.route("/newevent/:userId").post(
	upload.any("productImages"),
	roomController.createEvent);
	

roomRouter
	.route("/rooms/:roomId")
	.get(roomController.getRoomById)
	.put(
		upload.any("productImages"),
		roomController.updateRoomById)
	.delete(roomController.deleteRoomById);
	
	
roomRouter
	.route("/search/:name/:pagenumber")
	.get(
		roomController.searchForRoom
	)
	
roomRouter.route("/ended/:roomId").get(roomController.getDeletedRoomById);

roomRouter.route("/rooms/updatenew/:roomId").put(roomController.updateRoomByIdNew);

roomRouter.route("/stoprecording/:sid").post(roomController.stopRecording);

roomRouter.route("/record/:channelname").post(roomController.recordRoom);

roomRouter.route("/get/all/:userId").get(roomController.getRoomsByUserId);

roomRouter.route("/get/ended/:pagenumber").get(roomController.getEndedRooms);

roomRouter.route("/get/paginated/:userId/:pagenumber").get(roomController.getPaginatedRoomsByUserId);


roomRouter.route("/get/all/shops/:shopId").get(roomController.getRoomsByShopId);

roomRouter.route("/user/add/:roomId").put(roomController.addUserToRoom);

roomRouter.route("/user/remove/:roomId").put(roomController.removeUserFromRoom);

roomRouter.route("/speaker/remove/:roomId").put(roomController.removeSpeakerRoom);

roomRouter.route("/invitedSpeaker/remove/:roomId").put(roomController.removeInvitedSpeakerRoom);

roomRouter.route("/host/remove/:roomId").put(roomController.removeHostRoom);

roomRouter.route("/audience/remove/:roomId").put(roomController.removeUserFromAudienceRoom);

roomRouter.route("/raisedhans/remove/:roomId").put(roomController.removeRaisedHandRoom);

roomRouter.route("/agora/rooom/generatetoken").post(roomController.generateagoratoken);
roomRouter.route("/agora/rooom/rtmtoken/:id").get(roomController.generateRtmToken);

roomRouter.route("/test/:roomId").post(async (req, res) => {

	try {
  
		let updatedRoom = await roomsModel.findByIdAndUpdate(
			req.params.roomId,
			{
			  $addToSet: { userIds: req.body.users },
	
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
  } );

roomRouter.route("/allrooms/paginated").get(roomController.getALlRoomsPaginated);
roomRouter.route("/activetokshows").get(roomController.getPaginatedRoomsByUserIdNew);

roomRouter.route("/add/featured/:roomid").put(roomController.addProducttoRoom);
roomRouter.route("/remove/featured").put(roomController.removeFeaturedProduct);
roomRouter.route("/rooms/product/:roomid").put(roomController.removeProductFromroom);
module.exports = roomRouter;
