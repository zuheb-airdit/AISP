sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/BusyDialog",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/RadioButtonGroup",
    "sap/m/RadioButton",
    "sap/m/Select",
    "sap/ui/layout/form/SimpleForm",
    "sap/ui/model/json/JSONModel",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/ComboBox",
    "sap/ui/table/Table",
    "sap/m/UploadCollection"], (Controller, Fragment, MessageBox, BusyDialog, Input, Label, RadioButtonGroup, RadioButton, Select, SimpleForm, JSONModel, Column, Text, ComboBox, Table, UploadCollection) => {
        "use strict";

        return Controller.extend("com.requestmanagement.requestmanagement.controller.Registrationform", {
            onInit() {
                let oModel = this.getOwnerComponent().getModel("admin");
                this.getView().setModel(oModel)
                let oRegModel = this.getOwnerComponent().getModel("registration-manage");
                this.getView().setModel(oRegModel, "oRegModel")
                this.getOwnerComponent().getRouter().getRoute("Registrationform").attachPatternMatched(this._onRouteMatchedwithoutid, this);

            },

            _onRouteMatchedwithoutid: function () {
                console.log("routeMtachFucn");
                debugger;
                let oModel = this.getView().getModel();
                oModel.read("/FieldConfig", {
                    success: function (res) {
                        var fieldConfig = new JSONModel(res.results); // Assuming res.results contains the array
                        this.getView().setModel(fieldConfig, "fieldConfig");

                        // Initialize formDataModel with empty values based on fieldConfig
                        var initialData = {};
                        res.results.forEach(function (field) {
                            initialData[field.FIELD_PATH] = ""; // Set empty strings as initial values
                        });
                        var oFormDataModel = new JSONModel(initialData);
                        this.getView().setModel(oFormDataModel, "formDataModel");

                        this.createDynamicForms();
                    }.bind(this),
                    error: function (err) {
                        debugger;
                        console.error("Error fetching FieldConfig:", err);
                    }
                });
            },

            createDynamicForms: function () {
                debugger;
                var oIconTabBar = this.getView().byId("iconTabBar");
                var oFieldConfig = this.getView().getModel("fieldConfig").getData();
                var oSections = {};

                oFieldConfig.forEach(function (field) {
                    if (field.IS_VISIBLE) {
                        if (!oSections[field.SECTION]) {
                            oSections[field.SECTION] = [];
                        }
                        oSections[field.SECTION].push(field);
                    }
                });
                this.createSupplierForm(oSections["Supplier Information"]); // Pass only Supplier Information section
                this.createFinanceForm(oSections["Finance Information"]);
                this.createOperationalForm(oSections["Operational Information"]);
                this.createDisclosureForm(oSections["Disclosures"]);
                this.createQualityForm(oSections["Quality Certificates"]);
                this.createAttachmentsForm(oSections["Attachments"]);
                this.createSubmissionForm(oSections["Submission"]);
            },


            createSupplierForm: function (oSupplierFields) {
                if (!oSupplierFields) {
                    console.error("No fields found for Supplier Information");
                    return;
                }

                var oContainer = this.getView().byId(this.getView().createId("SupplierInformationFormContainer"));
                if (!oContainer) {
                    console.error("SupplierInformationFormContainer not found. Check your view XML.");
                    return;
                }

                var oVBox = new sap.m.VBox({
                    width: "100%"
                }).addStyleClass("subSectionSpacing");

                var oFormDataModel = this.getView().getModel("formDataModel");
                if (!oFormDataModel) {
                    console.error("formDataModel not found. Ensure it is set before creating the form.");
                    return;
                }

                var oCategories = {};
                oSupplierFields.forEach(function (field) {
                    if (field.IS_VISIBLE) {
                        if (!oCategories[field.CATEGORY]) {
                            oCategories[field.CATEGORY] = [];
                        }
                        oCategories[field.CATEGORY].push(field);
                    }
                });

                console.log("Categories and Fields:", oCategories); // Debug log to check field distribution

                for (var category in oCategories) {
                    var oSimpleForm = new sap.ui.layout.form.SimpleForm({
                        title: category === "Supplier Information" ? "Supplier Information" :
                            category === "Address" ? "Address" :
                                category === "Primary Contact" ? "Primary Contact" : "Other Office Address",
                        editable: true,
                        layout: sap.ui.layout.form.SimpleFormLayout.ColumnLayout,
                        columnsXL: 3,
                        columnsL: 3,
                        columnsM: 1,
                        labelSpanXL: 4,
                        labelSpanL: 4,
                        labelSpanM: 4,
                        emptySpanXL: 0,
                        emptySpanL: 0,
                        emptySpanM: 0,
                        singleContainerFullSize: false
                    }).addStyleClass("subSectionMargin");

                    var visibleFields = oCategories[category].filter(field => field.IS_VISIBLE);
                    if (visibleFields.length < 3) {
                        console.warn("Category", category, "has fewer than 3 visible fields:", visibleFields.length);
                    }

                    visibleFields.forEach(function (field) {
                        var oLabel = new Label({
                            text: field.FIELD_LABEL + (field.IS_MANDATORY ? " *" : "")
                        });

                        var oInput;
                        var modelPath = "/" + field.FIELD_PATH;
                        var value = oFormDataModel.getProperty(modelPath) || ""; // Get initial value

                        if (field.FIELD_LABEL === "Country" ||
                            field.FIELD_LABEL === "Region" ||
                            field.FIELD_LABEL === "City") {
                            oInput = new ComboBox({
                                selectedKey: value, // Set initial value
                                required: field.IS_MANDATORY,
                                width: "100%"
                            }).addStyleClass("sapUiSmallMarginBottom");

                            if (field.FIELD_LABEL === "Country") {
                                oInput.bindItems({
                                    path: "/Country",
                                    template: new sap.ui.core.Item({
                                        key: "{LAND1}",
                                        text: "{LANDX}"
                                    })
                                });
                            } else if (field.FIELD_LABEL === "Region") {
                                oInput.bindItems({
                                    path: "/Region",
                                    template: new sap.ui.core.Item({
                                        key: "{LAND1}", // Verify this key with your model
                                        text: "{BLAND}"
                                    })
                                });
                            } else if (field.FIELD_LABEL === "City") {
                                oInput.bindItems({
                                    path: "entityModel>/cities",
                                    template: new sap.ui.core.Item({
                                        key: "{entityModel>code}",
                                        text: "{entityModel>name}"
                                    })
                                });
                            }
                        } else {
                            oInput = new Input({
                                value: value, // Set initial value
                                required: field.IS_MANDATORY,
                                width: "100%"
                            }).addStyleClass("sapUiSmallMarginBottom");
                        }

                        if (oInput) {
                            try {
                                // Two-way binding to update formDataModel
                                oInput.bindProperty("value", {
                                    path: modelPath,
                                    model: "formDataModel",
                                    type: new sap.ui.model.type.String()
                                });
                            } catch (e) {
                                console.error("Binding failed for field:", field.FIELD_LABEL, e);
                            }

                            oSimpleForm.addContent(oLabel);
                            oSimpleForm.addContent(oInput);
                        }
                    });

                    oVBox.addItem(oSimpleForm);
                }

                oContainer.removeAllContent();
                oContainer.addContent(oVBox);
            },

            createFinanceForm: function (oFinanceFields) {
                if (!oFinanceFields) {
                    console.error("No fields found for Finance Information");
                    return;
                }

                var oContainer = this.getView().byId(this.getView().createId("FinanceInformationFormContainer"));
                if (!oContainer) {
                    console.error("FinanceInformationFormContainer not found. Check your view XML.");
                    return;
                }

                var oVBox = new sap.m.VBox({
                    width: "100%"
                }).addStyleClass("subSectionSpacing");

                var oFormDataModel = this.getView().getModel("formDataModel");
                if (!oFormDataModel) {
                    console.error("formDataModel not found. Ensure it is set before creating the form.");
                    return;
                }

                // Initialize financeModel for radio button logic if not already set
                var oFinanceModel = this.getView().getModel("financeModel");
                if (!oFinanceModel) {
                    oFinanceModel = new JSONModel({
                        isTaxApplicable: false, // Default value
                        taxSelectionIndex: 1 // Default to "No" (index 1)
                    });
                    this.getView().setModel(oFinanceModel, "financeModel");
                }

                var oCategories = {};
                oFinanceFields.forEach(function (field) {
                    if (field.IS_VISIBLE) {
                        if (!oCategories[field.CATEGORY]) {
                            oCategories[field.CATEGORY] = [];
                        }
                        oCategories[field.CATEGORY].push(field);
                    }
                });

                console.log("Categories:", oCategories);

                for (var category in oCategories) {
                    var oSimpleForm = new sap.ui.layout.form.SimpleForm({
                        title: category === "Primary Bank Details" ? "Primary Bank Details" :
                            category === "Other Bank Details" ? "Other Bank Details" :
                                category === "TAX/VAT/GST" ? "TAX/VAT/GST" : category,
                        editable: true,
                        layout: "ColumnLayout",
                        labelSpanL: 4,
                        labelSpanM: 4,
                        emptySpanL: 0,
                        emptySpanM: 0,
                        columnsL: 3,
                        columnsM: 1
                    }).addStyleClass("subSectionMargin");

                    var hasTaxField = false;
                    var hasGstField = false;

                    // First pass: Render TAX/VAT/GST radio buttons
                    oCategories[category].forEach(function (field) {
                        if (field.FIELD_LABEL === "TAX/VAT/GST" && !hasTaxField) {
                            hasTaxField = true;
                            var oTaxLabel = new sap.m.Label({ text: field.FIELD_LABEL });
                            var oTaxRadioGroup = new sap.m.RadioButtonGroup({
                                columns: 2,
                                selectedIndex: "{financeModel>/taxSelectionIndex}", // Bind to a numeric property
                                select: function (oEvent) {
                                    var oFinanceModel = this.getView().getModel("financeModel");
                                    var selectedIndex = oEvent.getParameter("selectedIndex");
                                    oFinanceModel.setProperty("/taxSelectionIndex", selectedIndex);
                                    oFinanceModel.setProperty("/isTaxApplicable", selectedIndex === 0); // Update isTaxApplicable
                                }.bind(this)
                            }).addStyleClass("sapUiSmallMarginBottom");
                            oTaxRadioGroup.addButton(new sap.m.RadioButton({ text: "Yes" }));
                            oTaxRadioGroup.addButton(new sap.m.RadioButton({ text: "No" }));

                            oSimpleForm.addContent(oTaxLabel);
                            oSimpleForm.addContent(oTaxRadioGroup);
                        }
                    });

                    // Second pass: Render other fields
                    oCategories[category].forEach(function (field) {
                        var oLabel = new sap.m.Label({
                            text: field.FIELD_LABEL // Removed custom asterisk
                        });

                        var oInput;
                        var modelPath = "/" + field.FIELD_PATH; // Use FIELD_PATH as the binding path
                        var value = oFormDataModel.getProperty(modelPath) || ""; // Get initial value

                        if (field.FIELD_LABEL === "Bank Name" ||
                            field.FIELD_LABEL === "Branch Name" ||
                            field.FIELD_LABEL === "Swift Code" ||
                            field.FIELD_LABEL === "Bank Country" ||
                            field.FIELD_LABEL === "Beneficiary Name" ||
                            field.FIELD_LABEL === "Account Number" ||
                            field.FIELD_LABEL === "IBAN Number" ||
                            field.FIELD_LABEL === "Routing Code" ||
                            field.FIELD_LABEL === "Bank Currency") {

                            if (field.FIELD_LABEL === "Bank Name" ||
                                field.FIELD_LABEL === "Branch Name" ||
                                field.FIELD_LABEL === "Bank Currency" ||
                                field.FIELD_LABEL === "Bank Country") {
                                oInput = new sap.m.ComboBox({
                                    selectedKey: value, // Set initial selected key
                                    value: value, // Set initial value for free text
                                    required: field.IS_MANDATORY,
                                    width: "100%"
                                }).addStyleClass("sapUiSmallMarginBottom");

                                // Bind selectedKey for pre-defined options
                                oInput.bindProperty("selectedKey", {
                                    path: modelPath,
                                    model: "formDataModel",
                                    type: new sap.ui.model.type.String()
                                });

                                // Bind value for free text input
                                oInput.bindProperty("value", {
                                    path: modelPath,
                                    model: "formDataModel",
                                    type: new sap.ui.model.type.String()
                                });

                                // Add change event to handle manual input
                                oInput.attachChange(function (oEvent) {
                                    var newValue = oEvent.getParameter("value");
                                    var selectedKey = oEvent.getParameter("selectedItem") ? oEvent.getParameter("selectedItem").getKey() : newValue;
                                    oFormDataModel.setProperty(modelPath, selectedKey || newValue); // Update model with selected key or free text
                                    console.log("ComboBox changed for", field.FIELD_LABEL, "new value:", newValue, "selectedKey:", selectedKey);
                                });

                                // Enhanced debugging to check model data and bound items
                                var oEntityModel = this.getView().getModel("entityModel");
                                var oDefaultModel = this.getView().getModel();
                                var boundItems = oInput.getBinding("items");
                                var itemsData = boundItems ? boundItems.getCurrentContexts().map(ctx => ctx.getObject()) : "Binding not resolved";
                                console.log("Debugging ComboBox for", field.FIELD_LABEL, {
                                    entityModel: oEntityModel ? oEntityModel.getData() : "Not set",
                                    defaultModel: oDefaultModel ? oDefaultModel.getData() : "Not set",
                                    bindingPath: field.FIELD_LABEL === "Bank Name" ? "entityModel>/banks" :
                                        field.FIELD_LABEL === "Branch Name" ? "entityModel>/branches" :
                                            field.FIELD_LABEL === "Bank Currency" ? "/Currency" :
                                                "/Country",
                                    banksData: oEntityModel ? oEntityModel.getProperty("/banks") : "N/A",
                                    branchesData: oEntityModel ? oEntityModel.getProperty("/branches") : "N/A",
                                    currencyData: oDefaultModel ? oDefaultModel.getProperty("/Currency") : "N/A",
                                    countryData: oDefaultModel ? oDefaultModel.getProperty("/Country") : "N/A",
                                    boundItemsData: itemsData
                                });

                                if (field.FIELD_LABEL === "Bank Name") {
                                    oInput.bindItems({
                                        path: "entityModel>/banks",
                                        template: new sap.ui.core.Item({
                                            key: "{entityModel>code}",
                                            text: "{entityModel>name}"
                                        })
                                    }).attachEventOnce("dataReceived", function () {
                                        console.log("Bank Name items loaded:", oInput.getItems().map(item => ({
                                            key: item.getKey(),
                                            text: item.getText()
                                        })));
                                    });
                                } else if (field.FIELD_LABEL === "Branch Name") {
                                    oInput.bindItems({
                                        path: "entityModel>/branches",
                                        template: new sap.ui.core.Item({
                                            key: "{entityModel>code}",
                                            text: "{entityModel>name}"
                                        })
                                    }).attachEventOnce("dataReceived", function () {
                                        console.log("Branch Name items loaded:", oInput.getItems().map(item => ({
                                            key: item.getKey(),
                                            text: item.getText()
                                        })));
                                    });
                                } else if (field.FIELD_LABEL === "Bank Currency") {
                                    oInput.bindItems({
                                        path: "/Currency",
                                        template: new sap.ui.core.Item({
                                            key: "{WAERS}",
                                            text: "{LTEXT}"
                                        })
                                    }).attachEventOnce("dataReceived", function () {
                                        console.log("Bank Currency items loaded:", oInput.getItems().map(item => ({
                                            key: item.getKey(),
                                            text: item.getText()
                                        })));
                                    });
                                } else if (field.FIELD_LABEL === "Bank Country") {
                                    oInput.bindItems({
                                        path: "/Country",
                                        template: new sap.ui.core.Item({
                                            key: "{LAND1}",
                                            text: "{LANDX}"
                                        })
                                    }).attachEventOnce("dataReceived", function () {
                                        console.log("Bank Country items loaded:", oInput.getItems().map(item => ({
                                            key: item.getKey(),
                                            text: item.getText()
                                        })));
                                    });
                                }
                            } else {
                                oInput = new sap.m.Input({
                                    required: field.IS_MANDATORY,
                                    width: "100%"
                                }).addStyleClass("sapUiSmallMarginBottom");

                                // Bind value with two-way binding
                                oInput.bindProperty("value", {
                                    path: modelPath,
                                    model: "formDataModel",
                                    type: new sap.ui.model.type.String()
                                });
                            }
                        } else if (field.FIELD_LABEL === "GST No" && !hasGstField) {
                            hasGstField = true;
                            oInput = new sap.m.Input({
                                required: "{financeModel>/isTaxApplicable}",
                                enabled: true,
                                width: "100%"
                            }).addStyleClass("sapUiSmallMarginBottom");

                            // Bind value with two-way binding
                            oInput.bindProperty("value", {
                                path: modelPath,
                                model: "formDataModel",
                                type: new sap.ui.model.type.String()
                            });
                        } else if (field.FIELD_LABEL === "TAX/VAT/GST") {
                            oInput = null;
                        } else {
                            oInput = new sap.m.Input({
                                required: field.IS_MANDATORY,
                                width: "100%"
                            }).addStyleClass("sapUiSmallMarginBottom");

                            // Bind value with two-way binding
                            oInput.bindProperty("value", {
                                path: modelPath,
                                model: "formDataModel",
                                type: new sap.ui.model.type.String()
                            });
                        }

                        if (oInput) {
                            oSimpleForm.addContent(oLabel);
                            oSimpleForm.addContent(oInput);
                        }
                    }.bind(this)); // Bind the outer function to access 'this' for getView()

                    oVBox.addItem(oSimpleForm);
                }

                oContainer.removeAllContent();
                oContainer.addContent(oVBox);
            },

            createOperationalForm: function (oOperationalFields) {
                if (!oOperationalFields) {
                    console.error("No fields found for Operational Information");
                    return;
                }

                var oContainer = this.getView().byId(this.getView().createId("OperationalInformationFormContainer"));
                if (!oContainer) {
                    console.error("OperationalInformationFormContainer not found. Check your view XML.");
                    return;
                }

                var oVBox = new sap.m.VBox({
                    width: "100%"
                }).addStyleClass("subSectionSpacing");

                var oFormDataModel = this.getView().getModel("formDataModel");
                if (!oFormDataModel) {
                    console.error("formDataModel not found. Ensure it is set before creating the form.");
                    return;
                }

                var oCategories = {};
                oOperationalFields.forEach(function (field) {
                    if (field.IS_VISIBLE) {
                        if (!oCategories[field.CATEGORY]) {
                            oCategories[field.CATEGORY] = [];
                        }
                        oCategories[field.CATEGORY].push(field);
                    }
                });

                console.log("Operational Categories:", oCategories); // Debug categories

                for (var category in oCategories) {
                    var oSimpleForm = new sap.ui.layout.form.SimpleForm({
                        title: category === "Product/Service Details" ? "Product/Service Details" :
                            category === "Operational Capacity" ? "Operational Capacity" : category,
                        editable: true,
                        layout: "ColumnLayout",
                        labelSpanL: 4,
                        labelSpanM: 4,
                        emptySpanL: 0,
                        emptySpanM: 0,
                        columnsL: 2,
                        columnsM: 1
                    }).addStyleClass("subSectionMargin");

                    oCategories[category].forEach(function (field) {
                        var oLabel = new sap.m.Label({
                            text: field.FIELD_LABEL // Removed custom asterisk
                        });

                        var oInput;
                        var modelPath = "/" + field.FIELD_PATH; // Use FIELD_PATH as the binding path
                        var value = oFormDataModel.getProperty(modelPath) || ""; // Get initial value

                        if (field.FIELD_LABEL === "Product Category" || field.FIELD_LABEL === "Production Location") {
                            oInput = new sap.m.ComboBox({
                                selectedKey: value, // Set initial selected key
                                value: value, // Set initial value for free text
                                required: field.IS_MANDATORY,
                                width: "100%"
                            }).addStyleClass("sapUiSmallMarginBottom");

                            // Bind selectedKey for pre-defined options
                            oInput.bindProperty("selectedKey", {
                                path: modelPath,
                                model: "formDataModel",
                                type: new sap.ui.model.type.String()
                            });

                            // Bind value for free text input
                            oInput.bindProperty("value", {
                                path: modelPath,
                                model: "formDataModel",
                                type: new sap.ui.model.type.String()
                            });

                            // Add change event to handle manual input and selections
                            oInput.attachChange(function (oEvent) {
                                var newValue = oEvent.getParameter("value");
                                var selectedKey = oEvent.getParameter("selectedItem") ? oEvent.getParameter("selectedItem").getKey() : newValue;
                                oFormDataModel.setProperty(modelPath, selectedKey || newValue); // Update model with selected key or free text
                                console.log("ComboBox changed for", field.FIELD_LABEL, "new value:", newValue, "selectedKey:", selectedKey);
                            });

                            // Enhanced debugging to check model data and bound items
                            var oEntityModel = this.getView().getModel("entityModel");
                            var boundItems = oInput.getBinding("items");
                            var itemsData = boundItems ? boundItems.getCurrentContexts().map(ctx => ctx.getObject()) : "Binding not resolved";
                            console.log("Debugging ComboBox for", field.FIELD_LABEL, {
                                entityModel: oEntityModel ? oEntityModel.getData() : "Not set",
                                bindingPath: field.FIELD_LABEL === "Product Category" ? "entityModel>/productCategories" :
                                    "entityModel>/locations",
                                itemsData: itemsData
                            });

                            if (field.FIELD_LABEL === "Product Category") {
                                oInput.bindItems({
                                    path: "entityModel>/productCategories",
                                    template: new sap.ui.core.Item({
                                        key: "{entityModel>code}",
                                        text: "{entityModel>name}"
                                    })
                                }).attachEventOnce("dataReceived", function () {
                                    console.log("Product Category items loaded:", oInput.getItems().map(item => ({
                                        key: item.getKey(),
                                        text: item.getText()
                                    })));
                                });
                            } else if (field.FIELD_LABEL === "Production Location") {
                                oInput.bindItems({
                                    path: "entityModel>/locations",
                                    template: new sap.ui.core.Item({
                                        key: "{entityModel>code}",
                                        text: "{entityModel>name}"
                                    })
                                }).attachEventOnce("dataReceived", function () {
                                    console.log("Production Location items loaded:", oInput.getItems().map(item => ({
                                        key: item.getKey(),
                                        text: item.getText()
                                    })));
                                });
                            }
                        } else {
                            oInput = new sap.m.Input({
                                value: value, // Set initial value
                                required: field.IS_MANDATORY,
                                width: "100%"
                            }).addStyleClass("sapUiSmallMarginBottom");

                            // Bind value with two-way binding
                            oInput.bindProperty("value", {
                                path: modelPath,
                                model: "formDataModel",
                                type: new sap.ui.model.type.String()
                            });
                        }

                        oSimpleForm.addContent(oLabel);
                        oSimpleForm.addContent(oInput);
                    }.bind(this)); // Bind the outer function to access 'this' for getView()

                    oVBox.addItem(oSimpleForm);
                }

                oContainer.removeAllContent();
                oContainer.addContent(oVBox);
            },


            createDisclosureForm: function (oDisclosureFields) {
                if (!oDisclosureFields || oDisclosureFields.length === 0) {
                    console.error("No fields found for Disclosure. Check fieldConfig data:", oDisclosureFields);
                    return;
                }

                var oContainer = this.getView().byId(this.getView().createId("DisclosureFormContainer"));
                if (!oContainer) {
                    console.error("DisclosureFormContainer not found. Check your view XML.");
                    return;
                }

                var oMainVBox = new sap.m.VBox({
                    width: "100%"
                }).addStyleClass("disclosureContainer");

                var oCategories = {};
                oDisclosureFields.forEach(function (field) {
                    if (field.IS_VISIBLE) {
                        if (!oCategories[field.CATEGORY]) {
                            oCategories[field.CATEGORY] = [];
                        }
                        oCategories[field.CATEGORY].push(field);
                    }
                });

                console.log("Disclosure Categories:", oCategories);

                if (Object.keys(oCategories).length === 0) {
                    console.warn("No categories found for Disclosure. Ensure fieldConfig includes Disclosure fields.");
                    return;
                }

                // Initialize disclosure model with default values (2 = NA)
                var oModel = new JSONModel({});
                var propertyMap = {}; // Track property names for debugging
                oDisclosureFields.forEach(function (field) {
                    var propertyName = "/" + field.FIELD_LABEL.toLowerCase().replace(/ /g, '').replace('&', '').replace('-', ''); // Default to NA (2)
                    oModel.setProperty(propertyName, 2); // Default to NA (2)
                    propertyMap[field.FIELD_LABEL] = propertyName; // Map FIELD_LABEL to propertyName
                    console.log("Initialized property:", propertyName, "for FIELD_LABEL:", field.FIELD_LABEL, "with value:", 2); // Debug initialization
                });
                this.getView().setModel(oModel, "disclosureModel");

                for (var category in oCategories) {
                    var firstField = oCategories[category][0];
                    var title = firstField.FIELD_LABEL || category;
                    var description = firstField.DESCRIPTION || "No description available.";
                    var propertyName = propertyMap[firstField.FIELD_LABEL];

                    var oCategoryPanel = new sap.m.Panel({
                        headerText: title,
                        width: "100%"
                    }).addStyleClass("categoryPanel");

                    oCategoryPanel.addContent(new sap.m.Text({
                        text: description,
                        wrapping: true
                    }).addStyleClass("disclosureDescription"));

                    var oRadioButtonGroup = new sap.m.RadioButtonGroup({
                        columns: 3,
                        selectedIndex: {
                            path: "disclosureModel>" + propertyName,
                            formatter: function (value) {
                                var index = parseInt(value, 10);
                                console.log("Formatter for", title, "value:", value, "parsed index:", index); // Debug formatter
                                return isNaN(index) ? 2 : index; // Default to 2 (NA) if invalid
                            }
                        },
                        select: function (oEvent) {
                            var oDisclosureModel = this.getView().getModel("disclosureModel");
                            var selectedIndex = oEvent.getParameter("selectedIndex");
                            if (oDisclosureModel) {
                                oDisclosureModel.setProperty(propertyName, selectedIndex);
                                console.log("Radio button changed for", title, "property:", propertyName, "new value:", selectedIndex); // Debug change
                            } else {
                                console.error("disclosureModel not available during select event.");
                            }
                        }.bind(this)
                    }).addStyleClass("radioButtonGroup");
                    oRadioButtonGroup.addButton(new sap.m.RadioButton({ text: "Yes" }));
                    oRadioButtonGroup.addButton(new sap.m.RadioButton({ text: "No" }));
                    oRadioButtonGroup.addButton(new sap.m.RadioButton({ text: "NA" }));
                    oCategoryPanel.addContent(oRadioButtonGroup);

                    oMainVBox.addItem(oCategoryPanel);
                }

                oContainer.removeAllContent();
                oContainer.addContent(oMainVBox);

                // Debugging: Log the VBox structure and initial model state
                console.log("VBox Content:", oMainVBox.getItems());
                console.log("Initial Disclosure Model:", oModel.getData());
            },

            createQualityForm: function (oQualityFields) {
                if (!oQualityFields) {
                    console.error("No fields found for Quality Certificates");
                    return;
                }

                var oContainer = this.getView().byId(this.getView().createId("QualityCertificateFormContainer"));
                if (!oContainer) {
                    console.error("QualityCertificateFormContainer not found. Check your view XML.");
                    return;
                }

                var oTable = new sap.m.Table({
                    width: "100%"
                });

                oTable.addColumn(new sap.m.Column({
                    header: new sap.m.Label({ text: "Description" })
                }));

                oTable.addColumn(new sap.m.Column({
                    header: new sap.m.Label({ text: "Action" })
                }));

                oTable.addColumn(new sap.m.Column({
                    header: new sap.m.Label({ text: "Done By" })
                }));

                var certificatesData = oQualityFields.map(function (field) {
                    var description = field.FIELD_LABEL.replace(" - Done By", "");
                    return {
                        description: description,
                        action: "No", // Default action to "No"
                        doneBy: "",  // Default doneBy to empty string
                        fieldPath: field.FIELD_PATH // Store FIELD_PATH
                    };
                });

                var oModel = new JSONModel({
                    certificates: certificatesData
                });
                this.getView().setModel(oModel, "qualityModel"); // Explicitly set as qualityModel

                oTable.bindItems({
                    path: "qualityModel>/certificates",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({ text: "{qualityModel>description}" }),
                            new sap.m.Select({
                                selectedKey: "{qualityModel>action}",
                                items: [
                                    new sap.ui.core.Item({ key: "Yes", text: "Yes" }),
                                    new sap.ui.core.Item({ key: "No", text: "No" })
                                ]
                            }),
                            new sap.m.Input({
                                value: "{qualityModel>doneBy}",
                                editable: true
                            })
                        ]
                    })
                });

                oTable.setModel(oModel);

                oContainer.removeAllContent();
                oContainer.addContent(new sap.m.VBox({
                    items: [oTable]
                }).addStyleClass("subSectionSpacing"));

                // Debugging: Log model data after initialization
                console.log("Initialized Quality Certificates Model:", oModel.getData());
            },



            createAttachmentsForm: function (oAttachmentFields) {
                if (!oAttachmentFields || oAttachmentFields.length === 0) {
                    console.error("No fields found for Attachments");
                    return;
                }

                var oContainer = this.getView().byId("AttachmentFormContainer");
                if (!oContainer) {
                    console.error("AttachmentsFormContainer not found. Check your view XML.");
                    return;
                }

                oContainer.removeAllContent();
                var oMainVBox = new sap.m.VBox().addStyleClass("subSectionSpacing");

                // Store oAttachmentFields as a controller property
                this._attachmentFields = oAttachmentFields;
                this._attachmentModels = []; // Array to store model references

                oAttachmentFields.forEach((oField) => {
                    var oModel = new JSONModel({
                        files: [{
                            description: oField.DESCRIPTION || "",
                            fileName: "",
                            uploaded: false,
                            fieldPath: oField.FIELD_PATH,
                            fieldId: oField.FIELD_ID
                        }]
                    });

                    this._attachmentModels.push(oModel); // Store the model reference

                    var oTable = new sap.m.Table({
                        growing: true,
                        columns: [
                            new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) }),
                            new sap.m.Column({ header: new sap.m.Label({ text: "Upload" }) }),
                            new sap.m.Column({ header: new sap.m.Label({ text: "File Name" }) }),
                            new sap.m.Column({ header: new sap.m.Label({ text: "Actions" }) })
                        ]
                    });

                    var oFileUploader = new sap.ui.unified.FileUploader({
                        name: "myFileUpload",
                        uploadUrl: "upload/", // Replace with your actual backend endpoint
                        tooltip: "Upload your file to the local server",
                        uploadComplete: this.handleUploadComplete.bind(this),
                        change: this.handleValueChange.bind(this),
                        typeMissmatch: this.handleTypeMissmatch.bind(this),
                        style: "Emphasized",
                        fileType: "txt,jpg,pdf,doc,docx,png",
                        placeholder: "Choose a file for Upload...",
                        visible: true
                    });

                    oFileUploader.addParameter(new sap.ui.unified.FileUploaderParameter({
                        name: "Accept-CH",
                        value: "Viewport-Width"
                    }));
                    oFileUploader.addParameter(new sap.ui.unified.FileUploaderParameter({
                        name: "Accept-CH",
                        value: "Width"
                    }));
                    oFileUploader.addParameter(new sap.ui.unified.FileUploaderParameter({
                        name: "Accept-CH-Lifetime",
                        value: "86400"
                    }));

                    var oItemTemplate = new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Input({
                                width: "100%"
                            }),
                            new sap.m.Button({
                                text: "Upload",
                                press: function (oEvent) {
                                    var oButton = oEvent.getSource();
                                    var oContext = oButton.getBindingContext();
                                    if (oContext) {
                                        oButton.addDependent(oFileUploader);
                                        oFileUploader.setBindingContext(oContext);

                                        oContainer.addContent(oFileUploader);

                                        setTimeout(() => {
                                            var $fileInput = oFileUploader.$().find("input[type='file']");
                                            if ($fileInput.length > 0) {
                                                $fileInput.trigger("click");
                                                if (!oFileUploader.getFocusDomRef()) {
                                                    console.warn("FileUploader focus issue detected after delay");
                                                }
                                            } else {
                                                console.error("File input not found in FileUploader");
                                            }
                                            oContainer.removeContent(oFileUploader);
                                        }, 100);
                                    } else {
                                        console.error("No binding context found for Upload button");
                                    }
                                }
                            }),
                            new sap.m.Text({
                                text: "{fileName}"
                            }),
                            new sap.m.HBox({
                                visible: true,
                                items: [
                                    new sap.m.Button({
                                        icon: "sap-icon://download",
                                        type: "Transparent",
                                        tooltip: "Download",
                                        press: function (oEvent) {
                                            var oContext = oEvent.getSource().getBindingContext();
                                            var sFileName = oContext.getProperty("fileName");
                                            sap.m.MessageToast.show("Download functionality for " + sFileName + " to be implemented");
                                        }
                                    }),
                                    new sap.m.Button({
                                        icon: "sap-icon://delete",
                                        type: "Transparent",
                                        tooltip: "Remove",
                                        press: function (oEvent) {
                                            var oContext = oEvent.getSource().getBindingContext();
                                            var sPath = oContext.getPath();
                                            oModel.setProperty(sPath + "/fileName", "");
                                            oModel.setProperty(sPath + "/uploaded", false);
                                        }
                                    })
                                ]
                            })
                        ]
                    });

                    oTable.bindItems({
                        path: "/files",
                        template: oItemTemplate
                    });

                    oTable.setModel(oModel);

                    oMainVBox.addItem(new sap.m.VBox({
                        items: [
                            new sap.m.Title({
                                text: oField.FIELD_LABEL,
                                level: "H3"
                            }),
                            oTable
                        ]
                    }).addStyleClass("attachmentTableSection"));
                });

                oContainer.addContent(new sap.m.VBox({
                    items: [
                        oMainVBox
                    ]
                }));

                var oCustomCSS = `
                    .attachmentTableSection {
                        margin-bottom: 2rem;
                    }
                    .attachmentTableSection .sapMTitle {
                        margin-bottom: 0.5rem;
                    }
                `;
                $('<style>').text(oCustomCSS).appendTo('head');
            },

            // Add these handler methods
            handleUploadComplete: function (oEvent) {
                var sResponse = oEvent.getParameter("response");
                console.log("handleUploadComplete triggered, response:", sResponse); // Debug to confirm trigger
                if (sResponse) {
                    var oContext = oEvent.getSource().getBindingContext();
                    if (oContext) {
                        var sFileName = oEvent.getParameter("fileName");
                        var oModel = oContext.getModel();
                        oModel.setProperty(oContext.getPath() + "/fileName", sFileName);
                        oModel.setProperty(oContext.getPath() + "/uploaded", true);

                        var oFile = oEvent.getParameter("files")[0];
                        if (oFile) {
                            var reader = new FileReader();
                            reader.onload = function (e) {
                                var base64String = e.target.result.split(',')[1];
                                var mimeType = oFile.type || "image/png";
                                var imageUrl = "data:" + mimeType + ";base64," + base64String;
                                oModel.setProperty(oContext.getPath() + "/imageUrl", imageUrl);
                                console.log("File uploaded and converted to base64:", sFileName, "imageUrl:", imageUrl);
                            };
                            reader.onerror = function (e) {
                                console.error("Error reading file:", e);
                            };
                            reader.readAsDataURL(oFile);
                        }
                    }
                } else {
                    console.warn("No response in uploadComplete, relying on change event");
                }
            },

            handleValueChange: function (oEvent) {
                var oFileUploader = oEvent.getSource();
                var oContext = oFileUploader.getBindingContext();
                if (oContext) {
                    var oModel = oContext.getModel();
                    var sPath = oContext.getPath();
                    var oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
                    if (oFile) {
                        oModel.setProperty(sPath + "/fileName", oFile.name);
                        oModel.setProperty(sPath + "/uploaded", true);

                        var reader = new FileReader();
                        reader.onload = function (e) {
                            var base64String = e.target.result.split(',')[1];
                            var mimeType = oFile.type || "image/png";
                            var imageUrl = "data:" + mimeType + ";base64," + base64String;
                            oModel.setProperty(sPath + "/imageUrl", imageUrl);
                            console.log("Change event: File converted to base64:", oFile.name, "imageUrl:", imageUrl);
                        };
                        reader.onerror = function (e) {
                            console.error("Error reading file in change:", e);
                        };
                        reader.readAsDataURL(oFile);
                    } else {
                        oModel.setProperty(sPath + "/fileName", oFileUploader.getValue());
                        console.log("Value changed, fileName updated:", oFileUploader.getValue());
                    }
                }
            },

            handleTypeMissmatch: function (oEvent) {
                var aFileTypes = oEvent.getSource().getFileType().join(", ");
                sap.m.MessageBox.error("The file type *." + oEvent.getParameter("fileType") +
                    " is not supported. Please upload only *." + aFileTypes + " files.");
            },
            createSubmissionForm: function (oFieldConfig) {
                var oContainer = this.getView().byId(this.getView().createId("SubmissionFormContainer"));
                if (!oContainer) {
                    sap.m.MessageBox.error("SubmissionFormContainer not found. Please check your view XML configuration.");
                    return;
                }

                // Initialize submissionModel with default values
                var oModel = new JSONModel({
                    completedBy: "",
                    designation: "",
                    submissionDate: new Date().toISOString().substr(0, 10), // Default to today
                    declarationConfirmation: false
                });
                this.getView().setModel(oModel, "submissionModel");

                var oForm = new sap.ui.layout.form.SimpleForm({
                    maxContainerCols: 2,
                    editable: true,
                    layout: "ResponsiveGridLayout",
                    content: []
                });

                var groupedFields = [];
                var declarationControl = null;

                // Process field configurations
                oFieldConfig.forEach(function (field) {
                    var oLabel = new sap.m.Label({
                        text: field.FIELD_LABEL,
                        required: field.IS_MANDATORY
                    });

                    var oControl;
                    switch (field.FIELD_LABEL) {
                        case "Completed By":
                            oControl = new sap.m.Input({
                                value: "{submissionModel>/completedBy}",
                                placeholder: "Enter " + field.FIELD_LABEL,
                                required: field.IS_MANDATORY,
                                width: "200px"
                            }).bindProperty("value", {
                                path: "/completedBy",
                                model: "submissionModel",
                                type: new sap.ui.model.type.String()
                            });
                            groupedFields.push({ label: oLabel, control: oControl });
                            break;
                        case "Designation":
                            oControl = new sap.m.Input({
                                value: "{submissionModel>/designation}",
                                placeholder: "Enter " + field.FIELD_LABEL,
                                required: field.IS_MANDATORY,
                                width: "200px"
                            }).bindProperty("value", {
                                path: "/designation",
                                model: "submissionModel",
                                type: new sap.ui.model.type.String()
                            });
                            groupedFields.push({ label: oLabel, control: oControl });
                            break;
                        case "Submission Date":
                            oControl = new sap.m.DatePicker({
                                value: "{submissionModel>/submissionDate}",
                                valueFormat: "yyyy-MM-dd",
                                displayFormat: "dd-MM-yyyy",
                                required: field.IS_MANDATORY,
                                width: "150px"
                            }).bindProperty("value", {
                                path: "/submissionDate",
                                model: "submissionModel",
                                type: new sap.ui.model.type.Date()
                            });
                            groupedFields.push({ label: oLabel, control: oControl });
                            break;
                        case "Declaration Confirmation":
                            declarationControl = new sap.m.CheckBox({
                                text: field.DESCRIPTION.trim(),
                                selected: "{submissionModel>/declarationConfirmation}",
                                required: field.IS_MANDATORY,
                                width: "100%",
                                wrapping: true
                            }).bindProperty("selected", {
                                path: "/declarationConfirmation",
                                model: "submissionModel",
                                type: new sap.ui.model.type.Boolean()
                            });
                            break;
                        default:
                            oControl = new sap.m.Text({ text: "Unsupported field type" });
                    }
                });

                // Create main vertical layout
                var oMainVBox = new sap.m.VBox({
                    width: "100%",
                    items: [
                        new sap.ui.core.HTML({
                            content: "<hr style='margin: 10px 0;'/>"
                        })
                    ]
                });

                // Add three fields in first row
                if (groupedFields.length > 0) {
                    var oFieldsHBox = new sap.m.HBox({
                        justifyContent: "Start",
                        items: groupedFields.map(function (field) {
                            return new sap.m.VBox({
                                width: "auto",
                                items: [
                                    field.label,
                                    field.control
                                ]
                            }).addStyleClass("fieldGroup");
                        })
                    }).addStyleClass("groupedFields");

                    oMainVBox.addItem(oFieldsHBox);
                }

                // Add declaration checkbox in second row
                if (declarationControl) {
                    var oDeclarationVBox = new sap.m.VBox({
                        width: "100%",
                        items: [declarationControl]
                    }).addStyleClass("declarationSection");

                    oMainVBox.addItem(oDeclarationVBox);
                }

                oForm.addContent(oMainVBox);
                oForm.addStyleClass("customSubmissionForm");
                oContainer.removeAllContent();
                oContainer.addContent(oForm);

                // Debugging: Log initial model data
                console.log("Initialized Submission Model:", oModel.getData());
            },

            onFileOpen: function () {
                debugger;
            },

            onWizardFinish: function () {
                MessageToast.show("Vendor creation submitted!");
                // Add submission logic here
            },

            onCancel: function () {
                MessageToast.show("Vendor creation cancelled");
                // Add cancel logic here
            },



            onCancel: function () {
                this.getOwnerComponent().getRouter().navTo("RouteRequestManagement")
            },
            onSaveDraft: function () {
                sap.m.MessageToast.show("Draft saved");
            },

            getAttachmentValues: function () {
                var attachmentValues = [];
                var attachmentFields = this._attachmentFields; // Access stored fields

                if (attachmentFields && this._attachmentModels) {
                    attachmentFields.forEach((field, index) => {
                        var oModel = this._attachmentModels[index];
                        if (oModel) {
                            var files = oModel.getProperty("/files") || [];
                            files.forEach(file => {
                                attachmentValues.push({
                                    REGESTERED_MAIL: "p5ak7@edny.net", // Default value as per request
                                    DESCRIPTION: file.description || "",
                                    ATTACH_SHORT_DEC: "TEST", // Default value as per request
                                    IMAGEURL: file.imageUrl || "" // Base64 URL if uploaded
                                });
                            });
                        } else {
                            console.warn("Model not found for attachment field index:", index);
                        }
                    });
                } else {
                    console.warn("attachmentFields or attachmentModels not initialized.");
                }

                console.log("Retrieved Attachment Values:", attachmentValues);
                return attachmentValues;
            },

            getFormValues: function () {
                var self = this;
                var allValues = {};

                try {
                    var oFormDataModel = this.getView().getModel("formDataModel");
                    if (oFormDataModel) {
                        allValues.formData = oFormDataModel.getData() || {};
                        console.log("Form Data Model Values:", allValues.formData);
                    } else {
                        console.warn("formDataModel not found.");
                    }

                    var oDisclosureModel = this.getView().getModel("disclosureModel");
                    if (oDisclosureModel) {
                        oDisclosureModel.updateBindings();
                        allValues.disclosureData = oDisclosureModel.getData() || {};
                        console.log("Disclosure Model Values:", allValues.disclosureData);
                    } else {
                        console.warn("disclosureModel not found.");
                    }

                    var oQualityModel = this.getView().getModel("qualityModel");
                    if (oQualityModel) {
                        oQualityModel.updateBindings();
                        allValues.qualityData = oQualityModel.getProperty("/certificates") || [];
                        console.log("Quality Model Values:", allValues.qualityData);
                    } else {
                        console.warn("qualityModel not found.");
                    }

                    var oSubmissionModel = this.getView().getModel("submissionModel");
                    if (oSubmissionModel) {
                        oSubmissionModel.updateBindings();
                        allValues.submissionData = oSubmissionModel.getData() || {};
                        console.log("Submission Model Values:", allValues.submissionData);
                    } else {
                        console.warn("submissionModel not found.");
                    }

                    allValues.attachmentData = this.getAttachmentValues() || [];
                    console.log("Attachment Model Values:", allValues.attachmentData);

                    console.log("All Retrieved Values:", allValues);
                    return allValues;
                } catch (error) {
                    console.error("Error in getFormValues:", error);
                    return null;
                }
            },

            buildPayload: function () {
                var oData = this.getFormValues();
            
                if (!oData || !oData.formData) {
                    console.warn("Form data missing or malformed!");
                    return;
                }
            
                let oModel = this.getView().getModel("oRegModel");
                var form = oData.formData;
                var submission = oData.submissionData || {};
            
                var payload = {
                    action: "CREATE",
                    stepNo: 1,
                    reqHeader: [
                        {
                            REGISTERED_ID: form.REGISTERED_ID || "",
                            WEBSITE: form.WEBSITE || "",
                            VENDOR_NAME1: form.VENDOR_NAME1 || "",
                            COMPLETED_BY: submission.completedBy || "",
                            DESIGNATION: submission.designation || "",
                            SUBMISSION_DATE: submission.submissionDate || "",
                            COMPANY_CODE: form["Company Code"] || "",
                            REQUEST_TYPE: form.REQUEST_TYPE || ""
                        }
                    ],
                    addressData: [
                        {
                            STREET: form.HOUSE_NUM1 || "",
                            STREET1: form.STREET1 || "",
                            STREET2: form.STREET2 || "",
                            STREET3: form.STREET3 || "",
                            STREET4: form.STREET4 || "",
                            COUNTRY: form.COUNTRY || "",
                            STATE: form.STATE || "",
                            CITY: form.CITY || "",
                            POSTAL_CODE: form.POSTAL_CODE || ""
                        }
                    ],
                    contactsData: [
                        {
                            EMAIL: form.EMAIL || "",
                            CONTACT_NO: form.CONTACT_NO || "",
                            FIRST_NAME: form.FIRST_NAME || "",
                            LAST_NAME: form.LAST_NAME || "",
                            DESIGNATION: form.DESIGNATION || "",
                            CONTACT_NO: form.CONTACT_NUMBER || "",
                            MOBILE: form.MOBILE || ""
                        }
                    ],
                    bankData: [
                        {
                            BANK_NAME: form.BANK_NAME || "",
                            BRANCH_NAME: form.BRANCH_NAME || "",
                            SWIFT_CODE: form.SWIFT_CODE || "",
                            BANK_COUNTRY: form.BANK_COUNTRY || "",
                            BENEFICIARY: form.BENEFICIARY || "",
                            ACCOUNT_NO: form.ACCOUNT_NO || "",
                            IBAN_NUMBER: form.IBAN_NUMBER || "",
                            ROUTING_CODE: form.ROUTING_CODE || "",
                            BANK_CURRENCY: form.BANK_CURRENCY || ""
                        }
                    ],
                    Operational_Prod_Desc: [
                        {
                            PRODUCT_NAME: form.PRODUCT_NAME || "",
                            PRODUCT_DESCRIPTION: form.PRODUCT_DESCRIPTION || "",
                            PRODUCT_TYPE: form.PRODUCT_TYPE || "",
                            PRODUCT_CATEGORY: form.PRODUCT_CATEGORY || ""
                        }
                    ],
                    Operational_Capacity: [
                        {
                            PRODUCTION_CAPACITY: form.PRODUCTION_CAPACITY || "",
                            PRODUCTION_LOCATION: form.PRODUCTION_LOCATION || "",
                            ORDER_SIZE_MIN: form.ORDER_SIZE_MIN || "",
                            ORDER_SIZE_MAX: form.ORDER_SIZE_MAX || ""
                        }
                    ],
                    Disclosure_Fields: [
                        {
                            INTEREST_CONFLICT: oData.disclosureData?.conflictofinterest ?? "",
                            ANY_LEGAL_CASES: oData.disclosureData?.legalcasedisclosure ?? "",
                            ABAC_REG: oData.disclosureData?.anticorruptionantibriberyregulation ?? "",
                            CONTROL_REGULATION: oData.disclosureData?.indianexportcontrol ?? ""
                        }
                    ],
                    Quality_Certificates: oData.qualityData || [],
                    Attachments: oData.attachmentData || []
                };
            
                console.log("✅ Final Payload:", payload);
            
                // 🔥 Trigger OData Action via create call
                oModel.create("/PostRegData", payload, {
                    success: function (oResponse) {
                        console.log("🎉 Data posted successfully:", oResponse);
                        debugger;
                        sap.m.MessageToast.show("Registration submitted successfully!");
                    },
                    error: function (oError) {
                        debugger;
                        console.error("❌ Error posting data:", oError);
                        sap.m.MessageBox.error("Error submitting registration.");
                    }
                });
            }
            





        });
    });