# Project Summary

This repository is a starter for a real-time Kanban board application built with React, Socket.IO, Vitest, and Playwright.

## What the project currently contains

### `README.md`
- Describes the project goal: build a real-time Kanban board.
- Lists expected features, architecture, and evaluation criteria.
- Explains the frontend/backend structure and testing expectations.

### `backend/`
- `package.json`
  - Defines backend npm scripts: `start` and `dev`.
  - Includes dependencies: `express`, `socket.io`, and `nodemon`.
  - Also includes test-related packages that are not used by backend code (`@playwright/test`, `vitest`, `@testing-library/react`).
- `server.js`
  - Creates an Express HTTP server and attaches Socket.IO.
  - Logs when users connect/disconnect.
  - Contains a TODO comment: WebSocket events for task management are not implemented.

### `frontend/`
- `package.json`
  - Defines a Vite + React app.
  - Scripts: `dev`, `build`, `lint`, `preview`, `test`, `test:e2e`.
  - Dependencies: `react`, `react-dom`, `socket.io-client`.
  - Dev dependencies: Vite, ESLint, React plugin, Vitest, Playwright, testing libraries.
- `vite.config.js`
  - Sets dev server and preview server to port 3000.
  - Configures Vitest with `jsdom`, global APIs, setup file, and excludes `src/tests/e2e`.
- `eslint.config.js`
  - Configures ESLint for JS/JSX, React hooks, and browser globals.
- `index.html`
  - The HTML entrypoint with `<div id="root"></div>`.
- `src/main.jsx`
  - Renders `<App />` into the root element.
- `src/App.jsx`
  - Displays the top-level title and renders `KanbanBoard`.
- `src/components/KanbanBoard.jsx`
  - Placeholder component with a title and TODO comments.
  - No state, no task rendering, no drag-and-drop, no WebSocket logic.
- `src/setupTests.js`
  - Imports `@testing-library/jest-dom` for test assertions.

### `frontend/src/tests/`
- `unit/KanbanBoard.test.jsx`
  - Verifies the placeholder `Kanban Board` title renders.
  - Contains TODO to add more unit tests.
- `integration/WebSocketIntegration.test.jsx`
  - Renders `KanbanBoard` and checks the title.
  - Comments mention a mocked `socket.io-client` library but no actual mock is implemented.
- `e2e/KanbanBoard.e2e.test.js`
  - Visits `http://localhost:3000` and checks the app title is visible.

## What needs to be done

### Backend
- Implement task storage (in-memory or database).
- Add Socket.IO event handlers for:
  - `task:create`
  - `task:update`
  - `task:move`
  - `task:delete`
  - `sync:tasks` / initial sync
- Emit updates to connected clients when tasks change.
- Optionally validate payloads and handle client disconnects gracefully.

### Frontend
- Implement `KanbanBoard` state management for tasks.
- Connect to the backend using `socket.io-client`.
- Build UI columns for `To Do`, `In Progress`, and `Done`.
- Implement task creation, editing, deletion, and moving tasks between columns.
- Add support for:
  - priority/category selection
  - file upload/attachment preview+9999999
  - task progress chart or summary
- Add drag-and-drop functionality.
- Sync frontend state with backend events.

### Tests
- Expand unit tests for task creation, update, deletion, and UI behavior.
- Create integration tests that verify WebSocket updates sync state.
- Enhance E2E tests to cover:
  - adding a task
  - moving a task between columns
  - deleting a task
  - real-time updates across clients
  - priority/category changes
  - file upload behavior

## Summary
- The current codebase is a minimal starter scaffold.
- Backend has a Socket.IO server skeleton but no task logic.
- Frontend has a placeholder Kanban component and basic app wiring.
- Tests are present but mostly placeholders.
- The main work is to implement the actual Kanban board features and WebSocket integration.
