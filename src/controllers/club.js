const userModel = require("../models/userSchema");
const clubModel = require("../models/clubModel");
const utils = require("../../utils");
const functions = require("../shared/functions")


//Get all clubs count
exports.getClubsCount = async function (req, res) {
    try {
        const clubs = await clubModel.count()
        res.json(clubs)

    } catch (error) {
        res.status(404).send(error);
    }
}

//Get all clubs
exports.getAllClubs = async function (req, res) {
    try {
        const clubs = await clubModel.aggregate([

            {
                $addFields: { members_count: { $size: { "$ifNull": ["$members", []] } } }
            },
            {
                $sort: { "members_count": -1 }
            }

        ])

        res.json(clubs)

    } catch (error) {
        res.status(404).send(error + " j");
    }
}

//Get all clubs
exports.getAllClubsAfter = async function (req, res) {
    try {
        var pageNumber = req.params.pagenumber

        if (pageNumber < 1) {
            pageNumber = 1
        }
        const clubs = await clubModel.aggregate(
            [
                {
                    $addFields: { members_count: { $size: { "$ifNull": ["$members", []] } } }
                },
                {
                    $sort: { "members_count": -1 }
                }])

        res.json(clubs)

    } catch (error) {
        res.status(404).send(error + " fff");
    }
}

//Get all clubs
exports.getAllClubsAfterGet = async function (req, res) {
    try {
        const clubs = await clubModel.find(
            {
                $or: [
                    {
                        _id: { $gt: req.params.id }
                    }
                ]
            }).limit(20)

        res.json(clubs)

    } catch (error) {
        res.status(404).send(error + " fff");
    }
}

//Get club by id
exports.getClubById = async function (req, res) {

    console.log(req.params.id);
    try {
        const club = await clubModel.findOne({ _id: req.params.id })
            .populate("rooms")
        res.json(club)

    } catch (error) {
        res.status(404).send(error);
    }
}

//Get club by title
exports.getClubByTitle = async function (req, res) {
    try {
        const title = req.params.title
        const club = await clubModel.find({ $or: [{ title: { $eq: title } }] }).limit(20)
        res.json(club)

    } catch (error) {
        res.status(404).send(error);
    }
}

//Search club by title
exports.searchClubByTitle = async function (req, res) {
    try {

        var pageNumber = req.params.pagenumber
        if (pageNumber < 1) {
            pageNumber = 1
        }

        const club = await clubModel.aggregate([
            {
                $match: {
                    $expr: {
                        $regexMatch: {
                            input: "$title",
                            regex: req.params.title,
                            options: "i"
                        }
                    }
                }
            },
            {
                $facet: {
                    metadata: [{ $count: "total" }, { $addFields: { page: pageNumber } }],
                    data: [
                        { $skip: (pageNumber - 1) * 20 },
                        { $limit: 20 },

                    ], // add projection here wish you re-shape the docs
                }
            }

        ])

        res.json(club)

    } catch (error) {
        res.status(404).send(error);
    }
}

//Get clubs where a user is owner of
exports.getClubsUserIsOwner = async function (req, res) {
    try {
        const id = req.params.id
        const clubs = await clubModel.find({ ownerid: id }).sort({ published_date: -1 })
        res.json(clubs)

    } catch (error) {
        res.status(404).send(error);
    }
}

//Get clubs where a user is a member of
exports.getClubsUserIsMember = async function (req, res) {
    try {
        const id = req.params.id
        const clubs = await clubModel.find({ members: id }).sort({ published_date: -1 })
        res.json(clubs)

    } catch (error) {
        res.status(404).send(error);
    }
}

//Get clubs members
exports.getClubMembers = async function (req, res) {
    try {
        const id = req.params.id

        const user = await userModel.find({ joinedclubs: id }).limit(20)
        res.json(user)

    } catch (error) {
        res.status(404).send(error);
    }
}

//Get clubs members
exports.getClubMembersAfter = async function (req, res) {
    try {

        const user = await userModel.find({
            $or: [
                { joinedclubs: req.body.id },
                {
                    membersince: { $gt: req.body.membersince },
                    _id: { $gt: req.body.id }
                }
            ]
        }).sort({ membersince: -1 }).limit(20)
        res.json(user)

    } catch (error) {
        res.status(404).send(error);
    }
}

//Get clubs members
exports.getClubMembersAfterGet = async function (req, res) {
    /*
        try {
    
            const user = await userModel.find({ [
                    {joinedclubs: req.params.clubid},
                    {
                        _id: {$gt: req.params.userid}
                    }
                ]
             }).limit(20)
            res.json(user)
    
        } catch (error) {
            res.status(404).send(error);
        }
    */
}

//Get clubs user follows
exports.getClubsUserFollows = async function (req, res) {
    try {
        const id = req.params.uid
        const clubs = await clubModel.find({ followers: id })
        res.json(clubs)

    } catch (error) {
        res.status(404).send(error);
    }
}

//Save club
exports.saveClub = async function (req, res) {
    const club = new clubModel(req.body)

    try {

        var clubs = await clubModel.find({ title: { $regex: req.body.title, $options: 'i' } })

        if (clubs.length > 0) {
            res.json({ success: false, message: "A channel with the same name exists" })
        } else {

            var results = await club.save();
            res.json({ success: true, data: results });
        }

    }

    catch (err) {
        console.log(err + " ")
        res.status(400).send({ success: false, message: err });
    }
}

exports.joinMyClub = async function (req, res) {

    try {

        await userModel.updateOne(
            { uid: req.body.userid },
            { $push: { clubs: [req.params.clubid] } })

        await userModel.updateOne(
            { uid: req.body.userid },
            { $push: { joinedclubs: [req.params.clubid] } })

        res.send("success")

    } catch (error) {
        res.status(404).send(error + " j");

    }
}

//Update club
exports.updateClub = async function (req, res) {
    try {
        await clubModel.updateOne({ _id: req.params.id },
            { $set: req.body })

        res.json("Updated club successfully")
    }

    catch (err) {
        console.log(err)
        res.status(404).send(err);
    }
}

//invite user to club
exports.inviteUserToClub = async function (req, res) {
    try {

        const userId = req.params.id
        const clubId = req.body.clubid
        const clubName = req.body.clubname
        const userToken = req.body.usertoken
        const inviterName = req.body.invitername
        const inviterImageUrl = req.body.inviterimageurl

        await clubModel.updateOne({ clubid: clubId },
            { $push: { "invited": [userId] } })

        functions.saveActivity(
            clubId,
            inviterName,
            'ClubScreen',
            false,
            inviterImageUrl,
            req.params.id,
            inviterName + "  invited you to join " + clubName + " club.",
            clubId
        )

        functions.sendNotificationOneSignal([userToken], "🙂 👋 New Club Invite",
            inviterName + " invite you to " + clubName + " club", "ClubScreen", clubId)


        res.json("Updated club successfully")
    }

    catch (error) {
        console.log(error)
        res.status(404).send(error);
    }
}

//accept club invite
exports.acceptClubInvite = async function (req, res) {
    try {

        const userId = req.body.uid
        const clubId = req.params.clubid

        await clubModel.updateOne({ clubid: clubId },
            { $push: { "members": [userId] } })

        await userModel.updateOne({ uid: userId },
            { $push: { "joinedclubs": [clubId] } })

        res.json("Accepted club invite successfully")
    }

    catch (err) {
        res.status(404).send(error);
    }
}

//join club
exports.joinClub = async function (req, res) {
    try {

        // mongoose.Types.ObjectId(

        const userId = req.body.uid
        const clubId = req.params.clubid

        await clubModel.updateOne({ _id: clubId },
            { $addToSet: { "members": req.body.uid } })

        await userModel.updateOne({ _id: userId },
            { $addToSet: { "joinedclubs": req.params.clubid } })

        res.json("Joined club successfully")
    }

    catch (err) {
        console.log(err + " ")
        res.status(404).send(err);
    }
}

//Follow club
exports.followClub = async function (req, res) {
    try {

        const userId = req.body.uid
        const clubId = req.params.clubid

        const club = await clubModel.findOne({ _id: clubId })

        // const clubStats = clubStatsModel(clubStatsBody)
        // clubStats.save()

        await clubModel.updateOne({ _id: clubId },
            { $push: { followers: [userId] } })

        res.json("Followed club successfully")
    }

    catch (err) {
        res.status(404).send(err + " ");
    }

}

//UnFollow club
exports.unFollowClub = async function (req, res) {
    try {

        const userId = req.body.uid
        const clubId = req.params.clubid

        const club = await clubModel.findOne({ _id: clubId })


        await clubModel.updateOne({ _id: clubId },
            { $pullAll: { followers: [userId] } })

        res.json("UnFollowed club successfully")
    }

    catch (err) {
        res.status(404).send(err + " ");
    }

}

//Leave club
exports.leaveClub = async function (req, res) {
    try {
        const myid = req.body.uid;
        const clubid = req.params.clubid;

        const club = await clubModel.findOne({ _id: clubid })


        await userModel.updateOne(
            { _id: myid },
            { $pullAll: { joinedclubs: [clubid] } }
        );

        await clubModel.updateOne(
            { _id: clubid },
            { $pullAll: { members: [myid] } }
        );

        res.json("Left club successfully");
    } catch (err) {
        console.log(err)
        res.status(404).send(err);
    }
};

//Add topic
exports.addTopic = async function (req, res) {
    try {
        const clubid = req.params.clubid;

        await clubModel.updateOne(
            { clubid: clubid },
            { $push: { topics: [req.body] } }
        );

        res.json("Added topic successfully");
    } catch (err) {
        res.status(404).send(err);
    }
};

//Remove topic
exports.removeTopic = async function (req, res) {
    try {
        const clubid = req.params.clubid;

        await clubModel.updateOne(
            { clubid: clubid },
            { $pullAll: { topics: [req.body] } }
        );

        res.json("Removed topic successfully");
    } catch (err) {
        res.status(404).send(err);
    }
};

//Add room belonging to club
exports.addRoom = async function (req, res) {
    try {
        const clubid = req.params.clubid;

        await clubModel.updateOne(
            { _id: clubid },
            { $addToSet: { rooms: [req.body.roomid] } }
        );

        res.json("Added Room successfully");
    } catch (err) {
        res.status(404).send(err);
    }
};

//Remove room belong to club
exports.removeRoom = async function (req, res) {
    try {
        const clubid = req.params.clubid;

        await clubModel.updateOne(
            { clubid: clubid },
            { $pullAll: { rooms: [req.body.roomid] } }
        );

        res.json("Removed Room successfully");
    } catch (err) {
        res.status(404).send(err);
    }
};

//Delete club
exports.deleteClub = async function (req, res) {
    try {

        await clubModel.deleteOne({ _id: req.params.id });

        res.json("Successfuly deleted club")
    }

    catch (err) {
        res.status(404).send(error);
    }
}
