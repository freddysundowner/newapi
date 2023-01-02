const adminModel = require("../models/adminSchema");
const jwt = require("jsonwebtoken");
const AppSettingsSchema = require("../models/appSettings");
exports.getAppSettings = async function (req, res) {
  try {
    const settings = await AppSettingsSchema.find();

    if (settings != null) {
      res.json(settings);
    } else {
      res.json(settings);
    }
  } catch (error) {
    res.status(404).send({ success: false, message: error });
  }
};

exports.saveAppSettings = async function (req, res) {
  const settings = await AppSettingsSchema.find();
  if (settings.length > 0) {
    await AppSettingsSchema.findByIdAndUpdate(
      { _id: settings[0]._id },
      { $set: req.body },
      { runValidators: true }
    );
  } else {
    let settingsdata = new AppSettingsSchema(req.body);
    settingsdata.save((err, setting) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: "Failed to add user. " + err,
        });
      } else {
        res.status(200).json(setting);
      }
    });
  }
};
exports.getAllAdmins = async function (req, res) {
  try {
    const admins = await adminModel.find();
    res.json({ success: true, admin: admins });
  } catch (error) {
    res.status(404).send({ success: false, message: error });
  }
};

exports.getSuperAdmin = async function (req, res) {
  try {
    const admin = await adminModel.findOne({ role: "admin" });
    res.json({ success: true, admin: admin });
  } catch (error) {
    res.status(404).send({ success: false, message: error });
  }
};

exports.getAdminById = async function (req, res) {
  try {
    const admin = await adminModel.findById(req.params.id);

    if (admin != null) {
      res.json({ success: false, admin: admin });
    } else {
      res.json({ success: true, admin: admin });
    }
  } catch (error) {
    res.status(404).send({ success: false, message: error });
  }
};

exports.saveAdmin = async function (req, res) {
  let newUser = new adminModel();

  newUser.email = req.body.email;
  newUser.role = req.body.role;
  newUser.setPassword(req.body.password);

  const admin = await adminModel.findOne({ email: req.body.email });
  if (admin) {
    res.json({
      success: false,
      message: "user with " + req.body.email + " exists",
    });
  } else {
    // Save newUser object to database
    newUser.save((err, User) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: "Failed to add user. " + err,
        });
      } else {
        const { _id, email, role } = User;
        const token = jwt.sign(newUser.email, process.env.secret_key);
        res.status(200).json({
          success: true,
          user: { _id, email, role },
          accesstoken: token,
        });
      }
    });
  }
};

exports.logInAdmin = async function (req, res) {
  try {
    adminModel.findOne({ email: req.body.email }, function (err, user) {
      if (user === null) {
        return res.status(400).send({
          message: "User not found.",
          success: false,
        });
      } else {
        if (user.validPassword(req.body.password)) {
          const { _id, email, role } = user;
          const token = jwt.sign(email, process.env.secret_key);
          return res.status(200).json({
            success: true,
            user: { _id, email, role },
            accesstoken: token,
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Wrong Password",
          });
        }
      }
    });
  } catch (error) {
    res.status(500).send({ success: false, message: error + "a" });
  }
};

exports.updateAdmin = async function (req, res) {
  try {
    let newUser = new adminModel();
    if (req.body.password !== ("" || undefined)) {
      newUser.setPassword(req.body.password);
    }
    req.body.password = newUser.password;
    await adminModel.updateOne({ _id: req.params.id }, { $set: req.body });
    res.json({ success: true, message: "Successfully updated" });
  } catch (error) {
    res.status(404).send({ success: false, message: error });
  }
};

exports.deleteAdmin = async function (req, res) {
  try {
    await adminModel.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: "Successfully deleted" });
  } catch (error) {
    res.status(404).send({ success: false, message: error });
  }
};
