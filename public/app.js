console.log("TaskFlow app.js loaded");


// =====================================================
// HELPER
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;
}


// =====================================================
// GLOBAL VARIABLES & COMMENTS MODAL ELEMENTS
// =====================================================

let selectedProjectId = null;
let selectedTaskId = null;
let currentUserId = null;

const commentsModal =
    document.getElementById("commentsModal");

const commentsContainer =
    document.getElementById("commentsContainer");

const commentsTaskName =
    document.getElementById("commentsTaskName");

const commentForm =
    document.getElementById("commentForm");

const commentText =
    document.getElementById("commentText");

const commentMessage =
    document.getElementById("commentMessage");

const closeCommentsButton =
    document.getElementById("closeCommentsButton");

const cancelCommentButton =
    document.getElementById("cancelCommentButton");


// =====================================================
// COMMENTS MODAL LOGIC
// =====================================================

async function openComments(taskId, taskTitle) {

    selectedTaskId =
        Number(taskId);


    if (commentsTaskName) {

        commentsTaskName.textContent =
            taskTitle;

    }


    if (commentsContainer) {

        commentsContainer.innerHTML =
            `<p>Loading comments...</p>`;

    }


    if (commentMessage) {

        commentMessage.textContent =
            "";

        commentMessage.className =
            "";

    }


    if (commentsModal) {

        commentsModal.classList.remove(
            "hidden"
        );

        commentsModal.style.display =
            "flex";

    }


    await loadComments();

}


async function loadComments() {

    if (!selectedTaskId) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/tasks/" +
                selectedTaskId +
                "/comments",
                {
                    method: "GET",

                    credentials:
                        "same-origin"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            if (commentsContainer) {

                commentsContainer.innerHTML =
                    `
                    <p class="error-message">
                        ${escapeHtml(
                            data.message ||
                            "Could not load comments."
                        )}
                    </p>
                    `;

            }

            return;

        }


        if (!commentsContainer) {
            return;
        }


        commentsContainer.innerHTML =
            "";


        if (
            !Array.isArray(
                data.comments
            ) ||
            data.comments.length === 0
        ) {

            commentsContainer.innerHTML =
                `<p>No comments yet.</p>`;

            return;

        }


        data.comments.forEach(
            function (comment) {

                const commentElement =
                    document.createElement(
                        "div"
                    );


                commentElement.className =
                    "comment";


                commentElement.innerHTML =
                    `
                    <div class="comment-header">
                        <strong>
                            ${escapeHtml(
                                comment.author ||
                                "User"
                            )}
                        </strong>

                        <button
                            type="button"
                            class="delete-comment-btn"
                            data-comment-id="${comment.id}"
                            title="Delete comment"
                        >
                            Delete
                        </button>
                    </div>

                    <p>
                        ${escapeHtml(
                            comment.content
                        )}
                    </p>

                    <small>
                        ${escapeHtml(
                            comment.created_at ||
                            ""
                        )}
                    </small>
                    `;


                commentsContainer.appendChild(
                    commentElement
                );

            }
        );


        // ATTACH DELETE COMMENT EVENT LISTENERS

        document
            .querySelectorAll(
                ".delete-comment-btn"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            deleteComment(
                                this.dataset.commentId
                            );

                        }
                    );

                }
            );

    } catch (error) {

        console.error(
            "Load comments error:",
            error
        );


        if (commentsContainer) {

            commentsContainer.innerHTML =
                `<p class="error-message">Could not load comments.</p>`;

        }

    }

}


// DELETE COMMENT FUNCTION

async function deleteComment(commentId) {

    const confirmed =
        confirm(
            "Delete this comment?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/comments/" + commentId,
                {
                    method: "DELETE",

                    credentials:
                        "same-origin"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Could not delete comment."
            );

            return;

        }


        await loadComments();

    } catch (error) {

        console.error(
            "Delete comment error:",
            error
        );

        alert(
            "Could not connect to server."
        );

    }

}


function closeComments() {

    if (!commentsModal) {
        return;
    }


    commentsModal.classList.add(
        "hidden"
    );

    commentsModal.style.display =
        "none";


    selectedTaskId =
        null;


    if (commentsContainer) {
        commentsContainer.innerHTML = "";
    }

    if (commentText) {
        commentText.value = "";
    }

    if (commentMessage) {

        commentMessage.textContent =
            "";

        commentMessage.className =
            "";

    }

}


// BIND COMMENT MODAL EVENTS

if (commentForm) {

    commentForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!selectedTaskId) {
                return;
            }


            const content =
                commentText.value.trim();


            if (!content) {

                commentMessage.textContent =
                    "Please enter a comment.";

                commentMessage.className =
                    "error-message";

                return;

            }


            try {

                const response =
                    await fetch(
                        "/api/tasks/" +
                        selectedTaskId +
                        "/comments",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "same-origin",

                            body:
                                JSON.stringify({
                                    content
                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    commentMessage.textContent =
                        data.message ||
                        "Could not add comment.";

                    commentMessage.className =
                        "error-message";

                    return;

                }


                commentText.value =
                    "";


                commentMessage.textContent =
                    "Comment added successfully!";

                commentMessage.className =
                    "success-message";


                await loadComments();


                setTimeout(
                    function () {

                        commentMessage.textContent =
                            "";

                        commentMessage.className =
                            "";

                    },
                    2000
                );

            } catch (error) {

                console.error(
                    "Add comment error:",
                    error
                );


                commentMessage.textContent =
                    "Could not connect to server.";

                commentMessage.className =
                    "error-message";

            }

        }
    );

}


if (closeCommentsButton) {

    closeCommentsButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            closeComments();

        }
    );

}


if (cancelCommentButton) {

    cancelCommentButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            closeComments();

        }
    );

}


if (commentsModal) {

    commentsModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                commentsModal
            ) {

                closeComments();

            }

        }
    );

}


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeComments();

        }

    }
);


// =====================================================
// REGISTER
// =====================================================

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                document.getElementById("name").value.trim();

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;

            const message =
                document.getElementById("message");


            try {

                const response =
                    await fetch(
                        "/api/auth/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name,
                                email,
                                password
                            })
                        }
                    );


                const data =
                    await response.json();


                message.textContent =
                    data.message;

                message.className =
                    response.ok
                        ? "success-message"
                        : "error-message";


                if (response.ok) {

                    registerForm.reset();

                    setTimeout(
                        function () {

                            window.location.href =
                                "/login.html";

                        },
                        1000
                    );

                }

            } catch (error) {

                console.error(error);

                message.textContent =
                    "Could not connect to server.";

                message.className =
                    "error-message";

            }

        }
    );

}


// =====================================================
// LOGIN
// =====================================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("loginPassword")
                    .value;

            const message =
                document.getElementById("message");


            try {

                const response =
                    await fetch(
                        "/api/auth/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "same-origin",

                            body: JSON.stringify({
                                email,
                                password
                            })
                        }
                    );


                const data =
                    await response.json();


                message.textContent =
                    data.message;

                message.className =
                    response.ok
                        ? "success-message"
                        : "error-message";


                if (response.ok) {

                    setTimeout(
                        function () {

                            window.location.href =
                                "/dashboard.html";

                        },
                        500
                    );

                }

            } catch (error) {

                console.error(error);

                message.textContent =
                    "Could not connect to server.";

                message.className =
                    "error-message";

            }

        }
    );

}


// =====================================================
// DASHBOARD
// =====================================================

const projectsContainer =
    document.getElementById(
        "projectsContainer"
    );


if (projectsContainer) {


    // =================================================
    // CURRENT USER
    // =================================================

    async function loadCurrentUser() {

        try {

            const response =
                await fetch(
                    "/api/auth/me",
                    {
                        credentials:
                            "same-origin"
                    }
                );


            if (!response.ok) {

                window.location.href =
                    "/login.html";

                return;

            }


            const user =
                await response.json();


            currentUserId = user.id;


            const welcome =
                document.getElementById(
                    "welcomeUser"
                );


            if (welcome) {

                welcome.textContent =
                    "✨ Welcome back, " + user.name + " ✦";
            }

        } catch (error) {

            console.error(error);

            window.location.href =
                "/login.html";

        }

    }


    // =================================================
    // LOAD PROJECTS
    // =================================================

    async function loadProjects() {

        try {

            const response =
                await fetch(
                    "/api/projects",
                    {
                        credentials:
                            "same-origin"
                    }
                );


            if (!response.ok) {

                projectsContainer.innerHTML =
                    `
                    <div class="empty-state">
                        <h3>Could not load projects</h3>
                        <p>Please refresh the page.</p>
                    </div>
                    `;

                return;

            }


            const projects =
                await response.json();


            projectsContainer.innerHTML =
                "";


            if (
                !Array.isArray(projects) ||
                projects.length === 0
            ) {

                projectsContainer.innerHTML =
                    `
                    <div class="empty-state">
                        <h3>No projects yet</h3>
                        <p>Create your first project above.</p>
                    </div>
                    `;

                return;

            }


            projects.forEach(
                function (project) {

                    const card =
                        document.createElement("div");

                    card.className =
                        "project-card";


                    card.innerHTML =
                        `
                        <div>

                            <h3>
                                ${escapeHtml(
                                    project.name
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    project.description ||
                                    "No description"
                                )}
                            </p>

                            <small>
                                Created by:
                                ${escapeHtml(
                                    project.creator
                                )}
                            </small>

                        </div>


                        <div class="project-actions">

                            <button
                                type="button"
                                class="open-project"
                                data-id="${project.id}"
                            >
                                Open Project
                            </button>


                            <button
                                type="button"
                                class="danger delete-project"
                                data-id="${project.id}"
                            >
                                Delete
                            </button>

                        </div>
                        `;


                    projectsContainer.appendChild(
                        card
                    );

                }
            );


            // OPEN PROJECT

            document
                .querySelectorAll(
                    ".open-project"
                )
                .forEach(
                    function (button) {

                        button.addEventListener(
                            "click",
                            function () {

                                openProject(
                                    this.dataset.id
                                );

                            }
                        );

                    }
                );


            // DELETE PROJECT

            document
                .querySelectorAll(
                    ".delete-project"
                )
                .forEach(
                    function (button) {

                        button.addEventListener(
                            "click",
                            function () {

                                deleteProject(
                                    this.dataset.id
                                );

                            }
                        );

                    }
                );

        } catch (error) {

            console.error(
                "Project loading error:",
                error
            );

            projectsContainer.innerHTML =
                `
                <div class="empty-state">
                    <h3>Could not load projects</h3>
                    <p>Please refresh the page.</p>
                </div>
                `;

        }

    }


    // =================================================
    // CREATE PROJECT
    // =================================================

    const projectForm =
        document.getElementById(
            "projectForm"
        );


    if (projectForm) {

        projectForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const name =
                    document
                        .getElementById(
                            "projectName"
                        )
                        .value
                        .trim();


                const description =
                    document
                        .getElementById(
                            "projectDescription"
                        )
                        .value
                        .trim();


                const message =
                    document.getElementById(
                        "projectMessage"
                    );


                if (!name) {

                    message.textContent =
                        "Please enter a project name.";

                    message.className =
                        "error-message";

                    return;

                }


                try {

                    const response =
                        await fetch(
                            "/api/projects",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                credentials:
                                    "same-origin",

                                body: JSON.stringify({
                                    name,
                                    description
                                })
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        message.textContent =
                            data.message ||
                            "Could not create project.";

                        message.className =
                            "error-message";

                        return;

                    }


                    message.textContent =
                        "Project created successfully!";

                    message.className =
                        "success-message";


                    projectForm.reset();


                    await loadProjects();


                    setTimeout(
                        function () {

                            message.textContent =
                                "";

                            message.className =
                                "";

                        },
                        2500
                    );

                } catch (error) {

                    console.error(error);

                    message.textContent =
                        "Could not connect to server.";

                    message.className =
                        "error-message";

                }

            }
        );

    }


    // =================================================
    // DELETE PROJECT
    // =================================================

    async function deleteProject(id) {

        const confirmed =
            confirm(
                "Are you sure you want to delete this project?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    "/api/projects/" + id,
                    {
                        method: "DELETE",

                        credentials:
                            "same-origin"
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Could not delete project."
                );

                return;

            }


            if (
                String(selectedProjectId) ===
                String(id)
            ) {

                closeProject();

            }


            await loadProjects();

        } catch (error) {

            console.error(error);

            alert(
                "Could not connect to server."
            );

        }

    }


    // =================================================
    // OPEN PROJECT
    // =================================================

    async function openProject(id) {

        selectedProjectId =
            Number(id);


        try {

            const response =
                await fetch(
                    "/api/projects",
                    {
                        credentials:
                            "same-origin"
                    }
                );


            const projects =
                await response.json();


            const project =
                projects.find(
                    function (item) {

                        return (
                            Number(item.id) ===
                            Number(id)
                        );

                    }
                );


            if (!project) {

                return;

            }


            document.getElementById(
                "selectedProjectName"
            ).textContent =
                project.name;


            document.getElementById(
                "selectedProjectDescription"
            ).textContent =
                project.description || "";


            document
                .getElementById(
                    "taskSection"
                )
                .classList.remove(
                    "hidden"
                );


            await loadTasks();


            document
                .getElementById(
                    "taskSection"
                )
                .scrollIntoView({
                    behavior: "smooth"
                });

        } catch (error) {

            console.error(
                "Open project error:",
                error
            );

        }

    }


    // =================================================
    // CLOSE PROJECT
    // =================================================

    function closeProject() {

        selectedProjectId =
            null;

        selectedTaskId =
            null;


        const taskSection =
            document.getElementById(
                "taskSection"
            );


        if (taskSection) {

            taskSection.classList.add(
                "hidden"
            );

        }


        document.getElementById(
            "selectedProjectName"
        ).textContent =
            "Project";


        document.getElementById(
            "selectedProjectDescription"
        ).textContent =
            "";


        document.getElementById(
            "todoTasks"
        ).innerHTML =
            "";


        document.getElementById(
            "progressTasks"
        ).innerHTML =
            "";


        document.getElementById(
            "doneTasks"
        ).innerHTML =
            "";


        closeComments();

    }


    const closeProjectButton =
        document.getElementById(
            "closeProjectButton"
        );


    if (closeProjectButton) {

        closeProjectButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeProject();

            }
        );

    }


    // =================================================
    // CREATE TASK
    // =================================================

    const taskForm =
        document.getElementById(
            "taskForm"
        );


    if (taskForm) {

        taskForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                if (!selectedProjectId) {

                    return;

                }


                const title =
                    document
                        .getElementById(
                            "taskTitle"
                        )
                        .value
                        .trim();


                const description =
                    document
                        .getElementById(
                            "taskDescription"
                        )
                        .value
                        .trim();


                const assignedEmail =
                    document
                        .getElementById(
                            "assignedEmail"
                        )
                        .value
                        .trim();


                const message =
                    document.getElementById(
                        "taskMessage"
                    );


                try {

                    const response =
                        await fetch(
                            "/api/tasks",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                credentials:
                                    "same-origin",

                                body: JSON.stringify({

                                    title,

                                    description,

                                    projectId:
                                        selectedProjectId,

                                    assignedEmail

                                })
                            }
                        );


                    const data =
                        await response.json();


                    message.textContent =
                        data.message ||
                        "";


                    if (!response.ok) {

                        message.className =
                            "error-message";

                        return;

                    }


                    message.className =
                        "success-message";


                    taskForm.reset();


                    await loadTasks();


                    setTimeout(
                        function () {

                            message.textContent =
                                "";

                            message.className =
                                "";

                        },
                        2500
                    );

                } catch (error) {

                    console.error(error);

                    message.textContent =
                        "Could not connect to server.";

                    message.className =
                        "error-message";

                }

            }
        );

    }


    // =================================================
    // LOAD TASKS
    // =================================================

    async function loadTasks() {

        if (!selectedProjectId) {
            return;
        }


        try {

            const response =
                await fetch(
                    "/api/tasks/" +
                    selectedProjectId,
                    {
                        credentials:
                            "same-origin"
                    }
                );


            const tasks =
                await response.json();


            if (!response.ok) {

                console.error(tasks);

                return;

            }


            const todo =
                document.getElementById(
                    "todoTasks"
                );

            const progress =
                document.getElementById(
                    "progressTasks"
                );

            const done =
                document.getElementById(
                    "doneTasks"
                );


            todo.innerHTML = "";
            progress.innerHTML = "";
            done.innerHTML = "";


            if (
                !Array.isArray(tasks) ||
                tasks.length === 0
            ) {

                todo.innerHTML =
                    `
                    <p class="empty-task">
                        No tasks yet.
                    </p>
                    `;

                return;

            }


            tasks.forEach(
                function (task) {

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "task-card";


                    card.innerHTML =
                        `
                        <h4>
                            ${escapeHtml(
                                task.title
                            )}
                        </h4>


                        <p>
                            ${escapeHtml(
                                task.description ||
                                "No description"
                            )}
                        </p>


                        ${
                            task.assigned_name
                                ? `
                                <small>
                                    Assigned to:
                                    ${escapeHtml(
                                        task.assigned_name
                                    )}
                                </small>
                                `
                                : ""
                        }


                        <select
                            class="status-select"
                        >

                            <option value="To Do">
                                To Do
                            </option>

                            <option value="In Progress">
                                In Progress
                            </option>

                            <option value="Done">
                                Done
                            </option>

                        </select>


                        <div class="task-buttons">

                            <button
                                type="button"
                                class="comment-button"
                            >
                                💬 Comments
                            </button>

                        </div>
                        `;


                    const statusSelect =
                        card.querySelector(
                            ".status-select"
                        );


                    statusSelect.value =
                        task.status;


                    statusSelect.addEventListener(
                        "change",
                        async function () {

                            try {

                                await fetch(
                                    "/api/tasks/" +
                                    task.id,
                                    {
                                        method: "PUT",

                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },

                                        credentials:
                                            "same-origin",

                                        body:
                                            JSON.stringify({
                                                status:
                                                    this.value
                                            })
                                    }
                                );


                                await loadTasks();

                            } catch (error) {

                                console.error(error);

                            }

                        }
                    );


                    const commentButton =
                        card.querySelector(
                            ".comment-button"
                        );


                    commentButton.addEventListener(
                        "click",
                        function () {

                            openComments(
                                task.id,
                                task.title
                            );

                        }
                    );


                    if (
                        task.status ===
                        "To Do"
                    ) {

                        todo.appendChild(
                            card
                        );

                    } else if (
                        task.status ===
                        "In Progress"
                    ) {

                        progress.appendChild(
                            card
                        );

                    } else {

                        done.appendChild(
                            card
                        );

                    }

                }
            );

        } catch (error) {

            console.error(
                "Load tasks error:",
                error
            );

        }

    }


    // =================================================
    // LOGOUT
    // =================================================

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async function () {

                try {

                    await fetch(
                        "/api/auth/logout",
                        {
                            method: "POST",

                            credentials:
                                "same-origin"
                        }
                    );

                } catch (error) {

                    console.error(error);

                }


                window.location.href =
                    "/login.html";

            }
        );

    }


    // =================================================
    // START DASHBOARD
    // =================================================

    loadCurrentUser();

    loadProjects();

}