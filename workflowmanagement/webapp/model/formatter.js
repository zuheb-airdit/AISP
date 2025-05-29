sap.ui.define(
    ["sap/ui/core/format/NumberFormat", "sap/ui/core/format/DateFormat"],
    function (NumberFormat, DateFormat) {
      "use strict";
      return {
        removeCommas: function (sValue, reqType) {
          if (!sValue) {
            return "";
          }
          var oNumberFormat = NumberFormat.getIntegerInstance({
            groupingEnabled: false,
          });
          return oNumberFormat.format(sValue) + " " + reqType;
        },
  
        statusFormatter: function (status, APPROVER_ROLE) {
          console.log("alpha");
          debugger;
          switch (status) {
            case 15:
              return "Not Invited";
            case 2:
              return "Invited";
  
            case 3:
              return "Rejected";
            case 4:
              return `Form in Progress-${APPROVER_ROLE}`;
            case 9:
              return "Send Back";
            default:
              return "No Data";
          }
        },
  
        // statusColorFormatter: function (status) {
        //     console.log("test")
        //     switch (status) {
        //         case 15:
        //             return "Indication13"
        //         case 2:
        //             return "Indication14"
  
        //         case 3:
        //             return "Indication11"
        //         default:
        //             return "None"
        //     }
        // },
  
        createdOnAndByFormatter: function (createdOn) {
          if (!createdOn) {
            return "";
          }
  
          var oDateFormat = DateFormat.getDateInstance({
            pattern: "dd-MM-yyyy",
          });
          var formattedDate = oDateFormat.format(new Date(createdOn));
  
          return formattedDate;
        },
  
        formatDepartment: function (dep) {
          let depArr = dep?.split("-");
          if (depArr && depArr.length > 1) {
            return depArr[1].trim(); // Returns the second element if available, trimming any extra spaces
          } else {
            return dep ? dep.trim() : ""; // Returns the original string if no "-" is found
          }
        },
  
        vendorAccountFormat: function (acc) {
          let depArr = acc?.split("-");
          if (depArr && depArr.length > 1) {
            return depArr[0].trim(); // Returns the second element if available, trimming any extra spaces
          } else {
            return acc ? acc.trim() : ""; // Returns the original string if no "-" is found
          }
        },
  
        formatStatusUser: function (status) {
          if (status == "ACTIVE") {
            return "● Active"; // Add two non-breaking spaces
          } else if (status == "INACTIVE") {
            return "● Inactive";
          } else {
            return `● ${status}`;
          }
        },
  
        getStatusState: function (status) {
          console.log(status);
          if (status == "ACTIVE") {
            return "Indication14";
          } else if (status == "INACTIVE") {
            return "Indication13";
          } else {
            return "Indication12";
          }
        },
  
        statusFormatter: function (status) {
          switch (status) {
            case 2:
              return "Invited";
            case 3:
              return "Rejected";
  
            case 4:
              return "Progress";
            case 5:
              return "Registered";
            case 7:
              return "Send Back";
            case 10:
              return "Deleted";
            case 20:
              return "Initiated";
            default:
              return "None";
          }
        },
  
        validateAllComboBoxes: function (oEvent) {
          let id = oEvent.getSource().getId().trim();
          const oComboBox = sap.ui.getCore().byId(id);
  
          if (!oComboBox) {
            console.error("Invalid ComboBox ID");
            return false;
          }
  
          let bIsValid = true;
  
          const sSelectedKey = oComboBox.getSelectedKey();
          const sValue = oComboBox.getValue();
          const oBinding = oComboBox.getBinding("items");
          let vendorType = sValue.split("-")[0].trim();
          let aItems = [];
  
          // Ensure binding exists before attempting to fetch data
          if (oBinding) {
            aItems = oBinding.getContexts().map((ctx) => ctx.getObject());
          }
  
          // Validate based on keys and text formats
          const bValid = aItems.some((item) => {
            return (
              `${item.code} - ${item.description}` === sSelectedKey ||
              `${item.CODE} - ${item.DESC}` === sSelectedKey ||
              `${item.name} - ${item.id}` === sSelectedKey ||
              `${item.id} - ${item.name}` === sSelectedKey ||
              `${item.Department} - ${item.Dept_Desc}` === sSelectedKey ||
              `${item.COMPANY_CODE}` === sSelectedKey ||
              `${item.accountGroupCode} - ${item.description}` === sValue ||
              `${item.id} - ${item.name}` === sValue ||
              item.code === sSelectedKey ||
              item.id === sValue ||
              item.name === sSelectedKey ||
              item.LAND1 === sSelectedKey
            );
          });
  
          // Set error state only for the invalid ComboBox
          // if (!bValid && sSelectedKey) {
          //     bIsValid = false;
          //     oComboBox.setValueState("Error");
          //     oComboBox.setValueStateText("Invalid selection. Please choose a valid option.");
          // } else if (!bValid && !sSelectedKey && oComboBox.getRequired()) {
          //     bIsValid = false;
          //     oComboBox.setValueState("Error");
          //     oComboBox.setValueStateText("This field is required.");
          // } else {
          //     oComboBox.setValueState("None");
          // }
          if (!bValid) {
            oComboBox.setValueState("Error");
            oComboBox.setValueStateText(
              "Invalid selection. Please choose a valid option."
            );
          } else {
            oComboBox.setValueState("None");
            if (id === "idDepartmenht") {
              this.onDepartmentChange();
            } else if (id === "idVendorGroupTsype" && vendorType) {
              this.onSelectVendorGroup(vendorType);
            }
          }
  
          return bIsValid;
        },
  
        validateReqType: function () {
          debugger;
          let oComboBox = sap.ui.getCore().byId("idReqType");
          const sValue = oComboBox.getValue(); // Get the current value of the ComboBox
          const expectedValue = "Empanelment form to be filled by Supplier";
          if (sValue !== expectedValue) {
            oComboBox.setValueState("Error");
            oComboBox.setValueStateText(
              "Invalid selection. Please choose the correct option."
            );
            return false; // Validation failed
          } else {
            oComboBox.setValueState("None"); // Clear any previous error state
            return true; // Validation passed
          }
        },
  
        onValidateAlphabetInput: function (oEvent) {
          const oInput = oEvent.getSource();
          let id = oInput.getId().trim();
          const sValue = oInput.getValue();
          const sFilteredValue = sValue.replace(/[^a-zA-Z\s]/g, ""); // Allow only alphabets and spaces
  
          // If the input contains invalid characters, sanitize and show error
          if (sValue !== sFilteredValue) {
            oInput.setValue(sFilteredValue);
            oInput.setValueState(sap.ui.core.ValueState.Error);
            oInput.setValueStateText("Only alphabets are allowed.");
            sap.m.MessageToast.show("Only alphabets are allowed.");
          }
          // If the input was in error state and is now valid, clear the error
          else if (oInput.getValueState() === sap.ui.core.ValueState.Error) {
            oInput.setValueState(sap.ui.core.ValueState.None);
            oInput.setValueStateText(""); // Clear the error message
          }
  
          // Uncomment if needed
          // if (id === "idOrgName1") {
          //     this.onLiveVenOrgName();
          // }
        },
  
        formatRequestType: function (requestType) {
          if (requestType === "Create User") {
            return "Created By User";
          } else if (requestType === "Create Supplier") {
            return "Created By Supplier";
          }
          return requestType; // Default: Return the same value if no match
        },
  
        formatMSMECategory: function (value) {
          return value === "true" ? "Registered" : "Not Registered";
        },
  
        formatDate: function (sDate) {
          debugger;
          if (!sDate) {
            return "";
          }
          var oDate = new Date(sDate); // Assuming the date is in a standard format
          var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
            pattern: "dd/MM/yyyy", // Change format as needed
          });
          return oDateFormat.format(oDate);
        },
  
        formatGSTNumber: function (sValue) {
          if (!sValue) {
            return "";
          }
  
          // Convert input to uppercase and remove invalid characters
          let sanitizedValue = sValue.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  
          // Validate length
          if (sanitizedValue.length !== 15) {
            return "Invalid GST format: Must be 15 characters";
          }
  
          // Extract components
          let stateCode = sanitizedValue.substring(0, 2);
          let panPart = sanitizedValue.substring(2, 12);
          let panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  
          // Check if state code is valid
          let isValidStateCode = Object.values(
            this.stateCodeMapping || {}
          ).includes(stateCode);
  
          if (!isValidStateCode) {
            return "Invalid GST format: State code incorrect";
          }
  
          // Validate PAN inside GST
          if (!panPattern.test(panPart)) {
            return "Invalid GST format: PAN part incorrect";
          }
  
          return sanitizedValue; // Return formatted GST number
        },
  
        formatPANNumber: function (sValue) {
          if (!sValue) {
            return "";
          }
  
          // Convert to uppercase and sanitize input
          let sanitizedValue = sValue.replace(/[^A-Z0-9]/g, "").toUpperCase();
  
          // Ensure length is exactly 10 characters
          if (sanitizedValue.length !== 10) {
            return "Invalid PAN format: Must be 10 characters";
          }
  
          // Validate PAN format
          let panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
          if (!panPattern.test(sanitizedValue)) {
            return "Invalid PAN format";
          }
  
          return sanitizedValue; // Return formatted PAN number
        },
      };
    }
  );