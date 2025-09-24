document.addEventListener("DOMContentLoaded", function () {
  const dobInput = document.getElementById("dob");
  const ageInput = document.getElementById("age");
  const gradYearInput = document.getElementById("gradYear");
  const form = document.getElementById("jobApplicationForm");
  const successMessage = document.getElementById("successMessage");
  const formSections = document.querySelectorAll(".form-section");

  // Auto-calculate age from DOB
  dobInput.addEventListener("change", function () {
    const dob = new Date(dobInput.value.split('-').reverse().join('-'));
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    ageInput.value = age;
  });

  // Graduation year validation: must be a 4-digit number
  gradYearInput.addEventListener("input", function () {
    const year = gradYearInput.value;
    if (!/^\d{4}$/.test(year)) {
      gradYearInput.setCustomValidity("Please enter a valid 4-digit year (e.g., 2024).");
    } else {
      gradYearInput.setCustomValidity("");
    }
  });

  // Handle form submission
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Check if form is valid
    if (!form.checkValidity()) {
      alert("Please fill out all required fields.");
      return;
    }

    // Hide form sections and display success message
    formSections.forEach(section => section.classList.add("hidden"));
    successMessage.classList.remove("hidden");
  });
});


async function submitForm(event) {
    // event.preventDefault(); // Prevent default form submission

    const form = document.getElementById('jobApplicationForm');
    const formData = new FormData(form);

    try {
      const response = await fetch('/apply', {
        method: 'POST',
        body: formData
      });

      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert("Failed to submit. Please check console for details.");
    }
  }
