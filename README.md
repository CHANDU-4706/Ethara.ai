# Team Task Manager

A full-stack Team Task Manager application built with Next.js, Prisma, and PostgreSQL. It features authentication, project tracking, role-based access control, and a beautifully designed custom UI.

## Features

- **Authentication**: Custom JWT-based user Signup/Login.
- **Roles**: Create Admin users who can create projects, and Member users who just work on tasks.
- **Projects**: Create projects, add members, and manage tasks within projects.
- **Tasks Board**: Assign tasks, set priorities, due dates, and update statuses (Pending, In Progress, Completed).
- **Dashboard**: A comprehensive dashboard showing task statistics (Total, Overdue, Pending).
- **Beautiful Design**: Modern dark, glassmorphic UI using standard CSS variables without heavy frameworks.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Backend APIs**: Next.js Route Handlers
- **Database**: PostgreSQL / SQLite (via Prisma ORM)
- **Authentication**: JWT & bcryptjs
- **Styling**: Vanilla CSS Modules (no Tailwind)

## Setup for Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   By default, it uses SQLite for local development. Run migrations to create `dev.db`:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

4. **Navigate to App**
   Open [http://localhost:3000](http://localhost:3000)

## Deployment (Railway)

This repository is pre-configured to be deployed on Railway.

1. Create a [Railway account](https://railway.app/).
2. Click **New Project** and select **Deploy from GitHub repo**.
3. Select this repository.
4. Add a **PostgreSQL** database service to your Railway project.
5. In your web application's service settings on Railway, go to the **Variables** tab and add:
   - `DATABASE_URL`: Add `{​​{Postgres.DATABASE_URL}}` to automatically link the database.
   - `JWT_SECRET`: Any secure random string (e.g., `super-secret-key-12345`).
6. Railway will automatically detect the `npm run build` and `npm start` commands and deploy the application.
