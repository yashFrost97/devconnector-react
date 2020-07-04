const express = require("express");

const router = express.Router();
const User = require("../../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const config = require("config");
const {
	check,
	validationResult
} = require("express-validator");

// @route post api/users
// register user, public
router.post("/",
	[
		check('name', "Name is required!").not().isEmpty(),
		check("email", "Email invalid").isEmail(),
		check("password", "Password should be 6 or more chars").isLength({
			min: 6
		})
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				errors: errors.array()
			});
		}
		const {
			name,
			email,
			password
		} = req.body;

		try {
			// see if user exists
			let user = await User.findOne({
				email
			});
			if (user) {
				return res.status(400).json({
					errors: [{
						msg: "User exists!"
					}]
				});
			}
			// get users gravatar
			const avatar = gravatar.url(email, {
				s: '200',
				r: 'pg',
				d: 'mm'
			});
			user = new User({
				name,
				email,
				avatar,
				password
			});
			// encrypt passowrd using bcrypt
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(password, salt);
			await user.save();
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