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

// jwt authentication ensures only authenticated users can access routes
function authenticateToken(req, res, next) {
    const authHeader = req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
    if (!token) return res.status(401).json({ message: "Access Denied" });

    try {
        // verify token validity
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid Token" });
    }
}

// user registration, registering a new user


app.post("/signup", (req, res) => {
  const { userHandle, password } = req.body;

  console.log("Current users:", users); // Log the current state of the users array

  // Check if userHandle and password are provided
  if (!userHandle || !password) {
    return res.status(400).json({ message: "userHandle and password are required" });
  }

  // Check if userHandle is at least 6 characters long
  if (userHandle.length < 6) {
    return res.status(400).json({ message: "userHandle must be at least 6 characters long" });
  }

  // Check if password is at least 6 characters long
  if (password.length < 6) {
    return res.status(400).json({ message: "password must be at least 6 characters long" });
  }

  // Check if the userHandle is already taken
  const userExists = users.some(user => user.userHandle === userHandle);
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Add the new user to the users array
  users.push({ userHandle, password });
  console.log("User registered successfully:", { userHandle, password }); // Log success
  res.status(201).json({ message: "User registered successfully" });
});
//new


// user Login
app.post("/login", (req, res) => {
    const { userHandle, password, ...extraFields } = req.body;

    // Check for missing fields
    if (!userHandle || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Check for unexpected fields
    if (Object.keys(extraFields).length > 0) {
        return res.status(400).json({ message: "Unexpected fields in request" });
    }

    // Check if user exists and password matches
    const user = users.find(user => user.userHandle === userHandle && user.password === password);

    if (!user) {
        return res.status(401).json({ message: "Invalid userHandle or password" });
    }

    // Generate a JWT token that expires in an hour
    const token = jwt.sign({ userHandle }, JWT_SECRET, { expiresIn: "1h" });

    // Return 200 on success with token
    return res.status(200).json({ jsonWebToken: token });
});


// submit a new high score (auth required)
app.post("/high-scores", authenticateToken, (req, res) => {
    const { level, userHandle, score, timestamp } = req.body;

    // validate required fields
    if (!level || !userHandle || !score || !timestamp) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    // validate score is a positive number
    if (typeof score !== "number" || score < 0) {
        return res.status(400).json({ message: "Score must be a positive number" });
    }
    // create and store new score entry
    const newScore = { level, userHandle, score, timestamp };
    scores.push(newScore);
    res.status(201).json({ message: "High score posted successfully", newScore });
});

// get high scores with pagination and filtering by level
app.get("/high-scores", (req, res) => {
    const { level, page = 1 } = req.query;
    const pageSize = 20; // Number of scores per page

    // filter scores by level if provided
    let filteredScores = level ? scores.filter(score => score.level === level) : scores;

    // sort scores from highest to lowest
    filteredScores.sort((a, b) => b.score - a.score);

    // paginate results
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedScores = filteredScores.slice(startIndex, endIndex);

    res.status(200).json(paginatedScores);
});

// ------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

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
      users,
};