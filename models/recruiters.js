const mongoose = require("mongoose");

// Define the recruiter schema
const recruiterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    company: {
        type: String,
        required: true,
    }
});

// Export the Recruiter model
module.exports = mongoose.model("Recruiter", recruiterSchema);
