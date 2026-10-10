const express = require("express");
const session = require("express-session");
const path = require("path");

const db = require("./database/database");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = 3000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =====================================================
// SESSION
// =====================================================

app.use(
    session({
        secret: "taskflow-secret-key",
        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);


// =====================================================
// STATIC FILES
// =====================================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// =====================================================
// AUTH ROUTES
// =====================================================

app.use(
    "/api/auth",
    authRoutes
);


// =====================================================
// LOGIN PROTECTION
// =====================================================

function requireLogin(req, res, next) {

    if (!req.session.userId) {

        return res.status(401).json({
            message: "You must be logged in."
        });

    }

    next();
}


// =====================================================
// COMMENTS TABLE
// =====================================================

db.run(
    `
    CREATE TABLE IF NOT EXISTS comments (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        task_id INTEGER NOT NULL,

        user_id INTEGER NOT NULL,

        content TEXT NOT NULL,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    )
    `,
    function (err) {

        if (err) {

            console.error(
                "Comments table error:",
                err
            );

        } else {

            console.log(
                "Comments table ready."
            );

        }

    }
);


// =====================================================
// HOME
// =====================================================

app.get("/", function (req, res) {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// =====================================================
// GET PROJECTS
// =====================================================

app.get(
    "/api/projects",
    requireLogin,
    function (req, res) {

        db.all(
            `
            SELECT
                projects.id,
                projects.name,
                projects.description,
                projects.created_by,
                users.name AS creator

            FROM projects

            JOIN users
                ON projects.created_by = users.id

            WHERE projects.created_by = ?

            ORDER BY projects.id DESC
            `,
            [req.session.userId],
            function (err, projects) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Could not load projects."
                    });

                }

                res.json(projects);

            }
        );

    }
);


// =====================================================
// CREATE PROJECT
// =====================================================

app.post(
    "/api/projects",
    requireLogin,
    function (req, res) {

        const name =
            (req.body.name || "").trim();

        const description =
            (req.body.description || "").trim();


        if (!name) {

            return res.status(400).json({
                message:
                    "Project name is required."
            });

        }


        db.run(
            `
            INSERT INTO projects
            (
                name,
                description,
                created_by
            )

            VALUES (?, ?, ?)
            `,
            [
                name,
                description,
                req.session.userId
            ],
            function (err) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Could not create project."
                    });

                }


                res.json({

                    message:
                        "Project created successfully!",

                    id:
                        this.lastID

                });

            }
        );

    }
);


// =====================================================
// DELETE PROJECT
// =====================================================

app.delete(
    "/api/projects/:id",
    requireLogin,
    function (req, res) {

        const projectId =
            req.params.id;


        db.get(
            `
            SELECT id

            FROM projects

            WHERE id = ?

            AND created_by = ?
            `,
            [
                projectId,
                req.session.userId
            ],
            function (err, project) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                if (!project) {

                    return res.status(403).json({
                        message:
                            "You cannot delete this project."
                    });

                }


                db.run(
                    `
                    DELETE FROM comments

                    WHERE task_id IN (

                        SELECT id
                        FROM tasks
                        WHERE project_id = ?

                    )
                    `,
                    [projectId],
                    function () {

                        db.run(
                            `
                            DELETE FROM tasks

                            WHERE project_id = ?
                            `,
                            [projectId],
                            function (taskError) {

                                if (taskError) {

                                    console.error(
                                        taskError
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Could not delete project tasks."
                                    });

                                }


                                db.run(
                                    `
                                    DELETE FROM projects

                                    WHERE id = ?
                                    `,
                                    [projectId],
                                    function (deleteError) {

                                        if (deleteError) {

                                            console.error(
                                                deleteError
                                            );

                                            return res.status(500).json({
                                                message:
                                                    "Could not delete project."
                                            });

                                        }


                                        res.json({
                                            message:
                                                "Project deleted."
                                        });

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    }
);


// =====================================================
// GET TASKS
// =====================================================

app.get(
    "/api/tasks/:projectId",
    requireLogin,
    function (req, res) {

        const projectId =
            req.params.projectId;


        db.get(
            `
            SELECT id

            FROM projects

            WHERE id = ?

            AND created_by = ?
            `,
            [
                projectId,
                req.session.userId
            ],
            function (projectError, project) {

                if (projectError) {

                    console.error(projectError);

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                if (!project) {

                    return res.status(403).json({
                        message:
                            "You cannot access this project."
                    });

                }


                db.all(
                    `
                    SELECT
                        tasks.*,

                        users.name AS assigned_name,

                        users.email AS assigned_email

                    FROM tasks

                    LEFT JOIN users

                        ON tasks.assigned_to = users.id

                    WHERE tasks.project_id = ?

                    ORDER BY tasks.id DESC
                    `,
                    [projectId],
                    function (err, tasks) {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                message:
                                    "Could not load tasks."
                            });

                        }

                        res.json(tasks);

                    }
                );

            }
        );

    }
);


// =====================================================
// CREATE TASK
// =====================================================

app.post(
    "/api/tasks",
    requireLogin,
    function (req, res) {

        const title =
            (req.body.title || "").trim();

        const description =
            (req.body.description || "").trim();

        const projectId =
            req.body.projectId;

        const assignedEmail =
            (req.body.assignedEmail || "").trim();


        if (!title) {

            return res.status(400).json({
                message:
                    "Task title is required."
            });

        }


        if (!projectId) {

            return res.status(400).json({
                message:
                    "Project is required."
            });

        }


        db.get(
            `
            SELECT id

            FROM projects

            WHERE id = ?

            AND created_by = ?
            `,
            [
                projectId,
                req.session.userId
            ],
            function (projectError, project) {

                if (projectError) {

                    console.error(projectError);

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                if (!project) {

                    return res.status(403).json({
                        message:
                            "You cannot add a task to this project."
                    });

                }


                function createTask(assignedUserId) {

                    db.run(
                        `
                        INSERT INTO tasks
                        (
                            title,
                            description,
                            status,
                            project_id,
                            assigned_to
                        )

                        VALUES (?, ?, ?, ?, ?)
                        `,
                        [
                            title,
                            description,
                            "To Do",
                            projectId,
                            assignedUserId
                        ],
                        function (err) {

                            if (err) {

                                console.error(err);

                                return res.status(500).json({
                                    message:
                                        "Could not create task."
                                });

                            }


                            res.json({

                                message:
                                    "Task created!",

                                id:
                                    this.lastID

                            });

                        }
                    );

                }


                if (!assignedEmail) {

                    createTask(null);

                    return;

                }


                db.get(
                    `
                    SELECT id

                    FROM users

                    WHERE email = ?
                    `,
                    [assignedEmail],
                    function (err, user) {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                message:
                                    "Database error."
                            });

                        }


                        if (!user) {

                            return res.status(400).json({
                                message:
                                    "That user does not exist."
                            });

                        }


                        createTask(user.id);

                    }
                );

            }
        );

    }
);


// =====================================================
// UPDATE TASK STATUS
// =====================================================

app.put(
    "/api/tasks/:id",
    requireLogin,
    function (req, res) {

        const taskId =
            req.params.id;

        const status =
            req.body.status;


        const allowedStatuses = [
            "To Do",
            "In Progress",
            "Done"
        ];


        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                message:
                    "Invalid status."
            });

        }


        db.get(
            `
            SELECT
                tasks.id

            FROM tasks

            JOIN projects
                ON tasks.project_id = projects.id

            WHERE tasks.id = ?

            AND projects.created_by = ?
            `,
            [
                taskId,
                req.session.userId
            ],
            function (err, task) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                if (!task) {

                    return res.status(403).json({
                        message:
                            "You cannot update this task."
                    });

                }


                db.run(
                    `
                    UPDATE tasks

                    SET status = ?

                    WHERE id = ?
                    `,
                    [
                        status,
                        taskId
                    ],
                    function (updateError) {

                        if (updateError) {

                            console.error(updateError);

                            return res.status(500).json({
                                message:
                                    "Could not update task."
                            });

                        }


                        res.json({
                            message:
                                "Task updated."
                        });

                    }
                );

            }
        );

    }
);


// =====================================================
// GET COMMENTS
// =====================================================

app.get(
    "/api/tasks/:taskId/comments",
    requireLogin,
    function (req, res) {

        const taskId =
            req.params.taskId;


        db.get(
            `
            SELECT
                tasks.id

            FROM tasks

            JOIN projects
                ON tasks.project_id = projects.id

            WHERE tasks.id = ?

            AND projects.created_by = ?
            `,
            [
                taskId,
                req.session.userId
            ],
            function (taskError, task) {

                if (taskError) {

                    console.error(taskError);

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                if (!task) {

                    return res.status(403).json({
                        message:
                            "You cannot access these comments."
                    });

                }


                db.all(
                    `
                    SELECT

                        comments.id,

                        comments.task_id,

                        comments.user_id,

                        comments.content,

                        comments.created_at,

                        users.name AS author

                    FROM comments

                    JOIN users
                        ON comments.user_id = users.id

                    WHERE comments.task_id = ?

                    ORDER BY comments.id ASC
                    `,
                    [taskId],
                    function (err, comments) {

                        if (err) {

                            console.error(
                                "GET COMMENTS ERROR:",
                                err
                            );

                            return res.status(500).json({
                                message:
                                    "Could not load comments."
                            });

                        }


                        res.json({
                            comments:
                                comments || []
                        });

                    }
                );

            }
        );

    }
);


// =====================================================
// ADD COMMENT
// =====================================================

app.post(
    "/api/tasks/:taskId/comments",
    requireLogin,
    function (req, res) {

        const taskId =
            req.params.taskId;

        const content =
            (req.body.content || "").trim();


        if (!content) {

            return res.status(400).json({
                message:
                    "Comment cannot be empty."
            });

        }


        db.get(
            `
            SELECT
                tasks.id

            FROM tasks

            JOIN projects
                ON tasks.project_id = projects.id

            WHERE tasks.id = ?

            AND projects.created_by = ?
            `,
            [
                taskId,
                req.session.userId
            ],
            function (taskError, task) {

                if (taskError) {

                    console.error(taskError);

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                if (!task) {

                    return res.status(403).json({
                        message:
                            "You cannot comment on this task."
                    });

                }


                db.run(
                    `
                    INSERT INTO comments
                    (
                        task_id,
                        user_id,
                        content
                    )

                    VALUES (?, ?, ?)
                    `,
                    [
                        taskId,
                        req.session.userId,
                        content
                    ],
                    function (err) {

                        if (err) {

                            console.error(
                                "ADD COMMENT ERROR:",
                                err
                            );

                            return res.status(500).json({
                                message:
                                    "Could not add comment."
                            });

                        }


                        res.json({

                            message:
                                "Comment added successfully!",

                            commentId:
                                this.lastID

                        });

                    }
                );

            }
        );

    }
);


// =====================================================
// DELETE COMMENT (FIXED ENDPOINT)
// =====================================================

app.delete(
    "/api/comments/:commentId",
    requireLogin,
    function (req, res) {

        const commentId =
            req.params.commentId;


        db.get(
            `
            SELECT
                comments.id,
                comments.user_id,
                projects.created_by AS project_owner

            FROM comments

            JOIN tasks
                ON comments.task_id = tasks.id

            JOIN projects
                ON tasks.project_id = projects.id

            WHERE comments.id = ?
            `,
            [commentId],
            function (err, comment) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Database error."
                    });

                }


                if (!comment) {

                    return res.status(404).json({
                        message:
                            "Comment not found."
                    });

                }


                // Allow deletion if user wrote the comment OR owns the project
                if (
                    comment.user_id !== req.session.userId &&
                    comment.project_owner !== req.session.userId
                ) {

                    return res.status(403).json({
                        message:
                            "You do not have permission to delete this comment."
                    });

                }


                db.run(
                    `
                    DELETE FROM comments
                    WHERE id = ?
                    `,
                    [commentId],
                    function (deleteErr) {

                        if (deleteErr) {

                            console.error(deleteErr);

                            return res.status(500).json({
                                message:
                                    "Could not delete comment."
                            });

                        }


                        res.json({
                            message:
                                "Comment deleted."
                        });

                    }
                );

            }
        );

    }
);


// =====================================================
// START SERVER
// =====================================================

app.listen(
    PORT,
    function () {

        console.log(
            `Server running at http://localhost:${PORT}`
        );

    }
);