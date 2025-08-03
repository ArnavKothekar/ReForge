
---
# Hephaestus App – Technical Specification

## 1. Overview
This document outlines the technical implementation plan for the Hephaestus web application. The architecture is designed around a central data model stored in the browser's localStorage. This approach simulates a NoSQL database (like MongoDB) and ensures data persistence across user sessions. All application logic will be implemented in Vanilla JavaScript, with dependencies (Tailwind CSS, FontAwesome, Chart.js) loaded via CDN.

**Assumption:** The application will be a Single Page Application (SPA). Navigation will be handled by showing and hiding different page div containers rather than full page reloads.

## 2. Data Model (localStorage)
A single JSON object will be stored in localStorage under the key `hephaestusUserData`. This object will serve as the single source of truth for the entire application state. All reads and writes to localStorage should be managed by dedicated helper functions to ensure consistency.

**localStorage Key:** `hephaestusUserData`

**Data Structure Example:**

```json
{
  "currency": 0,
  "dailyTasks": [
    { "id": 1, "text": "Task 1: Drink a glass of water", "completed": false },
    { "id": 2, "text": "Task 2: 5 minutes of stretching", "completed": false },
    { "id": 3, "text": "Task 3: Write one positive thought", "completed": false },
    { "id": 4, "text": "Task 4: Reach out to a friend", "completed": false }
  ],
  "rewards": {
    "availableBackgrounds": [
      { "id": "bg1", "name": "Forest Path", "cost": 10, "url": "pexels-url-1.jpg" },
      { "id": "bg2", "name": "Calm Beach", "cost": 10, "url": "pexels-url-2.jpg" },
      { "id": "bg3", "name": "Mountain Sunrise", "cost": 25, "url": "pexels-url-3.jpg" }
    ],
    "unlockedBackgroundIds": [],
    "selectedBackgroundId": null
  },
  "patientProfile": {
    "phqScore": null,
    "gadScore": null,
    "moodLikert": null,
    "sentiment": ""
  },
  "metrics": {
    "emotional": 0,
    "physical": 0,
    "social": 0,
    "cognitive": 0
  }
}
```

### State Management Functions

- **stateManager.js** module to handle all interactions with localStorage.
  - `getState()`: Reads the `hephaestusUserData` string from localStorage, parses it into a JavaScript object, and returns it. If no data exists, it should create and return the default structure defined above.
  - `setState(newState)`: Takes a JavaScript object, converts it to a JSON string using ` JSON.stringify()`,and saves it to localStorage under the `hephaestusUserData` key.

## 3. Core Feature Implementation

### 3.1. Dashboard View
**Objective:** Display the daily checklist and currency total. Update currency when tasks are completed.

#### Implementation Steps

- **Initial Render:**
  - On page load, call `getState()` to retrieve the current application state.
  - Target a div container for the checklist (e.g., `#task-list`).
  - Iterate through the `state.dailyTasks` array. For each task object, dynamically create an HTML list item containing a checkbox (`<input type="checkbox">`) and a label.
  - Set the `checked` property of the checkbox based on the task's `completed` status in the state object.
  - Display the `state.currency` value in the currency counter element (e.g., `#currency-total`).

- **Task Completion Logic:**
  - Attach a change event listener to the `#task-list` container, delegating it to the checkboxes.
  - When a checkbox is checked/unchecked:
    - Get the id of the corresponding task.
    - Retrieve the current state using `getState()`.
    - Find the task in the `state.dailyTasks` array and update its `completed` property.
    - If the task is newly completed (changing from `false` to `true`), increment `state.currency` by 1.
    - If a task is unchecked, decrement `state.currency` by 1. Ensure currency cannot go below zero.
    - Update the on-screen currency display immediately.
    - Save the modified state object back to localStorage using `setState(newState)`.

### 3.2. Patient About Me Page
**Objective:** Collect user-reported metrics via a form and save them to localStorage.

#### Implementation Steps

- **Form Creation:**
  - Create an HTML form with inputs for PHQ, GAD, Likert scales, and a text area for sentiment. Use appropriate input types (e.g., `<input type="range">` for sliders, `<select>` for dropdowns).

- **Populate Form with Existing Data:**
  - On page load, get the current state via `getState()`.
  - Populate the form input values from the `state.patientProfile` object. This ensures data persistence is visible to the user.

- **Data Saving Logic:**
  - Attach a submit event listener to the form.
  - Inside the listener, prevent the default form submission behavior.
  - Read the current values from all form inputs.
  - Get the current state using `getState()`.
  - Update the `state.patientProfile` object with the new values from the form.
  - Crucially, calculate and update the `state.metrics` object. (Assumption: The four pillar scores are derived from the form inputs. For example: emotional score might be an average of PHQ, GAD, and mood; physical score from a dedicated question, etc. Define this mapping clearly.)
  - Example mapping: `metrics.emotional = (10 - phqScore) + (10 - gadScore)`. This logic needs to be defined based on clinical guidance.
  - Save the entire updated state object back to localStorage using `setState(newState)`.

### 3.3. Specialist View
**Objective:** Display the four core patient metrics on a Chart.js radar chart.

#### Implementation Steps

- **Chart Canvas:**
  - Add a `<canvas>` element to the HTML for this view (e.g., `<canvas id="metricsRadarChart"></canvas>`).

- **Chart Initialization:**
  - Create a function `renderOrUpdateChart()`.
  - Inside this function, get the latest data using `getState()`.
  - Extract the four values from `state.metrics`: emotional, physical, social, and cognitive.
  - Instantiate a new Chart.js chart, targeting the canvas element.
    - `type: 'radar'`
    - `data:`
      - `labels: ['Emotional', 'Physical', 'Social', 'Cognitive']`
      - `datasets:` An array with one dataset object. The `data` property of this object should be an array containing the four metric values: `[state.metrics.emotional, state.metrics.physical, ...]`.
    - Configure options for styling as needed.

- **Dynamic Updates:**
  - The chart should be re-rendered whenever the underlying data changes. Call `renderOrUpdateChart()` whenever the "Specialist View" page becomes active.
  - To ensure the chart reflects new data from the "About Me" page, either re-initialize the chart when the view is shown or implement a more advanced pub/sub pattern where saving the form publishes an "update" event that the chart module subscribes to. For this project, re-rendering on view activation is sufficient.

### 3.4. The FUN Page (Rewards)
**Objective:** Allow users to spend currency to unlock Pexels backgrounds.

#### Implementation Steps

- **Grid Rendering:**
  - On page load, get the current state using `getState()`.
  - Target a grid container (`#rewards-grid`).
  - Iterate through the `state.rewards.availableBackgrounds` array.
  - For each background, create a div element.
    - Check if the background's id exists in the `state.rewards.unlockedBackgroundIds` array.
    - If unlocked: Display the background image. Add a "Select" button.
    - If locked: Display a placeholder, an icon (e.g., a lock), and the currency cost. Add an "Unlock" button. Disable the button if `state.currency` is less than the cost.

- **Unlocking Logic:**
  - Attach a click event listener to the `#rewards-grid`, delegating to the "Unlock" buttons.
  - When a button is clicked:
    - Get the id and cost of the background.
    - Get the current state using `getState()`.
    - Check if `state.currency >= cost`.
    - If sufficient currency exists:
      - Subtract the cost from `state.currency`.
      - Push the background's id into the `state.rewards.unlockedBackgroundIds` array.
      - Save the new state using `setState(newState)`.
      - Re-render the rewards grid to reflect the change in status.
      - Update the main currency display on the page.

### 3.5. Chatbot & FAQ
**Objective:** Provide a static, tabbed interface for support content.

#### Implementation Steps

- **HTML Structure:**
  - Create a set of tab buttons (`<button>`) for "Mental," "Physical," "Social," "Cognitive," and "FAQ."
  - Create corresponding content divs for each tab.

- **Tab-Switching Logic:**
  - Attach a click event listener to the container of the tab buttons.
  - On click, identify the target tab.
  - Add an active class to the clicked button and remove it from all others.
  - Show the corresponding content div and hide all others.

- **Content:**
  - The content for each tab will be hardcoded HTML containing pre-written text and guidance.
  - The FAQ tab will contain a list of questions and answers. No search functionality is required for the core implementation.
