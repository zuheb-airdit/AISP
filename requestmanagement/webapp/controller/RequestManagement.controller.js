sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment"
], (Controller,Fragment) => {
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

        onCloseReqManagement: function(){
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

        onValueHelpSubVendorFrag: function () {
            debugger;
            let oView = this.getView();
        
            // Check if the dialog already exists
            if (!this._oValueHelpDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.requestmanagement.requestmanagement.fragments.vendorType", // Replace with actual path
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
        
        
        onValueHelpOkPressRoles: function (oEvent) {
            debugger;
            let aSelectedContexts = oEvent.getParameter("tokens");
            if (aSelectedContexts.length) {
                let oSelectedItem = aSelectedContexts[0].data(); // Assuming single selection
                let sSelectedKey = oSelectedItem.key;
                let sSelectedText = oSelectedItem.text;
        
                // Set the selected value to the respective input field
                this.getView().byId("idSubVendorTypes").setValue(sSelectedText);
            }
            this._oValueHelpDialog.close();
        },
        
        onValueHelpCancelPress: function () {
            debugger;
            this._oValueHelpDialog.close();
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
        }
        
    
    });
});