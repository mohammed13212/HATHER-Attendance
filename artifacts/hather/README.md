# HATHER — QR Code Attendance System

A modern, responsive university attendance system where instructors generate QR codes for students to scan and check in.

---

## How It Works

1. **Instructor** opens `/instructor`, logs in with the password, fills in Course / Section / Lecture, and clicks **Generate QR**.
2. A unique QR code and attendance link are created and displayed.
3. The instructor projects the QR code in class.
4. **Students** scan the QR code with their phone, enter their 9-digit University ID, and click **Check In**.
5. Attendance is recorded in Google Sheets via Google Apps Script.

---

## Project Structure

```
artifacts/hather/
├── src/
│   ├── config.ts           ← App configuration (Apps Script URL, password)
│   ├── App.tsx             ← Router setup (Wouter)
│   ├── pages/
│   │   ├── StudentPage.tsx ← Student check-in page (route: /)
│   │   └── InstructorPage.tsx ← Instructor panel (route: /instructor)
│   └── index.css           ← Global styles
├── google-apps-script/
│   └── Code.gs             ← Google Apps Script backend code
└── README.md
```

---

## Setup

### 1. Google Sheets & Apps Script

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com).
2. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
3. Open [script.google.com](https://script.google.com) → New project.
4. Paste the contents of `google-apps-script/Code.gs`.
5. Replace `YOUR_SPREADSHEET_ID_HERE` with your actual Spreadsheet ID.
6. Click **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Authorize the app and copy the **Web App URL**.

### 2. Configure the App

Open `src/config.ts` and update:

```ts
export const config = {
  // Paste your Google Apps Script Web App URL here:
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",

  // Change the instructor panel password:
  INSTRUCTOR_PASSWORD: "hather2024",

  APP_NAME: "HATHER",
  UNIVERSITY_NAME: "University Attendance System",
};
```

### 3. Deploy to GitHub Pages

1. Push the project to GitHub.
2. Run the Vite build: `pnpm --filter @workspace/hather run build`
3. Deploy the `dist/public` folder to GitHub Pages.
4. Set `base` in `vite.config.ts` to your repo name if using a subdirectory, e.g. `base: "/hather/"`.

---

## Google Sheets Structure

The script automatically creates a sheet named **Attendance** with these columns:

| Timestamp | Student ID | Course | Section | Lecture |
|-----------|-----------|--------|---------|---------|

---

## Features

- **Student page**: 9-digit ID validation, loading state, success/error feedback, duplicate-check via Apps Script
- **Instructor panel**: Password-protected, QR code generation (qrcode.react), download QR as PNG, copy attendance link
- **Dark mode**: Toggle persisted in localStorage
- **RTL / Arabic**: Language toggle with full Arabic translations
- **Responsive**: Mobile, tablet, and desktop layouts

---

## Default Credentials

| Setting | Default Value |
|---------|---------------|
| Instructor Password | `hather2024` |

Change `INSTRUCTOR_PASSWORD` in `src/config.ts` before deploying to production.

---

## Security Notes

- The instructor password is client-side only — suitable for university classroom use but not for high-security scenarios.
- Data validation is performed both client-side and in the Apps Script.
- The Apps Script URL is stored in `config.ts` — do not commit sensitive credentials to public repositories.
