sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("com.systemconfiguration.systemconfigurationaisp.controller.SystemConfiguration", {
        onInit() {
            debugger;
            let oModel = this.getOwnerComponent().getModel();
            this.getView().setModel(oModel);
            var oViewModel = new JSONModel({
                isEditing: false
            });
            oModel.read("/FieldConfig", {
                success: function (res) {
                    var fieldConfigModel = new JSONModel(res);
                    this.getView().setModel(fieldConfigModel, "fieldConfigModel");
                }.bind(this),
                error: function (err) {
                    sap.m.MessageBox.error("Failed to load Email Configuration data.");
                },
            });            

            this.getView().setModel(oViewModel, "viewModel");
            this.getEmailModel();
        },

        onEditPress: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var bIsEditing = oViewModel.getProperty("/isEditing");
            oViewModel.setProperty("/isEditing", !bIsEditing);
            MessageToast.show(bIsEditing ? "Edit mode cancelled" : "Edit mode activated");
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
                    sap.m.MessageBox.error("Failed to load Email Configuration data.");
                },
            });
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
                    sap.m.MessageBox.success("Configuration Submitted Successfully");

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
                    sap.m.MessageBox.error("Please Try Again");

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

        onTestEmailPress: function () {
            var oView = this.getView();

            // Load the fragment if it is not already loaded
            if (!this.byId("emailTestDialog")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.air.vp.lnchpage.fragments.AdminConfig.TestEmail",
                    controller: this,
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("emailTestDialog").open();
            }
        },

        onDialogClose: function () {
            this.byId("emailTestDialog").close();
        },

        onSubmitEmailPress: function () {
            var oView = this.getView();

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
                    this.onDialogClose();
                    this.getEmailModel();
                }.bind(this),
                error: function (err) {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Something went wrong. Please try again.");

                    // Close the dialog and reset the fields on error as well
                    this.onDialogClose();
                }.bind(this),
            });
        },

        // Helper function for single email validation
        _validateEmail: function (email) {
            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailPattern.test(email);
        },

        // Helper function for validating multiple CC emails (comma-separated)
        _validateMultipleEmails: function (emails) {
            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            var emailArray = emails.split(",").map((email) => email.trim());
            return emailArray.every((email) => emailPattern.test(email));
        },

        onComboBoxChangeMaster: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var sKey = oSelectedItem.getKey(); // Get the key of the selected item
            let oModel = this.getView().getModel(); // OData Model

            // Perform actions based on the selected key
            switch (sKey) {
                case "country":
                    oModel.read("/Country", {
                        success: function (res) {
                            let aCountry = res.results.map((item) => {
                                return {
                                    CODE: item.LAND1,
                                    DESCRIPTION: item.LANDX,
                                    SHORTTEXT: item.NATIO
                                };
                            });

                            let mastJson = new sap.ui.model.json.JSONModel();
                            mastJson.setData({ results: aCountry }); // ✅ important
                            this.getView().setModel(mastJson, "mastJsonModel");
                            this.getView().byId("idCreateButton").setText("Country");
                        }.bind(this),
                        error: function (err) {
                            console.error("Failed to load country data", err);
                        },
                    });
                    break;
                case "currency":
                    let mastJsonCurrency = this.getView().getModel("mastJsonModel");
                    if (mastJsonCurrency) {
                        mastJsonCurrency.setData(null);
                    } else {
                        mastJsonCurrency = new sap.ui.model.json.JSONModel();
                    }

                    oModel.read("/Currency", {
                        success: function (res) {
                            let data = {
                                results: res.results.map(function (item) {
                                    return {
                                        CODE: item.WAERS,          // Currency Code
                                        DESCRIPTION: item.LTEXT,   // Long Description
                                        SHORTTEXT: item.KTEXT      // Short Description (optional)
                                    };
                                }),
                            };

                            mastJsonCurrency.setData(data);
                            this.getView().setModel(mastJsonCurrency, "mastJsonModel");
                            this.getView().byId("idCreateButton").setText("Currency");
                        }.bind(this),
                        error: function (err) {
                            console.error("Failed to load currency data", err);
                        },
                    });
                    break;
                case "approvalType":
                    let mastJsonApproval = this.getView().getModel("mastJsonModel");
                    if (mastJsonApproval) {
                        mastJsonApproval.setData(null);
                    } else {
                        mastJsonApproval = new sap.ui.model.json.JSONModel();
                    }

                    oModel.read("/ApprovalType", {
                        success: function (res) {
                            let data = {
                                results: res.results.map(function (item) {
                                    return {
                                        CODE: item.CODE,
                                        DESCRIPTION: item.DESC
                                    };
                                }),
                            };

                            mastJsonApproval.setData(data);
                            this.getView().setModel(mastJsonApproval, "mastJsonModel");
                            this.getView().byId("idCreateButton").setText("Approval Type");
                        }.bind(this),
                        error: function (err) {
                            console.error("Failed to load approval type data", err);
                        },
                    });
                    break;
                case "userRole":
                        let mastJsonUserRole = this.getView().getModel("mastJsonModel");
                        if (mastJsonUserRole) {
                            mastJsonUserRole.setData(null);
                        } else {
                            mastJsonUserRole = new sap.ui.model.json.JSONModel();
                        }
                    
                        oModel.read("/UserRole", {
                            success: function (res) {
                                let data = {
                                    results: res.results.map(function (item) {
                                        return {
                                            CODE: item.CODE,
                                            DESCRIPTION: item.DESCRIPTION
                                        };
                                    }),
                                };
                    
                                mastJsonUserRole.setData(data);
                                this.getView().setModel(mastJsonUserRole, "mastJsonModel");
                                this.getView().byId("idCreateButton").setText("User Role");
                            }.bind(this),
                            error: function (err) {
                                console.error("Failed to load user roles", err);
                            },
                        });
                        break;
                        case "companyCode":
                            let mastJsonCC = this.getView().getModel("mastJsonModel");
                            if (mastJsonCC) {
                                mastJsonCC.setData(null); // Clear model data
                            } else {
                                mastJsonCC = new sap.ui.model.json.JSONModel();
                            }
                        
                            oModel.read("/CompanyCode", {
                                success: function (res) {
                                    let data = {
                                        results: res.results.map(function (item) {
                                            return {
                                                CODE: item.BUKRS,             // Company Code
                                                DESCRIPTION: item.BUTXT,      // Company Name
                                                CITY: item.ORT01             // City
                                            };
                                        }),
                                    };
                        
                                    mastJsonCC.setData(data);
                                    this.getView().setModel(mastJsonCC, "mastJsonModel");
                                    this.getView().byId("idCreateButton").setText("Company Code");
                                }.bind(this),
                                error: function (err) {
                                    console.error("Failed to load company codes", err);
                                },
                            });
                            break;
                        
                default:
                    sap.m.MessageToast.show("Unknown selection");
            }
        },

        onSearchProducts: function (oEvent) {
            // Get the search query from the event
            var sQuery = oEvent.getParameter("query");

            // Get the binding of the table items
            var oTable = this.byId("idProductsTable");
            var oBinding = oTable.getBinding("items");

            // Define filters
            var aFilters = [];

            if (sQuery) {
                // Create a filter for 'CODE'
                var oFilterCode = new sap.ui.model.Filter(
                    "CODE",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                );

                // Create a filter for 'DESCRIPTION'
                var oFilterDescription = new sap.ui.model.Filter(
                    "DESCRIPTION",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                );

                // Create a filter for 'COMPANY'
                var oFilterCompany = new sap.ui.model.Filter(
                    "COMPANY",
                    sap.ui.model.FilterOperator.Contains,
                    sQuery
                );

                // Combine the filters in an OR condition
                aFilters.push(
                    new sap.ui.model.Filter({
                        filters: [oFilterCode, oFilterDescription, oFilterCompany],
                        and: false,
                    })
                );
            }

            // Apply the filter to the table's binding
            oBinding.filter(aFilters);
        },

        onAddProduct: function () {
            var oComboBox = this.byId("selectControl"); // Assuming ComboBox ID is "idPopinLayout"
            var sSelectedKey = oComboBox.getSelectedKey(); // Get the selected key from the dropdown

            // Open the fragment based on the selected key
            switch (sSelectedKey) {
                case "userRole":
                    this._openCreateRoleDialog();
                    break;

                case "department":
                    this._openCreateDepartmentDialog();
                    break;

                case "gaType":
                    this._openCreateGATypeDialog();
                    break;

                case "companyCode":
                    this._openCreateCompanyCodeDialog();
                    break;

                default:
                    sap.m.MessageToast.show("Please select a valid option.");
            }
        },
    });
});