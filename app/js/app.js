let quoteId, dealId, accountId, dealType, accountJurisdiction, email, applicationId, primaryContactId, contactName;

function showCustomAlert(message) {
  const alertBox = document.getElementById("custom-alert");
  const alertMessage = alertBox.querySelector("p");
  alertMessage.textContent = message;
  alertBox.classList.remove("hidden");
}

function hideCustomAlert() {
  const alertBox = document.getElementById("custom-alert");
  alertBox.classList.add("hidden");
}

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
  if (document.getElementById("amendment-process")) {
    initMultiPicklist({
      inputId: "amendment-process",
      listId: "options-list",
      selectedContainerId: "selected-options",
      hiddenInputId: "role-values"
    });
  }
});

const loadingOverlay = document.getElementById("loading-overlay");
const formContainer = document.querySelector(".form-container");

const prospectTypeField = document.getElementById("prospect-type");
const licenseAppWrapper = document.getElementById("license-application-wrapper");
const licenseAppField = document.getElementById("license-application");
const amendmentProcessWrapper = document.getElementById("amendment-process-wrapper");
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
  // const amendmentProcessValue = (amendmentProcessField?.value || "").trim();
  // const selectedAmendments = amendmentProcessValue.split(",").map(val => val.trim());

  licenseAppWrapper.style.display = "none";
  amendmentProcessWrapper.style.display = "none";

  if (prospectValue === "Renewal Trade License") {
    licenseAppWrapper.style.display = "block";

    if (licenseAppValue === "License Renewal with Amendment") {
      amendmentProcessWrapper.style.display = "block";
    }

  } else if (prospectValue === "Amendment Trade License") {
    amendmentProcessWrapper.style.display = "block";
  }
}

// APPLICATION REMARKS TOGGLE
function toggleRemarksField() {
  const amendmentValues = amendmentProcessValue();
  const remarksWrapper = document.getElementById("remarks-wrapper");

  console.log(amendmentValues);

  if (Array.isArray(amendmentValues) && amendmentValues.length === 1 && amendmentValues[0] === "Others") {
    remarksWrapper.style.display = "block";
  } else {
    remarksWrapper.style.display = "none";
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
      span.innerHTML = `${selectedValue} <span class="remove">x</span>`;
      selectedOptionsContainer.appendChild(span);
    }

    updateRoleValues();
    updateFieldVisibility();
    toggleRemarksField();
  }
});

selectedOptionsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove")) {
    const span = e.target.parentElement;
    span.remove();
    updateRoleValues();
    updateFieldVisibility();
    toggleRemarksField();
  }
});

// Standard field listeners :(
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
    quoteId = quoteData.id;
    dealId = quoteData.Deal_Name.id;

    const dealResponse = await ZOHO.CRM.API.getRecord({
      Entity: "Deals",
      approved: "both",
      RecordID: dealId
    });

    const dealData = dealResponse.data[0];
    dealType = dealData.Type;
    accountId = dealData.Account_Name.id;

    const accountResponse = await ZOHO.CRM.API.getRecord({
      Entity: "Accounts",
      approved: "both",
      RecordID: accountId
    });
    
    const accountData = accountResponse.data[0];
    console.log("Accounts Data: ", accountData);
    accountJurisdiction = accountData.Jurisdiction;
    primaryContactId = accountData.Primary_Contact.id;
    contactName = accountData.Primary_Contact.name;

    if (prospectTypeField) {
      prospectTypeField.value = dealType || "N/A";
      updateFieldVisibility();
      toggleRemarksField();
    }

    // CHECK CREATE NEW LICENSE APPLICATION IF IT IS TRUE
    createNewLicenseApplication = quoteData.Create_New_License_Application;
    if (createNewLicenseApplication === true) {
        showCustomAlert("Record has already been created. Close the form to exit.");
    } else {
        hideCustomAlert();
    }

  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    loadingOverlay.style.display = "none";
    formContainer.style.display = "block";
  }
});

function amendmentProcessValue() {
  const amendmentProcess = document.getElementById("role-values").value.split(",").filter(r => r.trim() !== "");
  console.log("AMENDMENT PROCESS: ", amendmentProcess);
  return amendmentProcess;
}

let isSubmitting = false;
async function create_record(event) {
  event.preventDefault();

  // prevent double submission
  if (isSubmitting) {
    console.log("Submission already in progress.");
    return;
  }

  isSubmitting = true;

  const licenseApplicationValue = document.getElementById("license-application").value;
  const amendmentValues = amendmentProcessValue();
  const prospectTypeFieldValue = document.getElementById("prospect-type").value;
  const remarksValue = document.getElementById("remarks")?.value.trim();

  const licenseError = document.getElementById("license-application-error");
  const amendmentError = document.getElementById("amendment-process-error");

  const remarksError = document.getElementById("remarks-error"); 

  licenseError.style.display = "none";
  amendmentError.style.display = "none";
  remarksError.style.display = "none";

  if (prospectTypeFieldValue === "Renewal Trade License" && licenseApplicationValue === "") {
    licenseError.style.display = "block";
    isSubmitting = false;
    return;
  }


  if (licenseApplicationValue === "License Renewal with Amendment" && amendmentValues.length === 0) {
    amendmentError.style.display = "block";
    isSubmitting = false;
    return;
  }

  
  if (licenseApplicationValue === "License Renewal with Amendment" && amendmentValues.includes("Others") && !remarksValue) {
    remarksError.style.display = "block";
    isSubmitting = false;
    return;
  }


  if (prospectTypeFieldValue === "Amendment Trade License" && amendmentValues.length === 0) {
    amendmentError.style.display = "block";
    isSubmitting = false;
    return;
  }

  let email;
  if ( accountJurisdiction === "Ajman Free Zone" || accountJurisdiction === "Ajman Media City Free Zone") {
    email = "opsn@uaecsp.club";
  } else if (accountJurisdiction === "International Free Zone Authority") {
    email = "partner@ifza.com";
  } else if (accountJurisdiction === "Sharjah Media City") {
    email = "safwan.m@scs.shams.ae";
  } else {
    email = "operations@tlz.ae";
  }

  // get layout id based on license application value and amendment values
  const isOthersSelected = licenseApplicationValue === "License Renewal with Amendment" && amendmentValues.includes("Others");
  const layoutId = isOthersSelected ? "3769920000000570410" : "3769920000104212264";

  const applicationData = {
    Authority_Email_Address: email,
    Deal_Name: dealId,
    Status: "In-Progress",
    Account_Name: accountId,
    Type: dealType,
    License_Jurisdiction: accountJurisdiction,
    Layout: layoutId,
    AML_Connected: true,
    New_Resident_Visa_Stage: "Start",
    License_Renewal_with_amendment: licenseApplicationValue,
    Type_of_Amendment: amendmentValues,
    Employee_Name: primaryContactId,
    PIC_Name: contactName,
    License_Remarks: remarksValue,
  };

  try {
    const appResponse = await ZOHO.CRM.API.insertRecord({
      Entity: "Applications1",
      APIData: applicationData,
    });

    const applicationId = appResponse.data[0].details.id;
    console.log("APPLICATION ID:", applicationId);

    // validate license application and amendment process values
    if (!isOthersSelected) {
      const licenseFormResponse = await ZOHO.CRM.API.insertRecord({
        Entity: "New_License_Forms",
        APIData: {
          New_License_Application: applicationId,
          Application_Stage: "Start",
          Application_Type: dealType,
          Application_Status: "In-Progress",
          AML_Connected: true,
          Layout: "3769920000261689839",
        },
      });

      const licenseFormId = licenseFormResponse.data[0].details.id;
      console.log("LICENSE FORM ID:", licenseFormId);
    }

    // UPDATE QUOTES
    const quoteData = {
        id: quoteId,
        Create_New_License_Application: true,
      }

    const updateQuotes = await ZOHO.CRM.API.updateRecord({
      Entity: "Quotes",
      APIData: quoteData,
    });
    console.log("UPDATE QUOTES RESPONSE:", updateQuotes);

    let license_url = "https://crm.zoho.com/crm/org682300086/tab/CustomModule3/" + applicationId;
    window.open(license_url, "_blank").focus();

    showCustomAlert("Application created successfully, Please close the form.");
  } catch (error) {
    console.error("API Error during record creation:", error);
    alert("API Error during record creation: " + error.message);
  } finally {
    isSubmitting = false;
  }
}

// function hidePopup() {
//   console.log("HIDE");
//   const popup = document.getElementById("custom-alert");
//   popup.style.display = "none";
// }

document.getElementById("record-form").addEventListener("submit", create_record);

ZOHO.embeddedApp.init();
