document.addEventListener("DOMContentLoaded", function () {
  const userForm = document.getElementById("userForm");
  const photoInput = document.getElementById("photo");
  const photoPreview = document.getElementById("photoPreview");
  const previewImage = document.getElementById("previewImage");

  // New elements for certificate
  const certificateInput = document.getElementById("certificate");
  const certificatePreview = document.getElementById("certificatePreview");
  const certificateFileName = document.getElementById("certificateFileName");
  const certificateImagePreview = document.getElementById(
    "certificateImagePreview"
  );
  const certificatePdfPreview = document.getElementById(
    "certificatePdfPreview"
  );
  const previewCertificateImage = document.getElementById(
    "previewCertificateImage"
  );

  const processingDiv = document.getElementById("processing");

  // Modals
  const termsModal = new bootstrap.Modal(document.getElementById("termsModal"));
  const paymentModal = new bootstrap.Modal(
    document.getElementById("paymentModal")
  );

  // Modal buttons
  const acceptTermsBtn = document.getElementById("acceptTermsBtn");
  const declineTermsBtn = document.getElementById("declineTermsBtn");
  const completePaymentBtn = document.getElementById("completePaymentBtn");
  const cancelPaymentBtn = document.getElementById("cancelPaymentBtn");

  // Show image preview when a photo is selected
  photoInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImage.src = e.target.result;
        photoPreview.classList.remove("d-none");
      };
      reader.readAsDataURL(file);
    }
  });

  // Show certificate preview when selected
  certificateInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      certificateFileName.textContent = "Selected file: " + file.name;

      if (file.type === "application/pdf") {
        certificateImagePreview.classList.add("d-none");
        certificatePdfPreview.classList.remove("d-none");
      } else {
        // It's an image
        const reader = new FileReader();
        reader.onload = function (e) {
          previewCertificateImage.src = e.target.result;
          certificateImagePreview.classList.remove("d-none");
          certificatePdfPreview.classList.add("d-none");
        };
        reader.readAsDataURL(file);
      }

      certificatePreview.classList.remove("d-none");
    }
  });

  // Handle form submission
  userForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Get the Aadhar number
    const aadhar = document.getElementById("aadhar").value;

    if (aadhar) {
      // First check if user already exists
      fetch(`/api/check-user/${aadhar}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.exists) {
            // Show user exists notification
            showUserExistsAlert();
          } else {
            // Show terms and conditions modal
            termsModal.show();
          }
        })
        .catch((error) => {
          console.error("Error checking user existence:", error);
          // Proceed anyway in case of error
          termsModal.show();
        });
    } else {
      // No Aadhar provided, show validation message
      alert("Please provide an Aadhar number");
    }
  });

  // Add this function to show the user exists alert
  function showUserExistsAlert() {
    // Remove any existing alert
    const existingAlert = document.getElementById("userExistsAlert");
    if (existingAlert) {
      existingAlert.remove();
    }

    // Create new alert
    const alertDiv = document.createElement("div");
    alertDiv.id = "userExistsAlert";
    alertDiv.className = "alert alert-warning alert-dismissible fade show";
    alertDiv.role = "alert";
    alertDiv.innerHTML = `
    <strong>User Already Exists!</strong> A user with this Aadhar number is already registered.
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

    // Insert at the top of the form
    const cardBody = document.querySelector(".card-body");
    cardBody.insertBefore(alertDiv, cardBody.firstChild);

    // Scroll to the top to make sure the alert is visible
    window.scrollTo(0, 0);
  }

  // Terms modal: Decline button
  declineTermsBtn.addEventListener("click", function () {
    termsModal.hide();
    alert("You must accept the terms and conditions to proceed.");
  });

  // Terms modal: Accept button
  acceptTermsBtn.addEventListener("click", function () {
    termsModal.hide();
    // Show payment modal
    paymentModal.show();
  });

  // Payment modal: Cancel button
  cancelPaymentBtn.addEventListener("click", function () {
    paymentModal.hide();
  });

  // Payment modal: Pay button
  completePaymentBtn.addEventListener("click", function () {
    paymentModal.hide();

    // Now proceed with form submission
    submitFormData();
  });

  // Function to handle actual form submission
  function submitFormData() {
    // Show processing indicator
    processingDiv.classList.remove("d-none");

    // Create FormData object to send form data including files
    const formData = new FormData(userForm);

    // Send form data to server
    fetch("/api/submit", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // Hide processing indicator
        processingDiv.classList.add("d-none");

        if (data.success) {
          // Redirect to ID card page with payment status in URL parameter
          window.location.href = `/view-card/${data.userId}?paymentStatus=success`;
        } else {
          alert("Error: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        processingDiv.classList.add("d-none");
        alert("An error occurred. Please try again.");
      });
  }
});
