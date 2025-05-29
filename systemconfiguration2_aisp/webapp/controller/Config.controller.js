sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/CheckBox",
    "sap/m/Select",
    "sap/m/Button",
    "sap/ui/core/Item",
    "sap/ui/layout/SplitterLayoutData",
    "sap/m/Token",
    "sap/ui/layout/Grid",
    "sap/m/FlexBox",
    "sap/m/MessageToast"
],
    function (Controller, JSONModel, Filter, FilterOperator, MessageBox, VBox, HBox, Label, Input, CheckBox, Select, Button, Item, SplitterLayoutData, Token, Grid, FlexBox, MessageToast) {
        "use strict";


        return Controller.extend("com.sconfig.systemconfiguration2aisp.controller.Config", {
            onInit: function () {
                this.oModel = this.getOwnerComponent().getModel();
                this.getView().setModel(this.oModel);
                this.error = [];
                var oActivityModel = new sap.ui.model.json.JSONModel({ results: [] });
                this.getView().setModel(oActivityModel, "ActivityFieldDetails");

                var formWidget = [
                    { icon: "sap-icon://text", text: "Input", type: "textBox" },
                    { icon: "sap-icon://multiselect-all", text: "Text Area", type: "textArea" },
                    { icon: "sap-icon://slim-arrow-down", text: "Dropdown", type: "select" },
                    { icon: "sap-icon://checklist-item", text: "Check Box", type: "checkBox" },
                    { icon: "sap-icon://circle-task", text: "Radio", type: "radio" },
                    { icon: "sap-icon://number-sign", text: "Number", type: "number" },
                    // { icon: "sap-icon://favorite", text: "Rating", type: "rating" },
                    { icon: "sap-icon://calendar", text: "Calender", type: "calendar" },
                ]
                var mediaWidget = [
                    { icon: "sap-icon://camera", text: "Camera", type: "camera" },
                    { icon: "sap-icon://video", text: "Video", type: "video" },
                    { icon: "sap-icon://signature", text: "Signature", type: "signature" },
                    { icon: "sap-icon://bar-code", text: "Bar Code", type: "barcode" }
                ]
                var addOnWidgets = [
                    { icon: "sap-icon://simulate", text: "Calculator", type: "calculation" },
                    { icon: "sap-icon://header", text: "Header", type: "heading" },
                    { icon: "sap-icon://map", text: "Map", type: "map" },
                    { icon: "sap-icon://table-chart", text: "Table", type: "table" },
                    { icon: "sap-icon://lateness", text: "Time", type: "time" },
                    { icon: "sap-icon://customer", text: "Properties", type: "properties" },
                    { icon: "sap-icon://drop-down-list", text: "Dyanmic Dropdown", type: "dynamicdropdown" },
                    { icon: "sap-icon://physical-activity", text: "Mobile Sensors", type: "sensors" }
                ]
                var oActionModel = new sap.ui.model.json.JSONModel({
                    Actions: [
                        { action: "Show", actionLabel: "Show" },
                        { action: "Hide", actionLabel: "Hide" },
                        { action: "Readonly", actionLabel: "Readonly" }
                    ]
                });
                this.formnames = false;
                this.getView().setModel(oActionModel, 'ActionModel');
                this.getView().setModel(new JSONModel({ results: formWidget }), "FormWidget");
                this.getView().setModel(new JSONModel({ results: mediaWidget }), "MediaWidget");
                this.getView().setModel(new JSONModel({ results: addOnWidgets }), "AddOnWidgets");
                this.getOwnerComponent().getRouter().getRoute("RouteNew").attachPatternMatched(this.patternMatch, this);
                this.formulaJSON = [];
                this.nestedJSONStack = [];
                this._groupTypeStack = [];
                this._currentGroupOperator = null; // e.g., "add", "avg"
                this._currentGroupOperatorFields = [];
                this._currentGroupOperatorRequiredCount = 0;
                this._isGroupOperatorClosed = true;
                this._isParenthesesClosed = true;
                this.lastInputType = null; // Tracks the last input type: "number", "field", "operator", "group", "parenthesis", or null
                this.currentNumberButton = null;

                // Define field requirements for each group operator
                this.fieldRequirements = {
                    add: { min: 2, max: 10 },
                    avg: { min: 2, max: 10 },
                    mul: { min: 2, max: 10 },
                    sub: { min: 2, max: 3 },
                    div: { min: 2, max: 2 },
                    inv: { min: 1, max: 1 },
                    sqrt: { min: 1, max: 1 },
                };

                // Map operand symbols to their respective operator keys
                this.operandMapping = {
                    "√": "sqrt",
                    "INV": "inv",
                    "⨏": "avg",
                };

            },
            patternMatch: function (oEvent) {
                var oParameters = oEvent.getParameter("arguments");
                var sCompanyCode = decodeURIComponent(oParameters.companyCode || "");
                var sRequestType = decodeURIComponent(oParameters.requestType || "");
                var emptyModel = new sap.ui.model.json.JSONModel({
                    list: false,
                    unList: false,
                    companyCode: sCompanyCode,
                    requestType : sRequestType
                });
                this.formnames = false;
                this.getView().setModel(emptyModel, 'listModel');
                var updateData = JSON.parse(localStorage.getItem("updateData"));
                console.log(updateData);
                var oToolPage = sap.ui.getCore().byId("container-com.airdit.agpp.agp---App--toolPage");
                var bSideExpanded = oToolPage.getSideExpanded();
                var listModel = this.getView().getModel('listModel');
                var thirdPanel = sap.ui.getCore().byId('splitterWidgets2');
                if (thirdPanel) {
                    thirdPanel.destroy();
                }
                oToolPage.setSideExpanded(false);
                var formId = this.formId = oEvent.getParameters().arguments.id,
                    activityName = oEvent.getParameters().arguments.name;
                this.getView().setModel(new JSONModel({ activityName: activityName }), "title");
                const prevFilter = new Filter("formId", FilterOperator.EQ, formId);
                if (formId === 'createForm') {
                    this.getView().setModel(new JSONModel({ results: {} }), "ActivityFieldDetails");
                    this.getView().setModel(new JSONModel({ results: {} }), "ActivityFormDetails");
                    sap.ui.getCore().setModel(new JSONModel({ resulted: "" }), "StaticFieldDetails");
                    this.getView().setModel(new JSONModel({ results: "" }), "trackChanges");
                    listModel.setProperty("/unList", true);
                    debugger
                }
                else
                    this.oModel.read('/ActivityFieldDetails', {
                        filters: [prevFilter],
                        success: function (res) {
                            this.formnames = true;
                            let skeletonData = res.results[0].skeletonData;
                            skeletonData.sort(function (a, b) {
                                const posA = (typeof a.position === 'number') ? a.position : 0;
                                const posB = (typeof b.position === 'number') ? b.position : 0;
                                return posA - posB;
                            });
                            let formData = res.results[0].formData;
                            var models = new JSONModel({ results: skeletonData });
                            models.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
                            var trackChanges = new JSONModel({ results: this.deepCopy(skeletonData) });
                            trackChanges.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
                            this.getView().setModel(trackChanges, "trackChanges");
                            this.getView().setModel(models, "ActivityFieldDetails");
                            this.generateConditions()
                            this.getView().setModel(new JSONModel({ results: formData }), "ActivityFormDetails");
                            this.staticFormDetails = this.deepCopy(skeletonData);
                            listModel.setProperty("/list", true);
                            sap.ui.getCore().setModel(new JSONModel({ resulted: this.staticFormDetails }), "StaticFieldDetails");
                        }.bind(this),
                        error: function (response) {

                            this.getView().setModel(new JSONModel({ results: {} }), "ActivityFieldDetails");
                            this.getView().setModel(new JSONModel({ results: {} }), "ActivityFormDetails");
                            sap.ui.getCore().setModel(new JSONModel({ resulted: "" }), "StaticFieldDetails");
                            listModel.setProperty("/unList", true);
                            if (response && response.responseText && response.statusCode !== 401) {
                                sap.m.MessageBox.error(response.responseText);
                            }
                        }.bind(this),
                    })
            },


            onDropToPanel1: function (oEvent) {
                var oDraggedItem = oEvent.getParameter("draggedControl");
                var oBindingContext = oDraggedItem.getBindingContext("FormWidget");
                var oDraggedData = oBindingContext.getObject();

                // Get the ActivityFieldDetails model
                var oActivityModel = this.getView().getModel("ActivityFieldDetails");
                var aResults = oActivityModel.getProperty("/results") || [];

                // Create a new item for the second panel
                var oNewItem = {
                    label: oDraggedData.text, // e.g., "Input"
                    type: oDraggedData.type,  // e.g., "textBox"
                    isRequired: false,        // Default value
                    icon: oDraggedData.icon   // Optional: Use the same icon
                };

                // Add the new item to the results array
                aResults.push(oNewItem);
                oActivityModel.setProperty("/results", aResults);
            },

            getIconForType: function (sType) {
                switch (sType) {
                    case "textBox":
                        return "sap-icon://text";
                    case "textArea":
                        return "sap-icon://multiselect-all";
                    case "select":
                        return "sap-icon://slim-arrow-down";
                    case "checkBox":
                        return "sap-icon://checklist-item";
                    case "radio":
                        return "sap-icon://circle-task";
                    case "number":
                        return "sap-icon://number-sign";
                    case "rating":
                        return "sap-icon://favorite";
                    case "calendar":
                        return "sap-icon://calendar";
                    default:
                        return "sap-icon://question-mark";
                }
            },

            onPressEdit: function (oEvent) {
                var oContext = oEvent.getSource().getParent().getBindingContext("ActivityFieldDetails");
                var sType = oContext.getProperty("type"),
                    sPath = oContext.getPath(),
                    iIndex = sPath.split("/").pop();

                // if (iIndex === this._currentRecordIndex) {
                //     return
                // }
                // else if (this.checkErrorsBeforeNextStep()) {
                //     sap.m.MessageToast.show("Please resolve the errors before proceeding.");
                //     return;
                // }
                var oModel = this.getView().getModel("ActivityFieldDetails");
                var oRecord = oModel.getProperty("/results/" + iIndex);
                var prevBoxId = oEvent.getSource().getParent().getParent().getId()
                // if (this._originalData && this._currentRecordIndex !== undefined) {
                //     var sCurrentRecordPath = "/results/" + this._currentRecordIndex;
                //     var oCurrentRecord = oModel.getProperty(sCurrentRecordPath);
                //     var oOriginalRecord = this._originalData;

                //     var bHasChanges = this._hasRecordChanged(oOriginalRecord, oCurrentRecord);

                //     if (bHasChanges) {
                //         sap.m.MessageBox.warning("You have unsaved changes. Do you want to continue?", {
                //             actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                //             onClose: function (oAction) {
                //                 if (oAction === sap.m.MessageBox.Action.OK) {
                //                     this.onCancelRecord(this._currentRecordIndex);
                //                     this._updateRecordForEditing(iIndex, oRecord, sType, prevBoxId);
                //                 }
                //                 // this._updateRecordForEditing(iIndex, oRecord, sType);
                //             }.bind(this)
                //         });
                //     } else {
                //         this._updateRecordForEditing(iIndex, oRecord, sType, prevBoxId);
                //     }
                // } else {
                //     this._updateRecordForEditing(iIndex, oRecord, sType, prevBoxId);
                // }
                this._updateRecordForEditing(iIndex, oRecord, sType, prevBoxId);
                this.onScrollPanelOne(['scrollContainerList', 'scrollContainerWidgets']);
                this.changeType = null;

            },

            _updateRecordForEditing: function (iIndex, oRecord, sType, id) {
                debugger
                this._currentRecordIndex = iIndex;
                this._originalData = JSON.parse(JSON.stringify(oRecord));
                var oNewVBox = sap.ui.getCore().byId(id) || this.getView().byId(id);
                if (this._previousVBox) {
                    this._previousVBox.removeStyleClass("ActFieldVbox");
                }
                if (oNewVBox) {
                    oNewVBox.addStyleClass("ActFieldVbox");
                }
                this._previousVBox = oNewVBox;
                this.onCreateThirdPanel(sType, iIndex);
            },

            onCreateThirdPanel: function (type, index) {
                var oModel = this.getView().getModel("ActivityFieldDetails");
                var oContainer = this.getView().byId("mainSplitterFieldDetails");
                var thirdPanel = sap.ui.getCore().byId('splitterWidgets2');
                if (thirdPanel) {
                    thirdPanel.destroy();
                }
                var oPanel = new sap.m.Panel('splitterWidgets2', {
                    height: "100%",
                    headerText: "Properties",
                    backgroundDesign: "Solid",
                    layoutData: new sap.ui.layout.SplitterLayoutData({
                        size: "35%"
                    })
                }).addStyleClass("splitterWidgets thin-scrollbar");
                oContainer.addContentArea(oPanel);
                var oVBox = this.byId("splitterWidgets2") || sap.ui.getCore().byId("splitterWidgets2");

                if (type === 'textBox' || type === 'textArea' || type === 'number') {
                    var oVBox = this.getView().byId("splitterWidgets2") || sap.ui.getCore().byId("splitterWidgets2");

                    // Determine Placeholder Text
                    var placeholderText = type === "number" ? "Enter number" : "Enter text";

                    // Set property bindings based on type
                    var minProperty = type === "number" ? "minValue" : "minLength";
                    var maxProperty = type === "number" ? "maxValue" : "maxLength";

                    var oFormContent = new sap.m.VBox('textBoxVbox', {
                        items: [
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "LABEL" }),
                                    new sap.m.Input({
                                        id: this.createId("textBoxLabel_" + index),
                                        value: "{ActivityFieldDetails>/results/" + index + "/label}",
                                        liveChange: this.onLabelLiveChange.bind(this, index)
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "DESCRIPTION" }),
                                    new sap.m.Input({
                                        id: this.createId("description_" + index),
                                        value: "{ActivityFieldDetails>/results/" + index + "/description}",
                                        placeholder: "Enter description"
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "SECTION" }),
                                    new sap.m.Select({
                                        id: this.createId("sectionSelect_" + index),
                                        selectedKey: "{ActivityFieldDetails>/results/" + index + "/section}",
                                        forceSelection: false,
                                        width: "100%",
                                        items: [
                                            new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" }),
                                            new sap.ui.core.Item({ key: "Finance Information", text: "Finance Information" }),
                                            new sap.ui.core.Item({ key: "Submission", text: "Submission" }),
                                            new sap.ui.core.Item({ key: "Quality Certificates", text: "Quality Certificates" }),
                                            new sap.ui.core.Item({ key: "Disclosures", text: "Disclosures" }),
                                            new sap.ui.core.Item({ key: "Operational Information", text: "Operational Information" })
                                        ]
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "CATEGORY" }),
                                    new sap.m.Select({
                                        id: this.createId("categorySelect_" + index),
                                        selectedKey: "{ActivityFieldDetails>/results/" + index + "/category}",
                                        forceSelection: false,
                                        width: "100%",
                                        items: [
                                            new sap.ui.core.Item({ key: "Primary Bank details", text: "Primary Bank details" }),
                                            new sap.ui.core.Item({ key: "TAX-VAT-GST", text: "TAX-VAT-GST" }),
                                            new sap.ui.core.Item({ key: "Operational Capacity", text: "Operational Capacity" }),
                                            new sap.ui.core.Item({ key: "Standard Certifications", text: "Standard Certifications" }),
                                            new sap.ui.core.Item({ key: "Product-Service Description", text: "Product-Service Description" }),
                                            new sap.ui.core.Item({ key: "Declaration", text: "Declaration" }),
                                            new sap.ui.core.Item({ key: "Address", text: "Address" }),
                                            new sap.ui.core.Item({ key: "Primary Contact", text: "Primary Contact" }),
                                            new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" })
                                        ]
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "MINIMUM" }),
                                    new sap.m.Input({
                                        id: this.createId("minLengthTextBox_" + index),
                                        value: "{ActivityFieldDetails>/results/" + index + "/" + minProperty + "}",
                                        type: "Number",
                                        placeholder: "Enter minimum " + placeholderText,
                                        liveChange: this.onMinLengthLiveChange.bind(this, index)
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "MAXIMUM" }),
                                    new sap.m.Input({
                                        id: this.createId("maxLengthTextBox_" + index),
                                        value: "{ActivityFieldDetails>/results/" + index + "/" + maxProperty + "}",
                                        type: "Number",
                                        placeholder: "Enter maximum " + placeholderText,
                                        liveChange: this.onMaxLengthLiveChange.bind(this, index)
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "DEFAULT VALUE" }),
                                    new sap.m.Input({
                                        id: this.createId("defaultValueTextBox_" + index),
                                        value: "{ActivityFieldDetails>/results/" + index + "/defaultValue}",
                                        placeholder: "Enter default value"
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "PLACE HOLDER" }),
                                    new sap.m.Input({
                                        id: this.createId("placeholderTextBox_" + index),
                                        value: "{ActivityFieldDetails>/results/" + index + "/placeholder}",
                                        placeholder: "Enter placeholder"
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }),
                            new sap.m.HBox({
                                items: [
                                    new sap.m.Label({ text: "SET RULES", width: "100px" }),
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.HBox({
                                items: [
                                    new sap.m.CheckBox({
                                        id: this.createId("requiredCheckBox_" + index),
                                        text: "Mandatory",
                                        selected: "{ActivityFieldDetails>/results/" + index + "/isRequired}"
                                    }),
                                    new sap.m.CheckBox({
                                        id: this.createId("disabledCheckBox_" + index),
                                        text: "Is Visible",
                                        selected: "{ActivityFieldDetails>/results/" + index + "/disabled}"
                                    })
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom')
                        ]
                    }).addStyleClass("sapUiSmallMargin");

                    oVBox.addContent(oFormContent);
                }
                else if (type === 'calendar' || type === 'calender') {
                    var oVBox = this.byId("splitterWidgets2") || sap.ui.getCore().byId("splitterWidgets2");
                    var oFormContent = new sap.m.VBox('textBoxVbox', {
                        items: [
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "LABEL" }),
                                    new sap.m.Input({
                                        id: this.createId("textBoxLabel_" + index),
                                        value: "{ActivityFieldDetails>/results/" + index + "/label}",
                                        liveChange: this.onLabelLiveChange.bind(this, index)
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "DESCRIPTION" }),
                                    new sap.m.Input({
                                        id: this.createId("description_" + index),
                                        value: "{ActivityFieldDetails>/results/" + index + "/description}",
                                        placeholder: "Enter description"
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "SECTION" }),
                                    new sap.m.Select({
                                        id: this.createId("sectionSelect_" + index),
                                        selectedKey: "{ActivityFieldDetails>/results/" + index + "/section}",
                                        forceSelection: false,
                                        width: "100%",
                                        items: [
                                            new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" }),
                                            new sap.ui.core.Item({ key: "Finance Information", text: "Finance Information" }),
                                            new sap.ui.core.Item({ key: "Submission", text: "Submission" }),
                                            new sap.ui.core.Item({ key: "Quality Certificates", text: "Quality Certificates" }),
                                            new sap.ui.core.Item({ key: "Disclosures", text: "Disclosures" }),
                                            new sap.ui.core.Item({ key: "Operational Information", text: "Operational Information" })
                                        ]
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "CATEGORY" }),
                                    new sap.m.Select({
                                        id: this.createId("categorySelect_" + index),
                                        selectedKey: "{ActivityFieldDetails>/results/" + index + "/category}",
                                        forceSelection: false,
                                        width: "100%",
                                        items: [
                                            new sap.ui.core.Item({ key: "Primary Bank details", text: "Primary Bank details" }),
                                            new sap.ui.core.Item({ key: "TAX-VAT-GST", text: "TAX-VAT-GST" }),
                                            new sap.ui.core.Item({ key: "Operational Capacity", text: "Operational Capacity" }),
                                            new sap.ui.core.Item({ key: "Standard Certifications", text: "Standard Certifications" }),
                                            new sap.ui.core.Item({ key: "Product-Service Description", text: "Product-Service Description" }),
                                            new sap.ui.core.Item({ key: "Declaration", text: "Declaration" }),
                                            new sap.ui.core.Item({ key: "Address", text: "Address" }),
                                            new sap.ui.core.Item({ key: "Primary Contact", text: "Primary Contact" }),
                                            new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" })
                                        ]
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.VBox("manualEntryVBox", {
                                visible: "{= ${ActivityFieldDetails>/results/" + index + "/typeOfDateSelected} === 'ManualEntry'}",
                                items: [
                                    new sap.m.Label({ text: "DEFAULT VALUE" }),
                                    new sap.m.Input({
                                        id: this.createId("defaultValueTextBox_" + index),
                                        type: 'Date',
                                        value: {
                                            path: "ActivityFieldDetails>/results/" + index + "/defaultValue",
                                            formatter: function (sValue) {
                                                if (sValue) {
                                                    let oDate = new Date(sValue);
                                                    return oDate.toISOString().split("T")[0]; // Extracts only YYYY-MM-DD
                                                }
                                                return "";
                                            }
                                        },
                                        placeholder: "Enter date"
                                    })
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "SELECT TYPE OF DATE" }),
                                    new sap.m.RadioButtonGroup({
                                        id: this.createId("typeOfDateSelected_" + index),
                                        columns: 2,
                                        selectedIndex: "{= ${ActivityFieldDetails>/results/" + index + "/typeOfDateSelected} === '' ? -1 : (${ActivityFieldDetails>/results/" + index + "/typeOfDateSelected} === 'SystemDate' ? 0 : 1)}",
                                        select: this.onSelectDateType.bind(this, index),
                                        buttons: [
                                            new sap.m.RadioButton({
                                                text: "System Date"
                                            }),
                                            new sap.m.RadioButton({
                                                text: "Manual Entry"
                                            })
                                        ]
                                    })
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.HBox({
                                items: [
                                    new sap.m.Label({ text: "SET RULES", width: "100px" }),
                                ]
                            }),
                            new sap.m.HBox({
                                items: [
                                    new sap.m.CheckBox({
                                        id: this.createId("requiredCheckBox_" + index),
                                        text: "Mandatory",
                                        selected: "{ActivityFieldDetails>/results/" + index + "/isRequired}"
                                    }),
                                    new sap.m.CheckBox({
                                        id: this.createId("disabledCheckBox_" + index),
                                        text: "Is Visible",
                                        selected: "{ActivityFieldDetails>/results/" + index + "/disabled}"
                                    })
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            // new sap.m.HBox({
                            //     items: [
                            //         new sap.m.Label({ text: "Change Type: ", width: "100px" }).addStyleClass('sapUiTinyMarginTop'),
                            //         new sap.m.Select({
                            //             id: this.createId("changeType_" + index),
                            //             selectedKey: "{ActivityFieldDetails>/results/" + index + "/typeChange}",
                            //             change: this.onChangeTypeSelected.bind(this, index),
                            //             forceSelection: false,
                            //             items: [
                            //                 this.getSelectForTypeChange(type).map(option =>
                            //                     new sap.ui.core.Item({ key: option.type, text: option.text })
                            //                 )
                            //             ]
                            //         })
                            //     ]
                            // }).addStyleClass('sapUiTinyMarginBottom')
                        ]
                    }).addStyleClass("sapUiSmallMargin");

                    oVBox.addContent(oFormContent);
                }
                else if (type === 'select' || type === 'radio' || type === 'dropdown') {
                    var oModel = this.getView().getModel("ActivityFieldDetails");
                    var aOptions = oModel.getProperty("/results/" + index + "/options") || [];
                    var oVBox = this.getView().byId("splitterWidgets2") || sap.ui.getCore().byId("splitterWidgets2");

                    var defaultValues = type === 'select' ? 'Dropdown1' : type === 'radio' ? 'Radio1' : 'Select1';
                    if (aOptions.length === 0) {
                        aOptions.push({
                            displayValue: defaultValues,
                            value: defaultValues
                        });
                        oModel.setProperty("/results/" + index + "/options", aOptions);
                    }

                    var oFormContentItems = [
                        new sap.m.VBox({
                            items: [
                                new sap.m.Label({ text: "LABEL" }),
                                new sap.m.Input({
                                    id: this.createId("textBoxLabel_" + index),
                                    value: "{ActivityFieldDetails>/results/" + index + "/label}"
                                }).addStyleClass('sapUiTinyMarginBottom')
                            ]
                        }),
                        new sap.m.VBox({
                            items: [
                                new sap.m.Label({ text: "DESCRIPTION" }),
                                new sap.m.Input({
                                    id: this.createId("description_" + index),
                                    value: "{ActivityFieldDetails>/results/" + index + "/description}",
                                    placeholder: "Enter description"
                                }).addStyleClass('sapUiTinyMarginBottom')
                            ]
                        }),
                        new sap.m.VBox({
                            items: [
                                new sap.m.Label({ text: "SECTION" }),
                                new sap.m.Select({
                                    id: this.createId("sectionSelect_" + index),
                                    selectedKey: "{ActivityFieldDetails>/results/" + index + "/section}",
                                    forceSelection: false,
                                    width: "100%",
                                    items: [
                                        new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" }),
                                        new sap.ui.core.Item({ key: "Finance Information", text: "Finance Information" }),
                                        new sap.ui.core.Item({ key: "Submission", text: "Submission" }),
                                        new sap.ui.core.Item({ key: "Quality Certificates", text: "Quality Certificates" }),
                                        new sap.ui.core.Item({ key: "Disclosures", text: "Disclosures" }),
                                        new sap.ui.core.Item({ key: "Operational Information", text: "Operational Information" })
                                    ]
                                }).addStyleClass('sapUiTinyMarginBottom')
                            ]
                        }).addStyleClass('sapUiTinyMarginBottom'),
                        new sap.m.VBox({
                            items: [
                                new sap.m.Label({ text: "CATEGORY" }),
                                new sap.m.Select({
                                    id: this.createId("categorySelect_" + index),
                                    selectedKey: "{ActivityFieldDetails>/results/" + index + "/category}",
                                    forceSelection: false,
                                    width: "100%",
                                    items: [
                                        new sap.ui.core.Item({ key: "Primary Bank details", text: "Primary Bank details" }),
                                        new sap.ui.core.Item({ key: "TAX-VAT-GST", text: "TAX-VAT-GST" }),
                                        new sap.ui.core.Item({ key: "Operational Capacity", text: "Operational Capacity" }),
                                        new sap.ui.core.Item({ key: "Standard Certifications", text: "Standard Certifications" }),
                                        new sap.ui.core.Item({ key: "Product-Service Description", text: "Product-Service Description" }),
                                        new sap.ui.core.Item({ key: "Declaration", text: "Declaration" }),
                                        new sap.ui.core.Item({ key: "Address", text: "Address" }),
                                        new sap.ui.core.Item({ key: "Primary Contact", text: "Primary Contact" }),
                                        new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" })
                                    ]
                                }).addStyleClass('sapUiTinyMarginBottom')
                            ]
                        }).addStyleClass('sapUiTinyMarginBottom'),
                        new sap.m.VBox({
                            items: [
                                new sap.m.Label({ text: "DEFAULT VALUE" }),
                                new sap.m.Input({
                                    id: this.createId("defaultValueTextBox_" + index),
                                    value: "{ActivityFieldDetails>/results/" + index + "/defaultValue}",
                                    placeholder: "Enter default value"
                                }).addStyleClass('sapUiTinyMarginBottom')
                            ]
                        }),
                        new sap.m.HBox({
                            items: [
                                new sap.m.Label({ text: "SET RULES", width: "100px" })
                            ]
                        }).addStyleClass('sapUiTinyMarginBottom'),
                        new sap.m.HBox({
                            items: [
                                new sap.m.CheckBox({
                                    id: this.createId("requiredCheckBox_" + index),
                                    text: "Mandatory",
                                    selected: "{ActivityFieldDetails>/results/" + index + "/isRequired}"
                                }),
                                new sap.m.CheckBox({
                                    id: this.createId("disabledCheckBox_" + index),
                                    text: "Is Visible",
                                    selected: "{ActivityFieldDetails>/results/" + index + "/disabled}"
                                })
                            ]
                        }).addStyleClass('sapUiTinyMarginBottom'),
                        // new sap.m.HBox({
                        //     items: [
                        //         new sap.m.CheckBox({
                        //             id: this.createId("disableOnEditCheckBox_" + index),
                        //             text: "Disable Edit",
                        //             selected: "{ActivityFieldDetails>/results/" + index + "/disableOnEdit}"
                        //         })
                        //     ]
                        // }).addStyleClass('sapUiTinyMarginBottom')
                    ];

                    // Add Allow Multiple Selection checkbox only for select type
                    // if (type === 'select') {
                    //     oFormContentItems.push(
                    //         new sap.m.HBox({
                    //             items: [
                    //                 new sap.m.CheckBox({
                    //                     id: this.createId("isAllowMultiselection_" + index),
                    //                     text: "Allow Multiple Selection",
                    //                     selected: "{ActivityFieldDetails>/results/" + index + "/isAllowMultiselection}"
                    //                 })
                    //             ]
                    //         }).addStyleClass('sapUiTinyMarginBottom')
                    //     );
                    // }

                    oFormContentItems.push(
                        new sap.m.VBox({
                            items: [
                                new sap.m.HBox({
                                    items: [
                                        new sap.m.Label({ text: "Add New Value/Option" }).addStyleClass("sapUiTinyMarginTop"),
                                        new sap.m.Button({
                                            text: "Add",
                                            press: this.onAddField.bind(this, index),
                                            icon: "sap-icon://add"
                                        }).addStyleClass("sapUiTinyMarginBegin")
                                    ]
                                }).addStyleClass("sapUiTinyMarginBottom"),
                                new sap.m.VBox({
                                    id: this.createId("newFieldsContainer_" + index),
                                    items: {
                                        path: "ActivityFieldDetails>/results/" + index + "/options",
                                        factory: function (sId, oContext) {
                                            return new sap.m.HBox({
                                                items: [
                                                    new sap.m.Input({
                                                        value: "{ActivityFieldDetails>displayValue}",
                                                        placeholder: "Display Value",
                                                        liveChange: this.onOptionLiveChange.bind(this, index)
                                                    }).addStyleClass('sapUiTinyMarginBottom sapUiTinyMarginEnd'),
                                                    new sap.m.Input({
                                                        value: "{ActivityFieldDetails>value}",
                                                        placeholder: "Value",
                                                        liveChange: this.onOptionLiveChange.bind(this, index)
                                                    }).addStyleClass('sapUiTinyMarginBottom sapUiTinyMarginBegin'),
                                                    new sap.m.Button({
                                                        icon: "sap-icon://delete",
                                                        type: "Transparent",
                                                        press: this.onRemoveField.bind(this, index)
                                                    }).addStyleClass('sapUiTinyMarginBegin')
                                                ]
                                            });
                                        }.bind(this)
                                    }
                                })
                            ]
                        }).addStyleClass("sapUiTinyMarginBottom"),
                        // new sap.m.HBox({
                        //     items: [
                        //         new sap.m.Label({ text: "Change Type: ", width: "100px" }).addStyleClass('sapUiTinyMarginTop'),
                        //         new sap.m.Select({
                        //             id: this.createId("changeType_" + index),
                        //             selectedKey: "{ActivityFieldDetails>/results/" + index + "/typeChange}",
                        //             change: this.onChangeTypeSelected.bind(this, index),
                        //             forceSelection: false,
                        //             items: [
                        //                 this.getSelectForTypeChange(type).map(option =>
                        //                     new sap.ui.core.Item({ key: option.type, text: option.text })
                        //                 )
                        //             ]
                        //         })
                        //     ]
                        // })
                    );

                    var oFormContent = new sap.m.VBox('textBoxVbox', {
                        items: oFormContentItems
                    }).addStyleClass("sapUiSmallMargin");

                    oVBox.addContent(oFormContent);
                }
                else if (type === 'checkBox') {
                    var oVBox = this.getView().byId("splitterWidgets2") || sap.ui.getCore().byId("splitterWidgets2");
                    var oModel = this.getView().getModel("ActivityFieldDetails");
                    var aOptions = oModel.getProperty("/results/" + index + "/options") || [];
                    if (aOptions.length === 0) {
                        aOptions.push({
                            displayValue: "Check Box1",
                            value: "Check Box1"
                        });
                        oModel.setProperty("/results/" + index + "/options", aOptions);
                    }

                    var oFormContent = new sap.m.VBox('textBoxVbox', {
                        items: [
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "LABEL" }),
                                    new sap.m.Input({
                                        id: this.createId("textBoxLabel_" + index),
                                        value: "{ActivityFieldDetails>/results/" + index + "/label}",
                                        liveChange: this.onLabelLiveChange.bind(this, index)
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "DESCRIPTION" }),
                                    new sap.m.Input({
                                        id: this.createId("description_" + index),
                                        value: "{ActivityFieldDetails>/results/" + index + "/description}",
                                        placeholder: "Enter description"
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "SECTION" }),
                                    new sap.m.Select({
                                        id: this.createId("sectionSelect_" + index),
                                        selectedKey: "{ActivityFieldDetails>/results/" + index + "/section}",
                                        forceSelection: false,
                                        width: "100%",
                                        items: [
                                            new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" }),
                                            new sap.ui.core.Item({ key: "Finance Information", text: "Finance Information" }),
                                            new sap.ui.core.Item({ key: "Submission", text: "Submission" }),
                                            new sap.ui.core.Item({ key: "Quality Certificates", text: "Quality Certificates" }),
                                            new sap.ui.core.Item({ key: "Disclosures", text: "Disclosures" }),
                                            new sap.ui.core.Item({ key: "Operational Information", text: "Operational Information" })
                                        ]
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "CATEGORY" }),
                                    new sap.m.Select({
                                        id: this.createId("categorySelect_" + index),
                                        selectedKey: "{ActivityFieldDetails>/results/" + index + "/category}",
                                        forceSelection: false,
                                        width: "100%",
                                        items: [
                                            new sap.ui.core.Item({ key: "Primary Bank details", text: "Primary Bank details" }),
                                            new sap.ui.core.Item({ key: "TAX-VAT-GST", text: "TAX-VAT-GST" }),
                                            new sap.ui.core.Item({ key: "Operational Capacity", text: "Operational Capacity" }),
                                            new sap.ui.core.Item({ key: "Standard Certifications", text: "Standard Certifications" }),
                                            new sap.ui.core.Item({ key: "Product-Service Description", text: "Product-Service Description" }),
                                            new sap.ui.core.Item({ key: "Declaration", text: "Declaration" }),
                                            new sap.ui.core.Item({ key: "Address", text: "Address" }),
                                            new sap.ui.core.Item({ key: "Primary Contact", text: "Primary Contact" }),
                                            new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" })
                                        ]
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.VBox({
                                items: [
                                    new sap.m.Label({ text: "DEFAULT VALUE" }),
                                    new sap.m.Input({
                                        id: this.createId("defaultValueTextBox_" + index),
                                        value: "{ActivityFieldDetails>/results/" + index + "/defaultValue}",
                                        placeholder: "Enter default value"
                                    }).addStyleClass('sapUiTinyMarginBottom')
                                ]
                            }),
                            new sap.m.HBox({
                                items: [
                                    new sap.m.Label({ text: "SET RULES", width: "100px" })
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            new sap.m.HBox({
                                items: [
                                    new sap.m.CheckBox({
                                        id: this.createId("requiredCheckBox_" + index),
                                        text: "Mandatory",
                                        selected: "{ActivityFieldDetails>/results/" + index + "/isRequired}"
                                    }),
                                    new sap.m.CheckBox({
                                        id: this.createId("disabledCheckBox_" + index),
                                        text: "Is Visible",
                                        selected: "{ActivityFieldDetails>/results/" + index + "/disabled}"
                                    })
                                ]
                            }).addStyleClass('sapUiTinyMarginBottom'),
                            // new sap.m.VBox({
                            //     items: [
                            //         new sap.m.HBox({
                            //             items: [
                            //                 new sap.m.Label({ text: "Add New Value/Option" }).addStyleClass("sapUiTinyMarginTop"),
                            //                 new sap.m.Button({
                            //                     text: "Add",
                            //                     press: this.onAddField.bind(this, index),
                            //                     icon: "sap-icon://add"
                            //                 }).addStyleClass("sapUiTinyMarginBegin")
                            //             ]
                            //         }).addStyleClass("sapUiTinyMarginBottom"),
                            //         new sap.m.VBox({
                            //             id: this.createId("newFieldsContainer_" + index),
                            //             items: {
                            //                 path: "ActivityFieldDetails>/results/" + index + "/options",
                            //                 factory: function (sId, oContext) {
                            //                     return new sap.m.HBox({
                            //                         items: [
                            //                             new sap.m.Input({
                            //                                 value: "{ActivityFieldDetails>displayValue}",
                            //                                 placeholder: "Display Value",
                            //                                 liveChange: this.onOptionLiveChange.bind(this, index)
                            //                             }).addStyleClass('sapUiTinyMarginBottom sapUiTinyMarginEnd'),
                            //                             new sap.m.Input({
                            //                                 value: "{ActivityFieldDetails>value}",
                            //                                 placeholder: "Value",
                            //                                 liveChange: this.onOptionLiveChange.bind(this, index)
                            //                             }).addStyleClass('sapUiTinyMarginBottom sapUiTinyMarginBegin'),
                            //                             new sap.m.Button({
                            //                                 icon: "sap-icon://delete",
                            //                                 type: "Transparent",
                            //                                 press: this.onRemoveField.bind(this, index)
                            //                             }).addStyleClass('sapUiTinyMarginBegin')
                            //                         ]
                            //                     });
                            //                 }.bind(this)
                            //             }
                            //         })
                            //     ]
                            // }).addStyleClass("sapUiTinyMarginBottom"),
                            // new sap.m.HBox({
                            //     items: [
                            //         new sap.m.Label({ text: "Change Type: ", width: "100px" }).addStyleClass('sapUiTinyMarginTop'),
                            //         new sap.m.Select({
                            //             id: this.createId("changeType_" + index),
                            //             selectedKey: "{ActivityFieldDetails>/results/" + index + "/typeChange}",
                            //             change: this.onChangeTypeSelected.bind(this, index),
                            //             forceSelection: false,
                            //             items: [
                            //                 this.getSelectForTypeChange(type).map(option =>
                            //                     new sap.ui.core.Item({ key: option.type, text: option.text })
                            //                 )
                            //             ]
                            //         })
                            //     ]
                            // })
                        ]
                    }).addStyleClass("sapUiSmallMargin");

                    oVBox.addContent(oFormContent);
                }
            },
            // onCreateThirdPanel: function (type, index) {
            //     var oModel = this.getView().getModel("ActivityFieldDetails");
            //     var oContainer = this.getView().byId("mainSplitterFieldDetails");
            //     var thirdPanel = sap.ui.getCore().byId('splitterWidgets2');
            //     if (thirdPanel) {
            //         thirdPanel.destroy();
            //     }
            //     var oPanel = new sap.m.Panel('splitterWidgets2', {
            //         height: "100%",
            //         headerText: "Properties",
            //         backgroundDesign: "Solid",
            //         layoutData: new sap.ui.layout.SplitterLayoutData({
            //             size: "35%"
            //         })
            //     }).addStyleClass("splitterWidgets thin-scrollbar");
            //     oContainer.addContentArea(oPanel);
            //     var oVBox = this.byId("splitterWidgets2") || sap.ui.getCore().byId("splitterWidgets2");
            //     if (type === 'textBox' || type === 'textArea' || type === 'number') {
            //         var oVBox = this.getView().byId("splitterWidgets2") || sap.ui.getCore().byId("splitterWidgets2");

            //         // Determine Placeholder Text
            //         var placeholderText = type === "number" ? "Enter number" : "Enter text";

            //         // Set property bindings based on type
            //         var minProperty = type === "number" ? "minValue" : "minLength";
            //         var maxProperty = type === "number" ? "maxValue" : "maxLength";

            //         var oFormContent = new sap.m.VBox('textBoxVbox', {
            //             items: [
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "LABEL" }),
            //                         new sap.m.Input('textBoxLabel', {
            //                             value: `{ActivityFieldDetails>/results/${index}/label}`,
            //                             liveChange: this.onLabelLiveChange.bind(this, index)
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "SECTION" }),
            //                         new sap.m.Select('sectionSelect', {
            //                             selectedKey: `{ActivityFieldDetails>/results/${index}/section}`,
            //                             forceSelection: false,
            //                             width: "100%",
            //                             items: [
            //                                 new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" }),
            //                                 new sap.ui.core.Item({ key: "Finance Information", text: "Finance Information" }),
            //                                 new sap.ui.core.Item({ key: "Submission", text: "Submission" }),
            //                                 new sap.ui.core.Item({ key: "Quality Certificates", text: "Quality Certificates" }),
            //                                 new sap.ui.core.Item({ key: "Disclosures", text: "Disclosures" }),
            //                                 new sap.ui.core.Item({ key: "Operational Information", text: "Operational Information" })
            //                             ]
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "CATEGORY" }),
            //                         new sap.m.Select('categorySelect', {
            //                             selectedKey: `{ActivityFieldDetails>/results/${index}/category}`,
            //                             forceSelection: false,
            //                             width: "100%",
            //                             items: [
            //                                 new sap.ui.core.Item({ key: "Primary Bank details", text: "Primary Bank details" }),
            //                                 new sap.ui.core.Item({ key: "TAX-VAT-GST", text: "TAX-VAT-GST" }),
            //                                 new sap.ui.core.Item({ key: "Operational Capacity", text: "Operational Capacity" }),
            //                                 new sap.ui.core.Item({ key: "Standard Certifications", text: "Standard Certifications" }),
            //                                 new sap.ui.core.Item({ key: "Product-Service Description", text: "Product-Service Description" }),
            //                                 new sap.ui.core.Item({ key: "Declaration", text: "Declaration" }),
            //                                 new sap.ui.core.Item({ key: "Address", text: "Address" }),
            //                                 new sap.ui.core.Item({ key: "Primary Contact", text: "Primary Contact" }),
            //                                 new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" })
            //                             ]
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "MINIMUM" }),
            //                         new sap.m.Input('minLengthTextBox', {
            //                             value: `{ActivityFieldDetails>/results/${index}/${minProperty}}`,
            //                             type: "Number",
            //                             placeholder: `Enter minimum ${placeholderText}`,
            //                             liveChange: this.onMinLengthLiveChange.bind(this, index)
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "MAXIMUM" }),
            //                         new sap.m.Input('maxLengthTextBox', {
            //                             value: `{ActivityFieldDetails>/results/${index}/${maxProperty}}`,
            //                             type: "Number",
            //                             placeholder: `Enter maximum ${placeholderText}`,
            //                             liveChange: this.onMaxLengthLiveChange.bind(this, index)
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "DEFAULT VALUE" }),
            //                         new sap.m.Input('defaultValueTextBox', {
            //                             value: `{ActivityFieldDetails>/results/${index}/defaultValue}`,
            //                             placeholder: "Enter default value"
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "PLACE HOLDER" }),
            //                         new sap.m.Input('placeholderTextBox', {
            //                             value: `{ActivityFieldDetails>/results/${index}/placeholder}`,
            //                             placeholder: "Enter placeholder"
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.Label({ text: "SET RULES", width: "100px" }),
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.CheckBox('requiredCheckBox', {
            //                             text: "Mandatory",
            //                             selected: "{= ${ActivityFieldDetails>/results/" + index + "/isRequired} === true || ${ActivityFieldDetails>/results/" + index + "/isRequired} === 'true' ? true : false }",
            //                         }),
            //                         new sap.m.CheckBox('disabledCheckBox', {
            //                             text: "Is Visible",
            //                             selected: "{= ${ActivityFieldDetails>/results/" + index + "/visible} === true || ${ActivityFieldDetails>/results/" + index + "/disabled} === 'true' ? true : false }",
            //                         })
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.Button({
            //                             icon: "sap-icon://accept",
            //                             type: "Accept",
            //                             press: function () {
            //                                 var oModel = this.getView().getModel("ActivityFieldDetails");
            //                                 var oRecord = oModel.getProperty("/results/" + index);
            //                                 var sLabel = sap.ui.getCore().byId("textBoxLabel").getValue().trim();
            //                                 var sSection = sap.ui.getCore().byId("sectionSelect").getSelectedKey();
            //                                 var sCategory = sap.ui.getCore().byId("categorySelect").getSelectedKey();
            //                                 var sMinValue = sap.ui.getCore().byId("minLengthTextBox")?.getValue()?.toString() || "";
            //                                 var sMaxValue = sap.ui.getCore().byId("maxLengthTextBox")?.getValue()?.toString() || "";
            //                                 var sDefaultValue = sap.ui.getCore().byId("defaultValueTextBox").getValue().trim();
            //                                 var sPlaceholder = sap.ui.getCore().byId("placeholderTextBox").getValue().trim();
            //                                 var bIsRequired = sap.ui.getCore().byId("requiredCheckBox").getSelected();
            //                                 var bIsReadOnly = sap.ui.getCore().byId("disabledCheckBox").getSelected();
            //                                 // var bDisableOnEdit = sap.ui.getCore().byId("disableOnEditCheckBox").getSelected();

            //                                 // Validate label uniqueness
            //                                 var aItems = oModel.getProperty("/results");
            //                                 var labelInfo = this.checkLabelUniqueness(sLabel, index, aItems);
            //                                 if (labelInfo.isDuplicate || labelInfo.error) {
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueState("Error");
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueStateText("Label must be unique.");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueState("None");
            //                                 }

            //                                 // Validate section
            //                                 if (!sSection) {
            //                                     sap.ui.getCore().byId("sectionSelect").setValueState("Error");
            //                                     sap.ui.getCore().byId("sectionSelect").setValueStateText("Please select a section.");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("sectionSelect").setValueState("None");
            //                                 }

            //                                 // Validate category
            //                                 if (!sCategory) {
            //                                     sap.ui.getCore().byId("categorySelect").setValueState("Error");
            //                                     sap.ui.getCore().byId("categorySelect").setValueStateText("Please select a category.");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("categorySelect").setValueState("None");
            //                                 }

            //                                 if ((sMinValue && !sMaxValue) || (!sMinValue && sMaxValue)) {
            //                                     sap.ui.getCore().byId("minLengthTextBox").setValueState("Error");
            //                                     sap.ui.getCore().byId("maxLengthTextBox").setValueState("Error");
            //                                     return;
            //                                 }

            //                                 if (sMinValue && sMaxValue && parseInt(sMinValue) >= parseInt(sMaxValue)) {
            //                                     sap.ui.getCore().byId("minLengthTextBox").setValueState("Error");
            //                                     sap.ui.getCore().byId("maxLengthTextBox").setValueState("Error");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("minLengthTextBox").setValueState("None");
            //                                     sap.ui.getCore().byId("maxLengthTextBox").setValueState("None");
            //                                 }

            //                                 // Set values in model
            //                                 oRecord.label = sLabel;
            //                                 oRecord.section = sSection;
            //                                 oRecord.category = sCategory;
            //                                 oRecord[minProperty] = sMinValue || '';
            //                                 oRecord[maxProperty] = sMaxValue || '';
            //                                 oRecord.defaultValue = sDefaultValue;
            //                                 oRecord.placeholder = sPlaceholder;
            //                                 oRecord.isRequired = bIsRequired;
            //                                 oRecord.disabled = bIsReadOnly;
            //                                 oRecord.disableOnEdit = bDisableOnEdit;
            //                                 if (oRecord.new)
            //                                     delete oRecord.new;

            //                                 oModel.setProperty("/results/" + index, oRecord);

            //                                 sap.m.MessageToast.show("Form saved successfully.");
            //                             }.bind(this)
            //                         }).addStyleClass('sapUiTinyMarginEnd'),
            //                         new sap.m.Button({
            //                             icon: "sap-icon://decline",
            //                             type: "Reject",
            //                             press: function () {
            //                                 this.onClearToExist(index);
            //                             }.bind(this)
            //                         }),
            //                     ],
            //                     justifyContent: "End",
            //                     width: "100%"
            //                 })
            //             ]
            //         }).addStyleClass("sapUiSmallMargin");

            //         oVBox.addContent(oFormContent);
            //     }
            //     else if (type === 'calendar' || type === 'calender') {
            //         var oVBox = this.byId("splitterWidgets2") || sap.ui.getCore().byId("splitterWidgets2");
            //         var oFormContent = new sap.m.VBox('textBoxVbox', {
            //             items: [
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "LABEL" }),
            //                         new sap.m.Input('textBoxLabel', { value: `{ActivityFieldDetails>/results/${index}/label}`, liveChange: this.onLabelLiveChange.bind(this, index) }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "SECTION" }),
            //                         new sap.m.Select('sectionSelect', {
            //                             selectedKey: `{ActivityFieldDetails>/results/${index}/section}`,
            //                             forceSelection: false,
            //                             width: "100%",
            //                             items: [
            //                                 new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" }),
            //                                 new sap.ui.core.Item({ key: "Finance Information", text: "Finance Information" }),
            //                                 new sap.ui.core.Item({ key: "Submission", text: "Submission" }),
            //                                 new sap.ui.core.Item({ key: "Quality Certificates", text: "Quality Certificates" }),
            //                                 new sap.ui.core.Item({ key: "Disclosures", text: "Disclosures" }),
            //                                 new sap.ui.core.Item({ key: "Operational Information", text: "Operational Information" })
            //                             ]
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "CATEGORY" }),
            //                         new sap.m.Select('categorySelect', {
            //                             selectedKey: `{ActivityFieldDetails>/results/${index}/category}`,
            //                             forceSelection: false,
            //                             width: "100%",
            //                             items: [
            //                                 new sap.ui.core.Item({ key: "Primary Bank details", text: "Primary Bank details" }),
            //                                 new sap.ui.core.Item({ key: "TAX-VAT-GST", text: "TAX-VAT-GST" }),
            //                                 new sap.ui.core.Item({ key: "Operational Capacity", text: "Operational Capacity" }),
            //                                 new sap.ui.core.Item({ key: "Standard Certifications", text: "Standard Certifications" }),
            //                                 new sap.ui.core.Item({ key: "Product-Service Description", text: "Product-Service Description" }),
            //                                 new sap.ui.core.Item({ key: "Declaration", text: "Declaration" }),
            //                                 new sap.ui.core.Item({ key: "Address", text: "Address" }),
            //                                 new sap.ui.core.Item({ key: "Primary Contact", text: "Primary Contact" }),
            //                                 new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" })
            //                             ]
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox("manualEntryVBox", {
            //                     visible: "{= ${ActivityFieldDetails>/results/" + index + "/typeOfDateSelected} === 'ManualEntry'}",
            //                     items: [
            //                         new sap.m.Label({ text: "DEFAULT VALUE" }),
            //                         new sap.m.Input('defaultValueTextBox', {
            //                             type: 'Date',
            //                             value: {
            //                                 path: `ActivityFieldDetails>/results/${index}/defaultValue`,
            //                                 formatter: function (sValue) {
            //                                     if (sValue) {
            //                                         let oDate = new Date(sValue);
            //                                         return oDate.toISOString().split("T")[0]; // Extracts only YYYY-MM-DD
            //                                     }
            //                                     return "";
            //                                 }
            //                             },
            //                             placeholder: "Enter date"
            //                         })
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "SELECT TYPE OF DATE" }),
            //                         new sap.m.RadioButtonGroup('typeOfDateSelected', {
            //                             columns: 2,
            //                             select: this.onSelectDateType.bind(this, index),
            //                             selectedIndex: "{= ${ActivityFieldDetails>/results/" + index + "/typeOfDateSelected} === '' ? -1 : (${ActivityFieldDetails>/results/" + index + "/typeOfDateSelected} === 'SystemDate' ? 0: !${ActivityFieldDetails>/results/" + index + "/typeOfDateSelected}  ? -1  : 1)}",
            //                             buttons: [
            //                                 new sap.m.RadioButton({
            //                                     text: "System Date"
            //                                 }),
            //                                 new sap.m.RadioButton({
            //                                     text: "Manual Entry"
            //                                 })
            //                             ]
            //                         })
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.Label({ text: "SET RULES", width: "100px" }),
            //                     ]
            //                 }),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.CheckBox('requiredCheckBox', {
            //                             text: "Mandatory",
            //                             selected: "{= ${ActivityFieldDetails>/results/" + index + "/isRequired} === true || ${ActivityFieldDetails>/results/" + index + "/isRequired} === 'true' ? true : false }",
            //                         }),
            //                         new sap.m.CheckBox('disabledCheckBox', {
            //                             text: "Is Visible",
            //                             selected: "{= ${ActivityFieldDetails>/results/" + index + "/visible} === true || ${ActivityFieldDetails>/results/" + index + "/disabled} === 'true' ? true : false }",
            //                         })
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.Label({ text: "Change Type: ", width: "100px" }).addStyleClass('sapUiTinyMarginTop'),
            //                         new sap.m.Select('changeType', {
            //                             selectedKey: this.changeType || `{ActivityFieldDetails>/results/${index}/typeChange}`,
            //                             change: this.onChangeTypeSelected.bind(this, index),
            //                             forceSelection: false,
            //                             items: [
            //                                 this.getSelectForTypeChange(type).map(option =>
            //                                     new sap.ui.core.Item({ key: option.type, text: option.text })
            //                                 )
            //                             ]
            //                         })
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.Button({
            //                             icon: "sap-icon://accept",
            //                             type: "Accept",
            //                             press: function () {
            //                                 var oModel = this.getView().getModel("ActivityFieldDetails");
            //                                 var oRecord = oModel.getProperty("/results/" + index);
            //                                 var sLabel = sap.ui.getCore().byId("textBoxLabel").getValue().trim();
            //                                 var sSection = sap.ui.getCore().byId("sectionSelect").getSelectedKey();
            //                                 var sCategory = sap.ui.getCore().byId("categorySelect").getSelectedKey();
            //                                 var sDefaultValue = sap.ui.getCore().byId("defaultValueTextBox").getValue().trim();
            //                                 var bIsRequired = sap.ui.getCore().byId("requiredCheckBox").getSelected();
            //                                 var bIsReadOnly = sap.ui.getCore().byId("disabledCheckBox").getSelected();
            //                                 var sChangeType = sap.ui.getCore().byId("changeType").getSelectedKey();

            //                                 // Validate the label uniqueness
            //                                 var aItems = oModel.getProperty("/results");
            //                                 var labelInfo = this.checkLabelUniqueness(sLabel, index, aItems);
            //                                 if (labelInfo.isDuplicate) {
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueState("Error");
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueStateText("Label must be unique.");
            //                                     return;
            //                                 } else if (labelInfo.error) {
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueState("Error");
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueStateText("Please give different Name");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueState("None");
            //                                 }

            //                                 // Validate section
            //                                 if (!sSection) {
            //                                     sap.ui.getCore().byId("sectionSelect").setValueState("Error");
            //                                     sap.ui.getCore().byId("sectionSelect").setValueStateText("Please select a section.");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("sectionSelect").setValueState("None");
            //                                 }

            //                                 // Validate category
            //                                 if (!sCategory) {
            //                                     sap.ui.getCore().byId("categorySelect").setValueState("Error");
            //                                     sap.ui.getCore().byId("categorySelect").setValueStateText("Please select a category.");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("categorySelect").setValueState("None");
            //                                 }

            //                                 // Set values in model
            //                                 oRecord.label = sLabel;
            //                                 oRecord.section = sSection;
            //                                 oRecord.category = sCategory;
            //                                 oRecord.defaultValue = sDefaultValue ? new Date(sDefaultValue).toISOString() : "";
            //                                 oRecord.isRequired = bIsRequired;
            //                                 oRecord.disabled = bIsReadOnly;
            //                                 if (!oRecord.typeOfDateSelected || oRecord.typeOfDateSelected === '')
            //                                     oRecord.typeOfDateSelected = 'SystemDate';
            //                                 var changeableType = this.changeType || sap.ui.getCore().byId("changeType").getSelectedKey();
            //                                 if (changeableType) {
            //                                     oRecord.type = changeableType;
            //                                 }
            //                                 oRecord.typeChange = sChangeType || '';
            //                                 this.changeType = null;
            //                                 if (oRecord.new)
            //                                     delete oRecord.new;

            //                                 oModel.setProperty("/results/" + index, oRecord);

            //                                 sap.m.MessageToast.show("Form saved successfully.");
            //                             }.bind(this)
            //                         }).addStyleClass('sapUiTinyMarginEnd'),
            //                         new sap.m.Button({
            //                             icon: "sap-icon://decline",
            //                             type: "Reject",
            //                             press: function () {
            //                                 this.onClearToExist(index);
            //                                 this.changeType = null;
            //                             }.bind(this)
            //                         })
            //                     ],
            //                     justifyContent: "End",
            //                     width: "100%"
            //                 }).addStyleClass('sapUiSmallMarginTop')
            //             ]
            //         }).addStyleClass("sapUiSmallMargin");

            //         oVBox.addContent(oFormContent);
            //     }
            //     else if (type === 'select' || type === 'radio' || type === 'dropdown') {
            //         var oModel = this.getView().getModel("ActivityFieldDetails");
            //         var aOptions = oModel.getProperty("/results/" + index + "/options") || [];
            //         var isAllow, isAllowMulti = false;
            //         if (type === 'select') {
            //             isAllowMulti = true;
            //             isAllow = new sap.m.CheckBox('isAllowMultiselection', {
            //                 text: "Allow Multiple Selection",
            //                 selected: "{= ${ActivityFieldDetails>/results/" + index + "/isAllowMultiselection} === true || ${ActivityFieldDetails>/results/" + index + "/isAllowMultiselection} === 'true' ? true : false }",
            //                 select: function (oEvent) {
            //                     var isChecked = oEvent.getParameter("selected");
            //                     var oModel = sap.ui.getCore().getModel("ActivityFieldDetails");
            //                     var oData = oModel.getProperty("/results/" + index);
            //                     if (oData) {
            //                         oData.isAllowMultiselection = isChecked;
            //                         oModel.refresh(true);
            //                     }
            //                 }
            //             });
            //         }

            //         var defaultValues = type === 'select' ? 'Dropdown1' : type === 'radio' ? 'Radio1' : 'Select1';
            //         if (aOptions.length === 0) {
            //             aOptions.push({
            //                 displayValue: defaultValues,
            //                 value: defaultValues
            //             });
            //             oModel.setProperty("/results/" + index + "/options", aOptions);
            //         }
            //         var oVBox = this.getView().byId("splitterWidgets2") || sap.ui.getCore().byId("splitterWidgets2");

            //         var oFormContent = new sap.m.VBox('textBoxVbox', {
            //             items: [
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "LABEL" }),
            //                         new sap.m.Input('textBoxLabel', { value: `{ActivityFieldDetails>/results/${index}/label}` }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "DESCRIPTION" }),
            //                         new sap.m.Input('description', { value: `{ActivityFieldDetails>/results/${index}/description}`, placeholder: "Enter description" }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "SECTION" }),
            //                         new sap.m.Select('sectionSelect', {
            //                             selectedKey: `{ActivityFieldDetails>/results/${index}/section}`,
            //                             forceSelection: false,
            //                             width: "100%",
            //                             items: [
            //                                 new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" }),
            //                                 new sap.ui.core.Item({ key: "Finance Information", text: "Finance Information" }),
            //                                 new sap.ui.core.Item({ key: "Submission", text: "Submission" }),
            //                                 new sap.ui.core.Item({ key: "Quality Certificates", text: "Quality Certificates" }),
            //                                 new sap.ui.core.Item({ key: "Disclosures", text: "Disclosures" }),
            //                                 new sap.ui.core.Item({ key: "Operational Information", text: "Operational Information" })
            //                             ]
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "CATEGORY" }),
            //                         new sap.m.Select('categorySelect', {
            //                             selectedKey: `{ActivityFieldDetails>/results/${index}/category}`,
            //                             forceSelection: false,
            //                             width: "100%",
            //                             items: [
            //                                 new sap.ui.core.Item({ key: "Primary Bank details", text: "Primary Bank details" }),
            //                                 new sap.ui.core.Item({ key: "TAX-VAT-GST", text: "TAX-VAT-GST" }),
            //                                 new sap.ui.core.Item({ key: "Operational Capacity", text: "Operational Capacity" }),
            //                                 new sap.ui.core.Item({ key: "Standard Certifications", text: "Standard Certifications" }),
            //                                 new sap.ui.core.Item({ key: "Product-Service Description", text: "Product-Service Description" }),
            //                                 new sap.ui.core.Item({ key: "Declaration", text: "Declaration" }),
            //                                 new sap.ui.core.Item({ key: "Address", text: "Address" }),
            //                                 new sap.ui.core.Item({ key: "Primary Contact", text: "Primary Contact" }),
            //                                 new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" })
            //                             ]
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "DEFAULT VALUE" }),
            //                         new sap.m.Input('defaultValueTextBox', { value: `{ActivityFieldDetails>/results/${index}/defaultValue}`, placeholder: "Enter default value" }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.Label({ text: "SET RULES", width: "100px" })
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.CheckBox('requiredCheckBox', {
            //                             text: "Mandatory",
            //                             selected: "{= ${ActivityFieldDetails>/results/" + index + "/isRequired} === true || ${ActivityFieldDetails>/results/" + index + "/isRequired} === 'true' ? true : false }",
            //                         }),
            //                         new sap.m.CheckBox('disabledCheckBox', {
            //                             text: "Is Visible",
            //                             selected: "{= ${ActivityFieldDetails>/results/" + index + "/visible} === true || ${ActivityFieldDetails>/results/" + index + "/disabled} === 'true' ? true : false }",
            //                         })
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.CheckBox('disableOnEditCheckBox', {
            //                             text: "Disable Edit",
            //                             selected: "{= ${ActivityFieldDetails>/results/" + index + "/disableOnEdit} === true || ${ActivityFieldDetails>/results/" + index + "/disableOnEdit} === 'true' ? true : false }",
            //                         })
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.HBox({
            //                             items: [
            //                                 new sap.m.Label({ text: "Add New Value/Option" }).addStyleClass("sapUiTinyMarginTop"),
            //                                 new sap.m.Button({
            //                                     text: "Add",
            //                                     press: this.onAddField.bind(this, index),
            //                                     icon: "sap-icon://add"
            //                                 }).addStyleClass("sapUiTinyMarginBegin")
            //                             ]
            //                         }).addStyleClass("sapUiTinyMarginBottom"),
            //                         new sap.m.VBox({
            //                             id: this.createId("newFieldsContainer"),
            //                             items: {
            //                                 path: "ActivityFieldDetails>/results/" + index + "/options",
            //                                 factory: function (sId, oContext) {
            //                                     return new sap.m.HBox({
            //                                         items: [
            //                                             new sap.m.Input({
            //                                                 value: "{ActivityFieldDetails>displayValue}",
            //                                                 placeholder: "Display Value",
            //                                                 liveChange: this.onOptionLiveChange.bind(this, index)
            //                                             }).addStyleClass('sapUiTinyMarginBottom sapUiTinyMarginEnd'),
            //                                             new sap.m.Input({
            //                                                 value: "{ActivityFieldDetails>value}",
            //                                                 placeholder: "Value",
            //                                                 liveChange: this.onOptionLiveChange.bind(this, index)
            //                                             }).addStyleClass('sapUiTinyMarginBottom sapUiTinyMarginBegin'),
            //                                             new sap.m.Button({
            //                                                 icon: "sap-icon://delete",
            //                                                 type: "Transparent",
            //                                                 press: this.onRemoveField.bind(this, index)
            //                                             }).addStyleClass('sapUiTinyMarginBegin')
            //                                         ]
            //                                     });
            //                                 }.bind(this)
            //                             }
            //                         })
            //                     ]
            //                 }).addStyleClass("sapUiTinyMarginBottom"),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.Label({ text: "Change Type: ", width: "100px" }).addStyleClass('sapUiTinyMarginTop'),
            //                         new sap.m.Select('changeType', {
            //                             selectedKey: this.changeType || `{ActivityFieldDetails>/results/${index}/typeChange}`,
            //                             change: this.onChangeTypeSelected.bind(this, index),
            //                             forceSelection: false,
            //                             items: [
            //                                 this.getSelectForTypeChange(type).map(option =>
            //                                     new sap.ui.core.Item({ key: option.type, text: option.text })
            //                                 )
            //                             ]
            //                         })
            //                     ]
            //                 }),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.Button({
            //                             icon: "sap-icon://accept",
            //                             type: "Accept",
            //                             press: function () {
            //                                 var oModel = this.getView().getModel("ActivityFieldDetails");
            //                                 var aOptions = oModel.getProperty("/results/" + index + "/options");
            //                                 var oNewFieldsContainer = this.getView().byId("newFieldsContainer");
            //                                 var sChangeType = sap.ui.getCore().byId("changeType").getSelectedKey();
            //                                 var sLabel = sap.ui.getCore().byId("textBoxLabel").getValue().trim();
            //                                 var sSection = sap.ui.getCore().byId("sectionSelect").getSelectedKey();
            //                                 var sCategory = sap.ui.getCore().byId("categorySelect").getSelectedKey();
            //                                 if (aOptions) {
            //                                     aOptions = aOptions.filter(function (option) {
            //                                         var displayValueFilled = option.displayValue && option.displayValue.trim().length > 0;
            //                                         var valueFilled = option.value && option.value.trim().length > 0;
            //                                         return (displayValueFilled && valueFilled);
            //                                     });
            //                                     var aNewFields = oNewFieldsContainer.getItems().map(function (oHBox) {
            //                                         var aInputs = oHBox.getItems().filter(function (item) {
            //                                             return item instanceof sap.m.Input;
            //                                         });
            //                                         return {
            //                                             displayValue: aInputs[0].getValue().trim(),
            //                                             value: aInputs[1].getValue().trim()
            //                                         };
            //                                     });
            //                                     aNewFields = aNewFields.filter(function (option) {
            //                                         return option.displayValue && option.value;
            //                                     });
            //                                     aNewFields = aNewFields.filter(function (newField) {
            //                                         return !aOptions.some(function (existingOption) {
            //                                             return existingOption.displayValue === newField.displayValue && existingOption.value === newField.value;
            //                                         });
            //                                     });
            //                                     aOptions = aOptions.concat(aNewFields);
            //                                     oModel.setProperty("/results/" + index + "/options", aOptions);
            //                                 } else {
            //                                     var aNewFields = oNewFieldsContainer.getItems().map(function (oHBox) {
            //                                         var aInputs = oHBox.getItems().filter(function (item) {
            //                                             return item instanceof sap.m.Input;
            //                                         });
            //                                         return {
            //                                             displayValue: aInputs[0].getValue().trim(),
            //                                             value: aInputs[1].getValue().trim()
            //                                         };
            //                                     });
            //                                     aNewFields = aNewFields.filter(function (option) {
            //                                         return option.displayValue && option.value;
            //                                     });
            //                                     if (aNewFields.length > 0) {
            //                                         oModel.setProperty("/results/" + index + "/options", aNewFields);
            //                                     } else {
            //                                         var newOption = {
            //                                             displayValue: 'Default Display Value',
            //                                             value: 'Default Value'
            //                                         };
            //                                         oModel.setProperty("/results/" + index + "/options", [newOption]);
            //                                     }
            //                                 }

            //                                 var aItems = oModel.getProperty("/results");
            //                                 var labelInfo = this.checkLabelUniqueness(sLabel, index, aItems);
            //                                 if (labelInfo.isDuplicate) {
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueState("Error");
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueStateText("Label must be unique.");
            //                                     return;
            //                                 } else if (labelInfo.error) {
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueState("Error");
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueStateText("Please give different Name");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueState("None");
            //                                 }

            //                                 // Validate section
            //                                 if (!sSection) {
            //                                     sap.ui.getCore().byId("sectionSelect").setValueState("Error");
            //                                     sap.ui.getCore().byId("sectionSelect").setValueStateText("Please select a section.");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("sectionSelect").setValueState("None");
            //                                 }

            //                                 // Validate category
            //                                 if (!sCategory) {
            //                                     sap.ui.getCore().byId("categorySelect").setValueState("Error");
            //                                     sap.ui.getCore().byId("categorySelect").setValueStateText("Please select a category.");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("categorySelect").setValueState("None");
            //                                 }

            //                                 var oRecord = oModel.getProperty("/results/" + index);
            //                                 oRecord.label = sLabel;
            //                                 oRecord.section = sSection;
            //                                 oRecord.category = sCategory;
            //                                 var defaultVal = sap.ui.getCore().byId("defaultValueTextBox").getValue().trim();
            //                                 var optionsOk = false;
            //                                 if (defaultVal && defaultVal !== '') {
            //                                     aOptions.forEach((data) => {
            //                                         if (data.value === defaultVal) {
            //                                             optionsOk = true;
            //                                         }
            //                                     });
            //                                     if (!optionsOk) {
            //                                         sap.ui.getCore().byId("defaultValueTextBox").setValueState("Error");
            //                                         sap.ui.getCore().byId("defaultValueTextBox").setValueStateText(`Default Value should match the ${type} value`);
            //                                         return;
            //                                     } else {
            //                                         sap.ui.getCore().byId("defaultValueTextBox").setValueState("None");
            //                                     }
            //                                 } else {
            //                                     sap.ui.getCore().byId("defaultValueTextBox").setValueState("None");
            //                                 }
            //                                 oRecord.defaultValue = defaultVal;
            //                                 oRecord.isRequired = sap.ui.getCore().byId("requiredCheckBox").getSelected();
            //                                 oRecord.disabled = sap.ui.getCore().byId("disabledCheckBox").getSelected();
            //                                 oRecord.disableOnEdit = sap.ui.getCore().byId("disableOnEditCheckBox").getSelected();
            //                                 if (isAllowMulti)
            //                                     oRecord.isAllowMultiselection = sap.ui.getCore().byId("isAllowMultiselection").getSelected();
            //                                 else
            //                                     oRecord.isAllowMultiselection = false;
            //                                 var changeableType = this.changeType || sap.ui.getCore().byId("changeType").getSelectedKey();
            //                                 if (changeableType) {
            //                                     oRecord.type = changeableType;
            //                                 }
            //                                 oRecord.typeChange = sChangeType || '';
            //                                 this.changeType = null;
            //                                 if (oRecord.new)
            //                                     delete oRecord.new;
            //                                 oModel.setProperty("/results/" + index, oRecord);
            //                                 oModel.refresh(true);

            //                                 sap.m.MessageToast.show("Form saved successfully.");
            //                             }.bind(this)
            //                         }).addStyleClass('sapUiTinyMarginEnd'),
            //                         new sap.m.Button({
            //                             icon: "sap-icon://decline",
            //                             type: "Reject",
            //                             press: function () {
            //                                 this.onClearToExist(index);
            //                                 this.changeType = null;
            //                             }.bind(this)
            //                         }),
            //                     ],
            //                     justifyContent: "End",
            //                     width: "100%"
            //                 })
            //             ]
            //         }).addStyleClass("sapUiSmallMargin");

            //         oVBox.addContent(oFormContent);
            //     }
            //     else if (type === 'checkBox') {
            //         var oVBox = this.getView().byId("splitterWidgets2") || sap.ui.getCore().byId("splitterWidgets2");
            //         var oModel = this.getView().getModel("ActivityFieldDetails");
            //         var aOptions = oModel.getProperty("/results/" + index + "/options") || [];
            //         if (aOptions.length === 0) {
            //             aOptions.push({
            //                 displayValue: "Check Box1",
            //                 value: "Check Box1"
            //             });
            //             oModel.setProperty("/results/" + index + "/options", aOptions);
            //         }

            //         var oFormContent = new sap.m.VBox('textBoxVbox', {
            //             items: [
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "LABEL" }),
            //                         new sap.m.Input('textBoxLabel', { value: `{ActivityFieldDetails>/results/${index}/label}`, liveChange: this.onLabelLiveChange.bind(this, index) }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "SECTION" }),
            //                         new sap.m.Select('sectionSelect', {
            //                             selectedKey: `{ActivityFieldDetails>/results/${index}/section}`,
            //                             forceSelection: false,
            //                             width: "100%",
            //                             items: [
            //                                 new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" }),
            //                                 new sap.ui.core.Item({ key: "Finance Information", text: "Finance Information" }),
            //                                 new sap.ui.core.Item({ key: "Submission", text: "Submission" }),
            //                                 new sap.ui.core.Item({ key: "Quality Certificates", text: "Quality Certificates" }),
            //                                 new sap.ui.core.Item({ key: "Disclosures", text: "Disclosures" }),
            //                                 new sap.ui.core.Item({ key: "Operational Information", text: "Operational Information" })
            //                             ]
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "CATEGORY" }),
            //                         new sap.m.Select('categorySelect', {
            //                             selectedKey: `{ActivityFieldDetails>/results/${index}/category}`,
            //                             forceSelection: false,
            //                             width: "100%",
            //                             items: [
            //                                 new sap.ui.core.Item({ key: "Primary Bank details", text: "Primary Bank details" }),
            //                                 new sap.ui.core.Item({ key: "TAX-VAT-GST", text: "TAX-VAT-GST" }),
            //                                 new sap.ui.core.Item({ key: "Operational Capacity", text: "Operational Capacity" }),
            //                                 new sap.ui.core.Item({ key: "Standard Certifications", text: "Standard Certifications" }),
            //                                 new sap.ui.core.Item({ key: "Product-Service Description", text: "Product-Service Description" }),
            //                                 new sap.ui.core.Item({ key: "Declaration", text: "Declaration" }),
            //                                 new sap.ui.core.Item({ key: "Address", text: "Address" }),
            //                                 new sap.ui.core.Item({ key: "Primary Contact", text: "Primary Contact" }),
            //                                 new sap.ui.core.Item({ key: "Supplier Information", text: "Supplier Information" })
            //                             ]
            //                         }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.Label({ text: "DEFAULT VALUE" }),
            //                         new sap.m.Input('defaultValueTextBox', { value: `{ActivityFieldDetails>/results/${index}/defaultValue}`, placeholder: "Enter default value" }).addStyleClass('sapUiTinyMarginBottom')
            //                     ]
            //                 }),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.Label({ text: "SET RULES", width: "100px" })
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.CheckBox('requiredCheckBox', {
            //                             text: "Mandatory",
            //                             selected: "{= ${ActivityFieldDetails>/results/" + index + "/isRequired} === true || ${ActivityFieldDetails>/results/" + index + "/isRequired} === 'true' ? true : false }",
            //                         }),
            //                         new sap.m.CheckBox('disabledCheckBox', {
            //                             text: "Is Visible",
            //                             selected: "{= ${ActivityFieldDetails>/results/" + index + "/visible} === true || ${ActivityFieldDetails>/results/" + index + "/disabled} === 'true' ? true : false }",
            //                         })
            //                     ]
            //                 }).addStyleClass('sapUiTinyMarginBottom'),
            //                 new sap.m.VBox({
            //                     items: [
            //                         new sap.m.HBox({
            //                             items: [
            //                                 new sap.m.Label({ text: "Add New Value/Option" }).addStyleClass("sapUiTinyMarginTop"),
            //                                 new sap.m.Button({
            //                                     text: "Add",
            //                                     press: this.onAddField.bind(this, index),
            //                                     icon: "sap-icon://add"
            //                                 }).addStyleClass("sapUiTinyMarginBegin")
            //                             ]
            //                         }).addStyleClass("sapUiTinyMarginBottom"),
            //                         new sap.m.VBox({
            //                             id: this.createId("newFieldsContainer"),
            //                             items: {
            //                                 path: "ActivityFieldDetails>/results/" + index + "/options",
            //                                 factory: function (sId, oContext) {
            //                                     return new sap.m.HBox({
            //                                         items: [
            //                                             new sap.m.Input({
            //                                                 value: "{ActivityFieldDetails>displayValue}",
            //                                                 placeholder: "Display Value",
            //                                                 liveChange: this.onOptionLiveChange.bind(this, index)
            //                                             }).addStyleClass('sapUiTinyMarginBottom sapUiTinyMarginEnd'),
            //                                             new sap.m.Input({
            //                                                 value: "{ActivityFieldDetails>value}",
            //                                                 placeholder: "Value",
            //                                                 liveChange: this.onOptionLiveChange.bind(this, index)
            //                                             }).addStyleClass('sapUiTinyMarginBottom sapUiTinyMarginBegin'),
            //                                             new sap.m.Button({
            //                                                 icon: "sap-icon://delete",
            //                                                 type: "Transparent",
            //                                                 press: this.onRemoveField.bind(this, index)
            //                                             }).addStyleClass('sapUiTinyMarginBegin')
            //                                         ]
            //                                     });
            //                                 }.bind(this)
            //                             }
            //                         })
            //                     ]
            //                 }).addStyleClass("sapUiTinyMarginBottom"),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.Label({ text: "Change Type: ", width: "100px" }).addStyleClass('sapUiTinyMarginTop'),
            //                         new sap.m.Select('changeType', {
            //                             selectedKey: this.changeType || `{ActivityFieldDetails>/results/${index}/typeChange}`,
            //                             change: this.onChangeTypeSelected.bind(this, index),
            //                             forceSelection: false,
            //                             items: [
            //                                 this.getSelectForTypeChange(type).map(option =>
            //                                     new sap.ui.core.Item({ key: option.type, text: option.text })
            //                                 )
            //                             ]
            //                         })
            //                     ]
            //                 }),
            //                 new sap.m.HBox({
            //                     items: [
            //                         new sap.m.Button({
            //                             icon: "sap-icon://accept",
            //                             type: "Accept",
            //                             press: function () {
            //                                 var oModel = this.getView().getModel("ActivityFieldDetails");
            //                                 var aOptions = oModel.getProperty("/results/" + index + "/options");
            //                                 var oNewFieldsContainer = this.getView().byId("newFieldsContainer");
            //                                 var sChangeType = sap.ui.getCore().byId("changeType").getSelectedKey();
            //                                 var sLabel = sap.ui.getCore().byId("textBoxLabel").getValue().trim();
            //                                 var sSection = sap.ui.getCore().byId("sectionSelect").getSelectedKey();
            //                                 var sCategory = sap.ui.getCore().byId("categorySelect").getSelectedKey();
            //                                 if (aOptions) {
            //                                     aOptions = aOptions.filter(function (option) {
            //                                         var displayValueFilled = option.displayValue && option.displayValue.trim().length > 0;
            //                                         var valueFilled = option.value && option.value.trim().length > 0;
            //                                         return (displayValueFilled && valueFilled);
            //                                     });
            //                                     var aNewFields = oNewFieldsContainer.getItems().map(function (oHBox) {
            //                                         var aInputs = oHBox.getItems().filter(function (item) {
            //                                             return item instanceof sap.m.Input;
            //                                         });
            //                                         return {
            //                                             displayValue: aInputs[0].getValue().trim(),
            //                                             value: aInputs[1].getValue().trim()
            //                                         };
            //                                     });
            //                                     aNewFields = aNewFields.filter(function (option) {
            //                                         return option.displayValue && option.value;
            //                                     });
            //                                     aNewFields = aNewFields.filter(function (newField) {
            //                                         return !aOptions.some(function (existingOption) {
            //                                             return existingOption.displayValue === newField.displayValue && existingOption.value === newField.value;
            //                                         });
            //                                     });
            //                                     aOptions = aOptions.concat(aNewFields);
            //                                     oModel.setProperty("/results/" + index + "/options", aOptions);
            //                                 } else {
            //                                     var aNewFields = oNewFieldsContainer.getItems().map(function (oHBox) {
            //                                         var aInputs = oHBox.getItems().filter(function (item) {
            //                                             return item instanceof sap.m.Input;
            //                                         });
            //                                         return {
            //                                             displayValue: aInputs[0].getValue().trim(),
            //                                             value: aInputs[1].getValue().trim()
            //                                         };
            //                                     });
            //                                     aNewFields = aNewFields.filter(function (option) {
            //                                         return option.displayValue && option.value;
            //                                     });
            //                                     if (aNewFields.length > 0) {
            //                                         oModel.setProperty("/results/" + index + "/options", aNewFields);
            //                                     } else {
            //                                         var newOption = {
            //                                             displayValue: 'Default Display Value',
            //                                             value: 'Default Value'
            //                                         };
            //                                         oModel.setProperty("/results/" + index + "/options", [newOption]);
            //                                     }
            //                                 }

            //                                 var aItems = oModel.getProperty("/results");
            //                                 var labelInfo = this.checkLabelUniqueness(sLabel, index, aItems);
            //                                 if (labelInfo.isDuplicate) {
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueState("Error");
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueStateText("Label must be unique.");
            //                                     return;
            //                                 } else if (labelInfo.error) {
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueState("Error");
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueStateText("Please give different Name");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("textBoxLabel").setValueState("None");
            //                                 }

            //                                 // Validate section
            //                                 if (!sSection) {
            //                                     sap.ui.getCore().byId("sectionSelect").setValueState("Error");
            //                                     sap.ui.getCore().byId("sectionSelect").setValueStateText("Please select a section.");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("sectionSelect").setValueState("None");
            //                                 }

            //                                 // Validate category
            //                                 if (!sCategory) {
            //                                     sap.ui.getCore().byId("categorySelect").setValueState("Error");
            //                                     sap.ui.getCore().byId("categorySelect").setValueStateText("Please select a category.");
            //                                     return;
            //                                 } else {
            //                                     sap.ui.getCore().byId("categorySelect").setValueState("None");
            //                                 }

            //                                 var oRecord = oModel.getProperty("/results/" + index);
            //                                 oRecord.label = sLabel;
            //                                 oRecord.section = sSection;
            //                                 oRecord.category = sCategory;
            //                                 var defaultVal = sap.ui.getCore().byId("defaultValueTextBox").getValue().trim();
            //                                 var optionsOk = false;
            //                                 if (defaultVal && defaultVal !== '') {
            //                                     aOptions.forEach((data) => {
            //                                         if (data.value === defaultVal) {
            //                                             optionsOk = true;
            //                                         }
            //                                     });
            //                                     if (!optionsOk) {
            //                                         sap.ui.getCore().byId("defaultValueTextBox").setValueState("Error");
            //                                         sap.ui.getCore().byId("defaultValueTextBox").setValueStateText(`Default Value should match the ${type} value`);
            //                                         return;
            //                                     } else {
            //                                         sap.ui.getCore().byId("defaultValueTextBox").setValueState("None");
            //                                     }
            //                                 } else {
            //                                     sap.ui.getCore().byId("defaultValueTextBox").setValueState("None");
            //                                 }
            //                                 oRecord.defaultValue = defaultVal;
            //                                 oRecord.isRequired = sap.ui.getCore().byId("requiredCheckBox").getSelected();
            //                                 oRecord.disabled = sap.ui.getCore().byId("disabledCheckBox").getSelected();
            //                                 var changeableType = this.changeType || sap.ui.getCore().byId("changeType").getSelectedKey();
            //                                 if (changeableType) {
            //                                     oRecord.type = changeableType;
            //                                 }
            //                                 oRecord.typeChange = sChangeType || '';
            //                                 this.changeType = null;
            //                                 if (oRecord.new)
            //                                     delete oRecord.new;
            //                                 oModel.setProperty("/results/" + index, oRecord);
            //                                 oModel.refresh(true);

            //                                 sap.m.MessageToast.show("Form saved successfully.");
            //                             }.bind(this)
            //                         }).addStyleClass('sapUiTinyMarginEnd'),
            //                         new sap.m.Button({
            //                             icon: "sap-icon://decline",
            //                             type: "Reject",
            //                             press: function () {
            //                                 this.onClearToExist(index);
            //                                 this.changeType = null;
            //                             }.bind(this)
            //                         }),
            //                     ],
            //                     justifyContent: "End",
            //                     width: "100%"
            //                 })
            //             ]
            //         }).addStyleClass("sapUiSmallMargin");

            //         oVBox.addContent(oFormContent);
            //     }
            // },

            onMinLengthLiveChange: function (index, oEvent) {
                var oModel = this.getView().getModel("ActivityFieldDetails");
                var oRecord = oModel.getProperty("/results/" + index) || {};

                // Get the current minLength/minValue from the event (being edited)
                var sMinLength = oEvent.getParameter("value").trim() || "";
                // Get the maxLength/maxValue from the model
                var sMaxLength = (oRecord.maxLength || oRecord.maxValue || "").toString().trim();

                // Validate: Both MinLength and MaxLength must be filled or both must be empty
                if ((sMinLength && !sMaxLength) || (!sMinLength && sMaxLength)) {
                    // Set error if one is filled but not the other
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Both Min and Max length must be filled.");
                } else if (sMinLength && sMaxLength && parseInt(sMinLength) >= parseInt(sMaxLength)) {
                    // Validate: MinLength should not be greater than MaxLength
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Min length cannot be greater than Max length.");
                } else {
                    // Clear error state if the validation passes
                    oEvent.getSource().setValueState("None");
                }
            },


            // Example: Integrate with onPressSave
            onPressSave: function() {
                var that = this;
                var oView = this.getView();
                var oPayload = this.getAllFormData();
            
                // Validate payload
                if (!oPayload.config || oPayload.config.length === 0) {
                    sap.m.MessageBox.error("No data to save. Please add at least one field.");
                    return;
                }
            
                // Additional validation: Ensure SECTION and CATEGORY are filled
                var bValid = true;
                oPayload.config.forEach(function(oField, index) {
                    if (!oField.SECTION) {
                        sap.m.MessageBox.error("Section is required for field at index " + index);
                        bValid = false;
                    }
                    if (!oField.CATEGORY) {
                        sap.m.MessageBox.error("Category is required for field at index " + index);
                        bValid = false;
                    }
                });
            
                if (!bValid) {
                    return;
                }
            
                // Get the OData V4 model
                var oODataModel = this.getView().getModel();
            
                // Set busy state
                oView.setBusy(true);
            
                // Submit the payload using create
                oODataModel.create("/AddDynamicField", oPayload, {
                    success: function(res) {
                        oView.setBusy(false);
                        sap.m.MessageBox.success(res.AddDynamicField || "Fields saved successfully.");
            
                        // Clear the ActivityFieldDetails model to empty the splitterWidgets1 panel
                        var oActivityModel = oView.getModel("ActivityFieldDetails");
                        oActivityModel.setProperty("/results", []);
            
                        // Remove the splitterWidgets2 panel (third panel)
                        var thirdPanel = sap.ui.getCore().byId("splitterWidgets2");
                        if (thirdPanel) {
                            thirdPanel.destroyContent(); // Destroy all content within the panel
                            thirdPanel.destroy(); // Destroy the panel itself
                        }
                    },
                    error: function(err) {
                        oView.setBusy(false);
                        sap.m.MessageBox.error("Unable to Create: " + (err.message || "Unknown error."));
                    }
                });
            },

            onPressBack: function () {
                this.getOwnerComponent().getRouter().navTo("RouteSystemView")
            },

            getAllFormData: function () {
                var oModel = this.getView().getModel("ActivityFieldDetails");
                let dModel = this.getView().getModel("listModel").getData();
                let cCode = dModel.companyCode;
                let rType = dModel.requestType;
                var aResults = oModel.getProperty("/results") || [];

                // Prepare the payload in the required format
                var aConfig = aResults.map(function (oRecord, index) {
                    var sFieldType;
                    switch (oRecord.type) {
                        case "textBox":
                            sFieldType = "Text";
                            break;
                        case "textArea":
                            sFieldType = "TextArea";
                            break;
                        case "number":
                            sFieldType = "Number";
                            break;
                        case "calendar":
                            sFieldType = "calendar";
                            break;
                        case "dropdown":
                        case "select":
                            sFieldType = "Dropdown";
                            break;
                        case "radio":
                            sFieldType = "Radio";
                            break;
                        case "checkBox":
                            sFieldType = "CheckBox";
                            break;
                        default:
                            sFieldType = "Text"; // Default fallback
                    }

                    // Prepare dropdown values (if applicable)
                    var sDropdownValues = "";
                    if (oRecord.options && Array.isArray(oRecord.options)) {
                        sDropdownValues = oRecord.options.map(option => option.value).join(",");
                    }

                    return {
                        FIELD_LABEL: oRecord.label || "",
                        DESCRIPTION: oRecord.description || "",
                        FIELD_PATH:oRecord.label || "",
                        SECTION: oRecord.section || "",
                        CATEGORY: oRecord.category || "",
                        COMPANY_CODE: cCode, // Static value as per example
                        REQUEST_TYPE: rType, // Static value as per example
                        IS_VISIBLE: oRecord.disabled === true || oRecord.disabled === "true", // Maps to isVisible
                        IS_MANDATORY: oRecord.isRequired === true || oRecord.isRequired === "true", // Maps to isRequired
                        FIELD_TYPE: sFieldType,
                        MINIMUM: oRecord.minLength || oRecord.minValue || "", // Use minLength or minValue
                        MAXIMUM: oRecord.maxLength || oRecord.maxValue || "", // Use maxLength or maxValue
                        DEFAULT_VALUE: oRecord.defaultValue || "",
                        PLACEHOLDER: oRecord.placeholder || "",
                        DROPDOWN_VALUES: sDropdownValues
                    };
                });

                return { config: aConfig };
            },

            onPressDelete: function (oEvent) {
                var oContext = oEvent.getSource().getParent().getBindingContext("ActivityFieldDetails");
                var sType = oContext.getProperty("type"),
                    sPath = oContext.getPath(),
                    iIndex = sPath.split("/").pop(),
                    oBinding = this.getView().byId("projectList").getBinding("items"),
                    aItems = oBinding.getModel().getProperty(oBinding.getPath()),
                    type = aItems[iIndex].type;
                aItems.splice(iIndex, 1)[0];
                if (type === 'table' || type === 'heading') {
                    let nextBreakIndex = -1;
                    for (let i = iIndex; i < aItems.length; i++) {
                        if (aItems[i].type === 'break') {
                            nextBreakIndex = i;
                            break;
                        }
                    }
                    if (nextBreakIndex !== -1) {
                        aItems.splice(iIndex, nextBreakIndex - iIndex + 1);
                    }
                }


                var prevBoxId = oEvent.getSource().getParent().getParent().getId()
                this.onDeletePreviousId(prevBoxId);
                var thirdPanel = sap.ui.getCore().byId('splitterWidgets2');
                if (thirdPanel) {
                    thirdPanel.destroy();
                }

                oBinding.getModel().setProperty(oBinding.getPath(), aItems);
                var results = this.getView().getModel("ActivityFieldDetails").getData().results;
                var listModel = this.getView().getModel('listModel');
                if (results.length > 0) {
                    listModel.setProperty("/unList", false);
                    listModel.setProperty("/list", true);
                } else {
                    listModel.setProperty("/unList", true);
                    listModel.setProperty("/list", false);
                }
                this.changeType = null

            },
            onLabelLiveChange: function (index, oEvent) {
                var sNewLabel = oEvent.getParameter("value");

                var oModel = this.getView().getModel("ActivityFieldDetails");
                var aItems = oModel.getProperty("/results");

                // Check how many times the label appears for different indices (exclude the current index)
                var iLabelCount = aItems.reduce(function (count, item, i) {
                    // Only count labels that match the new label and are not from the current item (index)
                    return item.label === sNewLabel && i !== parseInt(index) ? count + 1 : count;
                }, 0); // Initialize count to 0

                // If the label appears more than once for different indices, it's a duplicate
                if (iLabelCount > 0) {
                    this.labelError = true;
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Label must be unique");
                } else {
                    this.labelError = false
                    oEvent.getSource().setValueState("None");
                }
            },

            onDeletePreviousId: function (id) {
                var oNewVBox = sap.ui.getCore().byId(id) || this.getView().byId(id);
                if (this._previousVBox) {
                    this._previousVBox.removeStyleClass("ActFieldVbox");
                }
                if (oNewVBox) {
                    oNewVBox.removeStyleClass("ActFieldVbox");
                }
            },

            checkLabelUniqueness: function (sLabel, index, aItems) {
                // Count how many times the label appears in the list
                if (sLabel.trim() === '') {
                    return {
                        isDuplicate: false,
                        error: true
                    };
                }
                var iLabelCount = aItems.reduce(function (count, item, i) {
                    // Only count labels that match the new label and have a different index
                    return item.label === sLabel && i !== index ? count + 1 : count;
                }, 0);

                // Create an accumulator to track the count and first index of the duplicate
                var labelInfo = aItems.reduce(function (accumulator, item, i) {
                    if (item.label === sLabel && i !== index) {
                        accumulator.count += 1; // Increment the count
                        if (accumulator.firstIndex === -1) {
                            accumulator.firstIndex = i; // Store the index of the first match
                        }
                    }
                    return accumulator;
                }, { count: 0, firstIndex: -1 });

                var labels = [
                    "Input", "Text Area", "Dropdown", "Check Box", "Radio", "Number", "Rating", "Calender",
                    "Camera", "Video", "Signature", "Bar Code",
                    "Calculator", "Header", "Map", "Table", "Time", "Properties", "Dyanmic Dropdown", "Mobile Sensors"
                ]
                var hasError = labels.some(label => sLabel === label);


                // Return information about the duplication
                return {
                    isDuplicate: iLabelCount > 0 && labelInfo.firstIndex !== parseInt(index),
                    error: hasError,
                    firstIndex: labelInfo.firstIndex,
                    count: iLabelCount
                };
            },

            updateRecordForOK: function (iIndex, oRecord,) {
                this._currentRecordIndex = iIndex;
                this._originalCancelData = this._originalData
                this._originalData = JSON.parse(JSON.stringify(oRecord));
            },
            _hasRecordChanged: function (oOriginalRecord, oCurrentRecord) {
                return JSON.stringify(oOriginalRecord) !== JSON.stringify(oCurrentRecord);
            },
            _hasRecordChanged: function (oOriginalRecord, oCurrentRecord) {
                return JSON.stringify(oOriginalRecord) !== JSON.stringify(oCurrentRecord);
            },
            onCancelRecord: function (index) {
                var staticModel = sap.ui.getCore().getModel("StaticFieldDetails").getProperty("/resulted/" + index);
                var dynamicModel = this.getView().getModel("ActivityFieldDetails");
                dynamicModel.setProperty("/results/" + index, JSON.parse(JSON.stringify(staticModel)));
                dynamicModel.refresh(true);
                if (this._originalData && this._originalData[index]) {
                    delete this._originalData[index];
                }
            },
            onClearToExist: function (index) {
                // var oModel = this.getView().getModel("ActivityFieldDetails");
                // var oStaticModel = sap.ui.getCore().getModel("StaticFieldDetails"); // Access the StaticFieldDetails model

                // var oStaticRecord = oStaticModel.getProperty("/resulted/" + index);
                // const deepCopyOfStaticModel = JSON.parse(JSON.stringify(oStaticRecord));

                // if (deepCopyOfStaticModel) {
                //     oModel.setProperty("/results/" + index, deepCopyOfStaticModel);
                //     oModel.refresh(true);

                //     sap.m.MessageToast.show("Changes reverted to original values.");
                // } else {
                //     sap.m.MessageToast.show("No original data found for this record.");
                // }
                var thirdPanel = sap.ui.getCore().byId('splitterWidgets2');
                if (thirdPanel) {
                    thirdPanel.destroy();
                }
            },

            onMaxLengthLiveChange: function (index, oEvent) {
                var oModel = this.getView().getModel("ActivityFieldDetails");
                var oRecord = oModel.getProperty("/results/" + index) || {};

                // Get the current maxLength/maxValue from the event (being edited)
                var sMaxLength = oEvent.getParameter("value").trim() || "";
                // Get the minLength/minValue from the model
                var sMinLength = (oRecord.minLength || oRecord.minValue || "").toString().trim();

                // Validate: Both MinLength and MaxLength must be filled or both must be empty
                if ((sMinLength && !sMaxLength) || (!sMinLength && sMaxLength)) {
                    // Set error if one is filled but not the other
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Both Min and Max length must be filled.");
                } else if (sMinLength && sMaxLength && parseInt(sMinLength) >= parseInt(sMaxLength)) {
                    // Validate: MinLength should not be greater than or equal to MaxLength
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Max length must be greater than Min length.");
                } else {
                    // Clear error state if the validation passes
                    oEvent.getSource().setValueState("None");
                }
            },

            onScrollPanelOne: function (aScrollContainerIds) {
                aScrollContainerIds.forEach(function (sId) {
                    var oScrollContainer = this.getView().byId(sId) || sap.ui.getCore().byId(sId);
                    if (oScrollContainer) {
                        var iScrollTop = oScrollContainer.getDomRef().scrollTop;
                        setTimeout(function () {
                            oScrollContainer.getDomRef().scrollTop = iScrollTop;
                        }, 0);
                    }
                }.bind(this));
            },

            onSelectDateType: function (index, oEvent) {
                var iSelectedIndex = oEvent.getParameter("selectedIndex");
                var oVBox = sap.ui.getCore().byId("manualEntryVBox");
                if (iSelectedIndex === 1) {
                    oVBox.setVisible(true);
                } else {
                    oVBox.setVisible(false);
                }
                var iSelectedIndex = oEvent.getParameter("selectedIndex");
                var sNewValue = iSelectedIndex === 0 ? "SystemDate" : "ManualEntry";
                var sPath = "/results/" + index + "/typeOfDateSelected";
                if (sNewValue === 'SystemDate') {
                    this.getView().getModel("ActivityFieldDetails").setProperty("/results/" + index + "/defaultValue", "")
                }
                this.getView().getModel("ActivityFieldDetails").setProperty(sPath, sNewValue);
                var sPath = "ActivityFieldDetails>/results/" + index + "/typeOfDateSelected";

            },

            onChangeTypeSelected: function (index, oEvent) {
                var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
                this.changeType = sSelectedKey;
                this.onCreateThirdPanel(sSelectedKey, index)
            },

            getSelectForTypeChange: function (sType) {
                const baseOptions = [
                    { text: "Input", type: "textBox" },
                    { text: "Text Area", type: "textArea" },
                    { text: "Dropdown", type: "dropdown" },
                    { text: "Check Box", type: "checkBox" },
                    { text: "Radio", type: "radio" },
                    { text: "Number", type: "number" },
                    { text: "Rating", type: "rating" },
                    { text: "Calender", type: "calendar" },
                    { text: "Dyanmic Dropdown", type: "dynamicdropdown" }
                ];

                const restrictedOptions = {
                    textBox: baseOptions,
                    textArea: baseOptions.filter(option => option.type !== "dynamicdropdown"),
                    dropdown: baseOptions.filter(option => !["dropdown", "dynamicdropdown"].includes(option.type)),
                    checkBox: baseOptions.filter(option => !["dropdown", "dynamicdropdown"].includes(option.type)),
                    radio: baseOptions.filter(option => option.type !== "dynamicdropdown"),
                    number: [{ text: "Radio", type: "radio" }],
                    rating: [{ text: "Number", type: "number" }],
                    calendar: baseOptions.filter(option => ["textBox", "textArea"].includes(option.type))
                };

                return restrictedOptions[sType] || baseOptions;
            },

            onAddField: function (index) {
                var oModel = this.getView().getModel("ActivityFieldDetails");
                var aOptions = oModel.getProperty("/results/" + index + "/options") || [];

                // Add a new option to the array
                aOptions.push({
                    displayValue: "Option " + (aOptions.length + 1),
                    value: "Option " + (aOptions.length + 1)
                });

                // Update the model
                oModel.setProperty("/results/" + index + "/options", aOptions);
            },

            // onAddField: function (index) {
            //     var oView = this.getView();
            //     var oNewFieldsContainer = oView.byId("newFieldsContainer");
            //     var oNewField = new HBox({
            //         items: [
            //             new Input({ placeholder: "Display Name", liveChange: this.onOptionLiveChange.bind(this, index) }).addStyleClass("sapUiTinyMarginEnd"),
            //             new Input({ placeholder: "Display Value", liveChange: this.onOptionLiveChange.bind(this, index) }).addStyleClass("sapUiTinyMarginBegin"),
            //             new Button({
            //                 icon: "sap-icon://delete",
            //                 type: "Transparent",
            //                 press: this.onRemoveField.bind(this, index)
            //             }).addStyleClass('sapUiTinyMarginBegin')
            //         ]
            //     }).addStyleClass("sapUiTinyMarginBottom");
            //     oNewFieldsContainer.addItem(oNewField);
            // },

            onOptionLiveChange: function (index, oEvent) {
                var oModel = this.getView().getModel("ActivityFieldDetails");
                var aOptions = oModel.getProperty("/results/" + index + "/options");

                // Get the current input value and its binding context
                var sNewValue = oEvent.getParameter("value").trim();
                var oSource = oEvent.getSource(); // The input control that triggered the event
                var sPath = oSource.getBindingContext("ActivityFieldDetails").getPath(); // Get the path of the option being edited
                var oCurrentOption = oModel.getProperty(sPath);

                // Check whether it's a displayValue or value field
                var bIsDisplayValue = oSource.getPlaceholder() === "Display Value"; // We use the placeholder to differentiate fields

                // Validate: If displayValue is filled, value should also be filled and vice versa
                if (bIsDisplayValue) {
                    oCurrentOption.displayValue = sNewValue;
                } else {
                    oCurrentOption.value = sNewValue;
                }

                // Check if both fields (displayValue and value) are correctly filled or empty
                var bDisplayValueFilled = oCurrentOption.displayValue && oCurrentOption.displayValue.trim().length > 0;
                var bValueFilled = oCurrentOption.value && oCurrentOption.value.trim().length > 0;

                if ((bDisplayValueFilled && !bValueFilled) || (!bDisplayValueFilled && bValueFilled)) {
                    // If one is filled but the other is empty, set the ValueState to "Error"
                    oSource.setValueState("Error");
                    oSource.setValueStateText("Both Display Value and Value should be filled.");
                } else {
                    // Otherwise, clear the ValueState
                    oSource.setValueState("None");
                }

                // Update the model with the modified option
                oModel.setProperty(sPath, oCurrentOption);
            },

            onRemoveField: function (index, oEvent) {
                var oSource = oEvent.getSource(); // The delete button that triggered the event
                var oHBox = oSource.getParent();  // The HBox that contains the input fields

                // Get the parent container and its index in the model
                var oNewFieldsContainer = oHBox.getParent();  // The container holding all pairs (manually added ones)
                var iFieldIndex = oNewFieldsContainer.indexOfItem(oHBox);  // Get the index of the field being deleted

                // Remove the UI element (the HBox)
                oNewFieldsContainer.removeItem(oHBox);  // Remove the HBox from the UI

                // Now update the model to remove the corresponding option
                var oView = this.getView();
                var oModel = oView.getModel("ActivityFieldDetails");
                var aOptions = oModel.getProperty("/results/" + index + "/options");

                // Check if the deleted field is part of the model (existing field) or manually added field
                if (iFieldIndex < aOptions.length) {
                    // Remove the field from the model only if it's part of the original options (existing in model)
                    aOptions.splice(iFieldIndex, 1);  // Remove the option at the index
                }

                // Update the model with the updated options array
                oModel.setProperty("/results/" + index + "/options", aOptions);
                // oModel.refresh(true);

            },



            /**
             * Handles the event when the "Last Step" button is pressed.
             * Removes the last operator or the last completed group from the expression.
             */









        });
    });