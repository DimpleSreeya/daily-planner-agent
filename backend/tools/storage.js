import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/*
|--------------------------------------------------------------------------
| FILE LOCATION
|--------------------------------------------------------------------------
*/

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const dataFile = path.join(
  __dirname,
  "../data/store.json"
);

/*
|--------------------------------------------------------------------------
| DEFAULT DATA
|--------------------------------------------------------------------------
*/

const defaultData = {
  tasks: [],
  events: [],
};

/*
|--------------------------------------------------------------------------
| ENSURE STORAGE EXISTS
|--------------------------------------------------------------------------
*/

const ensureStorage = () => {
  const dataDirectory =
    path.dirname(dataFile);

  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(
      dataDirectory,
      {
        recursive: true,
      }
    );
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(
      dataFile,
      JSON.stringify(
        defaultData,
        null,
        2
      )
    );
  }
};

/*
|--------------------------------------------------------------------------
| READ STORAGE
|--------------------------------------------------------------------------
*/

export const readStorage = () => {
  ensureStorage();

  try {
    const fileContent =
      fs.readFileSync(
        dataFile,
        "utf-8"
      );

    const data =
      JSON.parse(fileContent);

    return {
      tasks:
        Array.isArray(data.tasks)
          ? data.tasks
          : [],

      events:
        Array.isArray(data.events)
          ? data.events
          : [],
    };
  } catch (error) {
    console.error(
      "Storage read error:",
      error
    );

    return {
      ...defaultData,
    };
  }
};

/*
|--------------------------------------------------------------------------
| WRITE STORAGE
|--------------------------------------------------------------------------
*/

export const writeStorage = (
  data
) => {
  ensureStorage();

  fs.writeFileSync(
    dataFile,
    JSON.stringify(
      data,
      null,
      2
    )
  );
};