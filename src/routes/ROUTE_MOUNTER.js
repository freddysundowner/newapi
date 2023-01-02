const express = require("express");
const authRouter = require("./authRoutes");
const userRouter = require("./userRoutes");
const orderRouter = require("./orderRoutes");
const shopRouter = require("./shopRoutes");
const productRouter = require("./productRoutes");
const billingRouter = require("./billing");
const addressRouter = require("./address");
const roomRouter = require("./roomRoutes");
const transRouter = require("./transactions");
const activityRouter = require("./activitiesRoute");
const notificationsRouter = require("./notificationRoutes");
const favoriteRouter = require("./favoriteRouter");
const adminRouter = require("./adminRoute");
const recordingRouter = require("./recordingRoute");
const clubRouter = require("./clubRoute");
const categoryRouter = require("./categoriesRoute");
const flutterWaveRouter = require("./flutterwave");
const importRouter = require("./import");
const auctionRouter = require("./auction");

const passport = require("passport");

require("../services/authenticate");
module.exports = app = express();

app.use("/", authRouter);
app.use("/users", userRouter);
app.use(
  "/orders",
  passport.authenticate("jwt", { session: false }),
  orderRouter
);
app.use("/shop", shopRouter);
app.use("/import", importRouter);
app.use("/events", roomRouter);
app.use("/products", productRouter);
app.use("/category", categoryRouter);
app.use("/flutterwave", flutterWaveRouter);
app.use("/favorite", favoriteRouter);
app.use("/auction", auctionRouter);
app.use(
  "/address",
  passport.authenticate("jwt", { session: false }),
  addressRouter
);
app.use(
  "/billing",
  passport.authenticate("jwt", { session: false }),
  billingRouter
);
app.use("/rooms", roomRouter);
// app.use("/rooms", passport.authenticate("jwt", { session: false }), roomRouter);
app.use(
  "/transactions",
  passport.authenticate("jwt", { session: false }),
  transRouter
);
app.use("/activities", activityRouter);
app.use(
  "/notifications",
  passport.authenticate("jwt", { session: false }),
  notificationsRouter
);
app.use("/admin", adminRouter);
app.use(
  "/recording",
  passport.authenticate("jwt", { session: false }),
  recordingRouter
);
app.use("/club", passport.authenticate("jwt", { session: false }), clubRouter);
