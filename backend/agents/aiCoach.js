import OpenAI from "openai";

/*
|--------------------------------------------------------------------------
| OPENAI CLIENT
|--------------------------------------------------------------------------
*/

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/*
|--------------------------------------------------------------------------
| GPT-6 LUNA PLANNING INSIGHT
|--------------------------------------------------------------------------
*/

export const generatePlanningInsight = async ({
  date,
  scheduledTasks,
  unscheduledTasks,
}) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is missing from backend/.env"
    );
  }

  const scheduleText = scheduledTasks
    .map(
      (task) =>
        `${task.title}: ${task.startTime} - ${task.endTime}, Priority: ${task.priority}`
    )
    .join("\n");

  const unscheduledText = unscheduledTasks
    .map(
      (task) =>
        `${task.title}: ${task.reason}`
    )
    .join("\n");

  const response =
    await openai.responses.create({
      model: "gpt-6-luna",

      instructions: `
You are an intelligent Daily Planner Agent.

Your job is to review the user's generated daily schedule.

Give:
1. A short summary of the day.
2. One productivity suggestion.
3. Mention any unscheduled tasks.
4. Keep the response concise and friendly.

Do not change the schedule.
The deterministic planner has already checked calendar conflicts.
      `,

      input: `
Planning date: ${date}

Scheduled tasks:
${scheduleText || "No scheduled tasks"}

Unscheduled tasks:
${unscheduledText || "None"}
      `,
    });

  return response.output_text;
};