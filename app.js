const express = require("express");
const path = require("path");
require("./src/services/authenticate");
const connect = require("./src/services/dbConnect");
const http = require("http");
const nodeCron = require("node-cron");
const roomsModel = require("./src/models/roomSchema");
const clubModel = require("./src/models/clubModel");
const adminModel = require("./src/models/adminSchema");
require("./src/models/bid");
const moment = require("moment");

const admin = require("firebase-admin");
/*****************
 *SERVER INITILIZATIONS
 *****************/
const app = express();

/*****************
 *VIEW ENGINE CONFIG
 *****************/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

/*****************
 *MIDDLEWARE
 *****************/
app.use(require("./src/services/middleware"));
app.use(require("./src/routes/ROUTE_MOUNTER"));
app.use("/public/img", express.static(path.join(__dirname, "public/img")));

/*****************
 *SERVER INSTANTIATION
 *****************/
var server = http.createServer(app);

server.listen(process.env.PORT, function () {
  _createSuperAdmin();
  console.log("Tokshop server listening on port " + process.env.PORT);
});

_createSuperAdmin = async () => {
  let newUser = new adminModel();

  newUser.email = "admin@gmail.com";
  newUser.role = "admin";
  newUser.setPassword("123456");
  const admin = await adminModel.find();
  if (admin.length == 0) {
    newUser.save((err) => {
      if (err) {
        console.log({
          success: false,
          message: "Failed to add user. " + err,
        });
      } else {
        console.log({
          success: true,
          message: "super admin created successfully",
        });
      }
    });
  }
};

connect();
const io = require("socket.io")(server);

io.on("connection", (socket) => {
  socket.on("room_changes", (data) => {
    if (data.roomId != null) {
      io.emit(data.roomId, JSON.stringify(data));
    }
  });
});

// Use body-parser to retrieve the raw body as a buffer
const bodyParser = require("body-parser");

//Sheduled job to run every minute to delete dead rooms
nodeCron.schedule("*/60 * * * * *", async () => {
  try {
    var twentyMinsAgo = new Date(Date.now() - 20000 * 60);
    console.log(twentyMinsAgo);

    var room = await roomsModel.find({
      $and: [
        { activeTime: { $lt: twentyMinsAgo } },
        { event: false },
        { ended: false },
      ],
    });
    
//     console.log(room[0]._id);

    await roomsModel.updateMany(
      {
        $and: [
          { activeTime: { $lt: twentyMinsAgo } },
          { event: false },
          { ended: false },
        ],
      },
      {
        $set: {
          ended: true,
          endedTime: Date.now(),
          productImages: [],
        },
      }
    );

    for (var i = 0; i < room.length; i++) {
      if (room[i]["channel"] != null) {
        await clubModel.findByIdAndUpdate(room[i]["channel"], {
          $pullAll: { rooms: [room[i]["_id"]] },
        });
      }
    }
  } catch (error) {
    console.log(error + " u");
  }
});

module.exports = app;
