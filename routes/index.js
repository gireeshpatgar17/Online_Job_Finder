const express=require('express');
const app=express();
const multer = require("multer");

// File storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(express.static("public"));

const collection=require('../models/script');
const Contact=require('../models/contact');
const Job=require('../models/jobpost');
const Application = require('../models/application');
// const bcrypt=require('bcrypt');
const path=require('path');

app.use(express.json());

// app.use(express.urlencoded({extended:false}));


app.set("view engine","ejs");

app.use(express.json());

app.use(express.urlencoded({extended:false}));

const session = require('express-session');


// Configure session middleware
app.use(session({
    secret: 'your-secret-key',  // Replace with a strong secret key for session encryption
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,  // Set to true if you're using https
        maxAge: 1000 * 60 * 60 * 24  // Optional: Set session expiration time (1 day)
    }
}));


app.get('/', async (req, res) => {
    

    try {
      const jobs = await Job.find(); // Fetch all job posts from DB
      res.render('index', { jobs ,user: req.session.user}); // Pass to index.ejs
    } catch (err) {
      console.error('Error fetching jobs:', err);
      res.status(500).send('Server Error');
    }
});


app.get('/login', function(req, res) {
    const message = req.query.message || ''; // get ?message=loggedout if present
    res.render("login", { message: message });
});

// GET /signup
app.get('/signup', function(req, res) {
    res.render('signup', { 
        error: null,
        success: null
    });
});

//GET /apply now
app.get('/application',function(req,res){
  res.render("apply");
})

//RECRUITERS

app.get('/recruiters',function(req,res){
    res.render('recruiters');
});

app.get('/post-job',function(req,res){
    if (req.session.user && req.session.user.role === 'recruiter') {
        res.render('postjob'); // Render the job post form
      } else {
        res.redirect('/');
      } 
});


app.get('/apply' ,function(req,res){
    res.render('apply')
});

// GET contact form for specific job
app.get('/contact/:jobId', async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.redirect('/?error=Job not found');
        }
        
        res.render('contact', { 
            job: job,
            user: req.session.user || null, // Pass user or null if not logged in
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (err) {
        console.error(err);
        res.redirect('/?error=Error loading contact form');
    }
});
// POST send message about specific job
app.post('/contact/:jobId', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.redirect(`/contact/${req.params.jobId}?error=Job not found`);
    }

    // Prepare contact data
    const contactData = {
      job: job._id,
      recruiter: job.postedBy,
      name: name,
      email: email,
      message: message
    };

    if (req.user) {
      contactData.user = req.user._id;
    }

    await Contact.create(contactData);

    // Redirect back to contact page with success message
    res.redirect(`/contact/${req.params.jobId}?success=Message sent successfully`);
  } catch (err) {
    console.error('Contact submission error:', err);
    res.redirect(`/contact/${req.params.jobId}?error=Error sending message`);
  }
});

// Route to view a single job
app.get('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate({
        path: 'postedBy',
        model: 'Recruiter', // Explicitly specify model name
        select: 'name company'
      });
    
    if (!job) {
      return res.status(404).send('Job not found');
    }

    res.render('job-details', { job });
  } catch (err) {
    console.error('Job view error:', err);
    res.status(500).send('Error loading job');
  }
});

app.get('/recruiter-dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'recruiter') {
    return res.redirect('/login');
  }

  try {
    const messages = await Contact.find({ recruiter: req.session.user._id })
      .populate('job', 'title')
      .populate('user', 'name email')
      .sort('-createdAt');

    res.render('recruiter-dashboard', {
      user: req.session.user,
      messages: messages.map(msg => ({
        ...msg.toObject(),
        sender: msg.user || { name: msg.name, email: msg.email }
      }))
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('recruiter-dashboard', {
      user: req.session.user,
      messages: [],
      error: 'Failed to load messages'
    });
  }
});
// POST /signup
app.post('/signup', async (req, res) => {
    const data = {
        name: req.body.username,
        password: req.body.password,

        role: req.body.role || "applicant", // default to applicant if not provided
        company: req.body.role === "recruiter" ? req.body.company || "" : "" 
        
    };

    try {
        const exist = await collection.findOne({ name: data.name });
        if (exist) {
            return res.render('signup', { 
                error: "Username already exists. Please choose a different username.",
                success: null
            });
        }

        await collection.create(data);
        res.render('signup', { 
            success: "Account successfully created! You can now log in.",
            error: null
        });
    } catch (err) {
        console.error("Signup Error:", err); 
        res.render('signup', { 
            error: "Something went wrong. Please try again.",
            success: null
        });
    }
});

//Login use

app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      const check = await collection.findOne({ name: username });
      if (!check) {
        return res.render('login', { error: "Username not found" });
      }
  
      if (password !== check.password) {
        return res.render('login', { error: "Wrong password" });
      }
  
      // Store user in session
      req.session.user = check;
  
      // Redirect after login (everyone goes to index, recruiters can go to recruiter page from there)
      res.redirect('/');
  
    } catch (err) {
      res.render('login', { error: "Something went wrong" });
    }
  });
  

//   app.post('/contact', async (req, res) => {
//     try {
//         const { name, email, message } = req.body;

//         // Simple validation
//         if (!name || !email || !message) {
//             return res.render('contact', {
//                 error: 'All fields are required!',
//                 success: null
//             });
//         }

//         // Save to database
//         await Contact.create({ name, email, message });

//         // Success response
//         res.render('contact', {
//             success: 'Your message has been sent!',
//             error: null
//         });
//     } catch (err) {
//         console.error('Contact form error:', err);
//         res.render('contact', {
//             error: 'Something went wrong. Please try again.',
//             success: null
//         });
//     }
// });


// POST /apply - Handle job application form submission
app.post('/apply', upload.fields([
  { name: 'certificates', maxCount: 5 },
  { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      name,
      dob,
      age,
      gender,
      address,
      email,
      phone,
      degree,
      specialization,
      university,
      gradYear,
      percentage,
      experienceYears,
      previousRole,
      companyName,
      jobDuration,
      keyResponsibilities,
      skills,
      github,
      personalWebsite
    } = req.body;

    const certificates = req.files['certificates']
      ? req.files['certificates'].map(file => file.filename)
      : [];

    const resume = req.files['resume']
      ? req.files['resume'][0].filename
      : "";

    const newApplication = new Application({
      name,
      dob,
      age,
      gender,
      address,
      email,
      phone,
      degree,
      specialization,
      university,
      gradYear,
      percentage,
      experienceYears,
      previousRole,
      companyName,
      jobDuration,
      keyResponsibilities,
      skills,
      certificates,
      github,
      personalWebsite,
      resume
    });

    await newApplication.save();
    console.log("Saved to MongoDB!");

    res.render('apply', {
      success: 'Your application has been submitted successfully!',
      error: null
    });

  } catch (err) {
    console.error('Error submitting application:', err);
    res.render('apply', {
      success: null,
      error: 'Something went wrong. Please try again.'
    });
  }
});



const jobIcons = [
    'job-offer.png',
    'posting.png',
    'promotion.png',
    'search.png',
];

// Route to handle job posting by recruiter
const sharp = require('sharp');
const path1 = require('path');
const fs = require('fs'); // Add filesystem module
const application = require('../models/application');

app.post('/post-job', async (req, res) => {
    
  try {
    const { title, description, type, deadline } = req.body;
    const postedBy = req.session.user._id;
    const role = req.session.user.role || 'Recruiter';

    // 1. Define available icons (relative to public/images/)
    const jobIcons = [
      'job-offer.png',
      'posting.png',
      'promotion.png',
      'search.png',
    ];

    // 2. Get random icon
    const randomIcon = jobIcons[Math.floor(Math.random() * jobIcons.length)];
    
    // 3. Construct CORRECT paths
    const publicImagesPath = path.join(__dirname, '..', 'public', 'images');
    const originalIconPath = path.join(publicImagesPath, randomIcon);
    const iconsDir = path1.join(publicImagesPath, 'icons');

    // 4. Verify paths exist
    if (!fs.existsSync(originalIconPath)) {
      throw new Error(`Original icon not found at: ${originalIconPath}`);
    }

    // Create icons directory if missing
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    // 5. Process image
    const resizedIconName = `resized-${randomIcon}`;
    const resizedIconPath = path.join(iconsDir, resizedIconName);

    await sharp(originalIconPath)
      .resize(50, 50)
      .toFile(resizedIconPath);

    // 6. Save job with relative path
    const newJob = new Job({
      title,
      role,
      description,
      type,
      deadline,
      postedBy,
      icon: `icons/${resizedIconName}`, // Relative to public/images
    });

    await newJob.save();
    res.redirect('/');

  } catch (err) {
    console.error('Error posting job:', err.message); // More detailed error
    res.status(500).send(`Error: ${err.message}`);
  }
});


app.delete('/messages/:id', async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

app.get('/logout', (req, res) => {
  // Destroy session or clear login info
  req.session.destroy(err => {
    if (err) {
      console.log('Logout Error:', err);
      return res.redirect('/recruiter-dashboard'); // or wherever user was
    }
    // Redirect to login page with a query param to show message
    res.redirect('/login?message=loggedout');
  });
});


const port=4000;
app.listen(port);
console.log(`port:${port} is listening`);