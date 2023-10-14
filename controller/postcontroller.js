const { Post } = require("../models/PostMongo");
const { ObjectId } = require("mongodb")

exports.createPost = async (req, res) => {
    const { title, content } = req.body;
    const post = await Post.create({ title, content });
    post.author = req.user;
    await post.save();
    res.status(201).json(post);
}

exports.getPosts = async (req, res) => {
    let query = { author: req.user };
    if (req.user.is_superuser()) {
        query = {};
    }
    const posts = await Post.find(query).populate("author");
    res.status(200).json(posts);
}

exports.updatePost = async (req, res) => {
    const { title, content } = req.body;
    const { id } = req.params;
    let query = { author: req.user };
    const filter = await Post.findOne({ _id: new ObjectId(id) }).populate("author");

    if (filter) {
        const update = await Post.updateOne({ title, content });
        res.status(201).json(update);
    } else {
        res.status(401).json({ error: "Error occured during update process" });
        return;
    }
}

exports.deletePost = async (req, res) => {
    const { id } = req.params;
    let query = { author: req.user };
    const remove = await Post.deleteOne({ _id: new ObjectId(id) });
    res.status(201).json(remove);

    if (filter) {
        const remove = await Post.deleteOne({ _id: new ObjectId(id) });
    } else {
        res.status(401).json({ error: "Error occured during delete process" });
        return;
    }
}