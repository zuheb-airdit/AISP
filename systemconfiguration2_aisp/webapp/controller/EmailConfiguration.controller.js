sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "sap/m/MessageToast",
  ],
  (
    Controller,
    JSONModel,
    Fragment,
    MessageBox,
    Filter,
    FilterOperator,
    Sorter,
    Spreadsheet,
    library,
    MessageToast
  ) => {
    "use strict";

    return Controller.extend(
      "com.sconfig.systemconfiguration2aisp.controller.SystemView",
      {
        onInit() {
          let mainModel = this.getOwnerComponent().getModel();
          this.getView().setModel(mainModel);
          var oViewModel = new JSONModel({
            isEditing: false,
          });
          this.getView().setModel(oViewModel, "viewModel");
          this.getEmailModel();
        },

        getEmailModel: function () {
          let oModel = this.getView().getModel();
          oModel.read("/EmailConfiguration", {
            success: function (res) {
              let oEmailConfigModel = new sap.ui.model.json.JSONModel(
                res.results[0]
              );
              this.getView().setModel(oEmailConfigModel, "emailConfigModel");
            }.bind(this),
            error: function (err) {
              sap.m.MessageBox.error(
                "Failed to load Email Configuration data."
              );
            },
          });
        },

        onEditPress: function () {
          var oViewModel = this.getView().getModel("viewModel");
          var bIsEditing = oViewModel.getProperty("/isEditing");
          oViewModel.setProperty("/isEditing", !bIsEditing);
          MessageToast.show(
            bIsEditing ? "Edit mode cancelled" : "Edit mode activated"
          );
        },

        onTestEmailPress: function () {
          var oView = this.getView();

          // Load the fragment if it is not already loaded
          if (!this.byId("emailTestDialog")) {
            Fragment.load({
              id: oView.getId(),
              name: "com.sconfig.systemconfiguration2aisp.fragments.TestEmail",
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              oDialog.open();
            });
          } else {
            this.byId("emailTestDialog").open();
          }
        },

        onSubmitPress: function () {
          var oView = this.getView();

          // Retrieve the model and the data from it
          var oModel = this.getView().getModel("emailConfigModel");
          var oData = oModel.getData();

          // Input field validation
          if (!oData.HOST || oData.HOST.trim() === "") {
            sap.m.MessageBox.error("Host is required.");
            return;
          }

          if (!oData.USERNAME || oData.USERNAME.trim() === "") {
            sap.m.MessageBox.error("Username is required.");
            return;
          }

          if (!oData.PASSWORD || oData.PASSWORD.trim() === "") {
            sap.m.MessageBox.error("Password is required.");
            return;
          }

          if (!oData.PORT || isNaN(oData.PORT)) {
            sap.m.MessageBox.error("Please enter a valid port number.");
            return;
          }

          if (!oData.SENDER_EMAIL || !this._validateEmail(oData.SENDER_EMAIL)) {
            sap.m.MessageBox.error("Please enter a valid email address.");
            return;
          }

          // Set busy indicator to true
          oView.setBusy(true);

          // Prepare the payload by extracting values from the model
          var payload = {
            host: oData.HOST, // Fetch from model
            username: oData.USERNAME, // Fetch from model
            password: oData.PASSWORD, // Fetch from model
            port: parseInt(oData.PORT), // Fetch and convert to integer
            secure: oData.SECURE, // Boolean value fetched from model
            senderEmail: oData.SENDER_EMAIL, // Fetch from model
          };

          console.log("Payload:", JSON.stringify(payload));

          // Call the OData action import 'updateEmailConfig'
          let model = this.getView().getModel();
          model.create("/updateEmailConfig", payload, {
            success: function (res) {
              oView.setBusy(false);
              MessageBox.success("Configuration Submitted Successfully");

              // Reset edit mode and update button states
              this._editMode = false;
              oView.byId("editButton").setText("Edit");
              oView.byId("submitButton").setVisible(false);

              // Make input fields non-editable after submission
              oView.byId("hostNameInput").setEditable(false);
              oView.byId("portInput").setEditable(false);
              oView.byId("securityInput").setEditable(false);
              oView.byId("userNameInput").setEditable(false);
              oView.byId("passwordInput").setEditable(false);
              oView.byId("senderEmailInput").setEditable(false);
            }.bind(this),
            error: function (err) {
              oView.setBusy(false);
              MessageBox.error("Please Try Again");

              // Reset edit mode and button states
              this._editMode = false;
              oView.byId("editButton").setText("Edit");
              oView.byId("submitButton").setVisible(false);

              // Make input fields non-editable again after error
              oView.byId("hostNameInput").setEditable(false);
              oView.byId("portInput").setEditable(false);
              oView.byId("securityInput").setEditable(false);
              oView.byId("userNameInput").setEditable(false);
              oView.byId("passwordInput").setEditable(false);
              oView.byId("senderEmailInput").setEditable(false);
            }.bind(this),
          });
        },

        onSubmitEmailPress: function () {
          var oView = this.getView();
          this.onDialogCloseTestEmail();

          // Get values from the inputs
          var fromEmail = this.byId("fromEmailInput").getValue();
          var toEmail = this.byId("toEmailInput").getValue();
          var ccEmails = this.byId("ccEmailInput").getValue();
          var subject = this.byId("subjectInput").getValue();
          var message = this.byId("messageInput").getValue();

          // Input validation
          if (!fromEmail || !this._validateEmail(fromEmail)) {
            sap.m.MessageBox.error("Please enter a valid From Email.");
            return;
          }

          if (!toEmail || !this._validateEmail(toEmail)) {
            sap.m.MessageBox.error("Please enter a valid To Email.");
            return;
          }

          if (ccEmails && !this._validateMultipleEmails(ccEmails)) {
            sap.m.MessageBox.error("Please enter valid CC Emails.");
            return;
          }

          if (!subject || subject.trim() === "") {
            sap.m.MessageBox.error("Please enter a subject.");
            return;
          }

          if (!message || message.trim() === "") {
            sap.m.MessageBox.error("Please enter a message.");
            return;
          }

          // Set busy indicator to true
          oView.setBusy(true);

          // Prepare the payload
          var payload = {
            ToEmails: toEmail,
            CCEmail: ccEmails,
            subject: subject,
            body: message,
            type: "html",
          };

          // Call OData create method
          let oModel = this.getView().getModel();
          oModel.create("/testEmailConfig", payload, {
            success: function (res) {
              oView.setBusy(false);
              sap.m.MessageBox.alert(res.testEmailConfig);

              // Reset the fields after successful submission
              this.byId("fromEmailInput").setValue("");
              this.byId("toEmailInput").setValue("");
              this.byId("ccEmailInput").setValue("");
              this.byId("subjectInput").setValue("");
              this.byId("messageInput").setValue("");

              // Close the dialog
              this.getEmailModel();
            }.bind(this),
            error: function (err) {
              oView.setBusy(false);
              sap.m.MessageBox.error("Something went wrong. Please try again.");

              // Close the dialog and reset the fields on error as well
            }.bind(this),
          });
        },

        onDialogCloseTestEmail: function () {
          this.byId("emailTestDialog").close();
        },

        _validateEmail: function (email) {
          var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailPattern.test(email);
        },

        onNavHome: function () {
          this.getOwnerComponent().getRouter().navTo("RouteSystemView");
        },
      }
    );
  }
);
