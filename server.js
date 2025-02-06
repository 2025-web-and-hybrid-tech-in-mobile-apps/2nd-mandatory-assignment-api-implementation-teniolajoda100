const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const app = express();
const port = process.env.PORT || 3000;

dotenv.config();
app.use(express.json());

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

// secret key for JWT to login and verify tokens
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// in memory storage for users and scores 
let users = [];
let scores = [];

// middleware for JWT authentication, ensures only authenticated users can acces routes
function authenticateToken(req, res, next) {
    const token = req.header("Authorization");
    //ig no token reject request
    if (!token) return res.status(401).json({ message: "Access Denied" });

    try {
      //verify token validityy
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid Token" });
    }
}

// user registration, registering a new user
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    //check if username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }
    //check if the username is taken
    if (users.some(user => user.username === username)) {
        return res.status(400).json({ message: "User already exists" });
    }
    //add new user to the list
    users.push({ username, password });
    res.status(201).json({ message: "User registered successfully" });
});

// user Login, validates suername and password and returns a jwt token
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    //check if user exists and password matches
    const user = users.find(user => user.username === username && user.password === password);

    if (!user) {
        return res.status(400).json({ message: "Invalid username or password" });
    }
    //generate a jwt token expires in an hour
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
});

// get all high scores, authentication is required
app.get("/scores", authenticateToken, (req, res) => {
    res.json(scores);
});

// submit a new high score (auth required)
app.post("/scores", authenticateToken, (req, res) => {
    const { score } = req.body;

    //validate score input
    if (typeof score !== "number" || score < 0) {
        return res.status(400).json({ message: "Score must be a positive number" });
    }
    //create and store new score entry
    const newScore = { id: scores.length + 1, username: req.user.username, score };
    scores.push(newScore);
    res.status(201).json({ message: "Score added successfully", newScore });
});

// get a specific high score by ID
app.get("/scores/:id", (req, res) => {
    const score = scores.find(s => s.id === parseInt(req.params.id));
    if (!score) {
        return res.status(404).json({ message: "Score not found" });
    }
    res.json(score);
});

// delete a high score, only user who submitted it can delete
app.delete("/scores/:id", authenticateToken, (req, res) => {
    const scoreIndex = scores.findIndex(s => s.id === parseInt(req.params.id));
    if (scoreIndex === -1) {
        return res.status(404).json({ message: "Score not found" });
    }
    //ensuring user can only delete their own score
    if (scores[scoreIndex].username !== req.user.username) {
        return res.status(403).json({ message: "You can only delete your own scores" });
    }

    scores.splice(scoreIndex, 1);
    res.json({ message: "Score deleted successfully" });
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
    start: function () {
        serverInstance = app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    },
    close: function () {
        serverInstance.close();
    },
};
