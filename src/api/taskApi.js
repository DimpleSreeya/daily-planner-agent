const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const API_URL =
  `${BASE_URL}/api/tasks`;

/*
|--------------------------------------------------------------------------
| GET ALL TASKS
|--------------------------------------------------------------------------
*/

export const getTasks = async () => {
  const response = await fetch(API_URL);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to load tasks"
    );
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| CREATE TASK
|--------------------------------------------------------------------------
*/

export const createTask = async (
  taskData
) => {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(taskData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to create task"
    );
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| UPDATE TASK
|--------------------------------------------------------------------------
*/

export const updateTask = async (
  id,
  taskData
) => {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(taskData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to update task"
    );
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| COMPLETE TASK
|--------------------------------------------------------------------------
*/

export const completeTask = async (id) => {
  const response = await fetch(
    `${API_URL}/${id}/complete`,
    {
      method: "PATCH",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to complete task"
    );
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| MARK TASK AS UNFINISHED
|--------------------------------------------------------------------------
*/

export const markTaskUnfinished =
  async (id) => {
    const response = await fetch(
      `${API_URL}/${id}/unfinished`,
      {
        method: "PATCH",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to mark task as unfinished"
      );
    }

    return data;
  };

/*
|--------------------------------------------------------------------------
| DELETE TASK
|--------------------------------------------------------------------------
*/

export const deleteTask = async (id) => {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to delete task"
    );
  }

  return data;
};