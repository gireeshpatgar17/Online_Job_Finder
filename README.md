# Online-JOB-UPDATED

This is a collaborative full-stack web app built using Node.js, MongoDB, and EJS.

## 🚀 How to Run

1. **Install Dependencies**
   - In your terminal, run:
     ```bash
     npm install express
     ```

2. **Start the Server**
   - After installing dependencies, run the following command to start the server:
     ```bash
     node server.js
     ```

3. **Access the Application**
   - Open your browser and visit the following pages:
     - **Home Page**: [http://localhost:4000](http://localhost:4000)
     - **Login Page**: [http://localhost:4000/login](http://localhost:4000/login)
     - **Sign-Up Page**: [http://localhost:4000/signup](http://localhost:4000/signup)

---

## 🛠 Project Structure

### 1. **Backend: `server.js`**
   - This file contains the server-side logic using **Express.js**.
   - It handles routing and renders views using **EJS**.

### 2. **Frontend: `views/` Directory**
   - This folder contains the front-end files (EJS templates):
     - **`index.ejs`**: The home page, with HTML and CSS.
     - **`contact.ejs`**: The contact page, with HTML and CSS.
     - **`login.ejs`**: The login page for both recruiters and applicants.
     - **`signup.ejs`**: The sign-up page for both recruiters and applicants.

---

## 📦 Dependencies
- **Express.js**
- **EJS**
- **MongoDB**

---

Feel free to modify the file structure or add more sections as necessary.

```
Online-JOB-UPDATED
├─ loginpage
├─ models
│  ├─ application.js
│  ├─ contact.js
│  ├─ jobpost.js
│  ├─ recruiters.js
│  └─ script.js
├─ package-lock.json
├─ package.json
├─ public
│  ├─ functions.js
│  ├─ images
│  │  ├─ cv.png
│  │  ├─ icons
│  │  │  ├─ resized-job-offer.png
│  │  │  ├─ resized-posting.png
│  │  │  ├─ resized-promotion.png
│  │  │  └─ resized-search.png
│  │  ├─ job-offer.png
│  │  ├─ posting.png
│  │  ├─ promotion.png
│  │  └─ search.png
│  ├─ re-style.css
│  └─ style.css
├─ README.md
├─ routes
│  └─ index.js
└─ views
   ├─ apply.ejs
   ├─ contact.ejs
   ├─ index.ejs
   ├─ login.ejs
   ├─ postjob.ejs
   ├─ recruiter-dashboard.ejs
   └─ signup.ejs

```