sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/BusyDialog",
    "sap/ui/model/json/JSONModel"
], (Controller, Fragment, MessageBox, BusyDialog, JSONModel) => {
    "use strict";

    return Controller.extend("com.requestmanagement.requestmanagement.controller.RequestManagement", {
        onInit() {
        },

        statusFormatter: function (status) {
            switch (status) {
                case 15:
                    return "Not Invited"
                case 16:
                    return "Invited"
                case 2:
                    return "In ReqApproval"

                case 3:
                    return "Rejected"
                case 7:
                    return "SendBack"
                default:
                    return "No Data"
            }
        },
        statusColorFormatter: function (status) {
            switch (status) {
                case 15:
                    return "Indication13"
                case 2:
                    return "Indication14"
                case 16:
                    return "Indication14"
                case 3:
                    return "Indication11"
                case 7:
                    return "Indication15"
                default:
                    return "None"
            }
        },

        onCreateRquestManagement: function () {
            if (!this.vhFragmentReqManagement) {
                this.vhFragmentReqManagement = sap.ui.xmlfragment("com.requestmanagement.requestmanagement.fragments.createRequestManagement", this);
                this.getView().addDependent(this.vhFragmentReqManagement);
            }
            this.vhFragmentReqManagement.open();
        },

        onCloseReqManagement: function () {
            this.vhFragmentReqManagement.close();
        },

        onSumbitReqManagement: function () {
            debugger;
            this.getView().setBusy(true);
            this.vhFragmentReqManagement.close();
            let reqModel = this.getView().getModel("request-process");
            let reqType = sap.ui.getCore().byId("idReqType").getSelectedKey();
            let companyCode = sap.ui.getCore().byId("idVendorEntity").getSelectedKeys().join(",");
            let vendorName = sap.ui.getCore().byId("idVendorName").getValue();
            let vendorType = sap.ui.getCore().byId("idVendorTypes").getValue();
            let venderEmail = sap.ui.getCore().byId("idVendorEmail").getValue();
            let vendorSubType = sap.ui.getCore().byId("idSubVendorTypes").getValue();
            let comment = sap.ui.getCore().byId("idTextArea").getValue();
            let suplType = vendorSubType.split("-")[0];
            let suplDescr = vendorSubType.split("-")[1];
            let bpType = vendorType.split("-")[0];
            let byDesc = vendorType.split("-")[1];
            debugger;
            let payload = {
                action: "CREATE",
                inputData: [
                    {
                        REGISTERED_ID: venderEmail,
                        COMPANY_CODE: companyCode,
                        VENDOR_NAME1: vendorName,
                        SUPPL_TYPE_DESC: suplDescr,
                        SUPPL_TYPE: suplType,
                        BP_TYPE_CODE: bpType,
                        BP_TYPE_DESC: byDesc,
                        REQUEST_TYPE: reqType,
                        COMMENT: comment,
                        REQUESTER_ID: "vai@gmail.com"
                    }
                ]
            };

            reqModel.create("/RequestProcess", payload, {
                success: function (oData) {
                    debugger;
                    this.getView().setBusy(false);
                    MessageBox.success("Request Sent SuccesFully!");
                    this.getView().byId("idSmartTableReqManagementInvidted").rebindTable();
                    sap.ui.getCore().byId("idReqType").setValue([]);
                    sap.ui.getCore().byId("idVendorEntity").setValue([]);
                    sap.ui.getCore().byId("idVendorName").setValue("");
                    sap.ui.getCore().byId("idVendorTypes").setValue("");
                    sap.ui.getCore().byId("idVendorEmail").setValue("");
                    sap.ui.getCore().byId("idSubVendorTypes").setValue("");
                    sap.ui.getCore().byId("idTextArea").setValue("");
                    // var oSmartTableNotInvited = this.byId("idSmartTableReqManagementInvidted");
                    // oSmartTableNotInvited.rebindTable()
                }.bind(this),
                error: function (oError) {
                    const jsonResponse = JSON.parse(oError.responseText);
                    const errorMessage = jsonResponse.error.message.value;
                    this.getView().setBusy(false);
                    sap.m.MessageBox.error(errorMessage);
                }.bind(this)
            });


        },

        onNotInvitedFilter: function (oEvent) {
            debugger
            let oBindingParams = oEvent.getParameter("bindingParams");
            var oFilter = new sap.ui.model.Filter("STATUS", "EQ", 15)
            oBindingParams.filters.push(oFilter);
            oBindingParams.events = {
                dataReceived: function (oData) {
                    let iCount = oData.getParameter("data").results.length;
                    // this.getView().getModel("countsModel").setProperty("/notInvitedCount", iCount);
                }.bind(this)
            };
        },

        onInvitedFiltertest: function (oEvent) {
            debugger;
            let oBindingParams = oEvent.getParameter("bindingParams");
            let oFilter = new sap.ui.model.Filter("STATUS", "EQ", 16)
            oBindingParams.filters.push(oFilter);
            oBindingParams.events = {
                dataReceived: function (oData) {
                    let iCount = oData.getParameter("data").results.length;
                    // this.getView().getModel("countsModel").setProperty("/invitedCount", iCount);
                }.bind(this)
            };
        },

        onRebindSmartTableReject: function (oEvent) {
            let oBindingParams = oEvent.getParameter("bindingParams");
            var filter = new sap.ui.model.Filter("STATUS", "EQ", "3")
            oBindingParams.filters.push(filter);
            oBindingParams.events = {
                dataReceived: function (oData) {
                    var iCount = oData.getParameter("data").results.length;
                    // this.getView().getModel("countsModel").setProperty("/rejectedCount", iCount);
                }.bind(this)
            };
        },

        onRebindSmartTableSendBack: function (oEvent) {
            let oBindingParams = oEvent.getParameter("bindingParams");
            var oFilter = new sap.ui.model.Filter("STATUS", "EQ", "7")
            oBindingParams.filters.push(oFilter);
            oBindingParams.events = {
                dataReceived: function (oData) {
                    let iCount = oData.getParameter("data").results.length;
                    // this.getView().getModel("countsModel").setProperty("/sendBackCount", iCount);
                }.bind(this)
            };
        },

        onRegisterFilter: function (oEvent) {
            let oBindingParams = oEvent.getParameter("bindingParams");
            let oFilter = new sap.ui.model.Filter("STATUS", "EQ", 5)
            oBindingParams.filters.push(oFilter);
            oBindingParams.events = {
                dataReceived: function (oData) {
                    let iCount = oData.getParameter("data").results.length;
                    // this.getView().getModel("countsModel").setProperty("/registeredCount", iCount);
                }.bind(this)
            };
        },

        onValueHelpVendorFrag: function () {
            debugger;
            let oView = this.getView();

            // Check if the dialog already exists
            if (!this._oValueHelpDialog1) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.requestmanagement.requestmanagement.fragments.vendorType", // Replace with actual path
                    controller: this
                }).then(function (oDialog) {
                    this._oValueHelpDialog1 = oDialog;
                    oView.addDependent(this._oValueHelpDialog1);

                    // Bind data after dialog is loaded
                    this._bindVendorTypeData1(oDialog);

                    oDialog.open();
                }.bind(this));
            } else {
                this._bindVendorTypeData(this._oValueHelpDialog1);
                this._oValueHelpDialog1.open();
            }
        },

        _bindVendorTypeData1: function (oDialog) {
            debugger;
            let oModel = this.getView().getModel("request-process"); // Get the model
            oDialog.setModel(oModel); // Set model to the dialog

            oDialog.getTableAsync().then(function (oTable) {
                oTable.setModel(oModel); // Set model to the table

                if (oTable.bindRows) {
                    oTable.bindAggregation("rows", {
                        path: "/Vendor_Sub_Type",
                        events: {
                            dataReceived: function () {
                                oDialog.update();
                            }
                        }
                    });

                    // Add columns dynamically if they don't already exist
                    if (oTable.getColumns().length === 0) {
                        oTable.addColumn(new sap.ui.table.Column({
                            label: new sap.m.Label({ text: "Language (SPRAS)" }),
                            template: new sap.m.Text({ text: "{SPRAS}" })
                        }));

                        oTable.addColumn(new sap.ui.table.Column({
                            label: new sap.m.Label({ text: "Description (TEXT40)" }),
                            template: new sap.m.Text({ text: "{TEXT40}" })
                        }));
                    }
                }

                oDialog.update();
            }.bind(this));
        },

        onValueHelpSubVendorFrag: function () {
            debugger;
            let oView = this.getView();

            // Check if the dialog already exists
            if (!this._oValueHelpDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.requestmanagement.requestmanagement.fragments.SubvendorType", // Replace with actual path
                    controller: this
                }).then(function (oDialog) {
                    this._oValueHelpDialog = oDialog;
                    oView.addDependent(this._oValueHelpDialog);

                    // Bind data after dialog is loaded
                    this._bindVendorTypeData(oDialog);

                    oDialog.open();
                }.bind(this));
            } else {
                this._bindVendorTypeData(this._oValueHelpDialog);
                this._oValueHelpDialog.open();
            }
        },

        _bindVendorTypeData: function (oDialog) {
            debugger;
            let oModel = this.getView().getModel("request-process"); // Get the model
            oDialog.setModel(oModel); // Set model to the dialog

            oDialog.getTableAsync().then(function (oTable) {
                oTable.setModel(oModel); // Set model to the table

                if (oTable.bindRows) {
                    oTable.bindAggregation("rows", {
                        path: "/Vendor_Type",
                        events: {
                            dataReceived: function () {
                                oDialog.update();
                            }
                        }
                    });

                    // Add columns dynamically if they don't already exist
                    if (oTable.getColumns().length === 0) {
                        oTable.addColumn(new sap.ui.table.Column({
                            label: new sap.m.Label({ text: "Language (SPRAS)" }),
                            template: new sap.m.Text({ text: "{SPRAS}" })
                        }));

                        oTable.addColumn(new sap.ui.table.Column({
                            label: new sap.m.Label({ text: "Description (TXT30)" }),
                            template: new sap.m.Text({ text: "{TXT30}" })
                        }));
                    }
                }

                oDialog.update();
            }.bind(this));
        },

        onValueHelpOkPressRolesVendor: function (oEvent) {
            debugger;
            let aSelectedContexts = oEvent.getParameter("tokens");
            if (aSelectedContexts.length) {
                let oSelectedItem = aSelectedContexts[0].data(); // Assuming single selection
                let sSelectedKey = oSelectedItem.row.SPRAS;
                let sSelectedText = oSelectedItem.row.TEXT40;

                // Set the selected value to the respective input field
                sap.ui.getCore().byId("idVendorTypes").setValue(`${sSelectedKey} - ${sSelectedText}`);
            }
            this._oValueHelpDialog1.close();
        },


        onValueHelpOkPressRoles: function (oEvent) {
            debugger;
            let aSelectedContexts = oEvent.getParameter("tokens");
            if (aSelectedContexts.length) {
                let oSelectedItem = aSelectedContexts[0].data(); // Assuming single selection
                let sSelectedKey = oSelectedItem.row.SPRAS;
                let sSelectedText = oSelectedItem.row.TXT30;

                // Set the selected value to the respective input field
                sap.ui.getCore().byId("idSubVendorTypes").setValue(`${sSelectedKey} - ${sSelectedText}`);
            }
            this._oValueHelpDialog.close();
        },

        onValueHelpCancelPress: function () {
            debugger;
            this._oValueHelpDialog.close();
        },

        onValueHelpCancelPressVendor: function () {
            debugger;
            this._oValueHelpDialog1.close();
        },

        onValueHelpAfterClose: function () {
            debugger;
            this._oValueHelpDialog.destroy();
            this._oValueHelpDialog = null;
        },

        onFilterBarSearch: function (oEvent) {
            debugger;
            let oFilterData = oEvent.getSource().getFilterData();
            console.log("Filter Data:", oFilterData);

            // Implement filter logic as needed
        },

        onSubmitReqManagement: function (oEvent) {
            debugger;

            // Create busy dialog
            const oBusyDialog = new BusyDialog({
                text: "Submitting request...",
                title: "Processing"
            });

            const sRequestType = sap.ui.getCore().byId("idReqType").getSelectedKey();
            const aCompanyCodes = sap.ui.getCore().byId("idVendorEntity").getSelectedKeys();
            const sVendorName = sap.ui.getCore().byId("idVendorName").getValue();
            const sVendorEmail = sap.ui.getCore().byId("idVendorEmail").getValue();
            const sVendorType = sap.ui.getCore().byId("idVendorTypes").getValue().split("-")[0].trim();
            const sVendorTypeDesc = sap.ui.getCore().byId("idVendorTypes").getValue().split("-")[1].trim();
            const sVendorSubType = sap.ui.getCore().byId("idSubVendorTypes").getValue().split("-")[0].trim();
            const sVendorSubTypeDesc = sap.ui.getCore().byId("idSubVendorTypes").getValue().split("-")[1].trim();
            const sComment = sap.ui.getCore().byId("idTextArea").getValue();

            if (!sVendorName || !sVendorEmail || !aCompanyCodes.length) {
                MessageToast.show("Please fill all required fields");
                return;
            }

            // Join company codes into a single comma-separated string
            const sCompanyCodesString = aCompanyCodes.join(",");

            // Prepare payload
            const oPayload = {
                action: "CREATE",
                inputData: [{
                    REGISTERED_ID: sVendorEmail,
                    VENDOR_NAME1: sVendorName,
                    COMPANY_CODE: sCompanyCodesString,
                    SUPPL_TYPE_DESC: sVendorTypeDesc,
                    SUPPL_TYPE: sVendorType,
                    BP_TYPE_CODE: sVendorSubType,
                    BP_TYPE_DESC: sVendorSubTypeDesc,
                    REQUEST_TYPE: sRequestType,
                    COMMENT: sComment,
                    REQUESTER_ID: "vai@gmail.com"
                }]
            };

            // Get the OData model
            const oModel = this.getView().getModel();

            // Show busy dialog before request
            oBusyDialog.open();

            // Make the POST request
            oModel.create("/RequestProcess", oPayload, {
                success: function (oData, oResponse) {
                    // Close busy dialog first
                    oBusyDialog.close();
                    sap.ui.getCore().byId("idReqType").setSelectedKey("");
                    sap.ui.getCore().byId("idVendorEntity").setSelectedKeys([]);
                    sap.ui.getCore().byId("idVendorName").setValue("");
                    sap.ui.getCore().byId("idVendorEmail").setValue("");
                    sap.ui.getCore().byId("idVendorTypes").setValue("");
                    sap.ui.getCore().byId("idSubVendorTypes").setValue("");
                    sap.ui.getCore().byId("idTextArea").setValue("");
                    MessageBox.success("Request created successfully");
                    this.vhFragmentReqManagement.close();
                }.bind(this),  // Bind this to maintain controller context
                error: function (oError) {
                    // Close busy dialog on error too
                    oBusyDialog.close();
                    this.vhFragmentReqManagement.close();
                    let sMessage = "Error submitting request";
                    try {
                        const oResponse = JSON.parse(oError.responseText);
                        sMessage = oResponse.error?.message || sMessage;
                    } catch (e) {
                        // Handle parsing error
                    }
                    MessageBox.error(sMessage);
                }.bind(this)  // Bind this to maintain controller context
            });
        },

        onIconTabBarSelect: function (oEvent) {
            const oIconTabBar = oEvent.getSource();
            const sSelectedKey = oEvent.getParameter("key");
            let oSmartTable;

            // Get the appropriate SmartTable based on selected key
            switch (sSelectedKey) {
                case "NotInvited":
                    oSmartTable = this.byId("idSmartTableReqManagementInvidted");
                    // this.onNotInvitedFilter(oEvent, oSmartTable);
                    oSmartTable.rebindTable();
                    break;
                case "Invited":
                    oSmartTable = this.byId("idSmartTableReqManagementInvited");
                    oSmartTable.rebindTable();
                    break;
                case "Rejected":
                    oSmartTable = this.byId("idSmartTableReqManagementReject");
                    oSmartTable.rebindTable();
                    break;
                case "SendBack":
                    oSmartTable = this.byId("idSmartTableSendback");
                    oSmartTable.rebindTable();
                    break;
                case "Registered":
                    oSmartTable = this.byId("idSmartTableReqManagementRegisterd");
                    oSmartTable.rebindTable();
                    break;
                default:
                    return;
            }

            // Ensure the table rebinds
            if (oSmartTable) {
                oSmartTable.rebindTable();
            }
        },

        onInviteRquestManagement: function () {
            var oModel = this.getOwnerComponent().getModel(); // OData model

            // Fetch CompanyCode data
            oModel.read("/CompanyCode", {
                success: function (oData) {
                    var oCompanyModel = new JSONModel(oData.results);
                    this.getView().setModel(oCompanyModel, "companyModel");

                    // Load the fragment
                    if (!this._oDialog) {
                        Fragment.load({
                            id: this.getView().getId(),
                            name: "com.requestmanagement.requestmanagement.fragments.CompanyCodeRequestTypeDialog",
                            controller: this
                        }).then(function (oDialog) {
                            this._oDialog = oDialog;
                            this.getView().addDependent(this._oDialog);
                            this._oDialog.bindElement({
                                path: "/CompanyCode"
                            });
                            this._oDialog.open();
                        }.bind(this));
                    } else {
                        this._oDialog.open();
                    }
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching CompanyCode data:", oError);
                    MessageBox.error("Failed to load company codes. Please try again.");
                }
            });

        },

        onProceedWithRequest: function () {
            debugger;
            var oCompanyCodeSelect = this.byId("companyCodeSelect");
            var sCompanyCode = oCompanyCodeSelect.getSelectedKey();
            var sRequestType = "Create User"; // Fixed as per requirement

            if (!sCompanyCode) {
                MessageBox.error("Please select a company code.");
                return;
            }

            // Navigate to the Registrationform route with parameters
            this.getOwnerComponent().getRouter().navTo("Registrationform", {
                companyCode: sCompanyCode,
                requestType: sRequestType
            });

            this._oDialog.close();
        },

        onCancelDialog: function () {
            this._oDialog.close();
        },

        onAfterCloseDialog: function () {
            if (this._oDialog) {
                this._oDialog.destroy();
                this._oDialog = null;
            }
        },


    });
});