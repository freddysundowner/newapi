
const userModel = require("../models/userSchema");
const passport = require("passport");
const jwt = require("jsonwebtoken");
var admin = require("firebase-admin");
const serviceAccount = require("../../service_account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin.firestore().settings({ ignoreUndefinedProperties: true });

require("dotenv").config({ path: `${__dirname}/../../.env` });


exports.checUserExistsByEmail = async (req, res, next) => {
  console.log(req.body);
  const user = await userModel.find({ email: req.body.email });
  if (user.length > 0) {
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
};

exports.mobileLoginRegisterWithSocial = async (req, res, next) => {
  const user = await userModel
    .find({ email: req.body.email })
    .populate("shopId")
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
    .populate("joinedclubs", ["title", "imageurl"]);
  if (user.length > 0) {
  	console.log("one", user[0]);
    admin
      .auth()
      .createCustomToken(user[0]._id.toString())
      .then(async (customToken) => {
        const token = jwt.sign(user[0].email, process.env.secret_key);
        res.status(200).json({
          authtoken: customToken,
          success: true,
          data: user[0],
          accessToken: token,
          newuser: false,
        });
      })
      .catch((error) => {
        res.status(400).json({ success: false });
      });
  } else {
    let added = await userModel.create(req.body);
    added
      .populate("shopId")
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
      .populate("joinedclubs", ["title", "imageurl"]);
  console.log("added ",added);
    admin
      .auth()
      .createCustomToken(added._id.toString())
      .then(async (customToken) => {
        const token = jwt.sign(added.email, process.env.secret_key);

        res.status(200).json({
          authtoken: customToken,
          success: true,
          data: added,
          accessToken: token,
          newuser: true,
        });
      })
      .catch((error) => {
        res.status(400).json({ success: false });
      });
  }
};
exports.adminLoginWithSocial = async (req, res, next) => {
  const user = await userModel.find({ email: req.body.email });
  if (user.length > 0 && user[0].shopId != null) {
    console.log(user);
    if (req.body.type == "apple" || req.body.type == "google") {
      admin
        .auth()
        .createCustomToken(user[0]._id.toString())
        .then(async (customToken) => {
          const token = jwt.sign(user[0].email, process.env.secret_key);

          res.status(200).json({
            authtoken: customToken,
            success: true,
            data: user[0],
            accessToken: token,
          });
        })
        .catch((error) => {
          res.status(400).json(null);
        });
    } else {
      res
        .status(422)
        .setHeader("Content-Type", "application/json")
        .json({ success: false, info: { message: "email already exists" } });
    }
  } else {
    console.log("error");
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: false, info: { message: "you dont have a shop" } });
  }
};

exports.authenticate = (req, res, next) => {
  /* custom callback . gives us access to req res and next coz of js closure */
  passport.authenticate("login", (err, user, info) => {
    if (err || !user) {
      console.log("err", err);
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.json({ success: false, info });
    }
    req.login(user, { session: false }, (error) => {
      if (error) {
        console.log("error", error);
        return res
          .status(422)
          .setHeader("Content-Type", "application/json")
          .json(error.message);
      } else if (user && !error) {
        admin
          .auth()
          .createCustomToken(info._id.toString())
          .then((customToken) => {
            // Send token back to client
            const token = jwt.sign(info.email, process.env.secret_key);
            res.status(200).json({
              authtoken: customToken,
              success: true,
              data: info,
              accessToken: token,
            });
          })
          .catch((error) => {
            console.log("Error creating custom token:", error);
            res.status(400).json(null);
          });
      }
    });
  })(req, res, next);
};

exports.phoneLogin = (req, res, next) => {
  /* custom callback . gives us access to req res and next coz of js closure */
  try {
    messagebird.verify.create(req.body.phone, params, function (err, response) {
      if (err) {
        return console.log(err);
      }
      res.status(200).json({ status: 200, requestid: response.id });
    });
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.verifyCode = (req, res, next) => {
  try {
    if (!req.body.requestId || !req.body.code) {
      res.status(400).json({ status: 400, message: "Missing required params" });
    } else {
      let requestId = req.body.requestId;
      messagebird.verify.verify(
        requestId,
        req.body.code,
        async function (err, response) {
          if (err) {
            res.status(400).json({ status: 400, message: err });
          } else {
            if (response.status == "verified") {
              const user = await userModel.findOne({
                phonenumber: { $eq: req.body.phone },
              });
              if (!user) {
                res.status(400).json({ status: 400, user: null });
                return;
              }

              const token = jwt.sign(user.phonenumber, process.env.secret_key);
              res.status(200).json({ user, token });
            } else {
              res
                .status(400)
                .json({ status: 400, message: "something happened" });
            }
          }
        }
      );
    }
  } catch (error) {
    res.status(400).json({ status: 400, message: error });
  }
};

exports.logout = (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie("session-id");
    res.redirect("/auth/login");
  } else {
    err = new Error("You aren't logged in");
    err.status = 403;
    next(err);
  }
};
