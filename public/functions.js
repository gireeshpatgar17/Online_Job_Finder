// Purpose: Add browser-side behavior to the application form, including calculating age from date of birth.
document.addEventListener('DOMContentLoaded', () => {
  const dobInput = document.getElementById('dob');
  const ageInput = document.getElementById('age');
  const gradYearInput = document.getElementById('gradYear');
  if (dobInput && ageInput) {
    dobInput.addEventListener('change', () => {
      const parts = dobInput.value.trim().split('-');
      let dob;
      if (parts[0]?.length === 4) dob = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
      else if (parts.length === 3) dob = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (!dob || Number.isNaN(dob.getTime()) || dob > new Date()) {
        ageInput.value = '';
        return;
      }
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
      ageInput.value = age >= 0 ? age : '';
    });
  }
  if (gradYearInput) {
    gradYearInput.addEventListener('input', () => {
      gradYearInput.setCustomValidity(/^\d{4}$/.test(gradYearInput.value) ? '' : 'Enter a four-digit graduation year.');
    });
  }
});
