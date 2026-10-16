const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const API_URL =
  `${BASE_URL}/api/calendar`;

// Get all calendar events
export const getCalendarEvents = async () => {
  const response = await fetch(API_URL);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to load calendar events"
    );
  }

  return data;
};

// Create calendar event
export const createCalendarEvent = async (eventData) => {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(eventData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to create calendar event"
    );
  }

  return data;
};

// Update calendar event
export const updateCalendarEvent = async (
  id,
  eventData
) => {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(eventData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to update calendar event"
    );
  }

  return data;
};

// Delete calendar event
export const deleteCalendarEvent = async (id) => {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to delete calendar event"
    );
  }

  return data;
};