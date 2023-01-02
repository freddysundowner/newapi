const activitiesModel = require("../models/activitySchema");
const userModel = require("../models/userSchema");
const utils = require("../../utils");
const transactionModel = require("../models/transactionSchema");
const appSettings = require("../models/appSettings");
const OneSignal = '@onesignal/node-onesignal';
const BASE_URL = "https://onesignal.com/api/v1";
const request = require('request');

async function saveActivity(
  actionKey,
  fromFullName,
  type,
  actioned,
  fromImageUrl,
  toId,
  message,
  fromId
) {
  try {
    var data = {
      imageurl: fromImageUrl,
      name: fromFullName,
      type: type,
      actionkey: actionKey,
      actioned: actioned,
      to: toId,
      from: fromId,
      message: message,
      time: Date.now(),
    };

    console.log(data);

    const activity = new activitiesModel(data);
    await activity.save();
  } catch (error) {
    console.log("Error saving activity " + error);
  }
  return 1;
}

async function awardUser(userdata, type) {
  if (type == "join") {
    let userId = userdata._id;
    let amount = 1000;
    let respondeduser = await userModel.findByIdAndUpdate(
      userId,
      { $inc: { wallet: amount } },
      { runValidators: true, new: true }
    );

    saveActivity(
      userId,
      "New Account Award",
      "WalletScreen",
      false,
      userdata.profilePhoto,
      userId,
      "You have recived GP " + amount + " for joining GistShop Community",
      userId
    );

    sendNotificationOneSignal(
      [userdata["notificationToken"]],
      "Welcome to GistShop, you have been awarded GP. 1000",
      "👋👋👋👋",
      userId
    );

    let newTransaction2 = {
      from: userId,
      to: userId,
      reason: utils.Transactionreasons.NEWACCOUNTAWARD,
      amount: amount,
      type: "newaccountaward",
      status: "Completed",
      deducting: false,
      date: Date.now(),
    };

    let t2 = new transactionModel(newTransaction2);
    await t2.save();
    return respondeduser;
  }
}

/**
 * Send notificatio with One signal
 * @param {String} userTokenList the list of user tokens.
 * @param {String} title The title of the notification.
 * @param {String} msg The message.
 * @param {String} screenA The screen to go to when you click.
 * @param {String} id The id of what to go to.
 */
async function sendNotificationOneSignal(
  userTokenList,
  title,
  msg,
  screenA,
  id
) {
  console.log("Sending notif with One signal " + userTokenList);
  var sendNotification = function (data) {
    var headers = {
      "Content-Type": "application/json; charset=utf-8",
    };

    var options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers,
    };

    var https = require("https");
    var req = https.request(options, function (res) {
      res.on("data", function (data) {
	    console.log("data",data.body);
      });
    });

    req.on("error", function (e) {
      console.log("ERROR:");
      console.log(e);
    });

    req.write(JSON.stringify(data));
    console.log("last",JSON.stringify(data));
    req.end();
  };
  
  var response = await appSettings.find();
  console.log("one signal id", response[0]["oneSignalAppID"]);
  var message = {
    app_id: response[0]["oneSignalAppID"],
    headings: { en: title },
    contents: { en: msg },
    data: { screen: screenA, id: id },
    include_player_ids: userTokenList,
  };

  sendNotification(message);
}

async function getSettings() {
  var response = await appSettings.find();
  return response[0]; 
} 


const optionsBuilder = async (method, path, body) => {
	var response = await appSettings.find();
	var key = response[0]["OneSignalApiKey"];
	body["app_id"] = response[0]["oneSignalAppID"];
// 	console.log(response[0]);
    return {
        method,
        'url': `${BASE_URL}/${path}`,
        'headers': {
            'Content-Type': 'application/json',   
            'Authorization': `Basic ${key}`,
        },
        body: body ? JSON.stringify(body) : null,
    };
}

const sendNotificationToAll =  async (body) => { 
    const options = await optionsBuilder("POST","notifications", body); 
//     console.log(options);
    request(options, (error, response) => {
        if (error){
	        console.log("error sendiing notificatiooon");
        } else{
//         console.log(response.body);
        }
    });
}


module.exports = {
  saveActivity,
  sendNotificationOneSignal,sendNotificationToAll,
  awardUser,
  getSettings,
};
