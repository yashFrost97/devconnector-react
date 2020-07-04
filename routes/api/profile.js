const express = require("express");
const request = require("request");
const config = require("config");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

const {
	check,
	validationResult
} = require("express-validator");

// @route get api/profile/me
// get current users profile, private that's why middleware auth
router.get("/me", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.user.id
		}).populate("user", ['name', 'avatar']);

		if (!profile) {
			return res.status(400).json({
				msg: "There is no profile for this user"
			});

		}
		res.json(profile);
	} catch (error) {
		console.log(error.message);
		res.status(500).send("server error!");
	}
});


// @route post api/profile
// create or update user profile, private that's why middleware auth
router.post("/", [auth, [
	check("status", "Status is required").not().isEmpty(),
	check("skills", "Skills is required").not().isEmpty()
]], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			errors: errors.array()
		});
	}
	const {
		company,
		website,
		location,
		bio,
		status,
		githubusername,
		skills,
		youtube,
		facebook,
		twitter,
		instagram,
		linkedin
	} = req.body;
	// build profile object

	const profileFields = {};
	profileFields.user = req.user.id;
	if (company) profileFields.company = company;
	if (website) profileFields.website = website;
	if (location) profileFields.location = location;
	if (bio) profileFields.bio = bio;
	if (status) profileFields.status = status;
	if (githubusername) profileFields.githubusername = githubusername;

	if (skills) {
		profileFields.skills = skills.split(",").map(skill => skill.trim());
	}

	// build social object
	profileFields.social = {};
	if (youtube) profileFields.social.youtube = youtube;
	if (twitter) profileFields.social.twitter = twitter;
	if (facebook) profileFields.social.facebook = facebook;
	if (linkedin) profileFields.social.linkedin = linkedin;
	if (instagram) profileFields.social.instagram = instagram;

	try {
		let newProfile = await Profile.findOne({
			user: req.user.id
		});
		if (newProfile) {
			// update
			newProfile = await Profile.findOneAndUpdate({
				user: req.user.id
			}, {
				$set: profileFields
			}, {
				new: true
			});

			return res.json(newProfile);
		}

		// Create Profile
		newProfile = new Profile(profileFields);
		await newProfile.save();
		res.json(newProfile);

	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server erorr!");
	}
});

// @route post api/profile
// get all profiles, public 
router.get("/", async (req, res) => {
	try {
		const profiles = await Profile.find().populate("user", ['name', 'avatar']);
		res.json(profiles);
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server Error!");
	}
});

// @route post api/profile/user/:user_id
// get profile by user id, public 
router.get("/user/:user_id", async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id
		}).populate("user", ['name', 'avatar']);
		if (!profile) return res.status(400).json({
			msg: "Profile not found!"
		});

		res.json(profile);
	} catch (error) {
		console.log(error.message);
		if (error.kind == "ObjectId") {
			return res.status(400).json({
				msg: "Profile not found!"
			})
		}
		res.status(500).send("Server Error!");
	}
});

// @route DELETE api/profile
// Delete profiles users and posts, private 
router.delete("/", auth, async (req, res) => {
	try {
		// remove profile
		// todo remove posts associated with users
		await Profile.findOneAndRemove({
			user: req.user.id
		});
		await User.findOneAndRemove({
			_id: req.user.id
		});


		res.json({
			msg: "User deleted!"
		});
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server Error!");
	}
});

// @route PUT api/profile/experience
// Add profile experience, private
router.put("/experience", [auth, [
	check("title", "Title is required").not().isEmpty(),
	check("company", "Company is required").not().isEmpty(),
	check("from", "From date is required").not().isEmpty()
]], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			errors: errors.array()
		});
	}

	const {
		title,
		company,
		location,
		from,
		to,
		current,
		description
	} = req.body;
	//created object
	const newExp = {
		title,
		company,
		location,
		from,
		to,
		current,
		description
	}

	try {
		const profile = await Profile.findOne({
			user: req.user.id
		});
		profile.experience.unshift(newExp);
		await profile.save();

		res.json(profile);
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server Error!");
	}
});

// @route DELETE api/profile/experience/:exp_id
// Delete exp from profile, private 
router.delete("/experience/:exp_id", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.user.id
		});

		// get remove index
		const removeIndex = profile.experience
			.map(item => item.id)
			.indexOf(req.params.exp_id);

		profile.experience.splice(removeIndex, 1);

		await profile.save();

		res.json(profile);
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server Error!");
	}
});


// @route PUT api/profile/education
// Add profile Education, private
router.put("/education", [auth, [
	check("school", "School is required").not().isEmpty(),
	check("degree", "Degree is required").not().isEmpty(),
	check("from", "From date is required").not().isEmpty(),
	check("fieldofstudy", "Field of Study is required").not().isEmpty()
]], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			errors: errors.array()
		});
	}

	const {
		school,
		degree,
		fieldofstudy,
		from,
		to,
		current,
		description
	} = req.body;
	//created object
	const newEdu = {
		school,
		degree,
		fieldofstudy,
		from,
		to,
		current,
		description
	}

	try {
		const profile = await Profile.findOne({
			user: req.user.id
		});
		profile.education.unshift(newEdu);
		await profile.save();

		res.json(profile);
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server Error!");
	}
});

// @route DELETE api/profile/education/:edu_id
// Delete edu from profile, private 
router.delete("/education/:edu_id", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.user.id
		});

		// get remove index
		const removeIndex = profile.education
			.map(item => item.id)
			.indexOf(req.params.edu_id);

		profile.education.splice(removeIndex, 1);

		await profile.save();

		res.json(profile);
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server Error!");
	}
});

// @route GET api/profile/github/:username
// get users repo from github, public
router.get("/github/:username", (req, res) => {
	try {
		const options = {
			uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get("githubClientId")}&client_secret=${config.get("githubSecret")}`,
			method: "GET",
			headers: {
				"user-agent": "node.js"
			}
		}

		request(options, (err, response, body) => {
			if (err) console.log(error);
			if (response.statusCode !== 200) {
				return res.status(404).json({
					msg: "No Github Profile found"
				});
			}

			res.json(JSON.parse(body));
		});
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server Error!");
	}
});


module.exports = router;