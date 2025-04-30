sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "com/usermasteraisp/usermasteraisp/model/formatter",
    "sap/ui/model/json/JSONModel",
    "sap/m/Popover",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, formatter, JSONModel, Popover, List, StandardListItem, MessageBox, Fragment, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("com.usermasteraisp.usermasteraisp.controller.Usermaster", {
        formatter: formatter,
        onInit() {
            this.oModel = this.getOwnerComponent().getModel();
            this.getView().setModel(this.oModel)
            this.getIasUsers();
        },

        getIasUsers: function () {
            const oModel1 = this.getView().getModel();
            oModel1.read("/IasUsersF4Help", {
                success: function (response) {
                    debugger;
                    const valueModel = new JSONModel(response);
                    this.getView().setModel(valueModel, "valueModel")
                }.bind(this),
                error: function (error) {
                }
            })
        },


        onTableUpdateFinished: function () {
            var oTable = this.getView().byId("usertableID");
            var aItems = oTable.getItems();
            var oTable1 = this.getView().byId("usertableID");
            var aItems1 = oTable1.getItems();
            var oRoleMapping = {
                "ADM": "Admin",
                "BYR": "Buyer",
                "QA": "Quality Manager",
                "ISP": "Insp. Manager",
                "PM": "Proc. Manager"
            };
            aItems.forEach(function (oItem) {
                var oCtx = oItem.getBindingContext();
                if (oCtx) {
                    var sUserRole = oCtx.getProperty("USER_ROLE");
                    var oMultiInput = oItem.getCells()[2].getItems()[0];
                    if (sUserRole && oMultiInput) {
                        oMultiInput.removeAllTokens();
                        var aRoles = sUserRole.split(",");
                        aRoles.forEach(function (role) {
                            var sFullRole = oRoleMapping[role.trim()] || role.trim();
                            var oToken = new sap.m.Token({
                                text: role.trim() + " - " + sFullRole,
                                key: role.trim(),
                                editable: false
                            });
                            oMultiInput.addToken(oToken);
                        });
                    }
                }
            });
            aItems1.forEach(function (oItem) {
                var oCtx1 = oItem.getBindingContext();
                if (oCtx1) {
                    var sCompany = oCtx1.getProperty("COMPANY_CODE");
                    var oMultiInput1 = oItem.getCells()[3].getItems()[0];
                    if (sCompany && oMultiInput1) {
                        oMultiInput1.removeAllTokens();
                        var aCode = sCompany.split(",");
                        aCode.forEach(function (code) {
                            var oToken = new sap.m.Token({ text: code.trim(), key: code.trim(), editable: false });
                            oMultiInput1.addToken(oToken);
                        });
                    }
                }
            });
        },


        onRemainingRolesClick: function (oEvent) {
            let sRoles = oEvent.getSource().getBindingContext().getProperty("USER_ROLE");
            let rolesArray = sRoles ? sRoles.split(",").map(role => role.trim()) : [];
            let remainingRoles = rolesArray.slice(3);
            if (!this._oPopover) {
                this._oPopover = new sap.m.Popover({
                    title: "Roles",
                    placement: "Bottom",
                    content: new sap.m.List({
                        items: {
                            path: "/roles",
                            template: new sap.m.StandardListItem({
                                title: "{roleName}"
                            })
                        }
                    })
                });

                this.getView().addDependent(this._oPopover);
            }
            let oModel = new sap.ui.model.json.JSONModel({
                roles: remainingRoles.map(role => ({
                    roleName: role
                }))
            });
            this._oPopover.setModel(oModel);
            this._oPopover.openBy(oEvent.getSource());
        },

        onSelectionChange: function (oEvent) {
            debugger
            var selectedItems = oEvent.getSource().getSelectedItems();
            if (!selectedItems || selectedItems.length === 0) {
                return; // Exit if no items are selected
            }
            var status = selectedItems[0]?.getBindingContext()?.getObject()?.STATUS;
            var isDeleted = status?.toLowerCase().includes("deleted");
            var editButton = this.getView().byId("idEditUserMaster");
            var deleteButton = this.getView().byId("idDeleteUserMaster");
            var isEditable = !isDeleted;
            editButton.setEnabled(isEditable);
            deleteButton.setEnabled(true);
            deleteButton.setText(isDeleted ? "Revoke" : "Delete");
        },

        onCreateUser: function () {
            // Check if fragment already exists; if yes, just open it
            if (!this.createFragment) {
                this.createFragment = sap.ui.xmlfragment("com.usermasteraisp.usermasteraisp.fragments.createUserMaster", this);
                this.getView().addDependent(this.createFragment);
            }

            // Reset input fields
            sap.ui.getCore().byId("idUserId").setValue("");
            sap.ui.getCore().byId("idUserName").setValue("");
            sap.ui.getCore().byId("idUserRole").setSelectedKeys([]);
            sap.ui.getCore().byId("idCompanyCode").setSelectedKeys([]);

            this.createFragment.open();
        },



        onCloseUserFragment: function () {
            if (this.createFragment) {
                this.createFragment.close();
            }
        },


        onSumbitUserMaster: function () {
            let that = this;
            let bValidationError = false;
            that.getView().setBusy(true);

            let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            const aInputFields = [
                "idUserId",
                "idUserName",
                "idUserRole",
                "idCompanyCode",
            ];

            // Validate all input fields for errors
            aInputFields.forEach((sFieldId) => {
                const oInput = sap.ui.getCore().byId(sFieldId);
                if (oInput && oInput.getValueState() === sap.ui.core.ValueState.Error) {
                    oInput.focus(); // Focus the first field with an error
                    bValidationError = true;
                    return;
                }
            });

            // Stop submission if validation errors exist
            if (bValidationError) {
                that.getView().setBusy(false);
                sap.m.MessageToast.show("Please correct the errors before submitting.");
                return;
            }

            // Retrieve values from input fields
            let userId = sap.ui.getCore().byId("idUserId").getValue();
            let userName = sap.ui.getCore().byId("idUserName").getValue();
            let oCompanyComboBox = sap.ui.getCore().byId("idCompanyCode");
            let oUserRoleComboBox = sap.ui.getCore().byId("idUserRole");

            // Fix for MultiComboBox user roles
            let aSelectedRoles = oUserRoleComboBox.getSelectedItems().map(item => item.getKey()).join(", ");
            let aSelectedCompanyCodes = oCompanyComboBox.getSelectedItems().map(item => item.getKey()).join(",");
            let aSelectedCompanyDescs = oCompanyComboBox.getSelectedItems().map(item => item.getText()).join(",");

            // Add validation for userId
            if (!userId) {
                let oInput = sap.ui.getCore().byId("idUserId");
                oInput.setValueState(sap.ui.core.ValueState.Error);
                oInput.setValueStateText("This field is required.");
                oInput.focus();
                bValidationError = true;
            } else if (!emailRegex.test(userId)) {
                let oInput = sap.ui.getCore().byId("idUserId");
                oInput.setValueState(sap.ui.core.ValueState.Error);
                oInput.setValueStateText("Please enter a valid Email Id.");
                oInput.focus();
                bValidationError = true;
            } else {
                sap.ui.getCore().byId("idUserId").setValueState(sap.ui.core.ValueState.None);
            }

            // Add validation for userName
            if (!userName) {
                sap.ui.getCore().byId("idUserName").setValueState(sap.ui.core.ValueState.Error);
                sap.ui.getCore().byId("idUserName").setValueStateText("This field is required.");
                bValidationError = true;
            } else {
                sap.ui.getCore().byId("idUserName").setValueState(sap.ui.core.ValueState.None);
            }

            // Add validation for user roles
            if (!aSelectedRoles) {
                sap.ui.getCore().byId("idUserRole").setValueState(sap.ui.core.ValueState.Error);
                sap.ui.getCore().byId("idUserRole").setValueStateText("At least one role must be selected.");
                bValidationError = true;
            } else {
                sap.ui.getCore().byId("idUserRole").setValueState(sap.ui.core.ValueState.None);
            }

            // Add validation for company codes
            if (!aSelectedCompanyCodes) {
                sap.ui.getCore().byId("idCompanyCode").setValueState(sap.ui.core.ValueState.Error);
                sap.ui.getCore().byId("idCompanyCode").setValueStateText("This field is required.");
                bValidationError = true;
            } else {
                sap.ui.getCore().byId("idCompanyCode").setValueState(sap.ui.core.ValueState.None);
            }

            // Stop submission if validation errors exist
            if (bValidationError) {
                that.getView().setBusy(false);
                return;
            }

            let oModel = this.getView().getModel();
            this.createFragment.close();
            this.getView().setBusy(true);

            // Fetch employee number based on user ID
            oModel.read("/IasUsers", {
                success: function (res) {
                    let data = res.results.find(item => item.EMAIL === userId);
                    let emp_no = data ? data.USER_ID : "";

                    // Construct the correct payload
                    let oPayload = {
                        userData: {
                            SR_NO: 1, // If you need to generate SR_NO dynamically, do it here
                            USER_ID: userId,
                            USER_ROLE: aSelectedRoles, // Multi roles separated by comma
                            USER_NAME: userName,
                            EMAIL: userId,
                            COMPANY_CODE: aSelectedCompanyCodes, // Multi company codes separated by comma
                            COMPANY_DESC: aSelectedCompanyDescs, // Multi company descriptions separated by comma
                            EMP_NO: emp_no // Employee number fetched from backend
                        }
                    };

                    // Send the payload
                    oModel.create("/CreateVMUser", oPayload, {
                        success: function () {
                            that.getView().setBusy(false);
                            MessageBox.success("User created successfully!");

                            // Reset input fields after successful submission
                            sap.ui.getCore().byId("idUserId").setValue("");
                            sap.ui.getCore().byId("idUserName").setValue("");
                            sap.ui.getCore().byId("idUserRole").setSelectedKeys([]); // Clear multi select
                            sap.ui.getCore().byId("idCompanyCode").setSelectedKeys([]); // Clear multi select

                            // Refresh table data
                            that.getView().byId("UserMasterSmartTable").rebindTable();
                        },
                        error: function (errorResponse) {
                            that.getView().setBusy(false);
                            let errorMessage = errorResponse.responseText || "An error occurred.";
                            MessageBox.error(errorMessage, {
                                title: "Error",
                                onClose: function () {
                                    console.log("Error message box closed.");
                                }
                            });
                        }
                    });
                },
                error: function () {
                    that.getView().setBusy(false);
                    MessageBox.error("Something Went Wrong");
                }
            });
        },


        onEditUserMaster: function () {
            debugger;
            this.getView().setBusy(true)
            // Check if the fragment already exists, if not create it
            if (!this.updateFragment) {
                this.updateFragment = sap.ui.xmlfragment("com.usermasteraisp.usermasteraisp.fragments.updateUserMaster", this);
                this.getView().addDependent(this.updateFragment);
            }

            // Open the fragment (edit dialog)
            this.updateFragment.open();

            // Get selected item from the table
            var oTable = this.getView().byId('usertableID');
            var aSelectedItems = oTable.getSelectedItems();
            // Ensure an item is selected
            if (aSelectedItems.length === 0) {
                MessageBox.error("Please select a user to edit.");
                return;
            }
            // Extract data from the selected row
            var sData = aSelectedItems[0].getBindingContext().getObject();
            // Parse and split company codes and roles if available
            var aSelectedEntity = sData.COMPANY_CODE ? sData.COMPANY_CODE.split(",") : [];
            var aSelectedRoles = sData.USER_ROLE ? sData.USER_ROLE.split(",").map(role => role.trim()) : [];
            sap.ui.getCore().byId("idUserIdEdit").setValue(sData.USER_ID); // Set User ID
            sap.ui.getCore().byId("idEditUserRole").setSelectedKeys(aSelectedRoles); // Set User Roles
            sap.ui.getCore().byId("idUserEditName").setValue(sData.USER_NAME); // Set User Name
            sap.ui.getCore().byId("idCompanyCodeEdit").setSelectedKeys(aSelectedEntity);
            this.getView().setBusy(false)

        },

        onCloseUserFragmentEdit: function () {
            this.updateFragment.close();
            this.updateFragment.destroy(true);
            this.updateFragment = undefined;
        },


        onSumbitUserMasterEdit: function () {
            this.getView().setBusy(true);
            this.updateFragment.close();

            // Get required input values
            let userId = sap.ui.getCore().byId("idUserIdEdit").getValue();
            let userRoles = sap.ui.getCore().byId("idEditUserRole").getSelectedKeys();
            let selectedCompanyCodes = sap.ui.getCore().byId("idCompanyCodeEdit").getSelectedKeys(); // Array

            // Company Code Data (Manually Mapped)
            let companyData = [
                { BUKRS: "1000", BUTXT: "Airdit" },
                { BUKRS: "2000", BUTXT: "Fiserv" },
                { BUKRS: "3000", BUTXT: "IBM" },
                { BUKRS: "4000", BUTXT: "TCS" },
                { BUKRS: "5000", BUTXT: "Google" }
            ];

            // Map Company Codes to Descriptions
            let companyDescArray = selectedCompanyCodes.map(code => {
                let company = companyData.find(item => item.BUKRS === code);
                return company ? company.BUTXT : "";
            }).filter(desc => desc !== ""); // Remove any empty descriptions

            // Construct payload
            let oPayload = {
                USER_ROLE: userRoles.join(","), // Convert array to comma-separated string
                COMPANY_CODE: selectedCompanyCodes.join(","), // Convert array to comma-separated string
                COMPANY_DESC: companyDescArray.join(",") // Convert mapped descriptions to string
            };

            console.log("Final Payload:", oPayload); // Debugging

            // Get model
            let oModel = this.getView().getModel();

            // Update user details
            oModel.update(`/VMUsers(EMAIL='${userId}')`, oPayload, {
                success: function (oData) {
                    MessageBox.success("User Edited successfully!");
                    this.getView().setBusy(false);
                    this.getView().byId("UserMasterSmartTable").rebindTable();
                }.bind(this),
                error: function (oRes) {
                    this.getView().setBusy(false);
                    MessageBox.error("Unable to Edit");
                }.bind(this)
            });
        },



        //for delete and revoke users

        onDeleteUserMaster: function () {
            if (!this.insertCommentFrag) {
                this.insertCommentFrag = sap.ui.xmlfragment("com.usermasteraisp.usermasteraisp.fragments.insertComment", this);
                this.getView().addDependent(this.insertCommentFrag);
            }
            this.insertCommentFrag.open();
        },

        onDialogCancel: function () {
            this.insertCommentFrag.close();
        },

        onDeleteConfirm: function (oEvent) {
            debugger;
            let comment = sap.ui.getCore().byId("idcomment").getValue();
            if (!comment || comment.trim() === "") {
                MessageBox.error("Comment cannot be empty.");
                return; // Stop further execution
            }
            this.insertCommentFrag.close();
            var that = this;
            var oModel = this.getView().byId('UserMasterSmartTable').getModel();
            var oTable = this.getView().byId('usertableID');
            var aSelectedItems = oTable.getSelectedItems();
            var sName = aSelectedItems[0].getBindingContext().getObject().EMAIL;
            let currStatus = aSelectedItems[0].getBindingContext().getObject().STATUS;
            let action = currStatus === "Deleted" ? "REVOKE" : "DELETE";
            let payload = {
                "EMAIL": sName,
                "ACTION_TYPE": action,
                "COMMENTS": comment,
            };
            MessageBox.confirm(`Are you sure you want to ${action} ${sName}?`, {
                icon: MessageBox.Icon.WARNING,
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.YES,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        that.getView().setBusy(true);
                        oModel.callFunction("/UpdateVMUserStatus", {
                            method: "POST", // Ensure it's a POST request
                            urlParameters: payload, // Pass parameters inside `urlParameters`
                            success: function (oData) {
                                that.getView().setBusy(false);
                                MessageBox.success(oData.UpdateVMUserStatus);
                                oTable.removeSelections();
                                that.getView().byId('UserMasterSmartTable').rebindTable();
                                sap.ui.getCore().byId("idcomment").setValue("")
                            },
                            error: function (oError) {
                                that.getView().setBusy(false);
                                that.insertCommentFrag.close();
                                MessageBox.error("Something went wrong!");
                            }
                        });
                    } else {
                        sap.ui.getCore().byId("idcomment").setValue("")
                    }
                }
            });
        },

        sortMultiInputTokens: function (sMultiInputId) {
            var oMultiInput = this.byId(sMultiInputId);
            if (!oMultiInput) return;

            // Get existing tokens
            var aTokens = oMultiInput.getTokens();

            // Extract text and sort alphabetically
            var aSortedTexts = aTokens.map(token => token.getText()).sort();

            // Clear existing tokens
            oMultiInput.removeAllTokens();

            // Add sorted tokens back
            aSortedTexts.forEach(text => {
                oMultiInput.addToken(new sap.m.Token({ text: text }));
            });
        },



        onAfterRendering: function () {
            var oSmartTable = this.getView().byId("idSmartTable");

            if (!oSmartTable) {
                console.error("SmartTable not found!");
                return;
            }

            // Ensure event is attached only once
            if (!this._bTableRendered) {
                this._bTableRendered = true;

                var oTable = oSmartTable.getTable();
                if (oTable) {
                    oTable.attachEvent("updateFinished", this.onTableRendered, this);
                }
            }
        },

        onTableRendered: function () {
            console.log("SmartTable is fully rendered!");

            var oSmartTable = this.getView().byId("idSmartTable");
            var oTable = oSmartTable.getTable();
            var aItems = oTable.getItems();

            aItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext();
                if (!oContext) return;

                var aRoles = oContext.getProperty("TO_USER_ROLE");

                var oHBox = oItem.getCells()[1]; // Assuming the HBox is in the second column
                var oText = oHBox.getItems()[0]; // Text element
                var oButton = oHBox.getItems()[1]; // Button element

                if (aRoles.length > 2) {
                    this.remainingRoles = aRoles.map(role => `${role.CODE} - ${role.DESCRIPTION}`).sort().slice(2);
                    oButton.setText("+" + this.remainingRoles.length + " More");
                    oButton.setVisible(true);
                }
            }.bind(this));
        },

        onShowMoreRoles: function (oEvent) {
            var oButton = oEvent.getSource();
            var oHBox = oButton.getParent();
            var oText = oHBox.getItems()[0];

            if (this.remainingRoles && this.remainingRoles.length > 0) {
                let fullText = oText.getText() + ", " + this.remainingRoles.join(", ");
                oText.setText(fullText);
                oButton.setVisible(false);
            }
        },

        // Create Value help request 
        onValueHelpRequest: function () {
            const oView = this.getView();

            if (!this._oValueHelpDialog) {
                sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "com.usermasteraisp.usermasteraisp.fragments.createValueHelpRequest",    // namesapce
                    controller: this,
                }).then(
                    function (oDialog) {
                        this._oValueHelpDialog = oDialog;
                        oView.addDependent(this._oValueHelpDialog);

                        // ✅ Now it's safe to use getFilterBar after dialog is ready
                        const oFilterBar = this._oValueHelpDialog.getFilterBar();
                        const oInput = oFilterBar?.determineControlByName("Partner");
                        if (oInput) {
                            oInput.attachLiveChange(this.onSearchLiveChange, this);
                        }

                        this._oValueHelpDialog.getTableAsync().then(
                            function (oTable) {
                                const tModel = oView.getModel("valueModel");
                                oTable.setModel(tModel);
                                oTable.bindRows("/results");

                                // Add Columns
                                oTable.addColumn(
                                    new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "Email" }),
                                        template: new sap.m.Text({ text: "{EMAIL} " }),
                                        sortProperty: "EMAIL",
                                        // customData:"{FIRST_NAME}",
                                        filterProperty: "EMAIL",
                                    })
                                );

                                oTable.addColumn(
                                    new sap.ui.table.Column({
                                        label: new sap.m.Label({ text: "User Name" }),
                                        template: new sap.m.Text({ text: "{FIRST_NAME}" }),
                                        sortProperty: "FIRST_NAME",
                                        filterProperty: "FIRST_NAME",
                                    })
                                );

                                // oTable.addColumn(
                                //     new sap.ui.table.Column({
                                //         label: new sap.m.Label({ text: "Account Group" }),
                                //         template: new sap.m.Text({
                                //             text: "{SupplierAccountGroup}",
                                //         }),
                                //         sortProperty: "SupplierAccountGroup",
                                //         filterProperty: "SupplierAccountGroup",
                                //     })
                                // );

                                this._oValueHelpDialog.update();
                            }.bind(this)
                        );

                        this._oValueHelpDialog.open();
                    }.bind(this)
                );
            } else {
                this._oValueHelpDialog.open();
            }
        },

        onValueHelpOkPress: function (oEvent) {
            const aTokens = oEvent.getParameter("tokens");

            if (aTokens && aTokens.length > 0) {
                const sSelectedKey = aTokens[0].getKey(); // Partner
                const sDescriptionFull = aTokens[0].getText(); // FIRST_NAME (EMAIL)

                const sDescription = sDescriptionFull.split(" (")[0]; // Extract FIRST_NAME  

                sap.ui.getCore().byId("idUserId").setValue(sSelectedKey);
                sap.ui.getCore().byId("idUserName").setValue(sDescription);

                const oUserIdField = sap.ui.getCore().byId("idUserId");
                const oUserNameField = sap.ui.getCore().byId("idUserName");

                // if (oUserIdField !== 0  && oUserNameField !== 0) {
                //     oUserIdField.setValue(sSelectedKey);
                //     oUserIdField.setEditable(false);

                //     oUserNameField.setValue(sDescription);
                //     oUserNameField.setEditable(false);
                // } else {
                //     console.warn("Input fields not found by ID.");
                // }
            }

            this._oValueHelpDialog.close();
        },

        onCustomGo: function () {
            var oSmartTable = this.byId("idReportLists");
            oSmartTable.rebindTable(); // Triggers 'onBeforeSuppList'
        },

        onValueHelpCancelPress: function () {
            this._oValueHelpDialog.close();
        },

        onValueHelpAfterClose: function () {
            this._oValueHelpDialog.destroy();
            this._oValueHelpDialog = null;
        },

        onSearchLiveChange: function (oEvent) {
            debugger;
            const sSearchValue = oEvent.getParameter("newValue");
            const oTable = this._oValueHelpDialog.getTable();
            const oBinding = oTable.getBinding("rows");

            const aFilters = [];

            if (sSearchValue) {
                aFilters.push(
                    new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter(
                                "EMAIL",
                                sap.ui.model.FilterOperator.Contains,
                                sSearchValue
                            ),
                            new sap.ui.model.Filter(
                                "FIRST_NAME",
                                sap.ui.model.FilterOperator.Contains,
                                sSearchValue
                            ),
                            // new sap.ui.model.Filter(
                            //     "SupplierAccountGroup",
                            //     sap.ui.model.FilterOperator.Contains,
                            //     sSearchValue
                            // ),
                        ],
                        and: false,
                    })
                );
            }

            oBinding.filter(aFilters);
        },

    });
});