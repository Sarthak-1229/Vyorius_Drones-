# Vyorius Drones Internship Assessment Report

**Applicant:** Sarthak  
**Email:** sarthak.b.1204@gmail.com  
**Phone:** 7715073009  
**GitHub Repository:** [https://github.com/Sarthak-1229/Vyorius_Drones-.git](https://github.com/Sarthak-1229/Vyorius_Drones-.git)

<img src="./github_qr.png" alt="GitHub Repository QR Code" width="150" />

---

Hi Vyorius Drones Team! Thank you so much for the opportunity to complete this assessment for my internship interview. Over the past few days, I've had a great time tackling this assignment and building out the Kanban Board application. My main goal was to deliver something that wasn't just functionally complete according to the requirements, but genuinely felt like a modern, production-ready tool that showcases my attention to detail.

Here is a breakdown of what I built, the design decisions I made, and the extra features I added along the way to demonstrate my technical capabilities.

## Testing Credentials
To test the Role-Based Access Control (RBAC) and deletion privileges, you can log in using the pre-seeded system administrator account:
- **Admin Username (Operator ID):** `sarthak`
- **Password:** `sarthak_1204`

*(Note: Standard operator accounts can be created directly on the login page via the "Create Operator Profile" tab to test real-time multi-user synchronization.)*

## 1. Project Overview
I built the application using a **React** frontend (powered by Vite for fast builds) and a **Node.js/Express** backend, with **MongoDB** handling the data storage. The core of the app revolves around **Socket.IO**—I wanted to make sure that the moment a user moves a task, everyone else sees it happen instantly without needing to refresh their page.

## 2. Core Features & What I Learned

### Real-Time Syncing (Socket.IO)
Getting the WebSockets to play nicely with the drag-and-drop library was definitely a fun challenge! I set up a bi-directional connection so that whenever a task is created, updated, or dragged into a new column, the backend immediately broadcasts that change. I also had to write a small normalizer function on the frontend to ensure MongoDB's `_id` format matched exactly what the UI expected, which completely eliminated any glitching during live updates.

### Authentication & Security
I implemented a secure JWT-based login system. I also built a custom dual-login portal so team members can log in using either their Email or their Operator ID. 
To add a layer of realism, I built in **Role-Based Access Control (RBAC)**. For example, regular operators can create and move tasks, but only the system admin (`sarthak`) has the authority to permanently delete tasks from the board.

### Smooth Task Management
- **Drag & Drop:** I used `@hello-pangea/dnd` to make moving tasks between the "To Do", "In Progress", and "Done" columns feel snappy and fluid.
- **File Uploads:** I added a drag-and-drop zone for attachments. If a user uploads an image, it instantly converts to Base64 and renders a preview on the card. If it's a document (like a PDF), it renders as a neat, clickable download link.

## 3. Going the Extra Mile (Bonus Features)
I wanted the board to look and feel premium, so I went with a striking "Dark Brutalist" UI aesthetic. On top of the core requirements, I added a few quality-of-life features:

- **Search & Quick Filters:** I built a control panel right above the board. Users can instantly filter tasks by typing in the search bar, or use the 1-click chips to only show *High Priority* tasks, *Bugs*, or tasks specifically *Assigned to Me*. 
- **Assignments:** Whenever a user creates a task, it's automatically assigned to them. The UI renders a clean circular avatar with their initial on the task card so it's easy to see who is handling what at a glance.
- **Overdue Alerts:** I added a Due Date picker. If a task misses its deadline and isn't in the "Done" column, the card actually pulses with a red warning border to grab the team's attention!
- **Read-Only Details Modal:** Instead of just opening an edit form, clicking anywhere on a task card now opens a really clean "Details View" showing the full description, assignment info, timestamps, and full-size image previews.

## 4. Testing & Quality Assurance
I wanted to make sure the app was actually robust, so I spent a good amount of time writing tests.
- **Unit & Integration Tests:** I wrote 37 tests using Vitest and React Testing Library to verify that the form validations and UI components worked perfectly in isolation.
- **End-to-End Testing:** Using Playwright, I wrote an automated suite that actually logs in as the admin, opens a headless browser, and simulates complex drag-and-drop workflows. 
- *My favorite test:* I wrote a multi-browser simulation that opens two completely independent browser windows, creates a task in Window A, and verifies that it magically pops up in Window B via WebSockets!

## 5. Deployment Readiness
Before wrapping up, I made sure the codebase was clean. I ran the Vite production build to ensure there were no compilation errors, fixed all ESLint warnings, and created `.env.example` templates for both the frontend and backend so the app is incredibly easy for anyone else to spin up locally.

---

Thanks again for reviewing my work! This assignment was a great learning experience, and I'm really proud of how the final application turned out. I'm looking forward to your feedback!
