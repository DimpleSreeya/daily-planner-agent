import {
  getCalendarEvents,
  createCalendarEvent,
} from "../tools/mockCalendar.js";

import {
  getPendingTasks,
  updateTask,
} from "../tools/taskList.js";

/*
|--------------------------------------------------------------------------
| PRIORITY ORDER
|--------------------------------------------------------------------------
*/

const priorityValue = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/*
|--------------------------------------------------------------------------
| TIME → MINUTES
|--------------------------------------------------------------------------
*/

const timeToMinutes = (time) => {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
};

/*
|--------------------------------------------------------------------------
| MINUTES → TIME
|--------------------------------------------------------------------------
*/

const minutesToTime = (minutes) => {
  const hours = Math.floor(
    minutes / 60
  );

  const mins = minutes % 60;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(mins).padStart(2, "0")}`;
};

/*
|--------------------------------------------------------------------------
| CHECK OVERLAP
|--------------------------------------------------------------------------
*/

const hasOverlap = (
  startA,
  endA,
  startB,
  endB
) => {
  return (
    startA < endB &&
    endA > startB
  );
};

/*
|--------------------------------------------------------------------------
| FIND FREE TIME
|--------------------------------------------------------------------------
*/

const findFreeTime = ({
  date,
  duration,
  availableStart,
  availableEnd,
  calendarEvents,
  blockedSlots = [],
}) => {
  const dayStart =
    timeToMinutes(availableStart);

  const dayEnd =
    timeToMinutes(availableEnd);

  /*
  |--------------------------------------------------------------------------
  | CHECK EVERY 15 MINUTES
  |--------------------------------------------------------------------------
  */

  for (
    let start = dayStart;
    start + duration <= dayEnd;
    start += 15
  ) {
    const end = start + duration;

    /*
    |--------------------------------------------------------------------------
    | CHECK EXISTING CALENDAR EVENTS
    |--------------------------------------------------------------------------
    */

    const calendarConflict =
      calendarEvents.some((event) => {
        if (event.date !== date) {
          return false;
        }

        const eventStart =
          timeToMinutes(
            event.startTime
          );

        const eventEnd =
          timeToMinutes(
            event.endTime
          );

        return hasOverlap(
          start,
          end,
          eventStart,
          eventEnd
        );
      });

    if (calendarConflict) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK BLOCKED OLD SLOT
    |--------------------------------------------------------------------------
    */

    const blockedConflict =
      blockedSlots.some((slot) => {
        if (slot.date !== date) {
          return false;
        }

        const blockedStart =
          timeToMinutes(
            slot.startTime
          );

        const blockedEnd =
          timeToMinutes(
            slot.endTime
          );

        return hasOverlap(
          start,
          end,
          blockedStart,
          blockedEnd
        );
      });

    if (blockedConflict) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | FREE SLOT FOUND
    |--------------------------------------------------------------------------
    */

    return {
      startTime:
        minutesToTime(start),

      endTime:
        minutesToTime(end),
    };
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| DAILY PLANNER AGENT
|--------------------------------------------------------------------------
*/

export const runPlannerAgent = ({
  date,
  availableStart,
  availableEnd,

  /*
  |--------------------------------------------------------------------------
  | USED DURING REPLANNING
  |--------------------------------------------------------------------------
  */

  avoidStart = null,
  avoidEnd = null,
}) => {
  if (
    !date ||
    !availableStart ||
    !availableEnd
  ) {
    throw new Error(
      "Date and available hours are required"
    );
  }

  if (
    timeToMinutes(availableStart) >=
    timeToMinutes(availableEnd)
  ) {
    throw new Error(
      "Available start time must be before end time"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PERCEIVE
  |--------------------------------------------------------------------------
  */

  const pendingTasks =
    getPendingTasks();

  const calendarEvents = [
    ...getCalendarEvents(),
  ];

  /*
  |--------------------------------------------------------------------------
  | BLOCK PREVIOUS SLOT DURING REPLAN
  |--------------------------------------------------------------------------
  */

  const blockedSlots = [];

  if (avoidStart && avoidEnd) {
    blockedSlots.push({
      date,
      startTime: avoidStart,
      endTime: avoidEnd,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | PLAN
  | HIGH PRIORITY FIRST
  |--------------------------------------------------------------------------
  */

  const sortedTasks = [
    ...pendingTasks,
  ].sort((a, b) => {
    const priorityDifference =
      priorityValue[a.priority] -
      priorityValue[b.priority];

    if (
      priorityDifference !== 0
    ) {
      return priorityDifference;
    }

    /*
    |--------------------------------------------------------------------------
    | SAME PRIORITY → EARLIER DEADLINE
    |--------------------------------------------------------------------------
    */

    if (
      a.deadline &&
      b.deadline
    ) {
      return a.deadline.localeCompare(
        b.deadline
      );
    }

    if (a.deadline) {
      return -1;
    }

    if (b.deadline) {
      return 1;
    }

    return 0;
  });

  const scheduledTasks = [];

  const unscheduledTasks = [];

  /*
  |--------------------------------------------------------------------------
  | ACTION
  |--------------------------------------------------------------------------
  */

  for (const task of sortedTasks) {
    const freeTime =
      findFreeTime({
        date,

        duration:
          Number(task.duration),

        availableStart,

        availableEnd,

        calendarEvents,

        blockedSlots,
      });

    /*
    |--------------------------------------------------------------------------
    | NO FREE SLOT
    |--------------------------------------------------------------------------
    */

    if (!freeTime) {
      unscheduledTasks.push({
        taskId: task.id,

        title: task.title,

        reason:
          "Not enough free time available",
      });

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE MOCK CALENDAR EVENT
    |--------------------------------------------------------------------------
    */

    const calendarEvent =
  createCalendarEvent({
    title: task.title,

    date,

    startTime:
      freeTime.startTime,

    endTime:
      freeTime.endTime,

    eventType: "PLANNED",

    taskId: task.id,
  });
    /*
    |--------------------------------------------------------------------------
    | UPDATE TASK
    |--------------------------------------------------------------------------
    */

    updateTask(task.id, {
      status: "SCHEDULED",

      scheduledEventId:
        calendarEvent.id,

      scheduledDate: date,

      scheduledStart:
        freeTime.startTime,

      scheduledEnd:
        freeTime.endTime,
    });

    /*
    |--------------------------------------------------------------------------
    | PREVENT NEXT TASK FROM USING SAME TIME
    |--------------------------------------------------------------------------
    */

    calendarEvents.push(
      calendarEvent
    );

    scheduledTasks.push({
      taskId: task.id,

      title: task.title,

      priority: task.priority,

      duration: task.duration,

      date,

      startTime:
        freeTime.startTime,

      endTime:
        freeTime.endTime,

      calendarEventId:
        calendarEvent.id,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | REVIEW
  |--------------------------------------------------------------------------
  */

  return {
    success: true,

    message:
      "Daily plan created successfully",

    scheduledTasks,

    unscheduledTasks,

    summary: {
      totalPendingTasks:
        pendingTasks.length,

      scheduled:
        scheduledTasks.length,

      unscheduled:
        unscheduledTasks.length,
    },
  };
};