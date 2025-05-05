let dealType = "";

function initMultiPicklist({ inputId, listId, selectedContainerId, hiddenInputId, wrapperClass = 'custom-multiselect' }) {
    const roleInput = document.getElementById(inputId);
    const optionsList = document.getElementById(listId);
    const selectedOptionsContainer = document.getElementById(selectedContainerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const wrapper = roleInput.closest(`.${wrapperClass}`);
  
    let selectedValues = [];
  
    roleInput.addEventListener("click", () => {
      optionsList.style.display = optionsList.style.display === "block" ? "none" : "block";
    });
  
    optionsList.addEventListener("click", (e) => {
      const value = e.target.getAttribute("data-value");
      if (value && !selectedValues.includes(value)) {
        selectedValues.push(value);
        updateSelectedOptions();
      }
    });
  
    selectedOptionsContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove")) {
        const value = e.target.getAttribute("data-value");
        selectedValues = selectedValues.filter(v => v !== value);
        updateSelectedOptions();
      }
    });
  
    function updateSelectedOptions() {
      hiddenInput.value = selectedValues.join(", ");
      selectedOptionsContainer.innerHTML = "";
      selectedValues.forEach(value => {
        const span = document.createElement("span");
        span.innerHTML = `${value} <span class="remove" data-value="${value}">&times;</span>`;
        selectedOptionsContainer.appendChild(span);
      });
  
      const allOptions = optionsList.querySelectorAll("div[data-value]");
      allOptions.forEach(option => {
        const val = option.getAttribute("data-value");
        option.style.display = selectedValues.includes(val) ? "none" : "block";
      });
    }
  
    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) {
        optionsList.style.display = "none";
      }
    });
}

function getSelectedRoles() {
    const selectedRoles = document.getElementById("role-values").value.split(",").filter(r => r.trim() !== "");
    console.log("Selected Roles:", selectedRoles);
    return selectedRoles;
}
  

document.addEventListener("DOMContentLoaded", function () {
    initMultiPicklist({
        inputId: "amendment-process",
        listId: "options-list",
        selectedContainerId: "selected-options",
        hiddenInputId: "role-values"
    });

    initMultiPicklist({
        inputId: "another-input",
        listId: "another-options",
        selectedContainerId: "another-selected",
        hiddenInputId: "another-hidden"
    });

    initMultiPicklist({
        inputId: "license-application",
        listId: "license-options",
        selectedContainerId: "selected-license",
        hiddenInputId: "license-values"
        });
});

window.onload = function () {
    const loadingOverlay = document.getElementById("loading-overlay");
    const formContainer = document.querySelector(".form-container");
  
    const prospectTypeField = document.getElementById("prospect-type");
    const licenseAppWrapper = document.getElementById("license-application-wrapper");
    const licenseAppField = document.getElementById("license-application");
    const amendmentProcessWrapper = document.getElementById("amendment-process-wrapper");
    const remarksWrapper = document.getElementById("remarks-wrapper");
    const amendmentProcessField = document.getElementById("role-values");
  
    const optionsList = document.getElementById("options-list");
    const selectedOptionsContainer = document.getElementById("selected-options");
  
    function updateRoleValues() {
      const values = Array.from(selectedOptionsContainer.querySelectorAll("span")).map(span =>
        span.getAttribute("data-value")
      );
      amendmentProcessField.value = values.join(",");
    }
  
    function updateFieldVisibility() {
      const prospectValue = (prospectTypeField?.value || "").trim();
      const licenseAppValue = (licenseAppField?.value || "").trim();
      const amendmentProcessValue = (amendmentProcessField?.value || "").trim();
  
      const selectedAmendments = amendmentProcessValue.split(",").map(val => val.trim());
  
      licenseAppWrapper.style.display = "none";
      amendmentProcessWrapper.style.display = "none";
      remarksWrapper.style.display = "none";
  
      if (prospectValue === "Renewal Trade License") {
        licenseAppWrapper.style.display = "block";
  
        if (licenseAppValue === "License Renewal with Amendment") {
          amendmentProcessWrapper.style.display = "block";
  
          if (selectedAmendments.includes("Others")) {
            remarksWrapper.style.display = "block";
          }
        }
  
      } else if (prospectValue === "Amendment Trade License") {
        amendmentProcessWrapper.style.display = "block";
  
        if (selectedAmendments.includes("Others")) {
          remarksWrapper.style.display = "block";
        }
      }
    }
  
    // Event handlers for custom multiselect
    optionsList.addEventListener("click", (e) => {
      if (e.target && e.target.dataset.value) {
        const selectedValue = e.target.dataset.value;
  
        const existing = selectedOptionsContainer.querySelector(`[data-value="${selectedValue}"]`);
        if (!existing) {
          const span = document.createElement("span");
          span.setAttribute("data-value", selectedValue);
          span.innerHTML = `${selectedValue} <span class="remove">×</span>`;
          selectedOptionsContainer.appendChild(span);
        }
  
        updateRoleValues();
        updateFieldVisibility();
      }
    });
  
    selectedOptionsContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove")) {
        const span = e.target.parentElement;
        span.remove();
        updateRoleValues();
        updateFieldVisibility();
      }
    });
  
    // Standard field listeners
    prospectTypeField?.addEventListener("change", updateFieldVisibility);
    licenseAppField?.addEventListener("change", updateFieldVisibility);
  
    ZOHO.embeddedApp.on("PageLoad", async (entity) => {
      loadingOverlay.style.display = "flex";
  
      const entityId = entity.EntityId[0];
      try {
        const quoteResponse = await ZOHO.CRM.API.getRecord({
          Entity: "Quotes",
          approved: "both",
          RecordID: entityId
        });
  
        const quoteData = quoteResponse.data[0];
        const dealId = quoteData.Deal_Name.id;
  
        const dealResponse = await ZOHO.CRM.API.getRecord({
          Entity: "Deals",
          approved: "both",
          RecordID: dealId
        });
  
        const dealData = dealResponse.data[0];
        const dealType = dealData.Type;
  
        if (prospectTypeField) {
          prospectTypeField.value = dealType || "N/A";
          updateFieldVisibility();
        }
  
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        loadingOverlay.style.display = "none";
        formContainer.style.display = "block";
      }
    });
  
    ZOHO.embeddedApp.init();
  };
  
