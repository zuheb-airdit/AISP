sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"

], (Controller, MessageBox) => {
    "use strict";

    return Controller.extend("com.approvalmatrix.approvalmatrixaisp.controller.ApprovalHierarchy", {
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("RouteHierarchyid").attachPatternMatched(this._onRouteMatched, this);
            this.getOwnerComponent().getRouter().getRoute("RouteHierarchu").attachPatternMatched(this._onRouteMatchedwithoutid, this);

        },

        _onRouteMatchedwithoutid: function () {
            debugger;
            let apptypeIdField = this.byId("idCompoBoxReq");
            apptypeIdField.setValue("")
            apptypeIdField.setEditable(true)
            this.byId("idCreateFooterButton").setEnabled(true)
            this.byId("entityFilter").getInnerControls()[0].setValue("")
            this.byId("idEditBtn").setVisible(false)
        },

        _onRouteMatched: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var id = oArgs.id;
            var appType = oArgs.appType;
            this.getView().setBusy(true)
            this.byId("idCreateFooterButton").setEnabled(false)
            this.byId("idEditBtn").setVisible(true)
            this.getView().getModel().read("/CompanyCodeType", {
                filters: [
                    new sap.ui.model.Filter("APPR_TYPE", sap.ui.model.FilterOperator.EQ, appType),
                    new sap.ui.model.Filter("COMPANY_CODE", sap.ui.model.FilterOperator.EQ, id)
                ],
                success: function (res) {
                    debugger;
                    let apptypeIdField = this.byId("idCompoBoxReq");
                    let apprType = res.results[0].APPR_TYPE;
                    let companyCode = res.results[0].COMPANY_CODE;
                    let title = res.results[0].TO_COMPANY_CODE.BUTXT;
                    this.byId("idTitle").setText(title)
                    this.byId("entityFilter").getInnerControls()[0].setValue(companyCode)
                    let updBtn = this.byId("idSubmtUpdate");
                    apptypeIdField.setValue(apprType);
                    apptypeIdField.setEditable(false)
                    // this.byId("idText").setText(res.results[0].TO_COMPANY_CODE.BUTXT)
                    // if (apprType == "R1") {
                    //     updBtn.setVisible(true)
                    // }
                    // this.byId("idSubBtn").setVisible(false)
                    let oModel = this.getView().getModel("hierarchydata");
                    oModel.setData({ jsonObjects: [] })
                    let oData = oModel.getData();
                    let dataArr = res.results[0].TO_HIERARCHY.results;
                    dataArr.forEach(item => {
                        oData.jsonObjects.push({
                            "approvalLevel": item.APPROVER_LEVEL,
                            "role": item.USER_ROLE,
                            "user": item.USER_ID,
                            "selected": false,
                            "checkboxVisible": item.APPR_TYPE == "R1" ? true : false,
                            "editCheckboxVisible": item.ACCESS_EDIT,
                            "approveCheckboxVisible": item.ACCESS_APPROVE,
                            "sendBackCheckboxVisible": item.ACCESS_SENDBACK,
                            "rejectCheckboxVisible": item.ACCESS_REJECT,
                            "editable": false,
                            "editablechk": false,

                        });
                    });

                    // Set the updated data back to the model
                    oModel.setData(oData);
                    this.getView().setBusy(false)
                }.bind(this),
                error: function (err) {
                    debugger;
                    this.getView().setBusy(false)

                }.bind(this)
            })

        },

        onCloseApprovalSplit: function () {
            this.getOwnerComponent().getRouter().navTo("RouteApprovalMatrix")
        },

        onPressCreateMassApprovalInputs: function () {
            let approvalType = this.byId("idCompoBoxReq").getValue();
            debugger;
            var oModel = this.getOwnerComponent().getModel("hierarchydata");
            var oData = oModel.getData();
            oData.jsonObjects.push({
                "approvalLevel": (oData.jsonObjects.length + 1).toString(),
                "role": "",
                "user": "",
                "selected": false,
                "checkboxVisible": approvalType == "Register" ? true : false,
                "editCheckboxVisible": false,
                "approveCheckboxVisible": false,
                "sendBackCheckboxVisible": false,
                "rejectCheckboxVisible": false,
                "editable": true,
                "mdmBtn": false
            });
            oModel.setData(oData);
        },

        onSelectofApproval: function (oEvent) {
            debugger;
            this.ApprovalType = true;
            var sKey = oEvent.getSource().getSelectedKey();
            let oModel = this.getOwnerComponent().getModel("hierarchydata");
            let data = oModel?.getData();
            if (this.companyCode) {
                this.byId("idCreateMassRequest").setEnabled(true)

            }
            var sKey = oEvent.getSource().getSelectedKey();
            var oTable = this.byId("idProductsTable");
            var tModel = oTable.getModel();
            var aData = oModel.getProperty("/jsonObjects");
            data.jsonObjects.forEach(function (item) {
                if (sKey === "R0") {
                    item.checkboxVisible = false;
                } else if (sKey === "R1") {
                    item.checkboxVisible = true;
                }
            });

            oModel.setData(data)
            debugger
        },

        onValueHelpRequested: function (oEvent) {
            var oInput = oEvent.getSource();
            this._inputFieldUser = oInput;
            var oRowContext = oInput.getBindingContext("hierarchydata");
            var oView = this.getView();
            var sSelectedRole = oRowContext.getObject().role;
            var sCompanyCode = this.byId("entityFilter").getInnerControls()[0].getValue();
            if (!sSelectedRole || !sCompanyCode) {
                MessageBox.error("Please select a valid Role and Company Code first.");
                return;
            }
            var aFilters = [
                new sap.ui.model.Filter("USER_ROLE", sap.ui.model.FilterOperator.EQ, sSelectedRole),
                new sap.ui.model.Filter("COMPANY_CODE", sap.ui.model.FilterOperator.EQ, sCompanyCode)
            ];
            if (!this._oValueHelpDialog) {
                this.loadFragment({
                    name: "com.approvalmatrix.approvalmatrixaisp.fragments.Roles"
                }).then(function (oDialog) {
                    this._oValueHelpDialog = oDialog;
                    oView.addDependent(oDialog);

                    // Get FilterBar from the dialog
                    var oFilterBar = oDialog.getFilterBar();
                    this._oBasicSearchField = new sap.m.SearchField();

                    // Configure FilterBar
                    oFilterBar.setFilterBarExpanded(false);
                    oFilterBar.setBasicSearch(this._oBasicSearchField);

                    this._oBasicSearchField.attachSearch(function () {
                        oFilterBar.search();
                    });

                    // Bind table with user data and apply filters
                    oDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(oView.getModel()); // Set your OData model

                        if (oTable.bindRows) {
                            oTable.bindAggregation("rows", {
                                path: "/VMUsers", // Path to User entity
                                filters: aFilters, // Apply Role & Company Code Filters
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Add columns dynamically
                            oTable.addColumn(new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "User ID" }),
                                template: new sap.m.Text({ text: "{USER_ID}" })
                            }));

                            oTable.addColumn(new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "User Name" }),
                                template: new sap.m.Text({ text: "{USER_NAME}" })
                            }));
                        }

                        if (oTable.bindItems) {
                            oTable.bindAggregation("items", {
                                path: "/VMUsers",
                                filters: aFilters,
                                template: new sap.m.ColumnListItem({
                                    cells: [
                                        new sap.m.Label({ text: "{USER_ID}" }),
                                        new sap.m.Label({ text: "{USER_NAME}" })
                                    ]
                                }),
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            oTable.addColumn(new sap.m.Column({ header: new sap.m.Label({ text: "User ID" }) }));
                            oTable.addColumn(new sap.m.Column({ header: new sap.m.Label({ text: "User Name" }) }));
                        }

                        oDialog.update();
                    }.bind(this));

                    // Open the dialog
                    oDialog.open();
                }.bind(this));
            } else {
                // Apply Filters to existing dialog
                var oTable = this._oValueHelpDialog.getTable();
                oTable.getBinding("rows").filter(aFilters);
                oTable.getBinding("items").filter(aFilters);
                this._oValueHelpDialog.open();
            }
        },


        onValueHelpOkPress: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            var sPath = this._inputFieldRole.getBindingContext("hierarchydata").getPath();
            if (aTokens.length > 0) {
                var sSelectedUser = aTokens[0].getText(); // Get selected user value
                this.getView().byId("idRoleInput").setValue(sSelectedUser); // Set value in input field
                this.getView().getModel("hierarchydata").setProperty(sPath + "/role", sSelectedUser);

            }
            this._oValueHelpDialog.close();
        },

        onValueHelpCancelPress: function () {
            this._oValueHelpDialog.close();
        },

        onValueHelpAfterClose: function () {
            this._oValueHelpDialog.destroy();
            this._oValueHelpDialog = null;
        },

        onValueHelpRole: function (oEvent) {
            debugger;
            var oInput = oEvent.getSource(); // Get the input field that triggered the event
            this._inputFieldRole = oInput;

            var oView = this.getView();

            // Load the ValueHelpDialog Fragment
            if (!this._oValueHelpDialog) {
                this.loadFragment({
                    name: "com.approvalmatrix.approvalmatrixaisp.fragments.UserRole"
                }).then(function (oDialog) {
                    this._oValueHelpDialog = oDialog;
                    oView.addDependent(oDialog);

                    // Bind the dialog to UserRole model
                    oDialog.getTableAsync().then(function (oTable) {
                        oTable.setModel(oView.getModel()); // Set the model

                        if (oTable.bindRows) {
                            oTable.bindAggregation("rows", {
                                path: "/UserRole",
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });

                            // Add columns dynamically
                            oTable.addColumn(new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Role ID" }),
                                template: new sap.m.Text({ text: "{CODE}" })
                            }));

                            oTable.addColumn(new sap.ui.table.Column({
                                label: new sap.m.Label({ text: "Role Description" }),
                                template: new sap.m.Text({ text: "{DESCRIPTION}" })
                            }));
                        }

                        oDialog.update();
                    }.bind(this));

                    oDialog.open();
                }.bind(this));
            } else {
                this._oValueHelpDialog.open();
            }
        },

        // Handle user selection from Value Help
        onValueHelpOkPressRoles: function (oEvent) {
            debugger;
            // let model = this.getView().getModel("hierarchydata");
            var sPath = this._inputFieldUser.getBindingContext("hierarchydata").getPath();
            var aTokens = oEvent.getParameter("tokens");
            if (aTokens.length > 0) {
                var sSelectedRole = aTokens[0].getText(); // Get selected role
                this.getOwnerComponent().getModel("hierarchydata").setProperty(sPath + "/user", sSelectedRole);
            }
            this._oValueHelpDialog.close();
        },

        onValueHelpCancelPress: function () {
            this._oValueHelpDialog.close();
        },

        onValueHelpAfterClose: function () {
            this._oValueHelpDialog.destroy();
            this._oValueHelpDialog = null;
        },

        onFooterCreatePress: function () {
            debugger;
            var oView = this.getView();
            var oModel = oView.getModel(); // Get default OData v4 model
            var sApprovalType = oView.byId("idCompoBoxReq").getSelectedKey();
            var sCompanyCode = this.byId("entityFilter").getInnerControls()[0].getValue();
        
            // Validate inputs
            if (!sApprovalType || !sCompanyCode) {
                MessageBox.error("Please select a valid Approval Type and Company Code.");
                return;
            }
        
            // Get Approval Data from Table Model
            var aApprovalData = this.getOwnerComponent().getModel("hierarchydata").getProperty("/jsonObjects");
        
            // **Validation: Check if any user or role is missing**
            var bInvalidEntry = aApprovalData.some(function (item) {
                return !item.user || !item.role; // If user or role is empty, return true
            });
        
            if (bInvalidEntry) {
                MessageBox.error("Please enter Role and User for all rows before proceeding.");
                return;
            }
        
            // Construct payload
            var aFormattedData = aApprovalData.map(function (item) {
                var oPayload = {
                    "APPR_TYPE": sApprovalType,
                    "COMPANY_CODE": sCompanyCode,
                    "USER_ID": item.user,
                    "USER_ROLE": item.role,
                    "APPROVER_LEVEL": Number(item.approvalLevel)
                };
        
                // If Registration (R1), add extra fields
                if (sApprovalType === "R1") {
                    oPayload["ACCESS_EDIT"] = item.editCheckboxVisible;
                    oPayload["ACCESS_APPROVE"] = item.approveCheckboxVisible;
                    oPayload["ACCESS_SENDBACK"] = item.sendBackCheckboxVisible;
                    oPayload["ACCESS_REJECT"] = item.rejectCheckboxVisible;
                }
        
                return oPayload;
            });
        
            var oPostData = {
                "ApprovalData": aFormattedData
            };
        
            // Set busy state before API call
            oView.setBusy(true);
        
            if (this.editableData === true) {
                // Perform UPDATE request
                var sUpdateUrl = "/UpdateApprovalHierarchy";
        
                oModel.create(sUpdateUrl, oPostData, {
                    success: function () {
                        oView.setBusy(false);
                        MessageBox.success("Approval Hierarchy Updated Successfully!");
                        this.getOwnerComponent().getRouter().navTo("RouteApprovalMatrix");
                    }.bind(this),
                    error: function (oError) {
                        oView.setBusy(false);
                        var sErrorMessage = "Failed to update approval hierarchy.";
                        try {
                            var oErrorResponse = JSON.parse(oError.responseText);
                            if (oErrorResponse.error && oErrorResponse.error.message && oErrorResponse.error.message.value) {
                                sErrorMessage = oErrorResponse.error.message.value; // Extract error message
                            }
                        } catch (e) {
                            console.error("Error parsing responseText:", e);
                        }
                        MessageBox.error(sErrorMessage);
                    }.bind(this)
                });
        
            } else {
                // Perform CREATE request
                var sCreateUrl = "/CreateApprovalHierarchy";
        
                oModel.create(sCreateUrl, oPostData, {
                    success: function () {
                        oView.setBusy(false);
                        MessageBox.success("Approval Hierarchy Created Successfully!");
                        this.getOwnerComponent().getRouter().navTo("RouteApprovalMatrix");
                    }.bind(this),
                    error: function (oError) {
                        oView.setBusy(false);
                        var sErrorMessage = "Failed to create approval hierarchy.";
                        try {
                            var oErrorResponse = JSON.parse(oError.responseText);
                            if (oErrorResponse.error && oErrorResponse.error.message && oErrorResponse.error.message.value) {
                                sErrorMessage = oErrorResponse.error.message.value; // Extract error message
                            }
                        } catch (e) {
                            console.error("Error parsing responseText:", e);
                        }
                        MessageBox.error(sErrorMessage);
                    }.bind(this)
                });
            }
        },
        


        onPressDeleteSelectedRows: function (oEvent) {
            let oTable = this.byId("idProductsTable"); // Get the Table reference
            let oModel = this.getView().getModel("hierarchydata"); // Get the JSON model
            let aSelectedContexts = oTable.getSelectedContexts(); // Get selected rows
            let oDataModel = this.getView().getModel(); // OData Model

            if (aSelectedContexts.length === 0) {
                sap.m.MessageToast.show("Please select a record to delete.");
                return;
            }

            // Extract data from the selected row
            let oSelectedData = aSelectedContexts[0].getObject();
            let sCompanyCode = this.byId("entityFilter").getInnerControls()[0].getValue();
            let sApprovalType = this.byId("idCompoBoxReq").getValue();

            // Construct payload for deletion API
            let oPayload = {
                "USER_ID": oSelectedData.user,
                "APPR_TYPE": sApprovalType,
                "COMPANY_CODE": sCompanyCode,
                "APPROVER_LEVEL": oSelectedData.approvalLevel
            };

            // Set busy state before API call
            oTable.setBusy(true);

            oDataModel.create("/DeleteApprovalHierarchy", oPayload, {
                success: function (res) {
                    MessageBox.success("User Deleted Successfully!");
                    oModel.updateBindings(true);

                    // Remove selections after delete
                    oTable.removeSelections();

                    // Ensure UI updates
                    let oBinding = oTable.getBinding("items");
                    if (oBinding) {
                        oBinding.refresh(true);  // Refresh data
                    }

                    // Remove busy state
                    oTable.setBusy(false);
                    this.getOwnerComponent().getRouter().navTo("RouteApprovalMatrix")

                }.bind(this),
                error: function (err) {
                    MessageBox.error("Unable to delete User!");
                    oTable.setBusy(false);
                }
            });
        },

        onEditApproval: function (oEvent) {
            debugger;
            this.editableData = !this.editableData;
            let oModel = this.getOwnerComponent().getModel("hierarchydata");
            let data = oModel.getData();
            data.jsonObjects.forEach((ele) => {
                ele.editablechk = !ele.editablechk;
            });

            oModel.setData(data);
            this.byId("idCreateFooterButton").setEnabled(this.editableData);
        }











    });
});