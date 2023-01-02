const express = require("express");
const authRouter = express.Router();
const authController = require("../controllers/auth");

authRouter.post("/authenticate/social", authController.adminLoginWithSocial);
authRouter.post(
  "/authenticate/social/mobileapp",
  authController.mobileLoginRegisterWithSocial
); 

authRouter.get("/authenticate/usercheck", authController.checUserExistsByEmail);

module.exports = authRouter;
