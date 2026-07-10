# JSPL Workshop Dashboard & PPT Generator

A comprehensive Next.js web application designed to manage monthly workshop submissions, generate automated PowerPoint presentations, and collect live feedback from participants via dynamic QR codes.

## Features

- **Automated PPT Generation**: Instantly compiles user submissions into a beautifully formatted, premium PowerPoint presentation.
- **Live Feedback System**: Generates dynamic QR codes linked to your local IP network, allowing workshop attendees to scan and submit real-time suggestions from their mobile devices without needing internet access.
- **User Roles & Access Control**: Secure Role-Based Access Control (RBAC) with `Super Admin`, `Admin`, and `User` roles.
- **Live Toaster Notifications**: Admins receive instant, non-intrusive popup notifications on the dashboard when a new suggestion is submitted live.
- **Mobile-First Native Forms**: Feedback forms are engineered to bypass restrictive mobile WebView constraints (like those found in QR scanner apps), ensuring 100% submission reliability across all devices.

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
1. [Node.js](https://nodejs.org/en/download/) (v18 or higher)
2. [Git](https://git-scm.com/downloads)
3. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required to run the PostgreSQL database locally)

---

## Getting Started

Follow these step-by-step instructions to get the project running on your local machine.

### 1. Start the Database
This project uses a PostgreSQL database. A `docker-compose.yml` file is included to easily spin up a local database container.

Open your terminal in the project root and run:
```bash
docker compose up -d
```
*Note: The `-d` flag runs it in detached mode so you can continue using the terminal.*

### 2. Install Dependencies
Install all the necessary Node modules:
```bash
npm install
```

### 3. Setup Environment Variables
Create a file named `.env` in the root directory and add the following configuration:
```env
# PostgreSQL connection string pointing to your local Docker container
DATABASE_URL="postgresql://jspl_user:jspl_password@localhost:5432/jspl_db?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:4000"
NEXTAUTH_SECRET="any_secure_random_string_here"
```

### 4. Setup the Database Schema
Sync the Prisma schema with your newly created PostgreSQL database:
```bash
npx prisma db push
```

### 5. Run the Application
Start the Next.js development server. We use port `4000` to avoid conflicts with other apps:
```bash
npm run dev -- -p 4000
```

### 6. Access the Dashboard
- **Local Access**: Open [http://localhost:4000](http://localhost:4000) in your laptop's browser.
- **Mobile/Network Access**: Look at your terminal output for the **Network** IP (e.g., `http://192.168.x.x:4000`). Make sure your phone is connected to the same Wi-Fi network and open that URL to test mobile features!

---

## Architecture & Technologies

- **Frontend**: Next.js 14 (App Router), React, standard CSS for premium glassy aesthetics.
- **Backend**: Next.js API Routes, NextAuth for authentication.
- **Database**: PostgreSQL orchestrated via Prisma ORM.
- **PPT Generation**: `PptxGenJS`
- **QR Codes**: `qrcode` & `qrcode.react` (Fully local, no external APIs used).
