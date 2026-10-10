const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(
    "./database/taskflow.db",
    (err) => {

        if (err) {

            console.error(
                "Database connection failed:",
                err.message
            );

        } else {

            console.log(
                "Connected to TaskFlow database."
            );

        }

    }
);


// =====================================================
// CREATE TABLES
// =====================================================

db.serialize(() => {


    // =================================================
    // USERS
    // =================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS users (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            password TEXT NOT NULL

        )
    `);


    // =================================================
    // PROJECTS
    // =================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS projects (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            description TEXT,

            created_by INTEGER NOT NULL,

            FOREIGN KEY (created_by)
                REFERENCES users(id)

        )
    `);


    // =================================================
    // TASKS
    // =================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            title TEXT NOT NULL,

            description TEXT,

            status TEXT NOT NULL
                DEFAULT 'To Do',

            project_id INTEGER NOT NULL,

            assigned_to INTEGER,

            FOREIGN KEY (project_id)
                REFERENCES projects(id),

            FOREIGN KEY (assigned_to)
                REFERENCES users(id)

        )
    `);


    // =================================================
    // COMMENTS
    // =================================================

    db.run(`
        CREATE TABLE IF NOT EXISTS comments (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            task_id INTEGER NOT NULL,

            user_id INTEGER NOT NULL,

            content TEXT NOT NULL,

            created_at DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (task_id)
                REFERENCES tasks(id),

            FOREIGN KEY (user_id)
                REFERENCES users(id)

        )
    `);


    console.log(
        "TaskFlow database tables ready."
    );

});


module.exports = db;