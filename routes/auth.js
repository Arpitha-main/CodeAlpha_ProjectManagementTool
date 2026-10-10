const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();
const db = require("../database/database");

// ==============================
// REGISTER
// ==============================

router.post("/register", async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Please fill in all fields."
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters."
        });
    }

    try {

        db.get(
            "SELECT id FROM users WHERE email = ?",
            [email],
            async (err, existingUser) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Database error."
                    });
                }

                if (existingUser) {
                    return res.status(400).json({
                        message: "Email is already registered."
                    });
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                db.run(
                    `INSERT INTO users (name, email, password)
                     VALUES (?, ?, ?)`,
                    [name, email, hashedPassword],
                    function (err) {

                        if (err) {
                            console.error(err);
                            return res.status(500).json({
                                message: "Could not create account."
                            });
                        }

                        res.json({
                            message: "Registration successful!"
                        });
                    }
                );
            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error."
        });
    }
});


// ==============================
// LOGIN
// ==============================

router.post("/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please enter email and password."
        });
    }

    db.get(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, user) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Database error."
                });
            }

            if (!user) {
                return res.status(401).json({
                    message: "Invalid email or password."
                });
            }

            try {

                const passwordCorrect = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!passwordCorrect) {
                    return res.status(401).json({
                        message: "Invalid email or password."
                    });
                }

                // CREATE SESSION
                req.session.userId = user.id;
                req.session.userName = user.name;
                req.session.userEmail = user.email;

                res.json({
                    message: "Login successful!",
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                });

            } catch (error) {

                console.error(error);

                res.status(500).json({
                    message: "Login failed."
                });
            }
        }
    );
});


// ==============================
// LOGOUT
// ==============================

router.post("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            return res.status(500).json({
                message: "Logout failed."
            });
        }

        res.json({
            message: "Logout successful."
        });
    });
});


// ==============================
// CURRENT USER
// ==============================

router.get("/me", (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            message: "Not logged in."
        });
    }

    res.json({
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail
    });
});


module.exports = router;