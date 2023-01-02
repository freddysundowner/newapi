const express = require("express");
const router = express.Router();
const clubController = require("../controllers/club");


//Get all clubs count
router.get("/count/", clubController.getClubsCount);

//Get all clubs
router.get("/", clubController.getAllClubs);

//Get all clubs after
router.get("/last/club/:pagenumber", clubController.getAllClubsAfter);

//Get all clubs after
router.get("/last/club/get/:id", clubController.getAllClubsAfterGet);

//Get club by id
router.get("/:id", clubController.getClubById);

//Get club by title
router.get("/title/:title", clubController.getClubByTitle);

//Search club by title
router.get("/search/:title/:pagenumber", clubController.searchClubByTitle);

//Get clubs where a user is owner of
router.get("/owner/:id", clubController.getClubsUserIsOwner);

//Get clubs where a user is a member of
router.get("/member/:id", clubController.getClubsUserIsMember);

//Get clubs members
router.get("/clubmembers/:id", clubController.getClubMembers);

//Get clubs members after
router.get("/clubmembers/after/club", clubController.getClubMembersAfter);

 
//Get clubs members after
router.get("/clubmembers/:clubid/next/:userid", clubController.getClubMembersAfterGet);

//Get clubs user follows
router.get("/clubfollowers/:id", clubController.getClubsUserFollows);

//Save club
router.post("/", clubController.saveClub);

//Join as owner of club
router.put("/joinasowner/:clubid", clubController.joinMyClub);

//Update club
router.put("/:id", clubController.updateClub);

//invite user to club
router.put("/inviteuser/:id", clubController.inviteUserToClub);

//accept club invite
router.put("/acceptinvite/:clubid", clubController.acceptClubInvite);

//join club
router.put("/joinclub/:clubid", clubController.joinClub);

//Follow club
router.put("/followclub/:clubid", clubController.followClub);

//UnFollow club
router.put("/unfollowclub/:clubid", clubController.unFollowClub);

//Leave club
router.put("/leaveclub/:clubid", clubController.leaveClub);

//Add topic
router.put("/topics/add/:clubid", clubController.addTopic);

//Remove topic
router.put("/topics/remove/:clubid", clubController.removeTopic);

//Add Room belonging club
router.put("/rooms/add/:clubid", clubController.addRoom);

//Remove Room belonging club
router.put("/rooms/remove/:clubid", clubController.removeRoom);

//Delete club
router.delete("/:id", clubController.deleteClub);

module.exports = router;
