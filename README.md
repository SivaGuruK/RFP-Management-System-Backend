# RFP Management System – Backend

## 1. Project Overview
a. **Project Name:** RFP Management System (Backend)  
b. **Description:** A backend service that manages RFPs, vendors, proposal analysis, email parsing, and AI-powered processing.  
c. **Key Features:**  
   - Create & manage RFPs  
   - Vendor CRUD & search  
   - AI-based proposal generation and comparison  
   - Email ingestion & parsing  
   - Dashboard analytics
d. **Goals:** Provide scalable backend APIs supporting the full RFP workflow including AI-driven insights.

---

## 2. Project Setup

### a. **Prerequisites**
- Node.js **v20+**  
- npm **v9+**  
- Docker **v24+** (optional)  
- MongoDB (local or cloud - MongoDB Atlas)  

---

## 2.1 Environment Variables  
Create a `.env` file in the root directory:

The environmental variables is available on Notion:
🔗 [RFP Management System Environmental Variables](https://www.notion.so/env-2c1c01c760ed80c8b705d33feade52d8?source=copy_link)

> **Note:**  
> The environment variables in notion contain **real, temporary credentials intentionally shared only for evaluation purposes**.  
> These credentials will be **revoked, rotated, or deactivated immediately after the assessment**.  

---

## 3. Installation Steps

### 🔹 Clone Repository
```bash
git clone https://github.com/SivaGuruK/RFP-Management-System-Backend.git
cd RFP-Management-System-Backend
```

---

## 3.1 Manual Installation (Node + Express + TypeScript)

### 🔹 Install Dependencies
```bash
npm install
```
### 🔹 Start Compilation
```bash
tsc -w
```
### 🔹 Run in Development
```bash
npm run dev
```
---

## 3.2 Running with Docker

### 🔹 Build & Start
```bash
docker-compose up --build
```

### 🔹 Stop
```bash
docker-compose down
```

---

## 4. Tech Stack

| Category | Tech |
|---------|------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB (Mongoose) |
| Email Processing | IMAP client & custom parser |
| AI Provider | OpenRouter API |
| AI Model | amazon/nova-2-lite-v1:free (OpenRouter API) |
| Background Jobs | Node-Cron |
| Validation | Zod & Custom validators |
| Logging | Winston |
| Architecture | MVC + Services + Repositories |

## 5. API Documentation

The full API documentation, including all endpoints, request/response examples, and query parameters, is available on Notion:

🔗 [RFP Management System API Docs](https://www.notion.so/RFP-MANAGEMENT-SYSTEM-2c1c01c760ed806891b7f70d6a5f3ba7?source=copy_link)

> Note: The Notion page contains interactive examples and structured tables for easier reference.

## 6. Decisions & Assumptions

### a. Design Decisions
- REST architecture with modular services.  
- AI tasks separated into dedicated service layer.  
- Email polling handled via cron at 60-second intervals.  
- Mongoose models structured by domain (rfp, vendor, email,proposals).  
- Reusable middlewares for logging, error handling, validation.

### b. Assumptions
- AI output is deterministic enough for parsing.  
- Emails follow consistent vendor reply format.  
- Frontend always sends JSON.  
- Vendor responses always via inbound email.

### c. Limitations
- No rate-limiting added yet.  
- Cron job stops when server restarts.

---

## 7. Folder Structure (Simplified)

```txt
src/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── services/
 ├── utils/
 ├── middlewares/
 ├── jobs/
 └── index.ts
```

---

## 8. Running in Production

### Build
```bash
npm run build
```

### Start
```bash
npm start
```

---

## 9. License
This project is for evaluation purposes only.

## 10. License  
This project is for educational and evaluation purposes only.
