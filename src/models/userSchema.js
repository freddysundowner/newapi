const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const bcrypt = require("bcrypt");
const decode = require("../shared/base64");

const value = {
  type: String,
  required: [true, "This field is required"],
};

const userSchema = new Schema(
  {
    firstName: value,
    lastName: { type: String, default: "" },
    mpesaNumber: { type: String, default: "" },
    payment_method: { type: String, default: "" }, // to be removed after auction update
    defaultpaymentmethod:  
      {
        type: Schema.Types.ObjectId,
        ref: "paymentMethod",
        default: null
      },
    payoutmethod:  
      {
        type: Schema.Types.ObjectId,
        ref: "payoutMethod",
        default: null
      },
    bio: { type: String, default: "" },
    logintype: { type: String, default: "" },
    userName: {
      type: String,
       default: "" 
    },
    phonenumber: { type: String },
    profilePhoto: { type: String, default: "" },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: "Email address is required",
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    tokshows: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
    },
    stripeToken: {
	  type: String,  
      default: "",
    },
    followersCount: {
      type: Number,
    },
    followingCount: {
      type: Number,
    },
    interests: [
      {
        type: String,
      },
    ],
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    address: 
      {
        type: Schema.Types.ObjectId,
        ref: "address",
        default: null,
      },
    joinedclubs: [
      {
        type: Schema.Types.ObjectId,
        ref: "clubs",
      },
    ],
    appVersion: {
      type: String,
      default: "",
    },
    
    memberShip: {
      type: Number,
      default: 0,
    },
    upgradedDate: {
      type: Number,
    },
    wallet: {
      type: Number,
      min: 0,
      default: 0,
    },
    pendingWallet: {
      type: Number,
      min: 0,
      default: 0,
    },
    currentRoom: {
      type: String,
      default: "",
    },
    facebook: {
      type: String,
      default: "",
    },
    instagram: {
      type: String,
      default: "",
    },
    linkedIn: {
      type: String,
      default: "",
    },
    twitter: {
      type: String,
      default: "",
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "shop",
      default: null,
    },
    roomuid: {
      type: String,
      default: "",
    },
    agorauid: {
      type: Number,
      default: 0,
    },
    notificationToken: {
      type: String,
      default: "",
    },
    renewUpgrade: {
      type: Boolean,
      default: true,
    },
    muted: {
      type: Boolean,
      default: true,
    },
    stripeAccountId: {
      type: String,
      default: "",
    },
    stripeBankAccount: {
      type: String,
      default: "",
    },
    accountDisabled: {
      type: Boolean,
      default: false,
    },
    fw_subacoount: {
      type: String,
      default: "",
    },
    fw_id: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    autoCreate: true, // auto create collection
    autoIndex: true, // auto create indexes
  }
);

userSchema.pre("save", async function (next) {
  const user = this;

/*
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
*/
  user.agorauid = getUniqueIntFromObjectId(user._id);
  next();
});

var getUniqueIntFromObjectId = function (object_id) {
  var res = null;
  object_id = object_id.toString();
  var firstObjectId = "62a0a3d18a30696aa0910ce1";
  var delta =
    parseInt(object_id.substring(0, 8), 16) -
    parseInt(firstObjectId.substring(0, 8), 16);
  res = delta.toString() + parseInt(object_id.substring(18, 24), 16).toString();
  return Math.floor(100000 + Math.random() * 900000);
};

userSchema.methods.isValidPassword = async function (password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);
  return compare;
};

const users = model("user", userSchema);
module.exports = users;
