sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"

], (Controller, MessageBox) => {
    "use strict";

    return Controller.extend("com.approvalmatrix.approvalmatrixaisp.controller.ApprovalHierarchy", {
        onInit() {
            this.editableData = false;
            this.getOwnerComponent().getRouter().getRoute("RouteHierarchyid").attachPatternMatched(this._onRouteMatched, this);
            this.getOwnerComponent().getRouter().getRoute("RouteHierarchu").attachPatternMatched(this._onRouteMatchedwithoutid, this);

        },
        onBeforeRendering: function () {
            this.editableData = false;
            let oButton = this.byId("idEditBtn");
            if (oButton) {
                oButton.setText("Edit");
            }
            let submitBtn = this.byId("idCreateFooterButton");
            if (submitBtn) {
                submitBtn.setText("Create");
                submitBtn.setEnabled(false);
            }
        },

        _onRouteMatchedwithoutid: function () {
            debugger;
            let apptypeIdField = this.byId("idCompoBoxReq");
            apptypeIdField.setValue("")
            apptypeIdField.setEditable(true)
            this.byId("entityFilter").getInnerControls()[0].setValue("").setEditable(true)
            this.byId("idCreateFooterButton").setEnabled(true)
            this.byId("idEditBtn").setVisible(false)
            this.byId("idCreateMassRequest").setEnabled(true)
            this.byId("idDeleteBtmApprovalRow").setEnabled(true)
        },

        _onRouteMatched: function (oEvent) {
            debugger;
            var oArgs = oEvent.getParameter("arguments");
            var id = oArgs.id;
            var appType = oArgs.appType;
            this.getView().setBusy(true)
            this.byId("idCreateFooterButton").setEnabled(false)
            this.byId("idEditBtn").setVisible(true)
            this.byId("idCreateMassRequest").setEnabled(false)
            this.byId("idDeleteBtmApprovalRow").setEnabled(false)
            this.getView().getModel().read("/CompanyCodeType", {
                filters: [
                    new sap.ui.model.Filter("APPR_TYPE", sap.ui.model.FilterOperator.EQ, appType),
                    new sap.ui.model.Filter("COMPANY_CODE", sap.ui.model.FilterOperator.EQ, id),
                ],
                success: function (res) {
                    debugger;
                    let apptypeIdField = this.byId("idCompoBoxReq");
                    let apprType = res.results[0].APPR_TYPE;
                    let companyCode = res.results[0].COMPANY_CODE;
                    let desc = res.results[0].TO_APPR_TYPE.DESC;
                    let title = res.results[0].TO_COMPANY_CODE.BUTXT;
                    this.byId("idTitle").setText(title)

                    this.byId("entityFilter").getInnerControls()[0].setValue(companyCode).setEditable(false)

                    // const oSmartField = this.byId("entityFilter");
                    // const oParent = oSmartField.getParent();
                    // oSmartField.getInnerControls()[0].setValue(companyCode)

                    // oSmartField.setVisible(false);

                    // if (!this._oEntityInput) {
                    //     this._oEntityInput = new sap.m.Input("entityFilter_readonly", {
                    //         editable: false
                    //     });
                    //     oParent.addItem(this._oEntityInput);
                    // }

                    // set / update its value
                    // this._oEntityInput.setValue(companyCode);

                    let updBtn = this.byId("idSubmtUpdate");
                    apptypeIdField.setValue(apprType + `-` + desc);
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
                            "checkboxVisible": true,
                            "editCheckboxVisible": item.APPR_TYPE == "R1" ? true : false,
                            // "approveCheckboxVisible": item.APPR_TYPE == "FIC" || item.APPR_TYPE == "FIC_NonPo" || item.APPR_TYPE == "R1" ? true : false,
                            "approveCheckboxVisible": true,
                            "sendBackCheckboxVisible": item.APPR_TYPE == "R1" ? true : false,
                            // "rejectCheckboxVisible": item.APPR_TYPE == "FIC" || item.APPR_TYPE == "FIC_NonPo" || item.APPR_TYPE == "R1" ? true : false,
                            "rejectCheckboxVisible": true,
                            "editCheckboxSelected": item.ACCESS_EDIT,
                            "approveCheckboxSelected": item.ACCESS_APPROVE,
                            "sendBackCheckboxSelected": item.ACCESS_SENDBACK,
                            "rejectCheckboxSelected": item.ACCESS_REJECT,
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
            debugger;
            var sCompanyCode = this.byId("entityFilter").getInnerControls()[0].getValue();
            var sApprovalType = this.byId("idCompoBoxReq").getValue().split('-')[0]?.trim();
            var sApprovalTypeText = this.byId("idCompoBoxReq").getValue();

            var approvalType = (sApprovalType !== "" ? sApprovalType : sApprovalTypeText)
            // let approvalType = this.byId("idCompoBoxReq").getSelectedKey();
            var oModel = this.getOwnerComponent().getModel("hierarchydata");
            var oData = oModel.getData();
            debugger;

            if (!sCompanyCode || !approvalType) {
                MessageBox.error("Please select a valid Approval Type and Company Code first.");
                return;
            }

            const defaultState = {
                //visibilty
                editCheckboxVisible: false,
                approveCheckboxVisible: false,
                sendBackCheckboxVisible: false,
                rejectCheckboxVisible: false,
                //Selected
                editCheckboxSelected: false,
                approveCheckboxSelected: false,
                sendBackCheckboxSelected: false,
                rejectCheckboxSelected: false,
            };

            const state = { ...defaultState };

            if (approvalType === "Request" ||
                approvalType === "R0") {
                state.approveCheckboxVisible = false;
                state.rejectCheckboxVisible = false;
                state.editCheckboxVisible = false;
                state.sendBackCheckboxVisible = false;
            } else if (approvalType === "Registration" || approvalType === "R1") {
                state.approveCheckboxVisible = true;
                state.rejectCheckboxVisible = true;
                state.editCheckboxVisible = true;
                state.sendBackCheckboxVisible = true;
            } else {
                state.approveCheckboxVisible = true;
                state.rejectCheckboxVisible = true;
            }

            oData.jsonObjects.push({
                "approvalLevel": (oData.jsonObjects.length + 1).toString(),
                "role": "",
                "user": "",
                "selected": false,
                "checkboxVisible": true,
                "editCheckboxVisible": state.editCheckboxVisible,
                "approveCheckboxVisible": state.approveCheckboxVisible,
                "sendBackCheckboxVisible": state.sendBackCheckboxVisible,
                "rejectCheckboxVisible": state.rejectCheckboxVisible,
                "editCheckboxSelected": state.editCheckboxSelected,
                "approveCheckboxSelected": state.approveCheckboxSelected,
                "sendBackCheckboxSelected": state.sendBackCheckboxSelected,
                "rejectCheckboxSelected": state.rejectCheckboxSelected,
                "editable": true,
                "mdmBtn": false
            });
            oModel.setData(oData);
        },

        onSelectofApproval: function (oEvent) {
            // 1. what did the user pick?
            const approvalType = oEvent.getSource().getSelectedKey();   // "R0", "Finance Po Based", …

            // 2. model & data that feed the table
            const oModel = this.getOwnerComponent().getModel("hierarchydata");
            const data = oModel.getData();           // { jsonObjects : [...] }

            // 3. enable Create-row button once company-code is chosen
            if (this.companyCode) {
                this.byId("idCreateMassRequest").setEnabled(true);
            }

            debugger;

            // 4. decide which columns should be visible for this type
            data.jsonObjects.forEach(function (row) {

                /* ------- hide everything first ------- */
                row.editCheckboxVisible = false;
                row.approveCheckboxVisible = false;
                row.sendBackCheckboxVisible = false;
                row.rejectCheckboxVisible = false;

                /* ------- uncheck all the checkboxes ------- */
                row.editCheckboxSelected = false;
                row.approveCheckboxSelected = false;
                row.sendBackCheckboxSelected = false;
                row.rejectCheckboxSelected = false;


                /* ------- then enable what applies ----- */
                if (approvalType === "Registration" || approvalType === "R1") {
                    row.editCheckboxVisible = true;
                    row.approveCheckboxVisible = true;
                    row.sendBackCheckboxVisible = true;
                    row.rejectCheckboxVisible = true;
                } else if (approvalType === "R0") {
                    row.editCheckboxVisible = false;
                    row.approveCheckboxVisible = false;
                    row.sendBackCheckboxVisible = false;
                    row.rejectCheckboxVisible = false;
                }
                else {
                    row.approveCheckboxVisible = true;
                    row.rejectCheckboxVisible = true;
                }
            });

            // 5. push the changes back & repaint the table
            oModel.setData(data);                    // notify the JSON model
            // const oTable = this.byId("idProductsTable");
            // oTable.getBinding("items").refresh();    // force the rows to re-evaluate bindings
        },

        onValueHelpRequested: function (oEvent) {
            debugger;
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
            debugger;
            var aTokens = oEvent.getParameter("tokens");
            var sPath = this._inputFieldRole.getBindingContext("hierarchydata").getPath();
            if (aTokens.length > 0) {
                var sSelectedUser = aTokens[0].getText(); // Get selected user value
                this.getView().byId("idRoleInput").setValue(sSelectedUser); // Set value in input field
                this.getView().getModel("hierarchydata").setProperty(sPath + "/role", sSelectedUser);

                // clear the second input field 
                var sUserValue = this.getView().getModel("hierarchydata").getProperty(sPath + "/user"); // to get inputfiled
                if (sUserValue) {
                    // Clear user from model
                    this.getView().getModel("hierarchydata").setProperty(sPath + "/user", "");
                    if (this._inputFieldUser) {
                        this._inputFieldUser.setValue("");
                    }
                }
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
            var sApprovalType = oView.byId("idCompoBoxReq").getValue().split('-')[0]?.trim();
            var sApprovalTypeText = oView.byId("idCompoBoxReq").getValue();
            var sCompanyCode = this.byId("entityFilter").getInnerControls()[0].getValue();
            var approvalType = (sApprovalType !== "" ? sApprovalType : sApprovalTypeText)

            // Validate inputs
            if (!approvalType || !sCompanyCode) {
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

                oPayload["ACCESS_EDIT"] = item.editCheckboxSelected;
                oPayload["ACCESS_APPROVE"] = item.approveCheckboxSelected;
                oPayload["ACCESS_SENDBACK"] = item.sendBackCheckboxSelected;
                oPayload["ACCESS_REJECT"] = item.rejectCheckboxSelected;

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
                    success: function (res) {
                        oView.setBusy(false);
                        let responseMsg = "Approval Hierarchy Updated Successfully!";
                        MessageBox.success(res.UpdateApprovalHierarchy ?? responseMsg);
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
                    success: function (res) {
                        oView.setBusy(false);
                        var successMessage = "Approval Hierarchy Created Successfully!"
                        debugger;
                        let resMessage = res.CreateApprovalHierarchy ?? successMessage;
                        MessageBox.success(resMessage);
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
            debugger;
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
            let sApprovalType = this.byId("idCompoBoxReq").getValue().split('-')[0]?.trim();

            // Construct payload for deletion API
            let oPayload = {
                "USER_ID": oSelectedData.user,
                "APPR_TYPE": sApprovalType,
                "COMPANY_CODE": sCompanyCode,
                "APPROVER_LEVEL": oSelectedData.approvalLevel
            };
            oTable.setBusy(true);
            if (oSelectedData.user.length === 0 || oSelectedData.role.length === 0) {
                oTable.removeSelections();
                let successMessage = "Deleted Successfully!";
                MessageBox.success(successMessage);
                oModel.updateBindings(true);
                let oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh(true);
                }
                oTable.setBusy(false);
                this.getOwnerComponent().getRouter().navTo("RouteApprovalMatrix");

            } else {
                oDataModel.create("/DeleteApprovalHierarchy", oPayload, {
                    success: function (res) {
                        let successMessage = "User Deleted Successfully!";
                        MessageBox.success(res.DeleteApprovalHierarchy ?? successMessage);
                        oModel.updateBindings(true);
                        oTable.removeSelections();
                        let oBinding = oTable.getBinding("items");
                        if (oBinding) {
                            oBinding.refresh(true);
                        }
                        oTable.setBusy(false);
                        this.getOwnerComponent().getRouter().navTo("RouteApprovalMatrix")

                    }.bind(this),
                    error: function (err) {
                        MessageBox.error("Unable to delete User!");
                        oTable.setBusy(false);
                    }
                });
            }

        },

        onEditApproval: function (oEvent) {
            debugger;
            let oButton = this.byId("idEditBtn");
            let currentText = oButton.getText();
            if (currentText === "Edit") {
                oButton.setText("Cancel");
            } else {
                oButton.setText("Edit");
            }
            this.editableData = !this.editableData;
            let oModel = this.getOwnerComponent().getModel("hierarchydata");
            if (!this.editableData) {
                const data = oModel.getProperty("/jsonObjects") || [];
                const filteredData = data.filter(item => !(item.user === "" && item.role === ""));
                oModel.setProperty("/jsonObjects", filteredData);
            }
            let modelData = oModel.getData();
            if (modelData?.jsonObjects) {
                modelData.jsonObjects.forEach((ele) => {
                    ele.editablechk = this.editableData;
                });
                oModel.setData(modelData);
            }
            const submitBtn = this.byId("idCreateFooterButton");
            if (submitBtn) {
                submitBtn.setText(this.editableData ? "Submit" : "Create");
                submitBtn.setEnabled(this.editableData);
            }
            this.byId("idCreateMassRequest").setEnabled(true);
            this.byId("idDeleteBtmApprovalRow").setEnabled(true);

        }
    });
});