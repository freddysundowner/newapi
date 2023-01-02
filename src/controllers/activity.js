const activitiesModel = require('../models/activitySchema')
const mongoose = require("mongoose");

//Get all activities
exports.getAllActivities = async function (req, res) {

    try {
        const activity = await activitiesModel.find().sort({ time: -1 }).limit(20)
        res.json(activity)

    } catch (error) {
        res.status(400).send(error);
    }
}

//Get all activities after id
exports.getAllActivitiesAfter = async function (req, res) {


    try {

        var pageNumber = req.params.pagenumber

        const activity = await activitiesModel.aggregate([
            {
                $sort: { "time": -1 }
            },
            {
                $facet: {
                    metadata: [{ $count: "total" }, { $addFields: { page: pageNumber } }],
                    data: [{ $skip: pageNumber * 20 }, { $limit: 20 }] // add projection here wish you re-shape the docs
                }
            }
        ])

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(activity);

    } catch (error) {
        console.log(error + " ")
        res.statusCode = 422;
        res.setHeader("Content-Type", "application/json");
        res.json(error);
    }
}

exports.searchAllActivities = async function (req, res) {
	try {
  
	const activity = await activitiesModel.find({
		  $expr: {
		    $regexMatch: {
		      input: {
		        $concat: [
		          "$message",
		          " ",
		          "$name"
		        ]
		      },
		      regex: req.params.name,
		      options: "i"
		    }
		  }
		}).limit(20)
  
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(activity);

    } catch (error) {
        console.log(error + " ")
        res.statusCode = 422;
        res.setHeader("Content-Type", "application/json");
        res.json(error);
    }
  };

//Get all activities
exports.getUserActivities = async function (req, res) {

    try {
        // const activity = await activitiesModel.find({ to: req.params.uid }).sort({ time: -1 }).limit(50)


        var pageNumber = req.params.pagenumber
		
		if (pageNumber == 0) {
			pageNumber = 1
		}
		   pageNumber = pageNumber - 1

		const activity = await activitiesModel.aggregate([
			{
				$match: {"to": req.params.uid}
			},
			{
				$sort: { "time": -1 }
			},
			{
				$facet: {
					metadata: [{ $count: "total" }, { $addFields: { page: pageNumber } }],
					data: [
						{ $skip: pageNumber * 20 }, 
						{ $limit: 20 },
						
					]
				}
			}

		])


        res.json(activity)

    } catch (error) {
        console.log(error + " ")
        res.status(400).send(error);
    }
}

//Get all activities
exports.getUserActivitiesAfter = async function (req, res) {

    try {
        const activity = await activitiesModel.find(
            {
                $or: [
                    { time: { $gt: re.body.time } },
                    {
                        to: req.body.uid,
                        _id: { $gt: req.body.id }
                    }
                ]
            }
        ).sort({ time: -1 }).limit(20)

        res.json(activity)

    } catch (error) {
        res.status(404).send(error);
    }

    
}


//Get activity by id
exports.getActivityById = async function (req, res) {

    try {
        const activity = await activitiesModel.findById(req.params.id);
        res.json(activity)

    } catch (error) {
        res.status(404).send(error);
    }
}

//Get activity by type
exports.getActivityByType = async function (req, res) {
    try {
        const type = req.params.type
        const activity = await activitiesModel.find({ $or: [{ type: { $eq: type } }] })
        res.json(activity)

    } catch (error) {
        res.status(404).send(error);
    }
}

//Save activity
exports.saveActivity = async function (req, res) {
    const activity = new activitiesModel(req.body)

    try {
        await activity.save()
        res.json("Successfuly saved activity")
    }

    catch (err) {
        res.status(400).send(err);
    }
}

//Update activity
exports.updateActivity = async function (req, res) {
    try {
        await activitiesModel.updateOne({ _id: req.params.id },
            { $set: req.body })

        res.json("Updated activity successfully")
    }

    catch (err) {
        res.status(404).send(err);
    }
}

//Delete activity
exports.deleteActivity = async function (req, res) {
    try {

        await activitiesModel.deleteOne({ _id: req.params.id });

        res.json("Successfuly deleted activity")
    }

    catch (err) {
        res.status(404).send(err);
    }
}


//Delete activity
exports.deleteAllActivity = async function (req, res) {
    try {

        await activitiesModel.deleteMany({ to: req.body.userId });

        res.json("Successfuly deleted activity")
    }

    catch (err) {
        res.status(404).send(err);
    }
}


async function saveActivity(actionKey, fromFullName, type, actioned, fromImageUrl, toId, message) {
    try {

        var data = {
            "imageurl": fromImageUrl,
            "name": fromFullName,
            "type": type,
            "actionkey": actionKey,
            "actioned": actioned,
            'to': toId,
            "message": message,
            "time": Date.now(),
        }

        const activity = new activitiesModel(data);
        await activity.save()
    } catch (error) {
        console.log("Error saving activity " + error)
    }
    return 1

}