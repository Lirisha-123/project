# Mentor Bridge Server-Side Rendered Web App Development Plan

## Completed Steps
- [x] Analyze existing codebase (Express.js with Jade templates, basic MVC structure)
- [x] Confirm plan with user
- [x] Update package.json to add Mongoose, jsonwebtoken, bcryptjs, cors, express-session, connect-flash
- [x] Install backend dependencies (npm install)
- [x] Set up MongoDB connection in app.js
- [x] Create Mongoose models (User, Match) in App_Server/Models/
- [x] Create controllers for mentoring features (users.js)
- [x] Update routes in App_Server/routes/index.js and users.js

## Pending Steps
- [x] Update User model to include 'admin' role
- [x] Modify app.js to use Jade view engine, add session and auth middleware, remove Angular serving
- [x] Create authentication middleware for protected routes
- [x] Create new Jade templates: layout.jade, login.jade, register.jade, profile.jade, dashboard.jade, admin.jade
- [x] Update routes to render Jade templates with authentication
- [x] Add admin-specific features (e.g., view all users, manage matches)
- [x] Style templates with Bootstrap for proper web page look
- [x] Implement matching logic and display in dashboard
- [x] Test login, registration, and profile pages
- [x] Test full app locally
- [x] Remove old Jade view files and Angular app directory
