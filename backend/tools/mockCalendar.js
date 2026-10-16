import {
  readStorage,
  writeStorage,
} from "./storage.js";

/*
|--------------------------------------------------------------------------
| GET ALL CALENDAR EVENTS
|--------------------------------------------------------------------------
*/

export const getCalendarEvents = () => {
  const data = readStorage();

  return data.events;
};

/*
|--------------------------------------------------------------------------
| CREATE CALENDAR EVENT
|--------------------------------------------------------------------------
*/

export const createCalendarEvent = ({
  title,
  date,
  startTime,
  endTime,
  eventType = "FIXED",
  taskId = null,
}) => {
  const data = readStorage();

  const newEvent = {
    id: Date.now(),

    title,

    date,

    startTime,

    endTime,

    /*
    |--------------------------------------------------------------------------
    | FIXED   → Office / Meeting / Appointment
    | PLANNED → Task automatically scheduled by agent
    |--------------------------------------------------------------------------
    */

    eventType,

    taskId,
  };

  data.events.push(newEvent);

  writeStorage(data);

  return newEvent;
};

/*
|--------------------------------------------------------------------------
| CHECK CALENDAR CONFLICT
|--------------------------------------------------------------------------
*/

export const checkConflict = ({
  date,
  startTime,
  endTime,
}) => {
  const data = readStorage();

  return data.events.some((event) => {
    if (event.date !== date) {
      return false;
    }

    return (
      startTime < event.endTime &&
      endTime > event.startTime
    );
  });
};

/*
|--------------------------------------------------------------------------
| UPDATE CALENDAR EVENT
|--------------------------------------------------------------------------
*/

export const updateCalendarEvent = (
  id,
  updatedData
) => {
  const data = readStorage();

  const index = data.events.findIndex(
    (event) =>
      event.id === Number(id)
  );

  if (index === -1) {
    return null;
  }

  data.events[index] = {
    ...data.events[index],
    ...updatedData,
  };

  writeStorage(data);

  return data.events[index];
};

/*
|--------------------------------------------------------------------------
| DELETE CALENDAR EVENT
|--------------------------------------------------------------------------
*/

export const deleteCalendarEvent = (
  id
) => {
  const data = readStorage();

  const index = data.events.findIndex(
    (event) =>
      event.id === Number(id)
  );

  if (index === -1) {
    return false;
  }

  data.events.splice(
    index,
    1
  );

  writeStorage(data);

  return true;
};