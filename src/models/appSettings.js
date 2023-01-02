const mongoose = require("mongoose");

const AppSettingsSchema = mongoose.Schema({
  agoraAppID: {
    type: String,
    default: "",
  },
  agoraAppRecordKey: {
    type: String,
  },
  commission: {
    type: String,
    default: "",
  },
  currency: {
    type: String,
    default: "",
  },
  appVersion: {
    type: Number,
    default: 0,
  },
  fbStreamKey: {
    type: String,
    default: "",
  },
  fwPublicKey: {
    type: String,
    default: "",
  },
  oneSignalAppID: {
    type: String,
    default: "",
  },
  appVersion: {
    type: String,
    default: "",
  },
  androidVersion: {
    type: String,
    default: "",
  },
  iosVersion: {
    type: String,
    default: "",
  },
  AGORA_CERT: {
    type: String,
    default: "186d397ac7c44275badc356200fd86c1",
  },
  AGORA_CUSTOMER_KEY: {
    type: String,
    default: "4714495b140b408baf6a22a8beb6df8d",
  },
  AGORA_CUSTOMER_SECRET: {
    type: String,
    default: "f0703a9c08694f738c32bb8e8115e0d2",
  },
  FLUTTERWAVE_SECRET_KEY: {
    type: String,
    default: "FLWSECK_TEST-38bf7033601e837c27471b469ab86404-X",
  },
  AWSVENDOR: {
    type: Number,
    default: 1,
  },
  AWSREGION: {
    type: Number,
    default: 3,
  },
  AWSBUCKET: {
    type: String,
    default: "gistshopaudios",
  },
  AWSACCESSKEY: {
    type: String,
    default: "AKIAWZXHGM4OSTZXTKXF",
  },
  AWSSECRETKEY: {
    type: String,
    default: "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",
  },
  OneSignalApiKey: {
    type: String,
    default: "MTAzNTgwMWUtNzQ2Ny00M2I4LTk1Y2UtNmFiNDQ2MjNjZGYw",
  },
  oneSignalKey: {
    type: String,
    default: "",
  },
  recordedVideoBaseUrl: {
    type: String,
    default: "",
  },
  stripeSecretKey: {
    type: String,
    default: "",
  },
  stripepublickey: {
    type: String,
    default: "",
  },
  youTubeStreamKey: {
    type: String,
    default: "",
  },
  apiBaseUrl: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("appsettings", AppSettingsSchema);
