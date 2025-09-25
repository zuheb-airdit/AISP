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
      "com.sconfig.systemconfiguration2aisp.controller.MasterTable",
      {
        onInit() {
          let mainModel = this.getOwnerComponent().getModel();
          this.getView().setModel(mainModel);
          this.getMastertabledata("approvalType");
        },

        onComboBoxChangeMaster: function (oEvent) {
          var oSelectedItem = oEvent.getParameter("selectedItem");
          var sKey = oSelectedItem.getKey(); // Get the key of the selected item
          this.getMastertabledata(sKey);
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
                      SHORTTEXT: item.NATIO,
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
                        CODE: item.WAERS, // Currency Code
                        DESCRIPTION: item.LTEXT, // Long Description
                        SHORTTEXT: item.KTEXT, // Short Description (optional)
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
                  this.getView()
                    .byId("idCreateButton")
                    .setText("Approval Type");
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
                        DESCRIPTION: item.DESCRIPTION,
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
                        CODE: item.BUKRS, // Company Code
                        DESCRIPTION: item.BUTXT, // Company Name
                        SHORTTEXT: item.ORT01,
                        WAERS: item.WAERS, // City
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
                        SHORTTEXT: item.SUPPLIER_TYPE,
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
            case "vendorAccountGroup":
              let mastJsonVAG = this.getView().getModel("mastJsonModel");
              if (mastJsonVAG) {
                mastJsonVAG.setData(null); // Clear model data
              } else {
                mastJsonVAG = new sap.ui.model.json.JSONModel();
              }
              debugger;
              oModel.read("/VENDOR_ACCOUNT_GROUP", {
                success: function (res) {
                  let data = {
                    results: res.results.map(function (item) {
                      return {
                        CODE: item.CODE,
                        DESCRIPTION: item.DESCRIPTION,
                      };
                    }),
                  };

                  mastJsonVAG.setData(data);
                  mastJsonVAG.refresh(true);
                  this.getView().setModel(mastJsonVAG, "mastJsonModel");

                  this.getView()
                    .byId("idCreateButton")
                    .setText("Vendor Account Group");
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
                  `com.sconfig.systemconfiguration2aisp.fragments.CountryEdit`, // Fragment path
                  this // Bind the controller to handle fragment events
                );
                this.getView().addDependent(this._editUserDialog); // Add fragment as dependent to the view
              }

              // Pre-fill the fragment fields with the selected item data
              sap.ui
                .getCore()
                .byId("editCountryCodeInput")
                .setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editCountryNameInput")
                .setValue(index.DESCRIPTION);
              sap.ui
                .getCore()
                .byId("editCountryNationalityInput")
                .setValue(index.SHORTTEXT);
              this._editUserDialog.open();
              break;

            case "currency":
              if (!this._editCurrDialog) {
                this._editCurrDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.CurrencyEdit`, // Fragment path
                  this // Bind the controller to handle fragment events
                );
                this.getView().addDependent(this._editCurrDialog); // Add fragment as dependent to the view
              }

              // Pre-fill the fragment fields with the selected item data
              sap.ui
                .getCore()
                .byId("editCurrencyCodeInput")
                .setValue(index.CODE); // Adjust as per your field name
              sap.ui
                .getCore()
                .byId("editCurrencyDescInput")
                .setValue(index.DESCRIPTION); // Adjust as per your field name
              sap.ui
                .getCore()
                .byId("editCurrencyShortInput")
                .setValue(index.SHORTTEXT);
              this._editCurrDialog.open();
              break;

            case "approvalType":
              if (!this._approvalTypeEditDialog) {
                this._approvalTypeEditDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.ApprovalTypeEdit`,
                  this
                );
                this.getView().addDependent(this._approvalTypeEditDialog);
              }
              sap.ui
                .getCore()
                .byId("editApprovalTypeCodeInput")
                .setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editApprovalTypeDescInput")
                .setValue(index.DESCRIPTION);
              this._approvalTypeEditDialog.open();
              break;

            case "companyCode":
              if (!this._companyCodeEditDialog) {
                this._companyCodeEditDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.CompanyCodeEdit`,
                  this
                );
                this.getView().addDependent(this._companyCodeEditDialog);
              }
              sap.ui
                .getCore()
                .byId("editCompanyCodeInput")
                .setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editCompanyDescInput")
                .setValue(index.DESCRIPTION);
              sap.ui
                .getCore()
                .byId("editCompanyCityInput")
                .setValue(index.SHORTTEXT); // Assuming SHORTTEXT is city (adjust if not)
              sap.ui
                .getCore()
                .byId("editCompanyCurrencyInput")
                .setValue(index.WAERS);
              this._companyCodeEditDialog.open();
              break;

            case "userRole":
              if (!this._userRoleEditDialog) {
                this._userRoleEditDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.UserRoleEdit`,
                  this
                );
                this.getView().addDependent(this._userRoleEditDialog);
              }
              sap.ui
                .getCore()
                .byId("editUserRoleCodeInput")
                .setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editUserRoleDescInput")
                .setValue(index.DESCRIPTION);
              this._userRoleEditDialog.open();
              break;

            case "RequestType":
              if (!this._RequestTypeEditDialog) {
                this._RequestTypeEditDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.RequestTypeEdit`,
                  this
                );
                this.getView().addDependent(this._RequestTypeEditDialog);
              }
              sap.ui
                .getCore()
                .byId("editRequestTypeCodeInput")
                .setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editRequestTypeDescInput")
                .setValue(index.DESCRIPTION);
              sap.ui
                .getCore()
                .byId("editRequestTypeSuppInput")
                .setValue(index.SHORTTEXT);
              this._RequestTypeEditDialog.open();
              break;
            case "vendorAccountGroup":
              if (!this._vendorAccountEditDialog) {
                this._vendorAccountEditDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.vendorAccountEdit`,
                  this
                );
                this.getView().addDependent(this._RequestTypeEditDialog);
              }
              sap.ui.getCore().byId("editVendorCodeInput").setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editVendorDescInput")
                .setValue(index.DESCRIPTION);
              this._vendorAccountEditDialog.open();
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
          sap.m.MessageBox.confirm(
            "Are you sure you want to delete this item?",
            {
              actions: [
                sap.m.MessageBox.Action.YES,
                sap.m.MessageBox.Action.NO,
              ],
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
                          that.getMastertabledata("country");
                          MessageBox.success("Country deleted successfully.");
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
                          sap.m.MessageBox.error(
                            "Failed to delete Department."
                          );
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
                          that.getMastertabledata("currency");
                          sap.m.MessageBox.success(
                            "Currency deleted successfully."
                          );
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
                          that.getMastertabledata("approvalType");
                          sap.m.MessageBox.success(
                            "Approval Type deleted successfully."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                        error: function () {
                          sap.m.MessageBox.error(
                            "Failed to delete Approval Type."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                      });
                      break;

                    case "companyCode":
                      let cPayload = { BUKRS: oSelectedItem.CODE };
                      oModel.create(`/deleteCompanyCode`, cPayload, {
                        success: function () {
                          sap.m.MessageBox.success(
                            "Company Code deleted successfully."
                          );
                          that.getMastertabledata("companyCode");

                          sap.ui.core.BusyIndicator.hide();
                        },
                        error: function () {
                          sap.m.MessageBox.error(
                            "Failed to delete Company Code."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                      });
                      break;

                    case "userRole":
                      let userRolePayload = { CODE: oSelectedItem.CODE };
                      oModel.create(`/deleteUserRole`, userRolePayload, {
                        success: function () {
                          that.getMastertabledata("userRole");

                          sap.m.MessageBox.success(
                            "User Role deleted successfully."
                          );
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
                          that.getMastertabledata("RequestType");
                          sap.m.MessageBox.success(
                            "Request Type deleted successfully."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                        error: function () {
                          sap.m.MessageBox.error(
                            "Failed to delete Request Type."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                      });
                      break;
                    case "vendorAccountGroup":
                      let VAGPayload = { CODE: oSelectedItem.CODE };
                      oModel.create(`/deleteVendorAccountGroup`, VAGPayload, {
                        success: function () {
                          that.getMastertabledata("vendorAccountGroup");
                          sap.m.MessageBox.success(
                            "Vendor Account Group deleted successfully."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                        error: function () {
                          sap.m.MessageBox.error(
                            "Failed to delete Vendor Account Group."
                          );
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
            }
          );
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
            case "vendorAccountGroup":
              debugger;
              this._openCreateVendorAccountTypeDialog();
              break;
            default:
              sap.m.MessageToast.show("Please select a valid option.");
          }
        },

        _openCreateCompanyCodeDialog: function () {
          if (!this._companyCodeCreateDialog) {
            this._companyCodeCreateDialog = sap.ui.xmlfragment(
              `com.sconfig.systemconfiguration2aisp.fragments.CompanyCodeCreate`,
              this
            );
            this.getView().addDependent(this._companyCodeCreateDialog);
          }
          this._companyCodeCreateDialog.open();
        },

        _openCreateRoleDialog: function () {
          if (!this._userRoleCreateDialog) {
            this._userRoleCreateDialog = sap.ui.xmlfragment(
              `com.sconfig.systemconfiguration2aisp.fragments.UserRoleCreate`,
              this
            );
            this.getView().addDependent(this._userRoleCreateDialog);
          }
          this._userRoleCreateDialog.open();
        },

        _openCreateVendorAccountTypeDialog: function () {
          if (!this._vendoraccountGroupCreateDialog) {
            this._vendoraccountGroupCreateDialog = sap.ui.xmlfragment(
              `com.sconfig.systemconfiguration2aisp.fragments.VendorAccountFrag`,
              this
            );
            this.getView().addDependent(this._vendoraccountGroupCreateDialog);
          }
          this._vendoraccountGroupCreateDialog.open();
        },

        _openCreateCountryDialog: function () {
          if (!this._oCreateDepartmentDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: `com.sconfig.systemconfiguration2aisp.fragments.Country`,
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
              `com.sconfig.systemconfiguration2aisp.fragments.ApprovalTypeCreate`,
              this
            );
            this.getView().addDependent(this._approvalTypeCreateDialog);
          }
          this._approvalTypeCreateDialog.open();
        },

        _openCreateCuurency: function () {
          if (!this._oCreateCurrencyDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: `com.sconfig.systemconfiguration2aisp.fragments.Currency`,
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
              `com.sconfig.systemconfiguration2aisp.fragments.RequestTypeCreate`,
              this
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
            NATIO: sNation,
          };

          try {
            await this.getView()
              .getModel()
              .create("/createCountry", oPayload, {
                success: function () {
                  MessageBox.success("Country created successfully!");
                  this.getMastertabledata("country");
                  oDialog.close();
                }.bind(this),
                error: function (oError) {
                  MessageBox.error(
                    "Failed to create country. Please check details."
                  );
                },
              });
          } catch (err) {
            sap.m.MessageBox.error("Unexpected error occurred.");
          }
        },

        onCountryDialogClose: function () {
          this.byId("countryCreateDialog").close();
        },

        onUpdateCountrySubmit: function () {
          var sCode = sap.ui
            .getCore()
            .byId("editCountryCodeInput")
            .getValue()
            .trim();
          var sName = sap.ui
            .getCore()
            .byId("editCountryNameInput")
            .getValue()
            .trim();
          var sNation = sap.ui
            .getCore()
            .byId("editCountryNationalityInput")
            .getValue()
            .trim();

          if (!sNation) {
            sap.m.MessageToast.show("Short Text is required.");
            return;
          }

          var oModel = this.getView().getModel();

          var oPayload = {
            LAND1: sCode.toUpperCase(),
            LANDX: sName,
            NATIO: sNation,
          };

          // For OData V2 function import (GET)
          oModel.create("/updateCountry", oPayload, {
            success: function (res) {
              this._editUserDialog.close();
              MessageBox.success("Country Edited Sucessfully!");
              this.getMastertabledata("country");
            }.bind(this),
            error: function (err) {
              this._editUserDialog.close();
              MessageBox.error("Error in Uploading,Please try again");
            },
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
                  `com.sconfig.systemconfiguration2aisp.fragments.CountryEdit`, // Fragment path
                  this // Bind the controller to handle fragment events
                );
                this.getView().addDependent(this._editUserDialog); // Add fragment as dependent to the view
              }

              // Pre-fill the fragment fields with the selected item data
              sap.ui
                .getCore()
                .byId("editCountryCodeInput")
                .setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editCountryNameInput")
                .setValue(index.DESCRIPTION);
              sap.ui
                .getCore()
                .byId("editCountryNationalityInput")
                .setValue(index.SHORTTEXT);
              this._editUserDialog.open();
              break;

            case "currency":
              if (!this._editCurrDialog) {
                this._editCurrDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.CurrencyEdit`, // Fragment path
                  this // Bind the controller to handle fragment events
                );
                this.getView().addDependent(this._editCurrDialog); // Add fragment as dependent to the view
              }

              // Pre-fill the fragment fields with the selected item data
              sap.ui
                .getCore()
                .byId("editCurrencyCodeInput")
                .setValue(index.CODE); // Adjust as per your field name
              sap.ui
                .getCore()
                .byId("editCurrencyDescInput")
                .setValue(index.DESCRIPTION); // Adjust as per your field name
              sap.ui
                .getCore()
                .byId("editCurrencyShortInput")
                .setValue(index.SHORTTEXT);
              this._editCurrDialog.open();
              break;

            case "approvalType":
              if (!this._approvalTypeEditDialog) {
                this._approvalTypeEditDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.ApprovalTypeEdit`,
                  this
                );
                this.getView().addDependent(this._approvalTypeEditDialog);
              }
              sap.ui
                .getCore()
                .byId("editApprovalTypeCodeInput")
                .setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editApprovalTypeDescInput")
                .setValue(index.DESCRIPTION);
              this._approvalTypeEditDialog.open();
              break;

            case "companyCode":
              if (!this._companyCodeEditDialog) {
                this._companyCodeEditDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.CompanyCodeEdit`,
                  this
                );
                this.getView().addDependent(this._companyCodeEditDialog);
              }
              sap.ui
                .getCore()
                .byId("editCompanyCodeInput")
                .setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editCompanyDescInput")
                .setValue(index.DESCRIPTION);
              sap.ui
                .getCore()
                .byId("editCompanyCityInput")
                .setValue(index.SHORTTEXT); // Assuming SHORTTEXT is city (adjust if not)
              sap.ui
                .getCore()
                .byId("editCompanyCurrencyInput")
                .setValue(index.WAERS);
              this._companyCodeEditDialog.open();
              break;

            case "userRole":
              if (!this._userRoleEditDialog) {
                this._userRoleEditDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.UserRoleEdit`,
                  this
                );
                this.getView().addDependent(this._userRoleEditDialog);
              }
              sap.ui
                .getCore()
                .byId("editUserRoleCodeInput")
                .setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editUserRoleDescInput")
                .setValue(index.DESCRIPTION);
              this._userRoleEditDialog.open();
              break;

            case "RequestType":
              if (!this._RequestTypeEditDialog) {
                this._RequestTypeEditDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.RequestTypeEdit`,
                  this
                );
                this.getView().addDependent(this._RequestTypeEditDialog);
              }
              sap.ui
                .getCore()
                .byId("editRequestTypeCodeInput")
                .setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editRequestTypeDescInput")
                .setValue(index.DESCRIPTION);
              sap.ui
                .getCore()
                .byId("editRequestTypeSuppInput")
                .setValue(index.SHORTTEXT);
              this._RequestTypeEditDialog.open();
              break;
            case "vendorAccountGroup":
              if (!this._vendorAccountEditDialog) {
                this._vendorAccountEditDialog = sap.ui.xmlfragment(
                  `com.sconfig.systemconfiguration2aisp.fragments.vendorAccountEdit`,
                  this
                );
                this.getView().addDependent(this._RequestTypeEditDialog);
              }
              sap.ui.getCore().byId("editVendorCodeInput").setValue(index.CODE);
              sap.ui
                .getCore()
                .byId("editVendorDescInput")
                .setValue(index.DESCRIPTION);
              this._vendorAccountEditDialog.open();
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
          sap.m.MessageBox.confirm(
            "Are you sure you want to delete this item?",
            {
              actions: [
                sap.m.MessageBox.Action.YES,
                sap.m.MessageBox.Action.NO,
              ],
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
                          that.getMastertabledata("country");
                          MessageBox.success("Country deleted successfully.");
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
                          sap.m.MessageBox.error(
                            "Failed to delete Department."
                          );
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
                          that.getMastertabledata("currency");
                          sap.m.MessageBox.success(
                            "Currency deleted successfully."
                          );
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
                          that.getMastertabledata("approvalType");
                          sap.m.MessageBox.success(
                            "Approval Type deleted successfully."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                        error: function () {
                          sap.m.MessageBox.error(
                            "Failed to delete Approval Type."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                      });
                      break;

                    case "companyCode":
                      let cPayload = { BUKRS: oSelectedItem.CODE };
                      oModel.create(`/deleteCompanyCode`, cPayload, {
                        success: function () {
                          sap.m.MessageBox.success(
                            "Company Code deleted successfully."
                          );
                          that.getMastertabledata("companyCode");

                          sap.ui.core.BusyIndicator.hide();
                        },
                        error: function () {
                          sap.m.MessageBox.error(
                            "Failed to delete Company Code."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                      });
                      break;

                    case "userRole":
                      let userRolePayload = { CODE: oSelectedItem.CODE };
                      oModel.create(`/deleteUserRole`, userRolePayload, {
                        success: function () {
                          that.getMastertabledata("userRole");

                          sap.m.MessageBox.success(
                            "User Role deleted successfully."
                          );
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
                          that.getMastertabledata("RequestType");
                          sap.m.MessageBox.success(
                            "Request Type deleted successfully."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                        error: function () {
                          sap.m.MessageBox.error(
                            "Failed to delete Request Type."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                      });
                      break;
                    case "vendorAccountGroup":
                      let VAGPayload = { CODE: oSelectedItem.CODE };
                      oModel.create(`/deleteVendorAccountGroup`, VAGPayload, {
                        success: function () {
                          that.getMastertabledata("vendorAccountGroup");
                          sap.m.MessageBox.success(
                            "Vendor Account Group deleted successfully."
                          );
                          sap.ui.core.BusyIndicator.hide();
                        },
                        error: function () {
                          sap.m.MessageBox.error(
                            "Failed to delete Vendor Account Group."
                          );
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
            }
          );
        },

        onCreateCurrencySubmit: function () {
          // Get input values by Core IDs
          this.getView().setBusy(true);
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
            KTEXT: sShort,
          };

          // Get model (from Core or View; adjust as needed)
          var oModel = this.getView().getModel(); // Or this.getView().getModel()

          // POST to the correct entity set (adjust if your entity set name differs)
          oModel.create("/createCurrency", oPayload, {
            success: function (oData) {
              this.getView().setBusy(false);
              MessageBox.success("Currency created successfully!");
              this.byId("currencyCreateDialog").close();
              this.getMastertabledata("currency");
              // Optionally refresh your table/grid here
            }.bind(this),
            error: function (oError) {
              this.getView().setBusy(false);
              sap.m.MessageBox.error("Failed to create currency.");
            }.bind(this),
          });
        },

        onUpdateCurrencySubmit: function () {
          var sCode = sap.ui
            .getCore()
            .byId("editCurrencyCodeInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("editCurrencyDescInput")
            .getValue()
            .trim();
          var sShort = sap.ui
            .getCore()
            .byId("editCurrencyShortInput")
            .getValue()
            .trim();

          if (!sCode || !sDesc || !sShort) {
            sap.m.MessageBox.error("All fields are required.");
            return;
          }

          var oPayload = {
            WAERS: sCode,
            LTEXT: sDesc,
            KTEXT: sShort,
          };

          var oModel = this.getView().getModel();

          oModel.create("/updateCurrency", oPayload, {
            success: function () {
              this.getMastertabledata("currency");
              sap.m.MessageBox.success("Currency updated successfully!");
              sap.ui.getCore().byId("currencyEditDialog").close();
            }.bind(this),
            error: function () {
              sap.ui.getCore().byId("currencyEditDialog").close();

              sap.m.MessageBox.error("Failed to update currency.");
            },
          });
        },

        onCreateApprovalTypeSubmit: function () {
          var sCode = sap.ui
            .getCore()
            .byId("createApprovalTypeCodeInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("createApprovalTypeDescInput")
            .getValue()
            .trim();

          if (!sCode || !sDesc) {
            sap.m.MessageBox.error("All fields are required.");
            return;
          }

          var oPayload = {
            CODE: sCode,
            DESC: sDesc,
          };

          var oModel = this.getView().getModel();

          oModel.create("/createApprovalType", oPayload, {
            success: function () {
              sap.m.MessageBox.success("Approval Type created successfully!");
              this.getMastertabledata("approvalType");

              sap.ui.getCore().byId("approvalTypeCreateDialog").close();
              // Optionally refresh your master table data
            }.bind(this),
            error: function () {
              sap.m.MessageBox.error("Failed to create Approval Type.");
            },
          });
        },

        onCreateRequestTypeSubmit: function () {
          debugger;
          var supType = sap.ui
            .getCore()
            .byId("createRequestTypeSuppInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("createRequestTypeDescInput")
            .getValue()
            .trim();
          if (!supType || !sDesc) {
            sap.m.MessageBox.error("All fields are required.");
            return;
          }
          var oPayload = {
            SUPPLIER_TYPE: supType,
            DESCRIPTION: sDesc,
          };

          var oModel = this.getView().getModel();

          oModel.create("/createRequestType", oPayload, {
            success: function () {
              sap.m.MessageBox.success(" Request Type created successfully!");
              this.getMastertabledata("RequestType");

              sap.ui.getCore().byId("RequestTypeCreateDialog").close();
              // Optionally refresh your master table data
            }.bind(this),
            error: function () {
              sap.m.MessageBox.error("Failed to Request Approval Type.");
            },
          });
        },

        onApprovalTypeCreateDialogClose: function () {
          sap.ui.getCore().byId("approvalTypeCreateDialog").close();
        },

        onVendorAccountEditDialogClose: function () {
          sap.ui.getCore().byId("vendorEditDialog").close();
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
          var sCode = sap.ui
            .getCore()
            .byId("editRequestTypeCodeInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("editRequestTypeDescInput")
            .getValue()
            .trim();
          var supType = sap.ui
            .getCore()
            .byId("editRequestTypeSuppInput")
            .getValue()
            .trim();

          if (!sCode || !sDesc || !supType) {
            sap.m.MessageBox.error("All fields are required.");
            return;
          }

          var oPayload = {
            CODE: sCode,
            SUPPLIER_TYPE: supType,
            DESCRIPTION: sDesc,
          };
          debugger;
          var oModel = this.getView().getModel();

          oModel.create("/updateRequestType", oPayload, {
            success: function () {
              sap.m.MessageBox.success("Request Type updated successfully!");
              this.getMastertabledata("RequestType");

              sap.ui.getCore().byId("RequestTypeEditDialog").close();
              // Optionally refresh your master table data
            }.bind(this),
            error: function () {
              sap.m.MessageBox.error("Failed to Request Approval Type.");
            },
          });
        },

        onApprovalTypeEditDialogClose: function () {
          sap.ui.getCore().byId("approvalTypeEditDialog").close();
        },
        onRequestlTypeEditDialogClose: function () {
          sap.ui.getCore().byId("RequestTypeEditDialog").close();
        },
        onEditApprovalTypeSubmit: function () {
          var sCode = sap.ui
            .getCore()
            .byId("editApprovalTypeCodeInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("editApprovalTypeDescInput")
            .getValue()
            .trim();

          if (!sCode || !sDesc) {
            sap.m.MessageBox.error("All fields are required.");
            return;
          }

          var oPayload = {
            CODE: sCode,
            DESC: sDesc,
          };

          var oModel = this.getView().getModel();

          oModel.create("/updateApprovalType", oPayload, {
            success: function () {
              sap.m.MessageBox.success("Approval Type updated successfully!");
              this.getMastertabledata("approvalType");

              sap.ui.getCore().byId("approvalTypeEditDialog").close();
              // Optionally refresh your master table data
            }.bind(this),
            error: function () {
              sap.m.MessageBox.error("Failed to update Approval Type.");
            },
          });
        },

        onApprovalTypeEditDialogClose: function () {
          sap.ui.getCore().byId("approvalTypeEditDialog").close();
        },

        onCreateCompanyCodeSubmit: function () {
          var sCode = sap.ui
            .getCore()
            .byId("createCompanyCodeInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("createCompanyDescInput")
            .getValue()
            .trim();
          var sCity = sap.ui
            .getCore()
            .byId("createCompanyCityInput")
            .getValue()
            .trim();
          var sCurr = sap.ui
            .getCore()
            .byId("createCompanyCurrencyInput")
            .getValue()
            .trim();

          if (!sCode || !sDesc || !sCity || !sCurr) {
            sap.m.MessageBox.error("All fields are required.");
            return;
          }

          var oPayload = {
            BUKRS: sCode,
            BUTXT: sDesc,
            ORT01: sCity,
            WAERS: sCurr,
          };

          var oModel = this.getView().getModel();

          oModel.create("/createCompanyCode", oPayload, {
            success: function () {
              sap.m.MessageBox.success("Company Code created successfully!");
              sap.ui.getCore().byId("companyCodeCreateDialog").close();
              this.getMastertabledata("companyCode");
            }.bind(this),
            error: function () {
              sap.m.MessageBox.error("Failed to create Company Code.");
            },
          });
        },

        onCreateUserRoleSubmit: function () {
          var sCode = sap.ui
            .getCore()
            .byId("createUserRoleCodeInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("createUserRoleDescInput")
            .getValue()
            .trim();

          if (!sCode || !sDesc) {
            sap.m.MessageBox.error("All fields are required.");
            return;
          }

          var oPayload = {
            CODE: sCode,
            DESCRIPTION: sDesc,
          };

          var oModel = this.getView().getModel();

          oModel.create("/createUserRole", oPayload, {
            success: function () {
              sap.m.MessageBox.success("User Role created successfully!");
              sap.ui.getCore().byId("userRoleCreateDialog").close();
              this.getMastertabledata("userRole");
            }.bind(this),
            error: function () {
              sap.m.MessageBox.error("Failed to create User Role.");
            },
          });
        },

        onCreateVendorAccount: function () {
          var sCode = sap.ui
            .getCore()
            .byId("createvendorAccountCodeInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("createvendorAccountDescInput")
            .getValue()
            .trim();

          if (!sCode || !sDesc) {
            sap.m.MessageBox.error("All fields are required.");
            return;
          }

          var oPayload = {
            CODE: sCode,
            DESCRIPTION: sDesc,
          };

          var oModel = this.getView().getModel();

          oModel.create("/createVendorAccountGroup", oPayload, {
            success: function () {
              sap.ui.getCore().byId("vendorCreateDialog").close();
              sap.m.MessageBox.success(
                "Vendor Account Group created successfully!"
              );
              this.getMastertabledata("vendorAccountGroup");
            }.bind(this),
            error: function () {
              sap.m.MessageBox.error("Failed to create User Role.");
            },
          });
        },

        onUserRoleCreateDialogClose: function () {
          sap.ui.getCore().byId("userRoleCreateDialog").close();
        },

        onCompanyCodeCreateDialogClose: function () {
          sap.ui.getCore().byId("companyCodeCreateDialog").close();
        },

        onEditCompanyCodeSubmit: function () {
          var sCode = sap.ui
            .getCore()
            .byId("editCompanyCodeInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("editCompanyDescInput")
            .getValue()
            .trim();
          var sCity = sap.ui
            .getCore()
            .byId("editCompanyCityInput")
            .getValue()
            .trim();
          var sCurr = sap.ui
            .getCore()
            .byId("editCompanyCurrencyInput")
            .getValue()
            .trim();

          if (!sCode || !sDesc || !sCity || !sCurr) {
            sap.m.MessageBox.error("All fields are required.");
            return;
          }

          var oPayload = {
            BUKRS: sCode,
            BUTXT: sDesc,
            ORT01: sCity,
            WAERS: sCurr,
          };

          var oModel = this.getView().getModel();

          oModel.create("/updateCompanyCode", oPayload, {
            success: function () {
              sap.m.MessageBox.success("Company Code updated successfully!");
              this.getMastertabledata("companyCode");
              sap.ui.getCore().byId("companyCodeEditDialog").close();
            }.bind(this),
            error: function () {
              sap.m.MessageBox.error("Failed to update Company Code.");
            },
          });
        },

        onEditUserRoleSubmit: function () {
          var sCode = sap.ui
            .getCore()
            .byId("editUserRoleCodeInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("editUserRoleDescInput")
            .getValue()
            .trim();

          if (!sCode || !sDesc) {
            sap.m.MessageBox.error("All fields are required.");
            return;
          }

          var oPayload = {
            CODE: sCode,
            DESCRIPTION: sDesc,
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
            },
          });
        },

        onEditvendorSubmit: function () {
          var sCode = sap.ui
            .getCore()
            .byId("editVendorCodeInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("editVendorDescInput")
            .getValue()
            .trim();

          if (!sCode || !sDesc) {
            sap.m.MessageBox.error("All fields are required.");
            return;
          }

          var oPayload = {
            CODE: sCode,
            DESCRIPTION: sDesc,
          };

          var oModel = this.getView().getModel();

          oModel.create("/updateVendorAccountGroup", oPayload, {
            success: function () {
              sap.m.MessageBox.success(
                "Vendor Account Group updated successfully!"
              );
              sap.ui.getCore().byId("vendorEditDialog").close();
              this.getMastertabledata("vendorAccountGroup");
            }.bind(this),
            error: function () {
              sap.m.MessageBox.error("Failed to update User Role.");
            },
          });
        },

        onUserRoleEditDialogClose: function () {
          sap.ui.getCore().byId("userRoleEditDialog").close();
        },

        onCompanyCodeEditDialogClose: function () {
          sap.ui.getCore().byId("companyCodeEditDialog").close();
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

        onvendorAccountDialogClose: function(){
          this._vendoraccountGroupCreateDialog.close();
        },

        onNavHome: function(){
          this.getOwnerComponent().getRouter().navTo("RouteSystemView")
        }
      }
    );
  }
);
