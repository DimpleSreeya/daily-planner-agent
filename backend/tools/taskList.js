import {
  readStorage,
  writeStorage,
} from "./storage.js";

/*
|--------------------------------------------------------------------------
| GET ALL TASKS
|--------------------------------------------------------------------------
*/

export const getTasks = () => {
  const data = readStorage();

  return data.tasks;
};

/*
|--------------------------------------------------------------------------
| GET ONE TASK
|--------------------------------------------------------------------------
*/

export const getTaskById = (id) => {
  const data = readStorage();

  return (
    data.tasks.find(
      (task) =>
        task.id === Number(id)
    ) || null
  );
};

/*
|--------------------------------------------------------------------------
| ADD TASK
|--------------------------------------------------------------------------
*/

export const addTask = ({
  title,
  duration,
  priority = "MEDIUM",
  deadline = null,
}) => {
  const data = readStorage();

  const newTask = {
    id: Date.now(),

    title,

    duration: Number(duration),

    priority,

    deadline,

    status: "PENDING",

    scheduledEventId: null,

    scheduledDate: null,

    scheduledStart: null,

    scheduledEnd: null,
  };

  data.tasks.push(newTask);

  writeStorage(data);

  return newTask;
};

/*
|--------------------------------------------------------------------------
| UPDATE TASK
|--------------------------------------------------------------------------
*/

export const updateTask = (
  id,
  updatedData
) => {
  const data = readStorage();

  const index = data.tasks.findIndex(
    (task) =>
      task.id === Number(id)
  );

  if (index === -1) {
    return null;
  }

  data.tasks[index] = {
    ...data.tasks[index],
    ...updatedData,
  };

  writeStorage(data);

  return data.tasks[index];
};

/*
|--------------------------------------------------------------------------
| COMPLETE TASK
|--------------------------------------------------------------------------
*/

export const completeTask = (id) => {
  const data = readStorage();

  const index = data.tasks.findIndex(
    (task) =>
      task.id === Number(id)
  );

  if (index === -1) {
    return null;
  }

  data.tasks[index].status =
    "COMPLETED";

  writeStorage(data);

  return data.tasks[index];
};

/*
|--------------------------------------------------------------------------
| MARK TASK AS UNFINISHED
|--------------------------------------------------------------------------
*/

export const markTaskUnfinished = (
  id
) => {
  const data = readStorage();

  const index = data.tasks.findIndex(
    (task) =>
      task.id === Number(id)
  );

  if (index === -1) {
    return null;
  }

  data.tasks[index] = {
    ...data.tasks[index],

    status: "PENDING",

    scheduledEventId: null,

    scheduledDate: null,

    scheduledStart: null,

    scheduledEnd: null,
  };

  writeStorage(data);

  return data.tasks[index];
};

/*
|--------------------------------------------------------------------------
| GET PENDING TASKS
|--------------------------------------------------------------------------
*/

export const getPendingTasks = () => {
  const data = readStorage();

  return data.tasks.filter(
    (task) =>
      task.status === "PENDING"
  );
};

/*
|--------------------------------------------------------------------------
| DELETE TASK
|--------------------------------------------------------------------------
*/

export const deleteTask = (id) => {
  const data = readStorage();

  const index = data.tasks.findIndex(
    (task) =>
      task.id === Number(id)
  );

  if (index === -1) {
    return false;
  }

  data.tasks.splice(
    index,
    1
  );

  writeStorage(data);

  return true;
};