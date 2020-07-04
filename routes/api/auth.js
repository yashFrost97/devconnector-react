const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("config");
const {
	check,
	validationResult
} = require("express-validator");

const auth = require("../../middleware/auth");
const User = require("../../models/User");


// @route get api/users
// test, public
router.get("/", auth, async (req, res) => {
	try {
		// console.log(req.user);
		const user = await User.findById(req.user.id).select("-password");
		res.json(user);
	} catch (error) {
		res.status(500).send("server error!");
	}
});

// @route post api/auth
// auth user and get token, public
router.post("/",
	[
		check("email", "Email invalid").isEmail(),
		check("password", "Password required").exists()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				errors: errors.array()
			});
		}
		const {
			email,
			password
		} = req.body;

		try {
			// see if user exists
			let user = await User.findOne({
				email
			});
			if (!user) {
				return res.status(400).json({
					errors: [{
						msg: "Invalid Credentials!"
					}]
				});
			}

			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res.status(400).json({
					errors: [{
						msg: "Invalid Credentials!"
					}]
				});

			}
			// return JWT
			const payload = {
				user: {
					id: user.id
				}
			}

			jwt.sign(payload,
				config.get("jwtSecret"), {
					expiresIn: 360000,
				},
				(err, token) => {
					if (err) {
						throw err
					}
					res.json({
						token
					});
				});
		} catch (error) {
			console.log(err.message);
			res.status(500).send("Server Error!");
		}

	});

module.exports = router;