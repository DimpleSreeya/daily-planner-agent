const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const API_URL =
  `${BASE_URL}/api/agent/plan`;

/*
|--------------------------------------------------------------------------
| RUN DAILY PLANNER AGENT
|--------------------------------------------------------------------------
*/

export const createDailyPlan = async ({
  date,
  availableStart,
  availableEnd,
}) => {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      date,
      availableStart,
      availableEnd,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to create daily plan"
    );
  }

  return data;
};