import "dotenv/config";

import express from "express";
import cors from "cors";

import {
  getCalendarEvents,
  createCalendarEvent,
  checkConflict,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "./tools/mockCalendar.js";

import {
  getTasks,
  getTaskById,
  addTask,
  updateTask,
  completeTask,
  markTaskUnfinished,
  deleteTask,
} from "./tools/taskList.js";

import {
  runPlannerAgent,
} from "./agents/plannerAgent.js";

import {
  generatePlanningInsight,
} from "./agents/aiCoach.js";

/*
|--------------------------------------------------------------------------
| APP SETUP
|--------------------------------------------------------------------------
*/

const app = express();

const PORT =
  Number(process.env.PORT) || 5000;

/*
|--------------------------------------------------------------------------
| CORS CONFIGURATION
|--------------------------------------------------------------------------
|
| FRONTEND_URL can contain one URL:
|
| FRONTEND_URL=https://your-site.netlify.app
|
| Or multiple URLs separated by commas:
|
| FRONTEND_URL=https://site1.netlify.app,https://site2.netlify.app
|
*/

const deployedFrontendUrls =
  (process.env.FRONTEND_URL || "")
    .split(",")
    .map((url) =>
      url.trim().replace(/\/$/, "")
    )
    .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...deployedFrontendUrls,
];

console.log(
  "Allowed frontend origins:",
  allowedOrigins
);

/*
|--------------------------------------------------------------------------
| CORS MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: (origin, callback) => {
      /*
      |--------------------------------------------------------------------------
      | Requests without an Origin header are allowed.
      | Examples:
      | - Render health checks
      | - Postman
      | - Direct browser API URL
      |--------------------------------------------------------------------------
      */

      if (!origin) {
        return callback(
          null,
          true
        );
      }

      const normalizedOrigin =
        origin.replace(/\/$/, "");

      /*
      |--------------------------------------------------------------------------
      | ALLOW TRUSTED ORIGIN
      |--------------------------------------------------------------------------
      */

      if (
        allowedOrigins.includes(
          normalizedOrigin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      /*
      |--------------------------------------------------------------------------
      | BLOCK UNKNOWN ORIGIN
      |--------------------------------------------------------------------------
      */

      console.error(
        "Blocked by CORS:",
        normalizedOrigin
      );

      return callback(
        new Error(
          `CORS blocked origin: ${normalizedOrigin}`
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/*
|--------------------------------------------------------------------------
| JSON BODY
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "1mb",
  })
);

/*
|--------------------------------------------------------------------------
| TEST BACKEND
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message:
      "Daily Planner Agent API is running",
  });
});

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get(
  "/api/health",
  (req, res) => {
    return res.json({
      success: true,
      status: "healthy",
      message:
        "Daily Planner Agent backend is working",
    });
  }
);

/*
|--------------------------------------------------------------------------
| CALENDAR - GET ALL EVENTS
|--------------------------------------------------------------------------
*/

app.get(
  "/api/calendar",
  (req, res) => {
    try {
      const events =
        getCalendarEvents();

      return res.json({
        success: true,
        events,
      });
    } catch (error) {
      console.error(
        "Get calendar error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to get calendar events",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CALENDAR - CREATE EVENT
|--------------------------------------------------------------------------
*/

app.post(
  "/api/calendar",
  (req, res) => {
    try {
      const {
        title,
        date,
        startTime,
        endTime,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | VALIDATION
      |--------------------------------------------------------------------------
      */

      if (
        !title ||
        !date ||
        !startTime ||
        !endTime
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Title, date, start time and end time are required",
          });
      }

      if (
        startTime >= endTime
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Start time must be before end time",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | CHECK CALENDAR CONFLICT
      |--------------------------------------------------------------------------
      */

      const hasConflict =
        checkConflict({
          date,
          startTime,
          endTime,
        });

      if (hasConflict) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This time conflicts with an existing calendar event",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE FIXED CALENDAR EVENT
      |--------------------------------------------------------------------------
      */

      const newEvent =
        createCalendarEvent({
          title,
          date,
          startTime,
          endTime,

          eventType:
            "FIXED",

          taskId: null,
        });

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Calendar event created successfully",
          event: newEvent,
        });
    } catch (error) {
      console.error(
        "Create calendar event error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to create calendar event",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CALENDAR - UPDATE EVENT
|--------------------------------------------------------------------------
*/

app.patch(
  "/api/calendar/:id",
  (req, res) => {
    try {
      const eventId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          eventId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid calendar event ID",
          });
      }

      const updatedEvent =
        updateCalendarEvent(
          eventId,
          req.body
        );

      if (!updatedEvent) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Calendar event not found",
          });
      }

      return res.json({
        success: true,
        message:
          "Calendar event updated successfully",
        event:
          updatedEvent,
      });
    } catch (error) {
      console.error(
        "Update calendar event error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update calendar event",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CALENDAR - DELETE EVENT
|--------------------------------------------------------------------------
*/

app.delete(
  "/api/calendar/:id",
  (req, res) => {
    try {
      const eventId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          eventId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid calendar event ID",
          });
      }

      const deleted =
        deleteCalendarEvent(
          eventId
        );

      if (!deleted) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Calendar event not found",
          });
      }

      return res.json({
        success: true,
        message:
          "Calendar event deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete calendar event error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to delete calendar event",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| TASKS - GET ALL
|--------------------------------------------------------------------------
*/

app.get(
  "/api/tasks",
  (req, res) => {
    try {
      const tasks =
        getTasks();

      return res.json({
        success: true,
        tasks,
      });
    } catch (error) {
      console.error(
        "Get tasks error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to get tasks",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| TASKS - CREATE
|--------------------------------------------------------------------------
*/

app.post(
  "/api/tasks",
  (req, res) => {
    try {
      const {
        title,
        duration,
        priority,
        deadline,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | REQUIRED FIELDS
      |--------------------------------------------------------------------------
      */

      if (
        !title ||
        duration ===
          undefined ||
        duration === null ||
        duration === ""
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Task name and duration are required",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | DURATION VALIDATION
      |--------------------------------------------------------------------------
      */

      const numericDuration =
        Number(duration);

      if (
        !Number.isFinite(
          numericDuration
        ) ||
        numericDuration <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Duration must be greater than 0",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | PRIORITY VALIDATION
      |--------------------------------------------------------------------------
      */

      const allowedPriorities =
        [
          "HIGH",
          "MEDIUM",
          "LOW",
        ];

      const normalizedPriority =
        priority ||
        "MEDIUM";

      if (
        !allowedPriorities.includes(
          normalizedPriority
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Priority must be HIGH, MEDIUM or LOW",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE TASK
      |--------------------------------------------------------------------------
      */

      const newTask =
        addTask({
          title,

          duration:
            numericDuration,

          priority:
            normalizedPriority,

          deadline:
            deadline || null,
        });

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Task added successfully",
          task: newTask,
        });
    } catch (error) {
      console.error(
        "Create task error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to create task",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| TASKS - UPDATE
|--------------------------------------------------------------------------
*/

app.patch(
  "/api/tasks/:id",
  (req, res) => {
    try {
      const taskId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          taskId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid task ID",
          });
      }

      const updatedTask =
        updateTask(
          taskId,
          req.body
        );

      if (!updatedTask) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Task not found",
          });
      }

      return res.json({
        success: true,
        message:
          "Task updated successfully",
        task:
          updatedTask,
      });
    } catch (error) {
      console.error(
        "Update task error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update task",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| TASKS - COMPLETE
|--------------------------------------------------------------------------
*/

app.patch(
  "/api/tasks/:id/complete",
  (req, res) => {
    try {
      const taskId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          taskId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid task ID",
          });
      }

      const task =
        completeTask(
          taskId
        );

      if (!task) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Task not found",
          });
      }

      return res.json({
        success: true,
        message:
          "Task completed successfully",
        task,
      });
    } catch (error) {
      console.error(
        "Complete task error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to complete task",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| TASKS - MARK UNFINISHED
|--------------------------------------------------------------------------
*/

app.patch(
  "/api/tasks/:id/unfinished",
  (req, res) => {
    try {
      const taskId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          taskId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid task ID",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | FIND TASK
      |--------------------------------------------------------------------------
      */

      const task =
        getTaskById(
          taskId
        );

      if (!task) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Task not found",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | DELETE OLD SCHEDULED EVENT
      |--------------------------------------------------------------------------
      */

      if (
        task.scheduledEventId
      ) {
        deleteCalendarEvent(
          task.scheduledEventId
        );
      }

      /*
      |--------------------------------------------------------------------------
      | RESET TASK TO PENDING
      |--------------------------------------------------------------------------
      */

      const unfinishedTask =
        markTaskUnfinished(
          taskId
        );

      return res.json({
        success: true,

        message:
          "Task marked as unfinished and ready for replanning",

        task:
          unfinishedTask,
      });
    } catch (error) {
      console.error(
        "Mark unfinished error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to mark task as unfinished",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| TASKS - DELETE
|--------------------------------------------------------------------------
*/

app.delete(
  "/api/tasks/:id",
  (req, res) => {
    try {
      const taskId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          taskId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid task ID",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | FIND TASK
      |--------------------------------------------------------------------------
      */

      const task =
        getTaskById(
          taskId
        );

      if (!task) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Task not found",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | REMOVE SCHEDULED EVENT
      |--------------------------------------------------------------------------
      */

      if (
        task.scheduledEventId
      ) {
        deleteCalendarEvent(
          task.scheduledEventId
        );
      }

      /*
      |--------------------------------------------------------------------------
      | DELETE TASK
      |--------------------------------------------------------------------------
      */

      const deleted =
        deleteTask(
          taskId
        );

      if (!deleted) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Task not found",
          });
      }

      return res.json({
        success: true,
        message:
          "Task and its scheduled calendar event deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete task error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to delete task",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DAILY PLANNER AGENT
|--------------------------------------------------------------------------
*/

app.post(
  "/api/agent/plan",
  async (req, res) => {
    try {
      const {
        date,
        availableStart,
        availableEnd,
        avoidStart,
        avoidEnd,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | VALIDATION
      |--------------------------------------------------------------------------
      */

      if (
        !date ||
        !availableStart ||
        !availableEnd
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Date, available start time and available end time are required",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | STEP 1
      | RUN CONFLICT-SAFE PLANNER
      |--------------------------------------------------------------------------
      */

      const result =
        runPlannerAgent({
          date,

          availableStart,

          availableEnd,

          avoidStart:
            avoidStart ||
            null,

          avoidEnd:
            avoidEnd ||
            null,
        });

      /*
      |--------------------------------------------------------------------------
      | STEP 2
      | AI PLANNER INSIGHT
      |--------------------------------------------------------------------------
      */

      let aiInsight =
        "";

      try {
        aiInsight =
          await generatePlanningInsight({
            date,

            scheduledTasks:
              result.scheduledTasks ||
              [],

            unscheduledTasks:
              result.unscheduledTasks ||
              [],
          });
      } catch (
        aiError
      ) {
        console.error(
          "AI insight error:",
          aiError.message
        );

        /*
        |--------------------------------------------------------------------------
        | AI FAILURE DOES NOT BREAK THE PLANNER
        |--------------------------------------------------------------------------
        */

        aiInsight =
          "Your schedule was created successfully. AI planning advice is temporarily unavailable.";
      }

      /*
      |--------------------------------------------------------------------------
      | FINAL RESPONSE
      |--------------------------------------------------------------------------
      */

      return res.json({
        ...result,
        aiInsight,
      });
    } catch (error) {
      console.error(
        "Planner agent error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to create daily plan",
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| 404 ROUTE
|--------------------------------------------------------------------------
*/

app.use(
  (req, res) => {
    return res
      .status(404)
      .json({
        success: false,
        message:
          "API route not found",
      });
  }
);

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
|
| This is especially important for CORS.
| It makes sure Express returns JSON instead of an HTML error page.
|
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Server error:",
      error.message
    );

    /*
    |--------------------------------------------------------------------------
    | CORS ERROR
    |--------------------------------------------------------------------------
    */

    if (
      error.message?.startsWith(
        "CORS blocked origin:"
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            error.message,
        });
    }

    /*
    |--------------------------------------------------------------------------
    | GENERIC ERROR
    |--------------------------------------------------------------------------
    */

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Internal server error",
      });
  }
);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Daily Planner Agent backend running on port ${PORT}`
    );
  }
);