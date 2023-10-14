const postController = require("../controller/postcontroller");
const permission = require("../permission");
const { Router } = require("express");
const router = Router();

router.post("", permission.is_authenticated, postController.createPost);
router.get("", permission.is_authenticated, postController.getPosts);
router.put("/:id", permission.is_authenticated, postController.updatePost);
router.delete("/:id", permission.is_authenticated, postController.deletePost);

module.exports = router;