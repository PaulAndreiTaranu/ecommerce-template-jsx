const User = require("../models/user");
const express = require("express");
const { check, body } = require("express-validator");
const router = express.Router();
const authController = require("../controllers/auth");

router.get("/login", authController.getLogin);
router.post(
    "/login",
    [
        check("email").isEmail().withMessage("Please enter a valid email.").normalizeEmail(),
        body("password", "Pleaser enter a password at least 5 characters long.")
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
    ],
    authController.postLogin
);

router.get("/signup", authController.getSignup);
router.post(
    "/signup",
    [
        check("email")
            .isEmail()
            .withMessage("Please enter a valid email.")
            .custom((value, { req }) => {
                // if (value === "test@test.com") {
                //     throw new Error("This email address is forbidden.");
                // }
                // return true;
                return User.findOne({ email: value }).then((userDoc) => {
                    if (userDoc) {
                        return Promise.reject("Email already exists, please pick a different one.");
                    }
                });
            })
            .normalizeEmail(),
        body("password", "Pleaser enter a password at least 5 characters long.")
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        body("confirmPassword")
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error("Passwords have to match!");
                }
                return true;
            })
            .trim(),
    ],
    authController.postSignup
);

router.get("/reset", authController.getReset);
router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);
router.post("/new-password", authController.postNewPassword);

router.post("/logout", authController.postLogout);

module.exports = router;
