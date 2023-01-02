const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/users");

const passport = require("passport");

require("../services/authenticate");

const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
	allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(null, false);
};

let upload = multer({ storage, fileFilter });

userRouter
	.route(`/`)
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.getAllUsers
	)
	.post(upload.single("profilePicture"), userController.addUser);

		
userRouter
	.route(`/allusers`)
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.getAllTheUsers
	);
	
	
userRouter
	.route("/:userId")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.getUserById
	)
	.put(
		upload.single("profilePhoto"),
		userController.editUserById
	)
	.delete(
		passport.authenticate("jwt", { session: false }),
		userController.deleteUserById
	);

userRouter
	.route("/users/upgraded")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.getUpgradedUsers
	)
userRouter
	.route("/sendgift")
	.post(
		userController.sendGift
	)
	
userRouter
	.route("/withdraw/requests")
	.get(
		userController.getAllWithdraws
	)
	.post(
		userController.withdraw
	)
		
userRouter
	.route("/withdraw/requests/:withdrawId")
	.get(
		userController.getWithdraw
	)
	.put(
		userController.updateWithdraw
	)
	.delete(
		userController.deleteWithdraw
	)
	
			
userRouter
	.route("/paginated/:pagenumber")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.getAllUsersPaginated
	)

userRouter
	.route("/followers/:userId")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.userFollowers
	)
	
userRouter
	.route("/followersfollowing/:userId")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.userFollowersFollowing
	)

userRouter
	.route("/followersfollowing/search/:userId/:name")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.searchForUserFriends
	)
	
userRouter
	.route("/add/favorite")
	.post(
		passport.authenticate("jwt", { session: false }),
		userController.addUserFavorite
	)
	

userRouter
	.route("/following/:userId")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.userFollowing
	)

userRouter
	.route("/search/:name/:pagenumber")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.searchForUser
	)

userRouter
	.route("/search/all/:name/:pagenumber")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.searchForAllUsers
	)
		
userRouter
	.route("/search/:name")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.searchForUserv2
	)
		
userRouter
	.route("/username/:userName")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.userByUsername
	)
	
userRouter
	.route("/upgrade/:userId")
	.put(
		passport.authenticate("jwt", { session: false }),
		userController.upgradeAccount
	)

userRouter
	.route("/follow/:myUid/:toFollowUid")
	.put(
		passport.authenticate("jwt", { session: false }),
		userController.followUser
	)

userRouter
	.route("/block/:myUid/:toBlockUid")
	.put(
		passport.authenticate("jwt", { session: false }),
		userController.blockUser
	)
	
userRouter
	.route("/unblock/:myUid/:toBlockUid")
	.put(
		passport.authenticate("jwt", { session: false }),
		userController.unblockUser
	)
	
	
userRouter
	.route("/unfollow/:myUid/:toFollowUid")
	.put(
		passport.authenticate("jwt", { session: false }),
		userController.unFollowUser
	)

userRouter
	.route("/updateWallet/:userId")
	.put(
		passport.authenticate("jwt", { session: false }),
		userController.updateWallet
	)
	

userRouter
	.route("/agora/:agoraid")
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.getUserByAgora
	)

userRouter
	.route("/profile/summary/:shopid") 
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.getProfileSummary
	)

userRouter
	.route("/paymentmethod/:id") 
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.getPaymentmethodByUserId
	)
	
	.post(
		passport.authenticate("jwt", { session: false }),
		userController.createPaymentMethod
	)
	.delete(
		passport.authenticate("jwt", { session: false }),
		userController.deletePaymentmethod
	)
	
userRouter
	.route("/payoutmethod/:id") 
	.get(
		passport.authenticate("jwt", { session: false }),
		userController.getPayoutmethodByUserId
	)
	
	.post(
		passport.authenticate("jwt", { session: false }),
		userController.createPayoutMethod
	)
	.delete(
		passport.authenticate("jwt", { session: false }),
		userController.deletePayoutmethod
	)
	
module.exports = userRouter;
