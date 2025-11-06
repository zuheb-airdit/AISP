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
      "com.sconfig.systemconfiguration2aisp.controller.SupplierForm",
      {
        onInit() {
          var oFieldConfigModel = new JSONModel({
            results: [],
            buttonsEnabled: false,
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
              {
                key: "Operational Information",
                text: "Operational Information",
              },
            ],
            categories: [
              { key: "", text: "All" },
              { key: "Primary Bank details", text: "Primary Bank details" },
              { key: "TAX-VAT-GST", text: "TAX-VAT-GST" },
              { key: "Operational Capacity", text: "Operational Capacity" },
              {
                key: "Standard Certifications",
                text: "Standard Certifications",
              },
              {
                key: "Product-Service Description",
                text: "Product-Service Description",
              },
              { key: "Declaration", text: "Declaration" },
              { key: "Address", text: "Address" },
              { key: "Primary Contact", text: "Primary Contact" },
              { key: "Supplier Information", text: "Supplier Information" },
            ],
            fieldTypes: [
              { key: "", text: "All" },
              { key: "textBox", text: "Text" },
              { key: "select", text: "Dropdown" },
              { key: "calendar", text: "Calendar" },
              { key: "radio", text: "Radio" },
              { key: "checkBox", text: "Checkbox" },
            ],
          });
          this.getView().setModel(oFilterModel, "filterModel");
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
            options: [],
          });
          this.getView().setModel(oEditFieldModel, "EditFieldModel");
          this.appId = "com.sconfig.systemconfiguration2aisp";
        },

        onEditFieldPress: function (oEvent) {
          var oContext = oEvent
            .getSource()
            .getParent()
            .getBindingContext("fieldConfigModel");
          var oField = oContext.getObject();
          this._currentFieldConfig = oField;

          if (!this._editFormFieldDialog) {
            this._editFormFieldDialog = sap.ui.xmlfragment(
              `${this.appId}.fragments.UpdateFormField`,
              this
            );
            this.getView().addDependent(this._editFormFieldDialog);
          }

          sap.ui
            .getCore()
            .byId("updateFieldIdInput")
            .setValue(oField.FIELD_ID || "");
          sap.ui
            .getCore()
            .byId("updateFieldLabelInput")
            .setValue(oField.FIELD_LABEL || "");
          sap.ui
            .getCore()
            .byId("updateFieldDescInput")
            .setValue(oField.DESCRIPTION || "");
          sap.ui
            .getCore()
            .byId("updatePlaceholderInput")
            .setValue(oField.PLACEHOLDER || "");
          sap.ui
            .getCore()
            .byId("updateDefaultValueInput")
            .setValue(oField.DEFAULT_VALUE || "");
          sap.ui
            .getCore()
            .byId("updateMinimumInput")
            .setValue(oField.MINIMUM || "");
          sap.ui
            .getCore()
            .byId("updateMaximumInput")
            .setValue(oField.MAXIMUM || "");
          sap.ui
            .getCore()
            .byId("updateVisibleSwitch")
            .setState(!!oField.IS_VISIBLE);
          sap.ui
            .getCore()
            .byId("updateMandatorySwitch")
            .setState(!!oField.IS_MANDATORY);
          sap.ui
            .getCore()
            .byId("updateFieldTypeSelect")
            .setSelectedKey(oField.FIELD_TYPE || "");

          var mTypeMapping = {
            Input: "textBox",
            Dropdown: "select",
            Number: "number",
            Rating: "rating",
            Calendar: "calendar",
            CheckBox: "checkBox",
            Radio: "radio",
            TextArea: "textArea",
          };
          var sDialogFieldType =
            mTypeMapping[oField.FIELD_TYPE] || oField.FIELD_TYPE;

          // Parse DROPDOWN_OPTIONS string into options array
          var aOptions = [];
          if (
            oField.DROPDOWN_OPTIONS &&
            typeof oField.DROPDOWN_OPTIONS === "string"
          ) {
            aOptions = oField.DROPDOWN_OPTIONS.split(",").map(function (
              sValue
            ) {
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
            dropdownOptions: aOptions,
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

          var sFieldId = sap.ui
            .getCore()
            .byId("updateFieldIdInput")
            .getValue()
            .trim();
          var sFieldLabel = sap.ui
            .getCore()
            .byId("updateFieldLabelInput")
            .getValue()
            .trim();
          var sDesc = sap.ui
            .getCore()
            .byId("updateFieldDescInput")
            .getValue()
            .trim();
          var sPlaceholder = sap.ui
            .getCore()
            .byId("updatePlaceholderInput")
            .getValue()
            .trim();
          var sDefaultValue = sap.ui
            .getCore()
            .byId("updateDefaultValueInput")
            .getValue()
            .trim();
          var sMinimum = sap.ui
            .getCore()
            .byId("updateMinimumInput")
            .getValue()
            .trim();
          var sMaximum = sap.ui
            .getCore()
            .byId("updateMaximumInput")
            .getValue()
            .trim();
          var sFieldType = sap.ui
            .getCore()
            .byId("updateFieldTypeSelect")
            .getSelectedKey();
          var bVisible = sap.ui
            .getCore()
            .byId("updateVisibleSwitch")
            .getState();
          var bMandatory = sap.ui
            .getCore()
            .byId("updateMandatorySwitch")
            .getState();

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
              sap.m.MessageBox.error(
                "At least one dropdown option is required for dropdown fields."
              );
              return;
            }
            // Convert options back to comma-separated string for DROPDOWN_OPTIONS
            sDropdownValues = aOptions
              .map(function (oOption) {
                return oOption.displayValue;
              })
              .join(",");
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
              DROPDOWN_OPTIONS: sDropdownValues,
            },
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
              sap.m.MessageBox.error(
                "Failed to update field: " + (err.message || "Unknown error.")
              );
            }.bind(this),
          });
        },

        onCreateFieldPress: function (oEvent) {
          // Make sure the fragment is only created once
          if (!this._createFieldDialog) {
            this._createFieldDialog = sap.ui.xmlfragment(
              `${this.appId}.fragments.AddFormFields`,
              this
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
            new sap.ui.model.Filter(
              "COMPANY_CODE",
              sap.ui.model.FilterOperator.EQ,
              sEntityCode
            ),
            new sap.ui.model.Filter(
              "REQUEST_TYPE",
              sap.ui.model.FilterOperator.EQ,
              sRequestType
            ),
          ];

          var oModel = oView.getModel();
          oView.setBusy(true);

          oModel.read("/FieldConfig", {
            filters: aFilters,
            success: function (res) {
              var oFieldConfigModel = oView.getModel("fieldConfigModel");
              oFieldConfigModel.setProperty("/results", res.results || []);
              oFieldConfigModel.setProperty(
                "/buttonsEnabled",
                res.results && res.results.length > 0
              );
              oView.setBusy(false);
            }.bind(this),
            error: function () {
              oView.setBusy(false);
              sap.m.MessageBox.error("Failed to refresh field configuration.");
            }.bind(this),
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
          var sSourceRequestType =
            this.byId("requestTypeCombo").getSelectedKey();
          var sTargetCompanyCode = sap.ui
            .getCore()
            .byId("addEntityInput")
            .getSelectedKey();
          var sTargetRequestType = sap.ui
            .getCore()
            .byId("addRequestTypeInput")
            .getSelectedKey();
          if (!sSourceCompanyCode || !sSourceRequestType) {
            sap.m.MessageBox.error("Please fill in all required fields.");
            return;
          }
          var oPayload = {
            sourceCompanyCode: sSourceCompanyCode,
            sourceRequestType: sSourceRequestType,
            targetCompanyCode: sTargetCompanyCode,
            targetRequestType: sTargetRequestType,
          };
          var oModel = this.getView().getModel();
          oModel.create("/CopyFieldConfig", oPayload, {
            success: function (res) {
              debugger;
              sap.m.MessageBox.success(
                "Field configuration copied successfully!"
              );
              sap.ui.getCore().byId("addFormFieldsDialog").close();
            },
            error: function (err) {
              debugger;
              sap.m.MessageBox.error("Failed to copy field configuration.");
            },
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
            sap.m.MessageBox.error("Please select an Company Code.");
            this.getView().setBusy(false);
            return; // Stop further execution
          }

          var aFilters = [
            new Filter("COMPANY_CODE", FilterOperator.EQ, sEntityCode),
            new Filter("REQUEST_TYPE", FilterOperator.EQ, sRequestType),
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
              var oFieldConfigModel =
                this.getView().getModel("fieldConfigModel");
              // Update the results with the response data
              oFieldConfigModel.setProperty("/results", res.results || []);
              // Enable buttons if data is loaded
              oFieldConfigModel.setProperty(
                "/buttonsEnabled",
                res.results && res.results.length > 0
              );
              this.getView().setBusy(false);
            }.bind(this), // Maintain controller context
            error: function (err) {
              // Display an error message and keep buttons disabled
              this.getView()
                .getModel("fieldConfigModel")
                .setProperty("/buttonsEnabled", false);
              this.getView().setBusy(false);
              MessageBox.error("Failed to load Field Configuration data.");
            }.bind(this),
          });
        },

        onNavigateNew: function () {
          debugger;
          var sCompanyCode = this.byId("idSourceCC").getSelectedKey();
          var sRequestType = this.byId("requestTypeCombo").getSelectedKey();

          if (!sCompanyCode || !sRequestType) {
            sap.m.MessageBox.error(
              "Please select both Company Code and Request Type before proceeding."
            );
            return;
          }

          this.getOwnerComponent()
            .getRouter()
            .navTo("RouteNew", {
              companyCode: encodeURIComponent(sCompanyCode),
              requestType: encodeURIComponent(sRequestType),
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
              new Filter("DESCRIPTION", FilterOperator.Contains, sQuery),
            ];
            oBinding.filter(
              new Filter({
                filters: aFilters,
                and: false,
              })
            );
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

          var sSection = sap.ui
            .getCore()
            .byId("filterSectionSelect")
            .getSelectedKey();
          var sCategory = sap.ui
            .getCore()
            .byId("filterCategorySelect")
            .getSelectedKey();
          var sFieldType = sap.ui
            .getCore()
            .byId("filterFieldTypeSelect")
            .getSelectedKey();

          if (sSection) {
            aFilters.push(new Filter("SECTION", FilterOperator.EQ, sSection));
          }
          if (sCategory) {
            aFilters.push(new Filter("CATEGORY", FilterOperator.EQ, sCategory));
          }
          if (sFieldType) {
            var sMappedFieldType =
              {
                textBox: "Input",
                select: "Dropdown",
                calendar: "Calendar",
                radio: "Radio",
                checkBox: "Checkbox",
              }[sFieldType] || sFieldType;
            aFilters.push(
              new Filter("FIELD_TYPE", FilterOperator.EQ, sMappedFieldType)
            );
          }

          oBinding.filter(
            aFilters.length
              ? new Filter({
                  filters: aFilters,
                  and: true,
                })
              : []
          );
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
            {
              label: "Visibility",
              property: "IS_VISIBLE",
              formatter: function (bVisible) {
                return bVisible ? "Yes" : "No";
              },
            },
            {
              label: "Mandatory",
              property: "IS_MANDATORY",
              formatter: function (bMandatory) {
                return bMandatory ? "Yes" : "No";
              },
            },
          ];

          var oSettings = {
            workbook: { columns: aCols },
            dataSource: oRowBinding,
            fileName:
              "FieldConfiguration_" +
              new Date().toISOString().slice(0, 10) +
              ".csv",
          };

          var oSheet = new Spreadsheet(oSettings);
          oSheet.build().finally(function () {
            oSheet.destroy();
          });
        },

        onNavHome: function () {
          this.getOwnerComponent().getRouter().navTo("RouteSystemView");
        },
      }
    );
  }
);
