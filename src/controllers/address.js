const addressModel = require("../models/addressSchema");
const userModel = require("../models/userSchema");

exports.addAddress = async (req, res) => {
  try {
    let address = await addressModel.find({ userId: req.body.userId });
    if (address.length > 0) {
      let updatedAddress = await addressModel
        .findByIdAndUpdate(
          address[0]["_id"],
          { $set: req.body },
          { runValidators: true, new: true }
        )
        .populate("userId", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
        ]);
      await userModel.findByIdAndUpdate(
        req.body.userId,
        { $set: { address: address[0]["_id"] } },
        { runValidators: true, new: true }
      );
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json({ success: true, data: updatedAddress });
    } else {
      let newAddress = await addressModel.create(req.body);
      let response = await addressModel
        .findById(newAddress._id)
        .populate("userId", [
          "firstName",
          "lastName",
          "bio",
          "userName",
          "email",
        ]);
      await userModel.findByIdAndUpdate(
        req.body.userId,
        { $set: { address: newAddress._id } },
        { runValidators: true, new: true }
      );
      res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json({ success: true, data: response });
    }
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.getAddressByUserId = async (req, res) => {
  try {
    let Addresses = await addressModel
      .find({ userId: req.params.userId })
      .populate("userId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ]);
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json(Addresses);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.updateAddressById = async (req, res) => {
  console.log(req.params);
  try {
    let updatedAddress = await addressModel.findByIdAndUpdate(
      req.params.addressId,
      { $set: req.body },
      { runValidators: true, new: true }
    );
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ success: true, data: updatedAddress });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json({ success: false, message: error.message });
  }
};

exports.getAddressById = async (req, res) => {
  try {
    let Address = await addressModel
      .findById(req.params.addressId)
      .populate("userId", [
        "firstName",
        "lastName",
        "bio",
        "userName",
        "email",
      ]);
    res.status(200).setHeader("Content-Type", "application/json").json(Address);
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json(error.message);
  }
};

exports.deleteAddressById = async (req, res) => {
  try {
    let deleted = await addressModel.findByIdAndDelete(req.params.addressId);
    res.status(200).json({ success: true });
  } catch (error) {
    res
      .status(422)
      .setHeader("Content-Type", "application/json")
      .json({ success: false });
  }
};
