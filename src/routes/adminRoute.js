const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");

router.get("/", adminController.getAllAdmins);

router.get("/superAdmin", adminController.getSuperAdmin);

router.get("/id/:id", adminController.getAdminById);

router.post("/", adminController.saveAdmin);

router.post("/login", adminController.logInAdmin);

router.patch("/:id", adminController.updateAdmin);

router.delete("/:id", adminController.deleteAdmin);

router.post("/app/settings", adminController.saveAppSettings);
router.get("/app/settings", adminController.getAppSettings);

module.exports = router;
