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
      "com.sconfig.systemconfiguration2aisp.controller.ProcurementFields",
      {
        onInit() {
          var oData = {
            applications: [],
            selectedApplication: "",
            procurementFields: [],
            isEditable: false,
          };
          var oJsonModel = new JSONModel(oData);
          this.getView().setModel(oJsonModel, "procFieldsModel");
        },

        onApplicationChange: function (oEvent) {
          let sApplication = this.byId("applicationCombo").getValue();
          // var sApplication = oEvent.getSource().getSelectedKey();
          var oJsonModel = this.getView().getModel("procFieldsModel");
          oJsonModel.setProperty("/selectedApplication", sApplication);
          if (sApplication) {
            this._loadProcurementFields(sApplication);
          } else {
            oJsonModel.setProperty("/procurementFields", []);
          }
        },

        _loadProcurementFields: function (sApplication) {
          var oODataModel = this.getView().getModel();
          var oJsonModel = this.getView().getModel("procFieldsModel");
          var aFilters = [
            new Filter(
              "APPLICATION_NAME",
              FilterOperator.EQ,
              "AISP_VIM_WO_OCR"
            ),
          ];
          this.getView().setBusy(true);
          oODataModel.read("/PROCUREMENT_FORM_FIELD_CONFIG", {
            filters: aFilters,
            success: function (oData) {
              var aFields = oData.results.map(function (o, index) {
                return {
                  slNo: index + 1,
                  APPLICATION_NAME: o.APPLICATION_NAME,
                  SECTION: o.SECTION,
                  TECH_FIELD: o.TECH_FIELD,
                  FIELD_NAME: o.FIELD_NAME,
                  VISIBLE: o.VISIBLE,
                  MANDATORY: o.MANDATORY,
                  EDITABLE: o.EDITABLE,
                };
              });
              oJsonModel.setProperty("/procurementFields", aFields);
              this.getView().setBusy(false);
            }.bind(this),
            error: function (oError) {
              this.getView().setBusy(false);
              MessageToast.show(
                "Error loading fields: " + (oError.message || "Unknown error")
              );
              oJsonModel.setProperty("/procurementFields", []);
            },
          });
        },

        onEditPressPF: function () {
          var oJsonModel = this.getView().getModel("procFieldsModel");
          var bIsEditable = !oJsonModel.getProperty("/isEditable");
          oJsonModel.setProperty("/isEditable", bIsEditable);
          MessageToast.show(
            bIsEditable ? "Edit mode enabled" : "Edit mode disabled"
          );
        },

        _loadApplications: function () {
          var oODataModel = this.getView().getModel();
          var oJsonModel = this.getView().getModel("procFieldsModel");
          this.getView().setBusy(true);
          oODataModel.read("/PROCUREMENT_FORM_FIELD_CONFIG", {
            urlParameters: {
              $select: "APPLICATION_NAME",
              $apply: "groupby((APPLICATION_NAME))",
            },
            success: function (oData) {
              var aApplications = oData.results.map(function (o) {
                return { APPLICATION_NAME: o.APPLICATION_NAME };
              });
              oJsonModel.setProperty("/applications", aApplications);
              this.getView().setBusy(false);
            }.bind(this),
            error: function (oError) {
              this.getView().setBusy(false);
              MessageToast.show(
                "Error loading applications: " +
                  (oError.message || "Unknown error")
              );
            },
          });
        },

        onRowEditPress: function (oEvent) {
          var oContext = oEvent
            .getSource()
            .getBindingContext("procFieldsModel");
          var oField = oContext.getObject();

          // Create edit model for dialog
          var oEditModel = new JSONModel({
            APPLICATION_NAME: oField.APPLICATION_NAME,
            SECTION: oField.SECTION,
            TECH_FIELD: oField.TECH_FIELD,
            FIELD_NAME: oField.FIELD_NAME,
            VISIBLE: oField.VISIBLE,
            MANDATORY: oField.MANDATORY,
            EDITABLE: oField.EDITABLE,
            URI: oField.URI,
          });
          this.getView().setModel(oEditModel, "editModel");

          // Load and open dialog
          if (!this._oEditDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.sconfig.systemconfiguration2aisp.fragments.EditFieldDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oEditDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oEditDialog.open();
          }
        },

        onSubmitEditDialog: function () {
          var oEditModel = this.getView().getModel("editModel");
          var oFieldData = oEditModel.getData();
          var oODataModel = this.getView().getModel();

          // Prepare payload for update
          var oPayload = {
            APPLICATION_NAME: oFieldData.APPLICATION_NAME,
            SECTION: oFieldData.SECTION,
            TECH_FIELD: oFieldData.TECH_FIELD,
            FIELD_NAME: oFieldData.FIELD_NAME,
            VISIBLE: oFieldData.VISIBLE,
            MANDATORY: oFieldData.MANDATORY,
            EDITABLE: oFieldData.EDITABLE,
          };

          MessageBox.confirm(
            "Are you sure you want to update the field settings?",
            {
              title: "Confirm",
              onClose: function (sAction) {
                if (sAction === MessageBox.Action.OK) {
                  this.getView().setBusy(true);
                  oODataModel.create("/updateFieldConfig", oPayload, {
                    success: function () {
                      this.getView().setBusy(false);
                      MessageBox.success("Field updated successfully");
                      // Refresh table data
                      var sApplication = this.getView()
                        .getModel("procFieldsModel")
                        .getProperty("/selectedApplication");
                      this._loadProcurementFields(sApplication);
                      this._oEditDialog.close();
                    }.bind(this),
                    error: function (oError) {
                      this.getView().setBusy(false);
                      MessageBox.error(
                        "Error updating field: " +
                          (oError.message || "Unknown error")
                      );
                    }.bind(this),
                  });
                }
              }.bind(this),
            }
          );
        },

        formatSection: function (sValue) {
          return sValue ? sValue.replace(/_/g, " ") : sValue;
        },
        formatSectiona: function (sSection) {
          if (!sSection) return "";
          return sSection
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");
        },

        onCancelEditDialog: function () {
          this._oEditDialog.close();
        },

        onNavHome: function () {
          this.getOwnerComponent().getRouter().navTo("RouteSystemView");
        },
      }
    );
  }
);
