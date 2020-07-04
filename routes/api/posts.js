const express = require("express");

const router = express.Router();
const {
	check,
	validationResult
} = require("express-validator");

const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");


// @route post api/posts
// create a post, private
router.post("/", [
	auth, [
		check("text", "Text is required").not().isEmpty()
	]
], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			errors: errors.array()
		});
	}

	try {
		const user = await User.findById(req.user.id).select("-password");
		// can add title here
		const newPost = new Post({
			text: req.body.text,
			name: user.name,
			avatar: user.avatar,
			user: req.user.id

		});

		const post = await newPost.save();
		res.json(post);
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server Error!");
	}

});

// @route get api/posts
// get all posts, private
router.get("/", auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({
			date: -1
		});

		res.json(posts);
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server Error!");
	}
});

// @route get api/posts/:post_id
// get post by id, private
router.get("/:post_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);
		if (!post) {
			return res.status(404).json({
				msg: "Post not found!"
			});
		}
		res.json(post);
	} catch (error) {
		console.log(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({
				msg: "Post not found!"
			});
		}

		res.status(500).send("Server Error!");
	}
});

// @route DELETE api/posts/:post_id
// delete post, private
router.delete("/:post_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id).sort({
			date: -1
		});

		if (!post) {
			return res.status(404).json({
				msg: "Post not found!"
			});
		}
		// check user to see if he/she owns the post
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({
				msg: "You're not authorized to delete this post!"
			});
		}
		await post.remove();

		res.json({
			msg: "Post Deleted!"
		});
	} catch (error) {
		console.log(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({
				msg: "Post not found!"
			});

			res.status(500).send("Server Error!");
		}
	}
});

// @route PUT api/posts/like/:post_id
// like a post, private
router.put("/like/:post_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		// check if user has liked the post
		if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
			return res.status(400).json({
				msg: "Post already liked!"
			});
		}

		post.likes.unshift({
			user: req.user.id
		});

		await post.save();

		res.json(post.likes);
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server error!");
	}
});


// @route PUT api/posts/unlike/:post_id
// unlike a post, private
router.put("/unlike/:post_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		// check if user has liked the post
		if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
			return res.status(400).json({
				msg: "Post has not yet been liked"
			});
		}

		// get remove index
		const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
		post.likes.splice(removeIndex, 1);

		await post.save();

		res.json(post.likes);
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server error!");
	}
});

// @route post api/posts/comment/:id
// comment on a post, private
router.post("/comment/:id", [
	auth, [
		check("text", "Text is required").not().isEmpty()
	]
], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			errors: errors.array()
		});
	}

	try {
		const user = await User.findById(req.user.id).select("-password");
		const post = await Post.findById(req.params.id);

		// can add title here
		const newComment = {
			text: req.body.text,
			name: user.name,
			avatar: user.avatar,
			user: req.user.id

		};
		post.comments.unshift(newComment);

		await post.save();
		res.json(post.comments);
	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server Error!");
	}

});

// @route DELETE api/posts/comment/:post_id/:comment_id
// delete a comment on a post, private
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.post_id);

		// pull out comments
		const comment = post.comments.find(comment => comment.id === req.params.comment_id);

		// make sure comment exists
		if (!comment) {
			return res.status(404).json({
				msg: "Comment doesn't exist!"
			});
		}
		// checl user if he/she owns the comment
		if (comment.user.toString() !== req.user.id) {
			return res.status(401).json({
				msg: "user not authorized"
			});

		}
		// get remove index
		const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
		post.comments.splice(removeIndex, 1);

		await post.save();

		res.json(post.comments);

	} catch (error) {
		console.log(error.message);
		res.status(500).send("Server Error!");
	}
});

module.exports = router;