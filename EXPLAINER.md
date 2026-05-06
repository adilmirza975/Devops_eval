# 🚀 ShopSmart: Project Explainer & Guide

This document provides a detailed walkthrough of the **ShopSmart** project, explaining how each requirement was implemented, the technical choices made, and how the entire system fits together. Use this as your "cheat sheet" to explain the project!

---

## 🏗️ 1. Architecture & Design Decisions
**The Goal:** A scalable, modern full-stack application with a clear separation of concerns.

- **Frontend (client/):** Built with **React 18** and **Vite**. Vite was chosen for its extreme speed and modern development experience.
- **Backend (server/):** A **Node.js/Express** API. It follows a modular structure where `app.js` defines the logic and `index.js` starts the server.
- **Design Style:** Modern "Dark Mode" aesthetic using high-contrast colors, glassmorphism (blurs), and smooth transitions to feel premium.
- **Communication:** The frontend talks to the backend via RESTful APIs (`fetch`).

---

## 🛠️ 2. GitHub Workflows / CI (Automated Pipeline)
**The Goal:** Automatically catch errors before they reach the user.

We implemented **4 main GitHub Action workflows** in `.github/workflows/`:
1.  **`backend-tests.yml`**: Runs on every push/PR. It installs dependencies, runs the **ESLint** (linter), and executes **Jest** tests.
2.  **`Frontend-test.yml`**: Same as backend, but for the React app using **Vitest**.
3.  **`e2e-tests.yml`**: Runs complex user-flow tests using **Playwright**.
4.  **`deploy-pages.yml`**: Automatically builds and deploys the frontend to GitHub Pages.

---

## 🎨 3. Frontend Implementation
**The Goal:** A reactive, high-performance UI.

- **Features:** 
  - Dynamic Product Grid (fetched from API).
  - Category Filtering (real-time).
  - Sliding Cart Drawer (state-managed).
  - Toast Notifications (feedback on actions).
- **Responsive:** The UI uses CSS Grid and Flexbox to work perfectly on Mobile, Tablet, and Desktop.

---

## 🧪 4. Unit Testing
**The Goal:** Test small bits of code in isolation.

- **Tools:** **Vitest** (Frontend) and **Jest** (Backend).
- **Example:** We test if the "ShopSmart" title renders correctly or if the backend's health check object has the right timestamp format.
- **Mocking:** We use "mocks" to simulate the network so we don't need a real internet connection to run these tests.

---

## 🔗 5. Integration Testing
**The Goal:** Test how different parts work together.

- **Backend:** We use **Supertest** to send real HTTP requests to our Express app and check if the API returns 200 OK and valid JSON.
- **Frontend:** We test the flow of fetching data and ensuring the UI updates automatically once the data arrives.

---

## 🎭 6. End-to-End (E2E) Testing
**The Goal:** Simulate a real user.

- **Tool:** **Playwright**.
- **The Flow:** It opens a real Chromium browser, visits the URL, clicks buttons, and verifies that the page "looks" and "behaves" right.
- **Why:** This catches bugs that Unit tests miss (e.g., "The button is there, but it's hidden behind a header").

---

## 🧹 7. PR Checks (Linting)
**The Goal:** Keep code clean and consistent.

- **Tool:** **ESLint**.
- **How it works:** If you write "messy" code (like unused variables), the CI will **fail** the Pull Request. This forces every developer to follow the same coding standards.

---

## 🤖 8. Dependabot Configuration
**The Goal:** Keep libraries secure and up to date.

- **File:** `.github/dependabot.yml`.
- **What it does:** Every week, GitHub checks for new versions of our packages (React, Express, etc.). If an update exists, it **automatically** creates a Pull Request for us to review.

---

## ☁️ 9. AWS EC2 + GitHub Integration
**The Goal:** Automated Deployment.

- **Workflow:** `deploy to Ec2.yml`.
- **How it works:** When code is pushed to the `demo` branch, GitHub uses an **SSH Key** (stored as a Secret) to log into your AWS Ubuntu server, transfer the files, and restart the Nginx web server.

---

## 🔄 10. Idempotent Scripts
**The Goal:** "Run it once or a thousand times, result is the same."

- **File:** `setup.sh`.
- **Why it's smart:** 
  - It checks if `node_modules` exists before installing (saves time).
  - It creates `.env` files *only* if they are missing (doesn't overwrite your secrets).
  - It creates folders only if they don't exist.

---

## 🏁 11. Challenges & Solutions
- **Challenge:** API was returning 404 in integration tests.
- **Solution:** Added a "Catch-all 404" middleware to the Express app to handle undefined routes gracefully.
- **Challenge:** Testing Library found multiple "Electronics" labels (one on a button, one on a product).
- **Solution:** Refined the tests to search by **Role** (e.g., `{ role: 'button' }`) to be more specific.

---

## 🚀 Final Summary of Tools
| Feature | Tool |
| :--- | :--- |
| **Frontend** | React, Vite, ESLint |
| **Backend** | Node.js, Express, Jest, Supertest |
| **E2E** | Playwright |
| **CI/CD** | GitHub Actions |
| **Automation** | Dependabot, Idempotent Bash Scripts |
