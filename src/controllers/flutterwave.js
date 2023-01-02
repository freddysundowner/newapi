var request = require("request");
const userModel = require("../models/userSchema");
const functions = require("../shared/functions");

exports.createSubAccount = async (req, res) => {
  var response = await functions.getSettings();
  var options = {
    method: "POST",
    url: "https://api.flutterwave.com/v3/subaccounts",
    headers: {
      "Content-Type": "application/json",
	  Authorization: `Bearer ${response["FLUTTERWAVE_SECRET_KEY"]}`,
    },
    body: JSON.stringify({
      account_bank: req.body.bankcode,
      account_number: req.body.accountnumber,
      business_name: req.body.businessname,
      business_email: req.body.email,
      business_contact: "Anonymous",
      business_mobile: req.body.phone,
      country: req.body.country,
      split_type: "percentage",
      split_value: await functions.getSettings()["commission"],
    }),
  };
  request(options, function (error, response) {
    if (error){
	    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: false, data: error});
    }else{
	    console.log(response.body);
    var data = JSON.parse(response.body);
    if (req.params.id && data.status != "error") {
      userModel
        .findByIdAndUpdate(
          req.params.id,
          {
            $set: { 
              fw_subacoount: data.data.subaccount_id,
              fw_id: data.data.id,
            },
          }, 
          { new: true, runValidators: true }
        )
        .then((user) => {
          console.log("user", user);
        });
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json({ success: true, data: JSON.parse(response.body).data });
        
    } else { 
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json(JSON.parse(response.body));
    }
    }
  });
};
exports.getSubAccount = async (req, res) => {
  var response = await functions.getSettings();
  var options = {
    method: "GET",
    url: `https://api.flutterwave.com/v3/subaccounts/${req.params.id}`,
    headers: {
      Authorization: `Bearer ${response["FLUTTERWAVE_SECRET_KEY"]}`,
    },
  };
  request(options, function (error, response) {
   if (error){
	    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: false, data: error});
    }else{
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: JSON.parse(response.body).data });
      }
  });
};

exports.getBanks = async (req, res) => {
  var response = await functions.getSettings();
  console.log(response["FLUTTERWAVE_SECRET_KEY"]);
  var options = {
    method: "GET", 
    url: `https://api.flutterwave.com/v3/banks/${req.params.country}`,
    headers: {
      Authorization: `Bearer ${response["FLUTTERWAVE_SECRET_KEY"]}`,
    },
  };
  request(options, function (error, response) {
    if (error){
	    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: false, data: error});
    }else{
	    console.log(response.body)
/*
    	res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: JSON.parse(response.body).data });
*/
    }
  });
};
