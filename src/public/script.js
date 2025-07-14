// public/script.js

document.addEventListener("DOMContentLoaded", () => {
  const headingUpdateForm = document.getElementById("headingUpdateForm");
  const headingInput = document.getElementById("headingInput");
  const myDynamicHeading = document.getElementById("myDynamicHeading"); // Your h2 element

  if (headingUpdateForm) {
    headingUpdateForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent full page reload

      const newHeadingText = headingInput.value.trim();

      if (!newHeadingText) {
        // If input is empty, just return without doing anything
        return;
      }

      try {
        const response = await fetch("/update-heading", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newHeading: newHeadingText }),
        });

        if (response.ok) {
          const data = await response.json();
          // Directly update the h2 text
          if (myDynamicHeading) {
            myDynamicHeading.textContent = data.updatedHeading;
          }
          headingInput.value = ""; // Clear the input field
        } else {
          // Log errors to console, but don't display to user
          const errorData = await response.json();
          console.error(
            "Failed to update heading:",
            response.status,
            errorData.message,
          );
        }
      } catch (error) {
        // Log network errors to console, but don't display to user
        console.error("Network error during PUT request:", error);
      }
    });
  }
});
