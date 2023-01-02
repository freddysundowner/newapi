const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const clubSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  clubid: {
    type: String,

  },
  title: {
    type: String,
    unique: [true, "A club with the same name exists"],
  },
  description: {
    type: String,
    default: "",
  },
  imageurl: {
    type: String,
    default: "",
  },
  iconurl: {
    type: String,
    default: "",
  },
  invited: {
    type: Array,
  },
  ownerid: {
	  type: Schema.Types.ObjectId,
	  required: false,
	  ref: "user",
	},
  allowfollowers: {
    type: Boolean,
    default: false,
  },
  allowmemberstohostrooms: {
    type: Boolean,
    default: false,
  },
  allowmembersviewwallet: {
    type: Boolean,
    default: false,
  },
  membercanstartrooms: {
    type: Boolean,
    default: false,
  },
  membersprivate: {
    type: Boolean,
    default: false,
  },
  publisheddate: {
    type: String,
  },
  gcbalance: {
    type: Number,
    default: 0.0,
  },
  topics: {
    type: Array,
  },
  members: [
	  {
	  type: Schema.Types.ObjectId,
	  ref: "user",
	}
  ],
  followers: [
	  {
	  type: Schema.Types.ObjectId,
	  ref: "user",
	}
  ],
  rooms: [
	  {
	  type: Schema.Types.ObjectId,
	  ref: "rooms",
	}
  ]
});

module.exports = mongoose.model("clubs", clubSchema);
