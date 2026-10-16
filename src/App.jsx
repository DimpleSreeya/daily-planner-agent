import { useEffect, useState } from "react";

import {
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
} from "./api/calendarApi";

import {
  getTasks,
  createTask,
  completeTask,
  markTaskUnfinished,
  deleteTask,
} from "./api/taskApi";

import { createDailyPlan } from "./api/agentApi";

import "./App.css";

function App() {
  /*
  |--------------------------------------------------------------------------
  | CALENDAR STATE
  |--------------------------------------------------------------------------
  */

  const [events, setEvents] = useState([]);

  const [calendarForm, setCalendarForm] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  /*
  |--------------------------------------------------------------------------
  | TASK STATE
  |--------------------------------------------------------------------------
  */

  const [tasks, setTasks] = useState([]);

  const [taskForm, setTaskForm] = useState({
    title: "",
    duration: "",
    priority: "MEDIUM",
    deadline: "",
  });

  /*
  |--------------------------------------------------------------------------
  | PLANNER STATE
  |--------------------------------------------------------------------------
  */

  const [plannerForm, setPlannerForm] = useState({
    date: "",
    availableStart: "08:00",
    availableEnd: "22:00",
  });

  const [plannerResult, setPlannerResult] = useState(null);

  const [planning, setPlanning] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | GENERAL STATE
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD CALENDAR
  |--------------------------------------------------------------------------
  */

  const loadCalendar = async () => {
    const data = await getCalendarEvents();

    setEvents(data.events || []);
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD TASKS
  |--------------------------------------------------------------------------
  */

  const loadTasks = async () => {
    const data = await getTasks();

    setTasks(data.tasks || []);
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          loadCalendar(),
          loadTasks(),
        ]);
      } catch (error) {
        console.error(error);

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | TASK FORM CHANGE
  |--------------------------------------------------------------------------
  */

  const handleTaskChange = (event) => {
    const { name, value } = event.target;

    setTaskForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | ADD TASK
  |--------------------------------------------------------------------------
  */

  const handleAddTask = async (event) => {
    event.preventDefault();

    try {
      setMessage("");
      setError("");

      const data = await createTask({
        title: taskForm.title,
        duration: Number(taskForm.duration),
        priority: taskForm.priority,
        deadline: taskForm.deadline || null,
      });

      setMessage(
        data.message || "Task added successfully"
      );

      setTaskForm({
        title: "",
        duration: "",
        priority: "MEDIUM",
        deadline: "",
      });

      await loadTasks();
    } catch (error) {
      console.error(error);

      setError(error.message);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | COMPLETE TASK
  |--------------------------------------------------------------------------
  */

  const handleCompleteTask = async (id) => {
    try {
      setMessage("");
      setError("");

      await completeTask(id);

      setMessage(
        "Task completed successfully"
      );

      await loadTasks();
    } catch (error) {
      console.error(error);

      setError(error.message);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE TASK
  |--------------------------------------------------------------------------
  */

  const handleDeleteTask = async (id) => {
    try {
      setMessage("");
      setError("");

      await deleteTask(id);

      setMessage(
        "Task deleted successfully"
      );

      /*
      |--------------------------------------------------------------------------
      | REFRESH TASKS + CALENDAR
      |--------------------------------------------------------------------------
      */

      await Promise.all([
        loadTasks(),
        loadCalendar(),
      ]);
    } catch (error) {
      console.error(error);

      setError(error.message);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CALENDAR FORM CHANGE
  |--------------------------------------------------------------------------
  */

  const handleCalendarChange = (event) => {
    const { name, value } = event.target;

    setCalendarForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | ADD FIXED CALENDAR EVENT
  |--------------------------------------------------------------------------
  */

  const handleAddEvent = async (event) => {
    event.preventDefault();

    try {
      setMessage("");
      setError("");

      const data = await createCalendarEvent(
        calendarForm
      );

      setMessage(
        data.message ||
          "Calendar event added successfully"
      );

      setCalendarForm({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
      });

      await loadCalendar();
    } catch (error) {
      console.error(error);

      setError(error.message);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE CALENDAR EVENT
  |--------------------------------------------------------------------------
  */

  const handleDeleteEvent = async (id) => {
    try {
      setMessage("");
      setError("");

      await deleteCalendarEvent(id);

      setMessage(
        "Calendar event deleted successfully"
      );

      await loadCalendar();
    } catch (error) {
      console.error(error);

      setError(error.message);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PLANNER FORM CHANGE
  |--------------------------------------------------------------------------
  */

  const handlePlannerChange = (event) => {
    const { name, value } = event.target;

    setPlannerForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | PLAN MY DAY
  |--------------------------------------------------------------------------
  */

  const handlePlanDay = async (event) => {
    event.preventDefault();

    try {
      setPlanning(true);
      setMessage("");
      setError("");
      setPlannerResult(null);

      const result = await createDailyPlan({
        date: plannerForm.date,

        availableStart:
          plannerForm.availableStart,

        availableEnd:
          plannerForm.availableEnd,
      });

      setPlannerResult(result);

      setMessage(
        result.message ||
          "Daily plan created successfully"
      );

      await Promise.all([
        loadTasks(),
        loadCalendar(),
      ]);
    } catch (error) {
      console.error(error);

      setError(error.message);
    } finally {
      setPlanning(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UNFINISHED + AUTOMATIC REPLAN
  |--------------------------------------------------------------------------
  */

  const handleUnfinishedTask = async (task) => {
    try {
      setPlanning(true);
      setMessage("");
      setError("");

      /*
      |--------------------------------------------------------------------------
      | SAVE OLD SCHEDULE
      |--------------------------------------------------------------------------
      */

      const replanDate =
        task.scheduledDate ||
        plannerForm.date;

      const oldStart =
        task.scheduledStart;

      const oldEnd =
        task.scheduledEnd;

      if (!replanDate) {
        throw new Error(
          "Please select a planning date first"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | STEP 1
      | REMOVE OLD EVENT + RESET TASK
      |--------------------------------------------------------------------------
      */

      await markTaskUnfinished(
        task.id
      );

      /*
      |--------------------------------------------------------------------------
      | STEP 2
      | RUN PLANNER AGAIN
      |--------------------------------------------------------------------------
      */

      const result = await createDailyPlan({
        date: replanDate,

        availableStart:
          plannerForm.availableStart,

        availableEnd:
          plannerForm.availableEnd,

        avoidStart: oldStart,

        avoidEnd: oldEnd,
      });

      setPlannerResult(result);

      /*
      |--------------------------------------------------------------------------
      | FIND THIS TASK IN NEW SCHEDULE
      |--------------------------------------------------------------------------
      */

      const replannedTask =
        result.scheduledTasks?.find(
          (scheduledTask) =>
            scheduledTask.taskId ===
            task.id
        );

      if (replannedTask) {
        setMessage(
          `${task.title} was replanned to ${replannedTask.startTime} - ${replannedTask.endTime}`
        );
      } else {
        setMessage(
          `${task.title} could not be automatically rescheduled`
        );
      }

      /*
      |--------------------------------------------------------------------------
      | REFRESH UI
      |--------------------------------------------------------------------------
      */

      await Promise.all([
        loadTasks(),
        loadCalendar(),
      ]);
    } catch (error) {
      console.error(error);

      setError(error.message);
    } finally {
      setPlanning(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FIXED EVENTS ONLY
  |--------------------------------------------------------------------------
  */
/*
|--------------------------------------------------------------------------
| EVENTS FOR SELECTED PLANNING DATE
|--------------------------------------------------------------------------
*/

const selectedDate =
  plannerForm.date;

const displayEvents =
  selectedDate
    ? events.filter(
        (event) =>
          event.date === selectedDate
      )
    : events;

/*
|--------------------------------------------------------------------------
| FIXED EVENTS FOR SELECTED DATE
|--------------------------------------------------------------------------
*/

const fixedEvents =
  displayEvents.filter(
    (event) =>
      event.eventType === "FIXED" ||
      !event.eventType
  );

/*
|--------------------------------------------------------------------------
| SORT SELECTED DAY SCHEDULE
|--------------------------------------------------------------------------
*/

const sortedEvents = [
  ...displayEvents,
].sort((a, b) =>
  a.startTime.localeCompare(
    b.startTime
  )
);
 

  return (
    <div className="planner-page">
      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="planner-header">
        <div>
          <h1>
            Daily Planner Agent
          </h1>

          <p>
            Plan smarter. Detect conflicts.
            Stay on track.
          </p>
        </div>

        <div className="agent-status">
          <span className="status-dot" />

          Agent Ready
        </div>
      </header>

      <main className="planner-container">
        {/* =========================================================
            MESSAGES
        ========================================================= */}

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* =========================================================
            ADD TASK
        ========================================================= */}

        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <h2>Add Task</h2>

              <p>
                Add tasks that your Daily
                Planner Agent should schedule.
              </p>
            </div>
          </div>

          <form
            className="event-form"
            onSubmit={handleAddTask}
          >
            <div className="form-field">
              <label>
                Task Name
              </label>

              <input
                type="text"
                name="title"
                placeholder="Example: Learn AI"
                value={taskForm.title}
                onChange={handleTaskChange}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Duration in Minutes
              </label>

              <input
                type="number"
                name="duration"
                placeholder="Example: 60"
                min="1"
                value={
                  taskForm.duration
                }
                onChange={
                  handleTaskChange
                }
                required
              />
            </div>

            <div className="form-field">
              <label>
                Priority
              </label>

              <select
                name="priority"
                value={
                  taskForm.priority
                }
                onChange={
                  handleTaskChange
                }
              >
                <option value="HIGH">
                  High
                </option>

                <option value="MEDIUM">
                  Medium
                </option>

                <option value="LOW">
                  Low
                </option>
              </select>
            </div>

            <div className="form-field">
              <label>
                Deadline
              </label>

              <input
                type="date"
                name="deadline"
                value={
                  taskForm.deadline
                }
                onChange={
                  handleTaskChange
                }
              />
            </div>

            <button
              type="submit"
              className="primary-button"
            >
              Add Task
            </button>
          </form>
        </section>

        {/* =========================================================
            TASK LIST
        ========================================================= */}

        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <h2>Task List</h2>

              <p>
                View pending, scheduled and
                completed tasks.
              </p>
            </div>
          </div>

          {loading ? (
            <p>
              Loading tasks...
            </p>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              No tasks yet. Add your first
              task above.
            </div>
          ) : (
            <div className="item-list">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={
                    task.status ===
                    "COMPLETED"
                      ? "task-item completed-task"
                      : "task-item"
                  }
                >
                  <div>
                    <h3>
                      {task.title}
                    </h3>

                    <p>
                      {task.duration} Minutes
                      {" • "}
                      {task.priority.charAt(
                        0
                      ) +
                        task.priority
                          .slice(1)
                          .toLowerCase()}{" "}
                      Priority
                    </p>

                    {/* TASK STATUS BADGE */}

                    <div className="task-status-row">
                      <span
                        className={`task-status-badge ${task.status.toLowerCase()}`}
                      >
                        {task.status}
                      </span>
                    </div>

                    {task.deadline && (
                      <p>
                        Deadline:{" "}
                        {task.deadline}
                      </p>
                    )}

                    {task.scheduledDate && (
                      <p>
                        Scheduled Date:{" "}
                        {
                          task.scheduledDate
                        }
                      </p>
                    )}

                    {task.scheduledStart &&
                      task.scheduledEnd && (
                        <p>
                          Scheduled:{" "}
                          {
                            task.scheduledStart
                          }
                          {" - "}
                          {
                            task.scheduledEnd
                          }
                        </p>
                      )}
                  </div>

                  <div className="task-actions">
                    {task.status !==
                      "COMPLETED" && (
                      <button
                        className="complete-button"
                        onClick={() =>
                          handleCompleteTask(
                            task.id
                          )
                        }
                      >
                        Complete
                      </button>
                    )}

                    {task.status ===
                      "SCHEDULED" && (
                      <button
                        className="replan-button"
                        disabled={planning}
                        onClick={() =>
                          handleUnfinishedTask(
                            task
                          )
                        }
                      >
                        {planning
                          ? "Replanning..."
                          : "Unfinished / Replan"}
                      </button>
                    )}

                    <button
                      className="delete-button"
                      onClick={() =>
                        handleDeleteTask(
                          task.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================
            PLAN MY DAY
        ========================================================= */}

        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <h2>
                Plan My Day
              </h2>

              <p>
                Give the agent your available
                hours and it will automatically
                schedule your pending tasks.
              </p>
            </div>
          </div>

          <form
            className="event-form"
            onSubmit={handlePlanDay}
          >
            <div className="form-field">
              <label>
                Planning Date
              </label>

              <input
                type="date"
                name="date"
                value={
                  plannerForm.date
                }
                onChange={
                  handlePlannerChange
                }
                required
              />
            </div>

            <div className="form-field">
              <label>
                Available From
              </label>

              <input
                type="time"
                name="availableStart"
                value={
                  plannerForm.availableStart
                }
                onChange={
                  handlePlannerChange
                }
                required
              />
            </div>

            <div className="form-field">
              <label>
                Available Until
              </label>

              <input
                type="time"
                name="availableEnd"
                value={
                  plannerForm.availableEnd
                }
                onChange={
                  handlePlannerChange
                }
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={planning}
            >
              {planning
                ? "Planning..."
                : "Plan My Day"}
            </button>
          </form>

          {/* =========================================================
              AGENT PLANNING RESULT
          ========================================================= */}

          {plannerResult && (
            <div className="planner-result">
              <h3>
                Agent Planning Result
              </h3>

              <p>
                Tasks Found:{" "}
                {
                  plannerResult.summary
                    ?.totalPendingTasks
                }
              </p>

              <p>
                Scheduled:{" "}
                {
                  plannerResult.summary
                    ?.scheduled
                }
              </p>

              <p>
                Unscheduled:{" "}
                {
                  plannerResult.summary
                    ?.unscheduled
                }
              </p>

              {/* =====================================================
                  AI PLANNER INSIGHT
              ===================================================== */}

              {plannerResult.aiInsight && (
                <div className="ai-insight-card">
                  <div className="ai-insight-title">
                    ✨ AI Planner Insight
                  </div>

                  <p>
                    {
                      plannerResult.aiInsight
                    }
                  </p>
                </div>
              )}

              {/* SCHEDULED TASK RESULTS */}

              {plannerResult
                .scheduledTasks?.length >
                0 && (
                <div className="planner-result-section">
                  <h4>
                    Scheduled Tasks
                  </h4>

                  {plannerResult.scheduledTasks.map(
                    (task) => (
                      <p
                        key={
                          task.taskId
                        }
                      >
                        ✅ {task.title}:{" "}
                        {task.startTime} -{" "}
                        {task.endTime}
                      </p>
                    )
                  )}
                </div>
              )}

              {/* UNSCHEDULED TASK RESULTS */}

              {plannerResult
                .unscheduledTasks?.length >
                0 && (
                <div className="planner-result-section">
                  <h4>
                    Unscheduled Tasks
                  </h4>

                  {plannerResult.unscheduledTasks.map(
                    (task) => (
                      <p
                        key={
                          task.taskId
                        }
                      >
                        ⚠️ {task.title}
                        {" — "}
                        {task.reason}
                      </p>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* =========================================================
            ADD CALENDAR EVENT
        ========================================================= */}

        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <h2>
                Add Calendar Event
              </h2>

              <p>
                Add fixed commitments such as
                office, meetings, classes or
                appointments.
              </p>
            </div>
          </div>

          <form
            className="event-form"
            onSubmit={handleAddEvent}
          >
            <div className="form-field">
              <label>
                Event Name
              </label>

              <input
                type="text"
                name="title"
                placeholder="Example: Office"
                value={
                  calendarForm.title
                }
                onChange={
                  handleCalendarChange
                }
                required
              />
            </div>

            <div className="form-field">
              <label>
                Date
              </label>

              <input
                type="date"
                name="date"
                value={
                  calendarForm.date
                }
                onChange={
                  handleCalendarChange
                }
                required
              />
            </div>

            <div className="form-field">
              <label>
                Start Time
              </label>

              <input
                type="time"
                name="startTime"
                value={
                  calendarForm.startTime
                }
                onChange={
                  handleCalendarChange
                }
                required
              />
            </div>

            <div className="form-field">
              <label>
                End Time
              </label>

              <input
                type="time"
                name="endTime"
                value={
                  calendarForm.endTime
                }
                onChange={
                  handleCalendarChange
                }
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button"
            >
              Add Event
            </button>
          </form>
        </section>

        {/* =========================================================
            FIXED COMMITMENTS
        ========================================================= */}

        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <h2>
                Today's Conflicts
              </h2>

              <p>
                Fixed commitments the agent
                must avoid while planning.
              </p>
            </div>
          </div>

          {fixedEvents.length === 0 ? (
            <div className="empty-state">
              No fixed calendar commitments.
            </div>
          ) : (
            <div className="item-list">
              {fixedEvents.map((event) => (
                <div
                  className="conflict-item"
                  key={event.id}
                >
                  <div className="conflict-details">
                    <span className="lock-icon">
                      📅
                    </span>

                    <div>
                      <strong>
                        {event.title}
                      </strong>

                      <p>
                        {event.startTime}
                        {" - "}
                        {event.endTime}
                      </p>

                      <p>
                        {event.date}
                      </p>
                    </div>
                  </div>

                  <button
                    className="delete-button"
                    onClick={() =>
                      handleDeleteEvent(
                        event.id
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================
            TODAY'S SCHEDULE
        ========================================================= */}

        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <h2>
                Today's Schedule
              </h2>

              <p>
                Fixed commitments and tasks
                automatically planned by the
                agent.
              </p>
            </div>
          </div>

          {sortedEvents.length === 0 ? (
            <div className="empty-state">
              Your schedule is empty.
            </div>
          ) : (
            <div className="schedule-list">
              {sortedEvents.map((event) => (
                <div
                  className="schedule-item"
                  key={event.id}
                >
                  <div className="schedule-time">
                    {event.startTime}
                  </div>

                  <div className="schedule-line">
                    <span />
                  </div>

                  <div className="schedule-content">
                    <div className="schedule-title-row">
                      <h3>
                        {event.title}
                      </h3>

                      <span
                        className={
                          event.eventType ===
                          "PLANNED"
                            ? "event-badge planned-badge"
                            : "event-badge fixed-badge"
                        }
                      >
                        {event.eventType ===
                        "PLANNED"
                          ? "AI Planned"
                          : "Fixed Commitment"}
                      </span>
                    </div>

                    <p>
                      {event.startTime}
                      {" - "}
                      {event.endTime}
                    </p>

                    <span>
                      {event.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;