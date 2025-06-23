sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library"
], (Controller, JSONModel, Fragment, MessageBox, Filter, FilterOperator, Sorter, Spreadsheet, library) => {
    "use strict";

    return Controller.extend("com.sconfig.systemconfiguration2aisp.controller.SystemView", {
        onInit() {
            let oModel = this.getOwnerComponent().getModel();
            this.appId = "com.sconfig.systemconfiguration2aisp"
            this.getView().setModel(oModel);
            var oEditFieldModel = new sap.ui.model.json.JSONModel({
                type: "",
                label: "",
                description: "",
                placeholder: "",
                defaultValue: "",
                minLength: "",
                maxLength: "",
                isRequired: false,
                isVisible: false,
                options: []
            });
            this.getView().setModel(oEditFieldModel, "EditFieldModel");
            var oViewModel = new JSONModel({
                isEditing: false
            });
            var oFieldConfigModel = new JSONModel({
                results: [],
                buttonsEnabled: false
            });
            this.getView().setModel(oFieldConfigModel, "fieldConfigModel");
            var oFilterModel = new JSONModel({
                sections: [
                    { key: "", text: "All" },
                    { key: "Supplier Information", text: "Supplier Information" },
                    { key: "Finance Information", text: "Finance Information" },
                    { key: "Submission", text: "Submission" },
                    { key: "Quality Certificates", text: "Quality Certificates" },
                    { key: "Disclosures", text: "Disclosures" },
                    { key: "Operational Information", text: "Operational Information" }
                ],
                categories: [
                    { key: "", text: "All" },
                    { key: "Primary Bank details", text: "Primary Bank details" },
                    { key: "TAX-VAT-GST", text: "TAX-VAT-GST" },
                    { key: "Operational Capacity", text: "Operational Capacity" },
                    { key: "Standard Certifications", text: "Standard Certifications" },
                    { key: "Product-Service Description", text: "Product-Service Description" },
                    { key: "Declaration", text: "Declaration" },
                    { key: "Address", text: "Address" },
                    { key: "Primary Contact", text: "Primary Contact" },
                    { key: "Supplier Information", text: "Supplier Information" }
                ],
                fieldTypes: [
                    { key: "", text: "All" },
                    { key: "textBox", text: "Text" },
                    { key: "select", text: "Dropdown" },
                    { key: "calendar", text: "Calendar" },
                    { key: "radio", text: "Radio" },
                    { key: "checkBox", text: "Checkbox" }
                ]
            });
            this.getView().setModel(oFilterModel, "filterModel");
            this.getView().setModel(oViewModel, "viewModel");
            this.getEmailModel();
            this.getMastertabledata("country")

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
            this.getMastertabledata(sKey)

        },

        getMastertabledata: function (sKey) {
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
                            mastJson.refresh(true);
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
                            mastJsonCurrency.refresh(true);
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
                                        DESCRIPTION: item.DESC,
                                    };
                                }),
                            };

                            mastJsonApproval.setData(data);
                            mastJsonApproval.refresh(true);
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
                            mastJsonUserRole.refresh(true);
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
                                        SHORTTEXT: item.ORT01,
                                        WAERS: item.WAERS           // City
                                    };
                                }),
                            };

                            mastJsonCC.setData(data);
                            mastJsonCC.refresh(true);
                            this.getView().setModel(mastJsonCC, "mastJsonModel");
                            this.getView().byId("idCreateButton").setText("Company Code");
                        }.bind(this),
                        error: function (err) {
                            console.error("Failed to load company codes", err);
                        },
                    });
                    break;
                    case "RequestType":
                        let mastJsonRT = this.getView().getModel("mastJsonModel");
                        if (mastJsonRT) {
                            mastJsonRT.setData(null); // Clear model data
                        } else {
                            mastJsonRT = new sap.ui.model.json.JSONModel();
                        }
                        debugger;
                        oModel.read("/RequestType", {
                            success: function (res) {
                                let data = {
                                    results: res.results.map(function (item) {
                                        return {
                                            CODE: item.CODE,
                                            DESCRIPTION: item.DESCRIPTION,
                                            SHORTTEXT: item.SUPPLIER_TYPE
                                        };
                                    }),
                                };
                    
                                mastJsonRT.setData(data);
                                mastJsonRT.refresh(true);
                                this.getView().setModel(mastJsonRT, "mastJsonModel");
                                
                                this.getView().byId("idCreateButton").setText("Request Type");
                            }.bind(this),
                            error: function (err) {
                                console.error("Failed to load request type data", err);
                            },
                        });
                        break;                    
                default:
                    debugger;
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
                case "approvalType":
                    this._openApprovalCurency();
                    break;
                case "companyCode":
                    this._openCreateCompanyCodeDialog();
                    break;
                case "currency":
                    this._openCreateCuurency();
                    break;
                case "country":
                    this._openCreateCountryDialog();
                    break;
                case "gaType":
                    this._openCreateGATypeDialog();
                    break;
                case "userRole":
                    this._openCreateRoleDialog();
                    break;
                case "RequestType":
                    debugger;
                    this._openCreateRequestTypeDialog();
                    break;
                default:
                    sap.m.MessageToast.show("Please select a valid option.");
            }
        },

        _openCreateCompanyCodeDialog: function () {
            if (!this._companyCodeCreateDialog) {
                this._companyCodeCreateDialog = sap.ui.xmlfragment(
                    `${this.appId}.fragments.CompanyCodeCreate`,
                    this
                );
                this.getView().addDependent(this._companyCodeCreateDialog);
            }
            this._companyCodeCreateDialog.open();
        },

        _openCreateRoleDialog: function () {
            if (!this._userRoleCreateDialog) {
                this._userRoleCreateDialog = sap.ui.xmlfragment(
                    `${this.appId}.fragments.UserRoleCreate`,
                    this
                );
                this.getView().addDependent(this._userRoleCreateDialog);
            }
            this._userRoleCreateDialog.open();
        },

        _openCreateCountryDialog: function () {
            if (!this._oCreateDepartmentDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: `${this.appId}.fragments.Country`,
                    controller: this,
                }).then(
                    function (oDialog) {
                        this._oCreateDepartmentDialog = oDialog;
                        this.getView().addDependent(this._oCreateDepartmentDialog);
                        this._oCreateDepartmentDialog.open();
                    }.bind(this)
                );
            } else {
                this._oCreateDepartmentDialog.open();
            }
        },

        _openApprovalCurency: function () {
            if (!this._approvalTypeCreateDialog) {
                this._approvalTypeCreateDialog = sap.ui.xmlfragment(
                    `${this.appId}.fragments.ApprovalTypeCreate`, this
                );
                this.getView().addDependent(this._approvalTypeCreateDialog);
            }
            this._approvalTypeCreateDialog.open();
        },


        _openCreateCuurency: function () {
            if (!this._oCreateCurrencyDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: `${this.appId}.fragments.Currency`,
                    controller: this,
                }).then(
                    function (oDialog) {
                        this._oCreateCurrencyDialog = oDialog;
                        this.getView().addDependent(this._oCreateCurrencyDialog);
                        this._oCreateCurrencyDialog.open();
                    }.bind(this)
                );
            } else {
                this._oCreateCurrencyDialog.open();
            }
        },
        _openCreateRequestTypeDialog: function () {
            debugger;
            if (!this._RequestTypeCreateDialog) {
                this._RequestTypeCreateDialog = sap.ui.xmlfragment(
                    `${this.appId}.fragments.RequestTypeCreate`, this
                );
                this.getView().addDependent(this._RequestTypeCreateDialog);
            }
            this._RequestTypeCreateDialog.open();
        },

        onCreateCountrySubmit: async function () {
            var oDialog = this.byId("countryCreateDialog");
            var sCode = this.byId("countryCodeInput").getValue().trim();
            var sName = this.byId("countryNameInput").getValue().trim();
            var sNation = this.byId("countryNationalityInput").getValue().trim();

            // Basic validation
            if (!sCode || !sName || !sNation) {
                sap.m.MessageToast.show("All fields are required.");
                return;
            }
            if (sCode.length !== 2) {
                sap.m.MessageToast.show("Country code must be exactly 2 letters.");
                return;
            }

            var oPayload = {
                LAND1: sCode.toUpperCase(),
                LANDX: sName,
                NATIO: sNation
            };

            try {
                await this.getView().getModel().create("/createCountry", oPayload, {
                    success: function () {
                        MessageBox.success("Country created successfully!");
                        this.getMastertabledata("country")
                        oDialog.close();
                    }.bind(this),
                    error: function (oError) {
                        MessageBox.error("Failed to create country. Please check details.");
                    }
                });
            } catch (err) {
                sap.m.MessageBox.error("Unexpected error occurred.");
            }
        },

        onCountryDialogClose: function () {
            this.byId("countryCreateDialog").close();
        },


        onUpdateCountrySubmit: function () {
            var sCode = sap.ui.getCore().byId("editCountryCodeInput").getValue().trim();
            var sName = sap.ui.getCore().byId("editCountryNameInput").getValue().trim();
            var sNation = sap.ui.getCore().byId("editCountryNationalityInput").getValue().trim();

            if (!sNation) {
                sap.m.MessageToast.show("Short Text is required.");
                return;
            }

            var oModel = this.getView().getModel();

            var oPayload = {
                LAND1: sCode.toUpperCase(),
                LANDX: sName,
                NATIO: sNation
            };

            // For OData V2 function import (GET)
            oModel.create("/updateCountry", oPayload, {
                success: function (res) {
                    this._editUserDialog.close();
                    MessageBox.success("Country Edited Sucessfully!")
                    this.getMastertabledata("country")

                }.bind(this),
                error: function (err) {
                    this._editUserDialog.close();
                    MessageBox.error("Error in Uploading,Please try again")

                }
            });

            // If your updateCountry is a POST function import (recommend for updates), use:
            // oModel.callFunction("/updateCountry", {
            //     method: "POST",
            //     urlParameters: { LAND1: sCode, LANDX: sName, NATIO: sNation },
            //     success: ...,
            //     error: ...
            // });
        },

        onCountryEditDialogClose: function () {
            debugger;
            let Countrydialog = sap.ui.getCore().byId("countryEditDialog");
            if (Countrydialog) {
                Countrydialog.close();
            }
            let Countrydialog1 = sap.ui.getCore().byId("countryCreateDialog");
            if (Countrydialog1) {
                Countrydialog1.close();
            }
            let currencyDialogEdit = sap.ui.getCore().byId("currencyEditDialog");
            if (currencyDialogEdit) {
                currencyDialogEdit.close();
            }

            let currencyDialog = sap.ui.getCore().byId("currencyCreateDialog");
            if (currencyDialog) {
                currencyDialog.close();
            }
        },

        onEditFunction: function (oEvent) {
            debugger;
            var oComboBox = this.byId("selectControl");
            var sSelectedKey = oComboBox.getSelectedKey();
            var oModel = this.getView().getModel();
            var oJsonModel = this.getView().getModel("mastJsonModel"); // JSON model for frontend
            var index = oEvent
                .getSource()
                .getParent()
                .getBindingContext("mastJsonModel")
                .getObject();

            // Check if there's selected data to delete
            if (!oJsonModel) {
                sap.m.MessageBox.error("No data to delete.");
                return;
            }
            switch (sSelectedKey) {
                case "country":
                    if (!this._editUserDialog) {
                        this._editUserDialog = sap.ui.xmlfragment(
                            `${this.appId}.fragments.CountryEdit`, // Fragment path
                            this // Bind the controller to handle fragment events
                        );
                        this.getView().addDependent(this._editUserDialog); // Add fragment as dependent to the view
                    }

                    // Pre-fill the fragment fields with the selected item data
                    sap.ui.getCore().byId("editCountryCodeInput").setValue(index.CODE);
                    sap.ui.getCore().byId("editCountryNameInput").setValue(index.DESCRIPTION);
                    sap.ui.getCore().byId("editCountryNationalityInput").setValue(index.SHORTTEXT);
                    this._editUserDialog.open();
                    break;

                case "currency":
                    if (!this._editCurrDialog) {
                        this._editCurrDialog = sap.ui.xmlfragment(
                            `${this.appId}.fragments.CurrencyEdit`, // Fragment path
                            this // Bind the controller to handle fragment events
                        );
                        this.getView().addDependent(this._editCurrDialog); // Add fragment as dependent to the view
                    }

                    // Pre-fill the fragment fields with the selected item data
                    sap.ui.getCore().byId("editCurrencyCodeInput").setValue(index.CODE);        // Adjust as per your field name
                    sap.ui.getCore().byId("editCurrencyDescInput").setValue(index.DESCRIPTION); // Adjust as per your field name
                    sap.ui.getCore().byId("editCurrencyShortInput").setValue(index.SHORTTEXT)
                    this._editCurrDialog.open();
                    break;


                case "approvalType":
                    if (!this._approvalTypeEditDialog) {
                        this._approvalTypeEditDialog = sap.ui.xmlfragment(
                            `${this.appId}.fragments.ApprovalTypeEdit`, this
                        );
                        this.getView().addDependent(this._approvalTypeEditDialog);
                    }
                    sap.ui.getCore().byId("editApprovalTypeCodeInput").setValue(index.CODE);
                    sap.ui.getCore().byId("editApprovalTypeDescInput").setValue(index.DESCRIPTION);
                    this._approvalTypeEditDialog.open();
                    break;

                case "companyCode":
                    if (!this._companyCodeEditDialog) {
                        this._companyCodeEditDialog = sap.ui.xmlfragment(
                            `${this.appId}.fragments.CompanyCodeEdit`,
                            this
                        );
                        this.getView().addDependent(this._companyCodeEditDialog);
                    }
                    sap.ui.getCore().byId("editCompanyCodeInput").setValue(index.CODE);
                    sap.ui.getCore().byId("editCompanyDescInput").setValue(index.DESCRIPTION);
                    sap.ui.getCore().byId("editCompanyCityInput").setValue(index.SHORTTEXT); // Assuming SHORTTEXT is city (adjust if not)
                    sap.ui.getCore().byId("editCompanyCurrencyInput").setValue(index.WAERS);
                    this._companyCodeEditDialog.open();
                    break;

                case "userRole":
                    if (!this._userRoleEditDialog) {
                        this._userRoleEditDialog = sap.ui.xmlfragment(
                            `${this.appId}.fragments.UserRoleEdit`,
                            this
                        );
                        this.getView().addDependent(this._userRoleEditDialog);
                    }
                    sap.ui.getCore().byId("editUserRoleCodeInput").setValue(index.CODE);
                    sap.ui.getCore().byId("editUserRoleDescInput").setValue(index.DESCRIPTION);
                    this._userRoleEditDialog.open();
                    break;

                case "RequestType":
                    if (!this._RequestTypeEditDialog) {
                        this._RequestTypeEditDialog = sap.ui.xmlfragment(
                            `${this.appId}.fragments.RequestTypeEdit`,
                            this
                        );
                        this.getView().addDependent(this._RequestTypeEditDialog);
                    }
                    sap.ui.getCore().byId("editRequestTypeCodeInput").setValue(index.CODE);
                    sap.ui.getCore().byId("editRequestTypeDescInput").setValue(index.DESCRIPTION);
                    sap.ui.getCore().byId("editRequestTypeSuppInput").setValue(index.SHORTTEXT);
                    this._RequestTypeEditDialog.open();
                    break;

                default:
                    sap.m.MessageBox.error("Please select a valid option.");
                    return;
            }

            // Get selected item from the JSON model to delete
        },

        onDeleteFunction: function (oEvent) {
            let that = this;
            var oComboBox = this.byId("selectControl"); // Assuming ComboBox ID is "selectControl"
            var sSelectedKey = oComboBox.getSelectedKey(); // Get the selected key from the dropdown
            var oModel = this.getView().getModel(); // OData model
            var oJsonModel = this.getView().getModel("mastJsonModel"); // JSON model for frontend
            var index = oEvent
                .getSource()
                .getParent()
                .getBindingContext("mastJsonModel")
                .sPath.split("/")[2];

            // Check if there's selected data to delete
            if (!oJsonModel) {
                sap.m.MessageBox.error("No data to delete.");
                return;
            }

            // Get selected item from the JSON model to delete
            var aItems = oEvent
                .getSource()
                .getParent()
                .getBindingContext("mastJsonModel")
                .getModel()
                .getData().results; // Assuming data is in "results" array
            var oSelectedItem = oEvent
                .getSource()
                .getParent()
                .getBindingContext("mastJsonModel")
                .getObject();

            if (!oSelectedItem) {
                sap.m.MessageBox.error("No item selected for deletion.");
                return;
            }
            sap.m.MessageBox.confirm("Are you sure you want to delete this item?", {
                actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                onClose: function (oAction) {
                    if (oAction === sap.m.MessageBox.Action.YES) {
                        // Show busy indicator during deletion
                        sap.ui.core.BusyIndicator.show(0);

                        // Open the fragment based on the selected key and handle deletion
                        switch (sSelectedKey) {
                            case "country":
                                // DELETE request to backend for userRole
                                let payload = {
                                    LAND1: oSelectedItem.CODE,
                                };
                                oModel.create(`/deleteCountry`, payload, {
                                    success: function (res) {
                                        // Remove the item from the frontend JSON model
                                        that.getMastertabledata("country")
                                        MessageBox.success(
                                            "Country deleted successfully."
                                        );
                                        sap.ui.core.BusyIndicator.hide(); // Hide busy indicator after success

                                    },
                                    error: function (err) {
                                        MessageBox.error("Failed to delete User Role.");
                                        sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on error
                                    },
                                });
                                break;

                            case "department":
                                // DELETE request to backend for department
                                let depPay = {
                                    Department: oSelectedItem.CODE,
                                };
                                oModel.create(`/DeleteDepartment`, depPay, {
                                    success: function () {
                                        aItems.splice(index, 1);
                                        oJsonModel.setData({ results: aItems });
                                        sap.m.MessageBox.success(
                                            "Department deleted successfully."
                                        );
                                        sap.ui.core.BusyIndicator.hide(); // Hide busy indicator after success

                                    },
                                    error: function (err) {
                                        sap.m.MessageBox.error("Failed to delete Department.");
                                        sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on error
                                    },
                                });
                                break;

                            case "gaType":
                                let gaPay = {
                                    GA_Code: oSelectedItem.CODE,
                                };
                                // DELETE request to backend for Geographical Area
                                oModel.create(`/DeleteGA`, gaPay, {
                                    success: function () {
                                        // Remove the item from the frontend JSON model
                                        aItems.splice(index, 1);
                                        oJsonModel.setData({ results: aItems });
                                        sap.m.MessageBox.success(
                                            "Geographical Area deleted successfully."
                                        );
                                        sap.ui.core.BusyIndicator.hide(); // Hide busy indicator after success

                                    },
                                    error: function (err) {
                                        sap.m.MessageBox.error(
                                            "Failed to delete Geographical Area."
                                        );
                                        sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on error
                                    },
                                });
                                break;

                            // case "companyCode":
                            //     // DELETE request to backend for Company Code
                            //     let cPayload = {
                            //         Company: oSelectedItem.COMPANY,
                            //         BUKRS: oSelectedItem.CODE,
                            //     };
                            //     oModel.create(`/DeleteCompany`, cPayload, {
                            //         success: function () {
                            //             // Remove the item from the frontend JSON model
                            //             aItems.splice(index, 1);
                            //             oJsonModel.setData({ results: aItems });
                            //             sap.m.MessageBox.success(
                            //                 "Company Code deleted successfully."
                            //             );
                            //             sap.ui.core.BusyIndicator.hide(); // Hide busy indicator after success
                            //         },
                            //         error: function (err) {
                            //             sap.m.MessageBox.error("Failed to delete Company Code.");
                            //             sap.ui.core.BusyIndicator.hide(); // Hide busy indicator on error
                            //         },
                            //     });
                            //     break;

                            case "currency":
                                let currencyPayload = { WAERS: oSelectedItem.CODE };
                                oModel.create(`/deleteCurrency`, currencyPayload, {
                                    success: function () {
                                        that.getMastertabledata("currency")
                                        sap.m.MessageBox.success("Currency deleted successfully.");
                                        sap.ui.core.BusyIndicator.hide();

                                    },
                                    error: function () {
                                        sap.m.MessageBox.error("Failed to delete Currency.");
                                        sap.ui.core.BusyIndicator.hide();
                                    },
                                });
                                break;

                            case "approvalType":
                                let apprPayload = { CODE: oSelectedItem.CODE };
                                oModel.create(`/deleteApprovalType`, apprPayload, {
                                    success: function () {
                                        that.getMastertabledata("approvalType")
                                        sap.m.MessageBox.success("Approval Type deleted successfully.");
                                        sap.ui.core.BusyIndicator.hide();

                                    },
                                    error: function () {
                                        sap.m.MessageBox.error("Failed to delete Approval Type.");
                                        sap.ui.core.BusyIndicator.hide();
                                    },
                                });
                                break;

                            case "companyCode":
                                let cPayload = { BUKRS: oSelectedItem.CODE };
                                oModel.create(`/deleteCompanyCode`, cPayload, {
                                    success: function () {

                                        sap.m.MessageBox.success("Company Code deleted successfully.");
                                        that.getMastertabledata("companyCode")

                                        sap.ui.core.BusyIndicator.hide();
                                    },
                                    error: function () {
                                        sap.m.MessageBox.error("Failed to delete Company Code.");
                                        sap.ui.core.BusyIndicator.hide();
                                    }
                                });
                                break;

                            case "userRole":
                                let userRolePayload = { CODE: oSelectedItem.CODE };
                                oModel.create(`/deleteUserRole`, userRolePayload, {
                                    success: function () {
                                        that.getMastertabledata("userRole")

                                        sap.m.MessageBox.success("User Role deleted successfully.");
                                        sap.ui.core.BusyIndicator.hide();

                                    },
                                    error: function () {
                                        sap.m.MessageBox.error("Failed to delete User Role.");
                                        sap.ui.core.BusyIndicator.hide();
                                    },
                                });
                                break;

                            case "RequestType":
                                let RTPayload = { CODE: oSelectedItem.CODE };
                                oModel.create(`/deleteRequestType`, RTPayload, {
                                    success: function () {
                                        that.getMastertabledata("RequestType")
                                        sap.m.MessageBox.success("Request Type deleted successfully.");
                                        sap.ui.core.BusyIndicator.hide();

                                    },
                                    error: function () {
                                        sap.m.MessageBox.error("Failed to delete Request Type.");
                                        sap.ui.core.BusyIndicator.hide();
                                    },
                                });
                                break;




                            default:
                                sap.m.MessageBox.error("Please select a valid option.");
                                sap.ui.core.BusyIndicator.hide(); // Hide busy indicator for invalid option
                        }
                    }
                },
            });
        },

        onCreateCurrencySubmit: function () {
            // Get input values by Core IDs
            this.getView().setBusy(true)
            var sCode = this.byId("createCurrencyCodeInput").getValue().trim();
            var sDesc = this.byId("createCurrencyDescInput").getValue().trim();
            var sShort = this.byId("createCurrencyShortInput").getValue().trim();

            if (!sCode || !sDesc || !sShort) {
                sap.m.MessageToast.show("All fields are required.");
                return;
            }

            // Build payload as per your entity's requirements
            var oPayload = {
                WAERS: sCode,
                LTEXT: sDesc,
                KTEXT: sShort
            };

            // Get model (from Core or View; adjust as needed)
            var oModel = this.getView().getModel(); // Or this.getView().getModel()

            // POST to the correct entity set (adjust if your entity set name differs)
            oModel.create("/createCurrency", oPayload, {
                success: function (oData) {
                    this.getView().setBusy(false)
                    MessageBox.success("Currency created successfully!");
                    this.byId("currencyCreateDialog").close();
                    this.getMastertabledata("currency")
                    // Optionally refresh your table/grid here

                }.bind(this),
                error: function (oError) {
                    this.getView().setBusy(false)
                    sap.m.MessageBox.error("Failed to create currency.");
                }.bind(this)
            });
        },

        onUpdateCurrencySubmit: function () {
            var sCode = sap.ui.getCore().byId("editCurrencyCodeInput").getValue().trim();
            var sDesc = sap.ui.getCore().byId("editCurrencyDescInput").getValue().trim();
            var sShort = sap.ui.getCore().byId("editCurrencyShortInput").getValue().trim();

            if (!sCode || !sDesc || !sShort) {
                sap.m.MessageBox.error("All fields are required.");
                return;
            }

            var oPayload = {
                WAERS: sCode,
                LTEXT: sDesc,
                KTEXT: sShort
            };

            var oModel = this.getView().getModel();

            oModel.create("/updateCurrency", oPayload, {
                success: function () {
                    this.getMastertabledata("currency")
                    sap.m.MessageBox.success("Currency updated successfully!");
                    sap.ui.getCore().byId("currencyEditDialog").close();

                }.bind(this),
                error: function () {
                    sap.ui.getCore().byId("currencyEditDialog").close();

                    sap.m.MessageBox.error("Failed to update currency.");
                }
            });
        },

        onCreateApprovalTypeSubmit: function () {
            var sCode = sap.ui.getCore().byId("createApprovalTypeCodeInput").getValue().trim();
            var sDesc = sap.ui.getCore().byId("createApprovalTypeDescInput").getValue().trim();

            if (!sCode || !sDesc) {
                sap.m.MessageBox.error("All fields are required.");
                return;
            }

            var oPayload = {
                CODE: sCode,
                DESC: sDesc
            };

            var oModel = this.getView().getModel();

            oModel.create("/createApprovalType", oPayload, {
                success: function () {
                    sap.m.MessageBox.success("Approval Type created successfully!");
                    this.getMastertabledata("approvalType")

                    sap.ui.getCore().byId("approvalTypeCreateDialog").close();
                    // Optionally refresh your master table data

                }.bind(this),
                error: function () {
                    sap.m.MessageBox.error("Failed to create Approval Type.");
                }
            });
        },
        onCreateRequestTypeSubmit: function () {
            debugger;
            var supType = sap.ui.getCore().byId("createRequestTypeSuppInput").getValue().trim();
            var sDesc = sap.ui.getCore().byId("createRequestTypeDescInput").getValue().trim();
            if (!supType || !sDesc) {
                sap.m.MessageBox.error("All fields are required.");
                return;
            }
            var oPayload = {
                SUPPLIER_TYPE: supType,
                DESCRIPTION: sDesc
            };

            var oModel = this.getView().getModel();

            oModel.create("/createRequestType", oPayload, {
                success: function () {
                    sap.m.MessageBox.success(" Request Type created successfully!");
                    this.getMastertabledata("RequestType")

                    sap.ui.getCore().byId("RequestTypeCreateDialog").close();
                    // Optionally refresh your master table data

                }.bind(this),
                error: function () {
                    sap.m.MessageBox.error("Failed to Request Approval Type.");
                }
            });
        },
        onApprovalTypeCreateDialogClose: function () {
            sap.ui.getCore().byId("approvalTypeCreateDialog").close();
        },
        onRequestTypeCreateDialogClose: function () {
            sap.ui.getCore().byId("RequestTypeCreateDialog").close();
        },
        onRequestTypeCreateDialogClose: function () {
            sap.ui.getCore().byId("RequestTypeCreateDialog").close();
        },
        onRequestTypeEditDialogClose: function () {
            sap.ui.getCore().byId("RequestTypeEditDialog").close();
        },
        onEditRequestTypeSubmit: function () {
            var sCode = sap.ui.getCore().byId("editRequestTypeCodeInput").getValue().trim();
            var sDesc = sap.ui.getCore().byId("editRequestTypeDescInput").getValue().trim();
            var supType = sap.ui.getCore().byId("editRequestTypeSuppInput").getValue().trim();

            if (!sCode || !sDesc || !supType) {
                sap.m.MessageBox.error("All fields are required.");
                return;
            }

            var oPayload = {
                CODE: sCode,
                SUPPLIER_TYPE: supType,
                DESCRIPTION: sDesc
            };
            debugger;
            var oModel = this.getView().getModel();

            oModel.create("/updateRequestType", oPayload, {
                success: function () {
                    sap.m.MessageBox.success("Request Type updated successfully!");
                    this.getMastertabledata("RequestType")

                    sap.ui.getCore().byId("RequestTypeEditDialog").close();
                    // Optionally refresh your master table data

                }.bind(this),
                error: function () {
                    sap.m.MessageBox.error("Failed to Request Approval Type.");
                }
            });
        },

        onApprovalTypeEditDialogClose: function () {
            sap.ui.getCore().byId("approvalTypeEditDialog").close();
        },
        onRequestlTypeEditDialogClose: function () {
            sap.ui.getCore().byId("RequestTypeEditDialog").close();
        },
        onEditApprovalTypeSubmit: function () {
            var sCode = sap.ui.getCore().byId("editApprovalTypeCodeInput").getValue().trim();
            var sDesc = sap.ui.getCore().byId("editApprovalTypeDescInput").getValue().trim();

            if (!sCode || !sDesc) {
                sap.m.MessageBox.error("All fields are required.");
                return;
            }

            var oPayload = {
                CODE: sCode,
                DESC: sDesc
            };

            var oModel = this.getView().getModel();

            oModel.create("/updateApprovalType", oPayload, {
                success: function () {
                    sap.m.MessageBox.success("Approval Type updated successfully!");
                    this.getMastertabledata("approvalType")

                    sap.ui.getCore().byId("approvalTypeEditDialog").close();
                    // Optionally refresh your master table data
                }.bind(this),
                error: function () {
                    sap.m.MessageBox.error("Failed to update Approval Type.");
                }
            });
        },

        onApprovalTypeEditDialogClose: function () {
            sap.ui.getCore().byId("approvalTypeEditDialog").close();
        },

        onCreateCompanyCodeSubmit: function () {
            var sCode = sap.ui.getCore().byId("createCompanyCodeInput").getValue().trim();
            var sDesc = sap.ui.getCore().byId("createCompanyDescInput").getValue().trim();
            var sCity = sap.ui.getCore().byId("createCompanyCityInput").getValue().trim();
            var sCurr = sap.ui.getCore().byId("createCompanyCurrencyInput").getValue().trim();

            if (!sCode || !sDesc || !sCity || !sCurr) {
                sap.m.MessageBox.error("All fields are required.");
                return;
            }

            var oPayload = {
                BUKRS: sCode,
                BUTXT: sDesc,
                ORT01: sCity,
                WAERS: sCurr
            };

            var oModel = this.getView().getModel();

            oModel.create("/createCompanyCode", oPayload, {
                success: function () {
                    sap.m.MessageBox.success("Company Code created successfully!");
                    sap.ui.getCore().byId("companyCodeCreateDialog").close();
                    this.getMastertabledata("companyCode")
                }.bind(this),
                error: function () {
                    sap.m.MessageBox.error("Failed to create Company Code.");
                }
            });
        },

        onCreateUserRoleSubmit: function () {
            var sCode = sap.ui.getCore().byId("createUserRoleCodeInput").getValue().trim();
            var sDesc = sap.ui.getCore().byId("createUserRoleDescInput").getValue().trim();

            if (!sCode || !sDesc) {
                sap.m.MessageBox.error("All fields are required.");
                return;
            }

            var oPayload = {
                CODE: sCode,
                DESCRIPTION: sDesc
            };

            var oModel = this.getView().getModel();

            oModel.create("/createUserRole", oPayload, {
                success: function () {
                    sap.m.MessageBox.success("User Role created successfully!");
                    sap.ui.getCore().byId("userRoleCreateDialog").close();
                    this.getMastertabledata("userRole")
                }.bind(this),
                error: function () {
                    sap.m.MessageBox.error("Failed to create User Role.");
                }
            });
        },

        onUserRoleCreateDialogClose: function () {
            sap.ui.getCore().byId("userRoleCreateDialog").close();
        },


        onCompanyCodeCreateDialogClose: function () {
            sap.ui.getCore().byId("companyCodeCreateDialog").close();
        },

        onEditCompanyCodeSubmit: function () {
            var sCode = sap.ui.getCore().byId("editCompanyCodeInput").getValue().trim();
            var sDesc = sap.ui.getCore().byId("editCompanyDescInput").getValue().trim();
            var sCity = sap.ui.getCore().byId("editCompanyCityInput").getValue().trim();
            var sCurr = sap.ui.getCore().byId("editCompanyCurrencyInput").getValue().trim();

            if (!sCode || !sDesc || !sCity || !sCurr) {
                sap.m.MessageBox.error("All fields are required.");
                return;
            }

            var oPayload = {
                BUKRS: sCode,
                BUTXT: sDesc,
                ORT01: sCity,
                WAERS: sCurr
            };

            var oModel = this.getView().getModel();

            oModel.create("/updateCompanyCode", oPayload, {
                success: function () {
                    sap.m.MessageBox.success("Company Code updated successfully!");
                    this.getMastertabledata("companyCode")
                    sap.ui.getCore().byId("companyCodeEditDialog").close();
                }.bind(this),
                error: function () {
                    sap.m.MessageBox.error("Failed to update Company Code.");
                }
            });
        },

        onEditUserRoleSubmit: function () {
            var sCode = sap.ui.getCore().byId("editUserRoleCodeInput").getValue().trim();
            var sDesc = sap.ui.getCore().byId("editUserRoleDescInput").getValue().trim();

            if (!sCode || !sDesc) {
                sap.m.MessageBox.error("All fields are required.");
                return;
            }

            var oPayload = {
                CODE: sCode,
                DESCRIPTION: sDesc
            };

            var oModel = this.getView().getModel();

            oModel.create("/updateUserRole", oPayload, {
                success: function () {
                    sap.m.MessageBox.success("User Role updated successfully!");
                    sap.ui.getCore().byId("userRoleEditDialog").close();
                    this.getMastertabledata("userRole");
                }.bind(this),
                error: function () {
                    sap.m.MessageBox.error("Failed to update User Role.");
                }
            });
        },

        onUserRoleEditDialogClose: function () {
            sap.ui.getCore().byId("userRoleEditDialog").close();
        },

        onCompanyCodeEditDialogClose: function () {
            sap.ui.getCore().byId("companyCodeEditDialog").close();
        },

        onEditFieldPress: function (oEvent) {
            var oContext = oEvent.getSource().getParent().getBindingContext("fieldConfigModel");
            var oField = oContext.getObject();
            this._currentFieldConfig = oField;

            if (!this._editFormFieldDialog) {
                this._editFormFieldDialog = sap.ui.xmlfragment(
                    `${this.appId}.fragments.UpdateFormField`,
                    this
                );
                this.getView().addDependent(this._editFormFieldDialog);
            }

            sap.ui.getCore().byId("updateFieldIdInput").setValue(oField.FIELD_ID || "");
            sap.ui.getCore().byId("updateFieldLabelInput").setValue(oField.FIELD_LABEL || "");
            sap.ui.getCore().byId("updateFieldDescInput").setValue(oField.DESCRIPTION || "");
            sap.ui.getCore().byId("updatePlaceholderInput").setValue(oField.PLACEHOLDER || "");
            sap.ui.getCore().byId("updateDefaultValueInput").setValue(oField.DEFAULT_VALUE || "");
            sap.ui.getCore().byId("updateMinimumInput").setValue(oField.MINIMUM || "");
            sap.ui.getCore().byId("updateMaximumInput").setValue(oField.MAXIMUM || "");
            sap.ui.getCore().byId("updateVisibleSwitch").setState(!!oField.IS_VISIBLE);
            sap.ui.getCore().byId("updateMandatorySwitch").setState(!!oField.IS_MANDATORY);
            sap.ui.getCore().byId("updateFieldTypeSelect").setSelectedKey(oField.FIELD_TYPE || "");

            var mTypeMapping = {
                Input: "textBox",
                Dropdown: "select",
                Number: "number",
                Rating: "rating",
                Calendar: "calendar",
                CheckBox: "checkBox",
                Radio: "radio",
                TextArea: "textArea"
            };
            var sDialogFieldType = mTypeMapping[oField.FIELD_TYPE] || oField.FIELD_TYPE;

            // Parse DROPDOWN_VALUES string into options array
            var aOptions = [];
            if (oField.DROPDOWN_VALUES && typeof oField.DROPDOWN_VALUES === "string") {
                aOptions = oField.DROPDOWN_VALUES.split(",").map(function (sValue) {
                    return { displayValue: sValue.trim(), value: sValue.trim() };
                });
            }

            var oEditFieldModel = this.getView().getModel("EditFieldModel");
            oEditFieldModel.setData({
                type: sDialogFieldType,
                label: oField.FIELD_LABEL || "",
                description: oField.DESCRIPTION || "",
                placeholder: oField.PLACEHOLDER || "",
                defaultValue: oField.DEFAULT_VALUE || "",
                minLength: oField.MINIMUM || "",
                maxLength: oField.MAXIMUM || "",
                isRequired: !!oField.IS_MANDATORY,
                isVisible: !!oField.IS_VISIBLE,
                dropdownOptions: aOptions
            });

            this._editFormFieldDialog.open();
        },

        onUpdateFormFieldDialogClose: function () {
            this._editFormFieldDialog.close();
        },

        onUpdateFormFieldSubmit: function () {
            var oView = this.getView();
            var oDialog = sap.ui.getCore().byId("updateFormFieldDialog");
            var oStored = this._currentFieldConfig || {};

            var sFieldId = sap.ui.getCore().byId("updateFieldIdInput").getValue().trim();
            var sFieldLabel = sap.ui.getCore().byId("updateFieldLabelInput").getValue().trim();
            var sDesc = sap.ui.getCore().byId("updateFieldDescInput").getValue().trim();
            var sPlaceholder = sap.ui.getCore().byId("updatePlaceholderInput").getValue().trim();
            var sDefaultValue = sap.ui.getCore().byId("updateDefaultValueInput").getValue().trim();
            var sMinimum = sap.ui.getCore().byId("updateMinimumInput").getValue().trim();
            var sMaximum = sap.ui.getCore().byId("updateMaximumInput").getValue().trim();
            var sFieldType = sap.ui.getCore().byId("updateFieldTypeSelect").getSelectedKey();
            var bVisible = sap.ui.getCore().byId("updateVisibleSwitch").getState();
            var bMandatory = sap.ui.getCore().byId("updateMandatorySwitch").getState();

            if (!sFieldId) {
                sap.m.MessageBox.error("Field ID is required.");
                return;
            }
            if (!sFieldLabel) {
                sap.m.MessageBox.error("Field Label is required.");
                return;
            }

            var aOptions = [];
            var sDropdownValues = "";
            if (sFieldType === "select" || sFieldType === "Dropdown") {
                var oEditFieldModel = oView.getModel("EditFieldModel");
                aOptions = oEditFieldModel.getProperty("/dropdownOptions") || [];
                if (aOptions.length === 0) {
                    sap.m.MessageBox.error("At least one dropdown option is required for dropdown fields.");
                    return;
                }
                // Convert options back to comma-separated string for DROPDOWN_VALUES
                sDropdownValues = aOptions.map(function (oOption) {
                    return oOption.displayValue;
                }).join(",");
            }

            let sCompanyCode = this.byId("idSourceCC").getSelectedKey();
            let sRequestType = this.byId("requestTypeCombo").getSelectedKey();

            var oPayload = {
                data: {
                    FIELD_ID: sFieldId,
                    COMPANY_CODE: oStored.COMPANY_CODE,
                    REQUEST_TYPE: oStored.REQUEST_TYPE,
                    IS_VISIBLE: bVisible,
                    IS_MANDATORY: bMandatory,
                    FIELD_LABEL: sFieldLabel,
                    DESCRIPTION: sDesc,
                    PLACEHOLDER: sPlaceholder,
                    DEFAULT_VALUE: sDefaultValue,
                    MAXIMUM: sMaximum,
                    MINIMUM: sMinimum,
                    FIELD_TYPE: sFieldType,
                    DROPDOWN_VALUES: sDropdownValues
                }
            };

            var oModel = this.getView().getModel();
            oModel.create("/UpdateFieldConfig", oPayload, {
                success: function () {
                    sap.m.MessageBox.success("Field updated successfully!");
                    oDialog.close();
                    this._refreshFieldConfigModel();

                }.bind(this),
                error: function (err) {
                    oDialog.close();
                    sap.m.MessageBox.error("Failed to update field: " + (err.message || "Unknown error."));
                }.bind(this)
            });
        },

        onCreateFieldPress: function (oEvent) {
            // Make sure the fragment is only created once
            if (!this._createFieldDialog) {
                this._createFieldDialog = sap.ui.xmlfragment(
                    `${this.appId}.fragments.AddFormFields`, this
                );

                // Add fragment as dependent to the view
                this.getView().addDependent(this._createFieldDialog);
            }

            // Now open the dialog
            this._createFieldDialog.open();
        },

        _refreshFieldConfigModel: function () {
            var oView = this.getView();
            var sRequestType = this.byId("requestTypeCombo").getSelectedKey();
            var sEntityCode = this.byId("idSourceCC").getSelectedKey();

            if (!sRequestType || !sEntityCode) {
                return;
            }

            var aFilters = [
                new sap.ui.model.Filter("COMPANY_CODE", sap.ui.model.FilterOperator.EQ, sEntityCode),
                new sap.ui.model.Filter("REQUEST_TYPE", sap.ui.model.FilterOperator.EQ, sRequestType)
            ];

            var oModel = oView.getModel();
            oView.setBusy(true);

            oModel.read("/FieldConfig", {
                filters: aFilters,
                success: function (res) {
                    var oFieldConfigModel = oView.getModel("fieldConfigModel");
                    oFieldConfigModel.setProperty("/results", res.results || []);
                    oFieldConfigModel.setProperty("/buttonsEnabled", res.results && res.results.length > 0);
                    oView.setBusy(false);
                }.bind(this),
                error: function () {
                    oView.setBusy(false);
                    sap.m.MessageBox.error("Failed to refresh field configuration.");
                }.bind(this)
            });
        },

        onRemoveDropdownOption: function (oEvent) {
            var oItem = oEvent.getSource().getParent();
            var sPath = oItem.getBindingContext("EditFieldModel").getPath();
            var oEditFieldModel = this.getView().getModel("EditFieldModel");
            var aOptions = oEditFieldModel.getProperty("/dropdownOptions") || [];
            var iIndex = parseInt(sPath.split("/").pop(), 10);
            aOptions.splice(iIndex, 1);
            oEditFieldModel.setProperty("/dropdownOptions", aOptions);
        },

        onAddDropdownOption: function () {
            var oEditFieldModel = this.getView().getModel("EditFieldModel");
            var aOptions = oEditFieldModel.getProperty("/dropdownOptions") || [];
            aOptions.push({ displayValue: "", value: "" });
            oEditFieldModel.setProperty("/dropdownOptions", aOptions);
        },


        onAddFormFieldsDialogClose: function () {
            debugger;
            this._createFieldDialog.close();
        },

        onAddFormFieldsSubmit: function () {
            debugger;
            var sSourceCompanyCode = this.byId("idSourceCC").getSelectedKey();
            var sSourceRequestType = this.byId("requestTypeCombo").getSelectedKey();
            var sTargetCompanyCode = sap.ui.getCore().byId("addEntityInput").getSelectedKey();
            var sTargetRequestType = sap.ui.getCore().byId("addRequestTypeInput").getSelectedKey();;
            if (!sSourceCompanyCode || !sSourceRequestType) {
                sap.m.MessageBox.error("Please fill in all required fields.");
                return;
            }
            var oPayload = {
                sourceCompanyCode: sSourceCompanyCode,
                sourceRequestType: sSourceRequestType,
                targetCompanyCode: sTargetCompanyCode,
                targetRequestType: sTargetRequestType
            };
            var oModel = this.getView().getModel();
            oModel.create("/CopyFieldConfig", oPayload, {
                success: function (res) {
                    debugger;
                    sap.m.MessageBox.success("Field configuration copied successfully!");
                    sap.ui.getCore().byId("addFormFieldsDialog").close();
                },
                error: function (err) {
                    debugger
                    sap.m.MessageBox.error("Failed to copy field configuration.");
                }
            });
        },

        onSubmitRefreshPress: function () {
            this.getView().setBusy(true);
            var sRequestType = this.byId("requestTypeCombo").getSelectedKey();
            var sEntityCode = this.byId("idSourceCC").getSelectedKey();

            // Validation: Check if Request Type and Entity Code are selected
            if (!sRequestType || sRequestType === "") {
                sap.m.MessageBox.error("Please select a Request Type.");
                this.getView().setBusy(false);
                return; // Stop further execution
            }

            if (!sEntityCode || sEntityCode === "") {
                sap.m.MessageBox.error("Please select an Entity Code.");
                this.getView().setBusy(false);
                return; // Stop further execution
            }

            var aFilters = [
                new Filter("COMPANY_CODE", FilterOperator.EQ, sEntityCode),
                new Filter("REQUEST_TYPE", FilterOperator.EQ, sRequestType)
            ];

            // Construct the OData service URL
            var sUrl = "/FieldConfig";

            // Get the OData model
            var oModel = this.getView().getModel();

            // Make the OData read call
            oModel.read(sUrl, {
                filters: aFilters,
                success: function (res) {
                    // Get the fieldConfigModel
                    var oFieldConfigModel = this.getView().getModel("fieldConfigModel");
                    // Update the results with the response data
                    oFieldConfigModel.setProperty("/results", res.results || []);
                    // Enable buttons if data is loaded
                    oFieldConfigModel.setProperty("/buttonsEnabled", res.results && res.results.length > 0);
                    this.getView().setBusy(false);
                }.bind(this), // Maintain controller context
                error: function (err) {
                    // Display an error message and keep buttons disabled
                    this.getView().getModel("fieldConfigModel").setProperty("/buttonsEnabled", false);
                    this.getView().setBusy(false);
                    MessageBox.error("Failed to load Field Configuration data.");
                }.bind(this)
            });
        },

        onNavigateNew: function () {
            debugger;
            var sCompanyCode = this.byId("idSourceCC").getSelectedKey();
            var sRequestType = this.byId("requestTypeCombo").getSelectedKey();

            if (!sCompanyCode || !sRequestType) {
                sap.m.MessageBox.error("Please select both Company Code and Request Type before proceeding.");
                return;
            }

            this.getOwnerComponent().getRouter().navTo("RouteNew", {
                companyCode: encodeURIComponent(sCompanyCode),
                requestType: encodeURIComponent(sRequestType)
            });
        },

        onSearchFields: function (oEvent) {
            var sQuery = oEvent.getParameter("query").toLowerCase();
            var oTable = this.byId("fieldConfigTable");
            var oBinding = oTable.getBinding("items");

            if (sQuery) {
                var aFilters = [
                    new Filter("SECTION", FilterOperator.Contains, sQuery),
                    new Filter("FIELD_ID", FilterOperator.Contains, sQuery),
                    new Filter("DESCRIPTION", FilterOperator.Contains, sQuery)
                ];
                oBinding.filter(new Filter({
                    filters: aFilters,
                    and: false
                }));
            } else {
                oBinding.filter([]);
            }
        },

        onOpenFilterDialog: function () {
            if (!this._filterDialog) {
                this._filterDialog = sap.ui.xmlfragment(
                    `${this.appId}.fragments.FilterFieldsDialog`,
                    this
                );
                this.getView().addDependent(this._filterDialog);
            }
            this._filterDialog.open();
        },

        onApplyFilters: function () {
            var oTable = this.byId("fieldConfigTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            var sSection = sap.ui.getCore().byId("filterSectionSelect").getSelectedKey();
            var sCategory = sap.ui.getCore().byId("filterCategorySelect").getSelectedKey();
            var sFieldType = sap.ui.getCore().byId("filterFieldTypeSelect").getSelectedKey();

            if (sSection) {
                aFilters.push(new Filter("SECTION", FilterOperator.EQ, sSection));
            }
            if (sCategory) {
                aFilters.push(new Filter("CATEGORY", FilterOperator.EQ, sCategory));
            }
            if (sFieldType) {
                var sMappedFieldType = {
                    textBox: "Input",
                    select: "Dropdown",
                    calendar: "Calendar",
                    radio: "Radio",
                    checkBox: "Checkbox"
                }[sFieldType] || sFieldType;
                aFilters.push(new Filter("FIELD_TYPE", FilterOperator.EQ, sMappedFieldType));
            }

            oBinding.filter(aFilters.length ? new Filter({
                filters: aFilters,
                and: true
            }) : []);
            this._filterDialog.close();
        },

        onClearFilters: function () {
            sap.ui.getCore().byId("filterSectionSelect").setSelectedKey("");
            sap.ui.getCore().byId("filterCategorySelect").setSelectedKey("");
            sap.ui.getCore().byId("filterFieldTypeSelect").setSelectedKey("");
            this.onApplyFilters();
        },

        onFilterDialogClose: function () {
            if (this._filterDialog) {
                this._filterDialog.close();
            }
        },

        onSortTable: function () {
            var oTable = this.byId("fieldConfigTable");
            var oBinding = oTable.getBinding("items");
            var oSorter = new Sorter("SECTION", false); // Sort by SECTION ascending
            oBinding.sort(oSorter);
        },

        onExportToCSV: function () {
            var oTable = this.byId("fieldConfigTable");
            var oRowBinding = oTable.getBinding("items");
            var aCols = [
                { label: "Section", property: "SECTION" },
                { label: "Category", property: "CATEGORY" },
                { label: "Field ID", property: "FIELD_ID" },
                { label: "Description", property: "DESCRIPTION" },
                { label: "Visibility", property: "IS_VISIBLE", formatter: function (bVisible) { return bVisible ? "Yes" : "No"; } },
                { label: "Mandatory", property: "IS_MANDATORY", formatter: function (bMandatory) { return bMandatory ? "Yes" : "No"; } }
            ];

            var oSettings = {
                workbook: { columns: aCols },
                dataSource: oRowBinding,
                fileName: "FieldConfiguration_" + new Date().toISOString().slice(0, 10) + ".csv"
            };

            var oSheet = new Spreadsheet(oSettings);
            oSheet.build().finally(function () {
                oSheet.destroy();
            });
        },
    });
});