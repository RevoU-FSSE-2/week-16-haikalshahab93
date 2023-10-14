const express = require('express');
const app = express();
const applyMiddleware = require('./middleware');
const User = require('./models/User');
const { attachPerm, detachPerm } = require('./models/permissions_utils');
const { PermissionMongo } = require('./models/UserMongo');
const postrouter = require('./route/post');
const controller = require('./controller/usercontroller');
const permissons = require('./permission');
const mongoose = require("mongoose");
const { loginLimiter, postLimiter } = require('./middleware/ratelimit')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URL).then(() => console.log("Successfully connect to MongoDB."))
    .catch(err => console.error("Connection error", err));

applyMiddleware(app);


app.get('/', (req, res) => {
    console.log(req.cookies, "COOKIES");
    console.log(req.user, "<============= USER");
    res.send('Hello, this is backend server!');
});

// register new user
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const user = await User.create({ username, email, password });
    const userPerm = await PermissionMongo.findOne({ name: "user" });
    await attachPerm(user, userPerm);
    const responseToken = User.generateToken(user);
    res.status(201).json(responseToken);
});

// regular login without session & cookie
app.post("/login", loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    const user = await User.get({ username });
    const is_authenticated = await User.authenticate(username, password);
    if (!user || !is_authenticated) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
    }
    const responseToken = User.generateToken(user);
    res.json(responseToken);
});

// login with session & cookie
app.post("/login_session", loginLimiter, controller.login_session);

// logout session & clearing cookie
app.post("/logout_session", controller.logout_session);

// add/update permission to user
app.post("/attachperm", async (req, res) => {
    const { username, permission } = req.body;
    const perm = await PermissionMongo.findOne({ name: permission });
    const user = await User.get({ username });
    await attachPerm(user, perm);
    res.json({ message: "success" });
});

// remove permission to user 
app.post("/detachperm", async (req, res) => {
    const { username, permission } = req.body;
    const perm = await PermissionMongo.findOne({ name: permission });
    const user = await User.get({ username });
    await detachPerm(user, perm);
    res.json({ message: "success" });
});

// get user info
app.get("/user", permissons.is_authenticated, async (req, res) => {
    const user = req.user;
    res.json(user);
});

// get protected member user info
app.get("/member", permissons.is_member, async (req, res) => {
    const user = req.user;
    res.json(user);
});

// get protected admin user info
app.get("/admin", permissons.is_superuser, async (req, res) => {
    const user = req.user;
    res.json(user);
});

// re-new login token session, without login manually
app.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    const user = await User.parseTokenSafe(refreshToken);
    if (!user) return res.status(401).json({ message: "Invalid token" });
    const responseToken = User.generateToken(user);
    res.json(responseToken);
});

// asking a key to requesting new reset password
app.post("/requestreset", controller.passwordResetRequest);

//  processing new reset password
app.post("/reset", controller.passwordReset);

// feature for create & get posting 
app.use("/posting", postLimiter, postrouter);

const server = app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});
module.exports = server;