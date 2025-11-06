sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/HTML",
    "sap/ui/layout/form/SimpleForm",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/RadioButton",
    "sap/m/RadioButtonGroup",
    "sap/m/Toolbar",
    "sap/m/Title",
    "sap/m/ToolbarSpacer",
    "sap/m/VBox",
  ],
  function (
    Controller,
    UIComponent,
    JSONModel,
    MessageBox,
    Fragment,
    Filter,
    FilterOperator,
    MessageToast,
    HTML,
    SimpleForm,
    Label,
    Input,
    Button,
    RadioButton,
    RadioButtonGroup,
    Toolbar,
    Title,
    ToolbarSpacer,
    VBox
  ) {
    "use strict";

    return Controller.extend(
      "com.registration.registrationapprovalaisp.controller.RegistrationApprovalObj",
      {
        onInit: function () {
          var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
          let oModel = this.getOwnerComponent().getModel();
          let formModel = this.getOwnerComponent().getModel("formData");
          this.getView().setModel(formModel, "formDataModel");
          const graphModel = new JSONModel({
            logs: [],
          });
          this.getView().setModel(graphModel, "graphModel");

          this.getView().setModel(oModel);
          oRouter
            .getRoute("RegisterObjPage")
            .attachPatternMatched(this.onObjectMatched, this);
        },

        loadApprovalLogs: function (requestNo) {
          const oModel = this.getView().getModel();
          const oGraphModel = this.getView().getModel("graphModel");

          const parseTimestamp = (raw) => {
            if (typeof raw === "string") {
              if (raw.includes("/Date(")) {
                return new Date(
                  parseInt(raw.replace("/Date(", "").replace(")/", ""))
                );
              }
              return new Date(raw);
            }
            if (typeof raw === "number") return new Date(raw);
            if (raw instanceof Date) return raw;
            return new Date();
          };

          const formatTimestamp = (date) => {
            // Format as "DD/MM/YYYY, HH:MM AM/PM"
            const options = {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            };
            return date.toLocaleString("en-GB", options).replace(",", "");
          };

          const getStatus = (action) => {
            switch (action) {
              case "CREATE":
                return "Information";
              case "APPROVE":
                return "Success";
              case "SEND_BACK":
                return "Warning";
              case "REJECT":
                return "Error";
              case "EDIT_RESUBMIT":
                return "Information";
              default:
                return "None";
            }
          };

          const getIcon = (action) => {
            switch (action) {
              case "CREATE":
                return "sap-icon://create";
              case "APPROVE":
                return "sap-icon://accept";
              case "SEND_BACK":
                return "sap-icon://undo";
              case "REJECT":
                return "sap-icon://decline";
              case "EDIT_RESUBMIT":
                return "sap-icon://edit";
              default:
                return "sap-icon://activity-items";
            }
          };

          oModel.read("/APPROVAL_LOGS_AISP", {
            filters: [new sap.ui.model.Filter("REQUEST_NO", "EQ", requestNo)],
            success: function (oData) {
              const aLogs = oData.results || [];
              if (!aLogs.length) {
                sap.m.MessageToast.show("No approval logs found.");
                oGraphModel.setProperty("/logs", []);
                return;
              }

              // Sort logs by timestamp
              aLogs.sort(
                (a, b) =>
                  parseTimestamp(a.TIMESTAMP) - parseTimestamp(b.TIMESTAMP)
              );

              const logs = aLogs.map((log) => {
                const timestamp = parseTimestamp(log.TIMESTAMP);
                return {
                  timestamp: formatTimestamp(timestamp), // For display
                  rawTimestamp: timestamp.toISOString(), // For binding
                  action: log.ACTION,
                  approver: log.APPROVER_ID,
                  role: log.APPROVER_ROLE || "N/A",
                  comment: log.COMMENT || "No comment provided",
                  level: log.APPROVAL_LEVEL,
                  status: getStatus(log.ACTION),
                  icon: getIcon(log.ACTION),
                };
              });

              oGraphModel.setProperty("/logs", logs);
              console.log("Timeline logs:", JSON.stringify(logs, null, 2));
            }.bind(this),
            error: function (err) {
              sap.m.MessageToast.show("Error fetching logs.");
              oGraphModel.setProperty("/logs", []);
            }.bind(this),
          });
        },

        onObjectMatched: function (oEvent) {
          const oView = this.getView();
          oView.byId("idSendBackBtn").setEnabled(true);
          oView.byId("idRejectBtn").setEnabled(true);
          oView.byId("idAcceptBtn").setEnabled(true);
          oView.byId("idSubmitBtn").setVisible(false);
          this.getView().setBusy(true);
          var sObjectId = oEvent.getParameter("arguments").id;
          this.loadApprovalLogs(sObjectId);

          // let oModel = this.getOwnerComponent().getModel("registration-manage");
          // this.getView().setModel(oModel)
          let model = this.getView().getModel();
          let sPath = `/RequestInfo/${sObjectId}`;
          debugger;
          model.read(sPath, {
            success: function (res) {
              debugger;
              this.responseData = res;
              let req = res.REQUEST_TYPE;
              let cCode = res.COMPANY_CODE;
              var oJsonModel = new JSONModel(res);
              this.getView().setModel(oJsonModel, "requestInfo");
              oJsonModel.setProperty("/editable", false);
              this.getView().setBusy(false);
              this.getFormValues(req, cCode);
              let arrAttachemnts = res.TO_ATTACHMENTS.results.map((item) => {
                return {
                  REGESTERED_MAIL: item.REGISTERED_MAIL,
                  DESCRIPTION: item.DESCRIPTION,
                  IMAGEURL: item.IMAGEURL,
                  IMAGE_FILE_NAME: item.IMAGE_FILE_NAME,
                };
              });
            }.bind(this),
            error: function (err) {
              debugger;
            },
          });
        },

        getFormValues: function (req, cCode) {
          const oView = this.getView();
          oView.setBusy(true);

          // Get the model for FieldConfig (assuming default model or 'registration-manage')
          let oModel = this.getOwnerComponent().getModel("admin"); // Adjust to 'registration-manage' if needed

          // Validate inputs
          if (!req || !cCode) {
            sap.m.MessageToast.show(
              "Request number or company code is missing"
            );
            oView.setBusy(false);
            return;
          }

          // Create filters for FieldConfig
          const aFilters = [
            new sap.ui.model.Filter(
              "COMPANY_CODE",
              sap.ui.model.FilterOperator.EQ,
              cCode
            ),
            new sap.ui.model.Filter(
              "REQUEST_TYPE",
              sap.ui.model.FilterOperator.EQ,
              req
            ),
          ];

          // Fetch FieldConfig data
          oModel.read("/FieldConfig", {
            filters: aFilters,
            success: function (fieldCfgRes) {
              let fieldConfig =
                fieldCfgRes.results || fieldCfgRes.value || fieldCfgRes;
              if (
                !fieldConfig ||
                (Array.isArray(fieldConfig) && fieldConfig.length === 0)
              ) {
                sap.m.MessageToast.show(
                  "No field configuration data available for the provided request number and company code."
                );
                fieldConfig = { results: [] }; // Empty structure to avoid errors in buildFormDataBySectionCategory
              }
              const formDataModel = this.buildFormDataBySectionCategory(
                fieldConfig,
                "sendback"
              );
              const oFormDataModel = new sap.ui.model.json.JSONModel(
                formDataModel
              );
              oView.setModel(oFormDataModel, "formDataModel");
              this.createDynamicForm(formDataModel, "sendback");
              oView.setBusy(false);
            }.bind(this),
            error: function (err) {
              console.error(err);
              sap.m.MessageToast.show("Failed to load FieldConfig data");
              oView.setBusy(false);
            },
          });
        },

        buildFormDataBySectionCategory: function (fields, type) {
          this.currentType = type;
          const model = {
            Attachments: [], // Initialize Attachments at the root level
          };
          console.log("Building form data from fields:", fields, type);

          // Map to store unique field keys per section/category/index
          const fieldKeyMap = {};

          // Helper function to normalize field keys
          const normalizeKey = (key) => key.replace(/\s+/g, "_").toUpperCase();

          // Process static fields
          fields.forEach((field) => {
            const section = field.SECTION;
            const category = field.CATEGORY;
            const key = field.FIELD_PATH;
            const normalizedKey = normalizeKey(key);
            const fieldKeyIdentifier = `${section}/${category}/${normalizedKey}/0`;

            if (section === "Attachments" && field.IS_VISIBLE) {
              model.Attachments.push({
                title: field.FIELD_LABEL,
                description: "",
                fileName: "",
                uploaded: false,
                fieldPath: field.FIELD_PATH,
                fieldId: field.FIELD_ID,
                imageUrl: "",
                mandatory: !!field.IS_MANDATORY,
                visible: !!field.IS_VISIBLE,
              });
              return;
            }

            if (!model[section]) model[section] = {};
            if (!model[section][category]) {
              if (category === "Address") {
                model[section][category] = [{ ADDRESS_TYPE: "Primary" }];
              } else if (category === "Primary Bank details") {
                model[section][category] = [{ BANK_TYPE: "Primary" }];
              } else {
                model[section][category] = {};
              }
            }

            const fieldData = {
              label: field.FIELD_LABEL,
              mandatory: !!field.IS_MANDATORY,
              visible: !!field.IS_VISIBLE,
              type: field.FIELD_TYPE || "",
              description: field.DESCRIPTION || "",
              value: field.DEFAULT_VALUE || "",
              fieldId: field.FIELD_ID || "",
              companyCode: field.COMPANY_CODE || "",
              requestType: field.REQUEST_TYPE || "",
              minimum: field.MINIMUM || "",
              maximum: field.MAXIMUM || "",
              placeholder: field.PLACEHOLDER || "",
              dropdownValues: field.DROPDOWN_VALUES || "",
              newDynamicFormField: !!field.NEW_DYANAMIC_FORM_FIELD,
            };

            if (fieldKeyMap[fieldKeyIdentifier]) {
              console.warn(
                `Duplicate static field detected: ${fieldKeyIdentifier}. Merging.`
              );
              const existingField =
                category === "Address" || category === "Primary Bank details"
                  ? model[section][category][0][key]
                  : model[section][category][key];
              if (
                (fieldData.value && !existingField.value) ||
                (fieldData.fieldId && !existingField.fieldId)
              ) {
                if (category === "Address" && key !== "ADDRESS_TYPE") {
                  model[section][category][0][key] = {
                    ...existingField,
                    ...fieldData,
                  };
                } else if (
                  category === "Primary Bank details" &&
                  key !== "BANK_TYPE"
                ) {
                  model[section][category][0][key] = {
                    ...existingField,
                    ...fieldData,
                  };
                } else if (
                  category !== "Address" &&
                  category !== "Primary Bank details"
                ) {
                  model[section][category][key] = {
                    ...existingField,
                    ...fieldData,
                  };
                }
              }
              return;
            }
            fieldKeyMap[fieldKeyIdentifier] = true;

            if (category === "Address" && key !== "ADDRESS_TYPE") {
              model[section][category][0][key] = fieldData;
            } else if (
              category === "Primary Bank details" &&
              key !== "BANK_TYPE"
            ) {
              model[section][category][0][key] = fieldData;
            } else if (
              category !== "Address" &&
              category !== "Primary Bank details"
            ) {
              model[section][category][key] = fieldData;
            }
          });

          if (type === "sendback") {
            const r = this.responseData;

            // Log TO_DYNAMIC_FIELDS for debugging
            console.log(
              "TO_DYNAMIC_FIELDS:",
              JSON.stringify(r.TO_DYNAMIC_FIELDS?.results, null, 2)
            );

            var oDisclosureModelData = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(oDisclosureModelData, "existModel");

            const disclosure = model["Disclosures"];
            if (disclosure && type === "sendback") {
              const disclosureKeys = Object.keys(disclosure);
              const fieldMapping = {
                "Conflict of Interest": "INTEREST_CONFLICT",
                "Legal Case Disclosure": "ANY_LEGAL_CASES",
                "Anti-Corruption Regulation": "ABAC_REG",
                "Export Control": "CONTROL_REGULATION",
              };
              const valueMapping = { YES: 0, NO: 1, NA: 2 };
              const reverseValueMapping = { 0: "YES", 1: "NO", 2: "NA" };

              disclosureKeys.forEach(function (fieldKey) {
                const field = disclosure[fieldKey];
                if (field && fieldKey) {
                  const mappedField = fieldMapping[fieldKey];
                  const innerFieldKey = Object.keys(field)[0];

                  if (
                    r &&
                    r.TO_DISCLOSURE_FIELDS &&
                    r.TO_DISCLOSURE_FIELDS.results &&
                    r.TO_DISCLOSURE_FIELDS.results.length > 0
                  ) {
                    const disclosureData = r.TO_DISCLOSURE_FIELDS.results[0];
                    let fieldValue = disclosureData[mappedField] || "NA";
                    const numericValue = valueMapping[fieldValue];
                    const displayValue = reverseValueMapping[numericValue];

                    if (field[innerFieldKey]) {
                      field[innerFieldKey].value = displayValue;
                      console.log(
                        `Set disclosure field ${fieldKey}/${innerFieldKey} value:`,
                        displayValue
                      );
                    } else {
                      console.error(
                        `Inner field ${innerFieldKey} not found in ${fieldKey}`
                      );
                    }

                    let propertyName =
                      "/" +
                      fieldKey
                        .toLowerCase()
                        .replace(/ /g, "")
                        .replace("&", "")
                        .replace("-", "");
                    oDisclosureModelData.setProperty(
                      propertyName,
                      numericValue
                    );
                    console.log(
                      `Set existModel field ${fieldKey} (mapped to ${mappedField}):`,
                      propertyName,
                      "with numeric value:",
                      numericValue
                    );
                  } else {
                    console.error(
                      `Disclosure data for ${mappedField} not found in response.`
                    );
                    field[innerFieldKey].value = "N/A";
                  }
                } else {
                  console.error(
                    `Missing or invalid data for field: ${fieldKey}. Full field data:`,
                    field
                  );
                }
              });
            } else {
              console.warn(
                "Disclosures section not found in model or type is not 'sendback'."
              );
            }

            const sInfo = model["Supplier Information"];
            if (sInfo) {
              const sup = sInfo["Supplier Information"];
              if (sup) {
                sup["VENDOR_NAME1"].value = r.VENDOR_NAME1 || "";
                sup["WEBSITE"].value = r.WEBSITE || "";
                sup["REGISTERED_ID"].value = r.REGISTERED_ID || "";
                sup["COMPANY_CODE"].value = r.COMPANY_CODE || "";
                sup["VENDOR_TYPE"].value =
                  `${r.SUPPL_TYPE} - ${r.SUPPL_TYPE_DESC}` || "";
                sup["VENDOR_SUB_TYPE"].value =
                  `${r.BP_TYPE_CODE} - ${r.BP_TYPE_DESC}` || "";
              }

              const addressRows = sInfo["Address"] || [];
              const addressResults = r.TO_ADDRESS?.results || [];

              if (addressRows[0] && addressResults[0]) {
                const src = addressResults[0];
                const trg = addressRows[0];
                trg.ADDRESS_TYPE = "Primary";
                [
                  "HOUSE_NUM1",
                  "STREET1",
                  "STREET2",
                  "STREET3",
                  "STREET4",
                  "COUNTRY",
                  "STATE",
                  "CITY",
                  "POSTAL_CODE",
                  "EMAIL",
                  "CONTACT_NO",
                ].forEach((field) => {
                  if (!trg[field]) {
                    trg[field] = {
                      value: "",
                      fieldId: "",
                      companyCode: "",
                      requestType: "",
                      mandatory: false,
                      visible: true,
                      type: "",
                      description: "",
                      minimum: "",
                      maximum: "",
                      placeholder: "",
                      dropdownValues: "",
                      newDynamicFormField: false,
                    };
                  }
                  trg[field].value = src[field] ?? "";
                });
              }

              if (addressResults[1]) {
                if (!addressRows[1]) {
                  const copy = JSON.parse(JSON.stringify(addressRows[0]));
                  Object.keys(copy).forEach((k) => {
                    if (k !== "ADDRESS_TYPE") copy[k].value = "";
                  });
                  copy.ADDRESS_TYPE = "Other Office Address";
                  addressRows.push(copy);
                }
                const src = addressResults[1];
                const trg = addressRows[1];
                trg.ADDRESS_TYPE = "Other Office Address";
                [
                  "HOUSE_NUM1",
                  "STREET1",
                  "STREET2",
                  "STREET3",
                  "STREET4",
                  "COUNTRY",
                  "STATE",
                  "CITY",
                  "POSTAL_CODE",
                  "EMAIL",
                  "CONTACT_NO",
                ].forEach((field) => {
                  if (!trg[field]) {
                    trg[field] = {
                      value: "",
                      fieldId: "",
                      companyCode: "",
                      requestType: "",
                      mandatory: false,
                      visible: true,
                      type: "",
                      description: "",
                      minimum: "",
                      maximum: "",
                      placeholder: "",
                      dropdownValues: "",
                      newDynamicFormField: false,
                    };
                  }
                  trg[field].value = src[field] ?? "";
                });
              }

              // const pCon = sInfo["Primary Contact"];
              // if (pCon) {
              //     const c = r.TO_CONTACTS?.results?.[0] || {};
              //     pCon["FIRST_NAME"].value = c.FIRST_NAME || "";
              //     pCon["LAST_NAME"].value = c.LAST_NAME || "";
              //     pCon["CITY"].value = c.CITY || "";
              //     pCon["STATE"].value = c.STATE || "";
              //     pCon["COUNTRY"]?.value = c?.COUNTRY || "";
              //     pCon["POSTAL_CODE"].value = c.POSTAL_CODE || "";
              //     pCon["DESIGNATION"].value = c.DESIGNATION || "";
              //     pCon["EMAIL"].value = c.EMAIL || "";
              //     pCon["CONTACT_NUMBER"].value = c.CONTACT_NO || "";
              //     pCon["MOBILE"].value = c.MOBILE_NO || "";
              // }

              const pCon = sInfo["Primary Contact"];
              if (pCon) {
                const c = r.TO_CONTACTS?.results?.[0] || {};
                pCon["FIRST_NAME"].value = c.FIRST_NAME || "";
                pCon["LAST_NAME"].value = c.LAST_NAME || "";
                pCon["CITY"].value = c.CITY || "";
                pCon["STATE"].value = c.STATE || "";
                if (pCon["COUNTRY"]) {
                  pCon["COUNTRY"].value = c?.COUNTRY || "";
                } else {
                  console.warn("[WARN] COUNTRY control is missing in pCon");
                }
                pCon["POSTAL_CODE"].value = c.POSTAL_CODE || "";
                pCon["DESIGNATION"].value = c.DESIGNATION || "";
                pCon["EMAIL"].value = c.EMAIL || "";
                pCon["CONTACT_NUMBER"].value = c.CONTACT_NO || "";
                pCon["MOBILE"].value = c.MOBILE_NO || "";
              }
            }

            const fin = model["Finance Information"];
            if (fin) {
              const bankRows = fin["Primary Bank details"] || [];
              const bankResults = r.TO_BANKS?.results || [];

              if (bankRows[0] && bankResults[0]) {
                const src = bankResults[0];
                const trg = bankRows[0];
                trg.BANK_TYPE = "Primary";
                [
                  "SWIFT_CODE",
                  "BRANCH_NAME",
                  "BANK_COUNTRY",
                  "BANK_NAME",
                  "BENEFICIARY",
                  "ACCOUNT_NO",
                  "IBAN_NUMBER",
                  "ROUTING_CODE",
                  "BANK_CURRENCY",
                ].forEach((field) => {
                  if (!trg[field]) {
                    trg[field] = {
                      value: "",
                      fieldId: "",
                      companyCode: "",
                      requestType: "",
                      mandatory: false,
                      visible: true,
                      type: "",
                      description: "",
                      minimum: "",
                      maximum: "",
                      placeholder: "",
                      dropdownValues: "",
                      newDynamicFormField: false,
                    };
                  }
                  trg[field].value = src[field] ?? "";
                });
                fin["TAX-VAT-GST"].GST_NO.value = src.GST ?? "";
              }

              if (bankResults[1]) {
                if (!bankRows[1]) {
                  const copy = JSON.parse(JSON.stringify(bankRows[0]));
                  Object.keys(copy).forEach((k) => {
                    if (k !== "BANK_TYPE") copy[k].value = "";
                  });
                  copy.BANK_TYPE = "Other Bank Details";
                  bankRows.push(copy);
                }
                const src = bankResults[1];
                const trg = bankRows[1];
                trg.BANK_TYPE = "Other Bank Details";
                [
                  "SWIFT_CODE",
                  "BRANCH_NAME",
                  "BANK_COUNTRY",
                  "BANK_NAME",
                  "BENEFICIARY",
                  "ACCOUNT_NO",
                  "IBAN_NUMBER",
                  "ROUTING_CODE",
                  "BANK_CURRENCY",
                ].forEach((field) => {
                  if (!trg[field]) {
                    trg[field] = {
                      value: "",
                      fieldId: "",
                      companyCode: "",
                      requestType: "",
                      mandatory: false,
                      visible: true,
                      type: "",
                      description: "",
                      minimum: "",
                      maximum: "",
                      placeholder: "",
                      dropdownValues: "",
                      newDynamicFormField: false,
                    };
                  }
                  trg[field].value = src[field] ?? "";
                });
              }
            }

            const op = model["Operational Information"];
            if (op) {
              const prod = op["Product-Service Description"];
              if (prod) {
                const p = r.TO_REG_PRODUCT_SERVICE?.results?.[0] || {};
                prod["PRODUCT_NAME"].value = p.PROD_NAME || "";
                prod["PRODUCT_DESCRIPTION"].value = p.PROD_DESCRIPTION || "";
                prod["PRODUCT_TYPE"].value = p.PROD_TYPE || "";
                prod["PRODUCT_CATEGORY"].value = p.PROD_CATEGORY || "";
              }
              const cap = op["Operational Capacity"];
              if (cap) {
                const c = r.TO_REG_CAPACITY?.results?.[0] || {};
                cap["ORDER_SIZE_MIN"].value = c.MINIMUM_ORDER_SIZE || "";
                cap["PRODUCTION_CAPACITY"].value = c.TOTAL_PROD_CAPACITY || "";
                cap["PRODUCTION_LOCATION"].value = c.CITY || "";
                cap["ORDER_SIZE_MAX"].value = c.MAXMIMUM_ORDER_SIZE || "";
              }
            }

            // Handle dynamic fields from TO_DYNAMIC_FIELDS
            if (
              r &&
              r.TO_DYNAMIC_FIELDS &&
              r.TO_DYNAMIC_FIELDS.results &&
              r.TO_DYNAMIC_FIELDS.results.length > 0
            ) {
              r.TO_DYNAMIC_FIELDS.results.forEach((dynamicField) => {
                const section = dynamicField.SECTION;
                const category = dynamicField.CATEGORY;
                const srNo = dynamicField.SR_NO;
                let data;

                try {
                  data = JSON.parse(dynamicField.DATA);
                } catch (e) {
                  console.error(
                    `Failed to parse DATA for SECTION: ${section}, CATEGORY: ${category}, SR_NO: ${srNo}`,
                    dynamicField.DATA,
                    e
                  );
                  return;
                }

                console.log(
                  `Processing dynamic field - SECTION: ${section}, CATEGORY: ${category}, SR_NO: ${srNo}, DATA:`,
                  data
                );

                if (!model[section]) {
                  console.warn(
                    `Section ${section} not found in model. Creating it.`
                  );
                  model[section] = {};
                }

                Object.keys(data).forEach((fieldKey) => {
                  let fieldValue = data[fieldKey];
                  const normalizedFieldKey = normalizeKey(fieldKey);
                  const fieldKeyIdentifier = `${section}/${category}/${normalizedFieldKey}/${srNo}`;

                  if (fieldKeyMap[fieldKeyIdentifier]) {
                    console.warn(
                      `Duplicate dynamic field detected: ${fieldKeyIdentifier}. Merging.`
                    );
                    return;
                  }
                  fieldKeyMap[fieldKeyIdentifier] = true;

                  if (
                    normalizedFieldKey.toLowerCase().includes("date") &&
                    fieldValue
                  ) {
                    try {
                      const parsedDate = new Date(fieldValue);
                      if (!isNaN(parsedDate.getTime())) {
                        fieldValue = parsedDate.toISOString().split("T")[0];
                        console.log(
                          `Reformatted date for ${fieldKey}: ${fieldValue}`
                        );
                      } else {
                        console.warn(
                          `Invalid date format for ${fieldKey}: ${fieldValue}`
                        );
                      }
                    } catch (e) {
                      console.error(
                        `Error parsing date for ${fieldKey}: ${fieldValue}`,
                        e
                      );
                    }
                  }

                  const fieldData = {
                    value: fieldValue || "",
                    label: fieldKey,
                    mandatory: false,
                    visible: true,
                    type: normalizedFieldKey.toLowerCase().includes("date")
                      ? "Date"
                      : "",
                    description: "",
                    fieldId: "",
                    companyCode: "",
                    requestType: "",
                    minimum: "",
                    maximum: "",
                    placeholder: "",
                    dropdownValues: "",
                    newDynamicFormField: true,
                  };

                  if (
                    section === "Supplier Information" &&
                    (category === "PrimaryAddress" ||
                      category === "Other Office Address")
                  ) {
                    const addressType =
                      category === "PrimaryAddress"
                        ? "Primary"
                        : "Other Office Address";
                    let addressArray = model[section]["Address"] || [];
                    let targetIndex = addressArray.findIndex(
                      (addr) => addr.ADDRESS_TYPE === addressType
                    );

                    if (targetIndex === -1) {
                      const newAddress = { ADDRESS_TYPE: addressType };
                      addressArray.push(newAddress);
                      targetIndex = addressArray.length - 1;
                    }

                    addressArray[targetIndex][fieldKey] = fieldData;
                    model[section]["Address"] = addressArray;
                    console.log(
                      `Set dynamic field in ${section}/Address[${targetIndex}]: ${fieldKey} = ${fieldValue} for ${addressType}`
                    );
                  } else if (
                    section === "Finance Information" &&
                    (category === "Primary Bank" ||
                      category === "Other Bank Details")
                  ) {
                    const bankType =
                      category === "Primary Bank"
                        ? "Primary"
                        : "Other Bank Details";
                    let bankArray =
                      model[section]["Primary Bank details"] || [];
                    let targetIndex = bankArray.findIndex(
                      (bank) => bank.BANK_TYPE === bankType
                    );

                    if (targetIndex === -1) {
                      const newBank = { BANK_TYPE: bankType };
                      bankArray.push(newBank);
                      targetIndex = bankArray.length - 1;
                    }

                    bankArray[targetIndex][fieldKey] = fieldData;
                    model[section]["Primary Bank details"] = bankArray;
                    console.log(
                      `Set dynamic field in ${section}/Primary Bank details[${targetIndex}]: ${fieldKey} = ${fieldValue} for ${bankType}`
                    );
                  } else {
                    if (!model[section][category]) {
                      model[section][category] = {};
                    }
                    if (model[section][category][fieldKey]) {
                      console.warn(
                        `Merging existing field in ${section}/${category}: ${fieldKey}`
                      );
                      const existingField = model[section][category][fieldKey];
                      model[section][category][fieldKey] = {
                        ...existingField,
                        value: fieldValue || existingField.value,
                        label: fieldKey,
                        mandatory:
                          existingField.mandatory || fieldData.mandatory,
                        visible: existingField.visible || fieldData.visible,
                        type: existingField.type || fieldData.type,
                        description:
                          existingField.description || fieldData.description,
                        fieldId: existingField.fieldId || fieldData.fieldId,
                        companyCode:
                          existingField.companyCode || fieldData.companyCode,
                        requestType:
                          existingField.requestType || fieldData.requestType,
                        minimum: existingField.minimum || fieldData.minimum,
                        maximum: existingField.maximum || fieldData.maximum,
                        placeholder:
                          existingField.placeholder || fieldData.placeholder,
                        dropdownValues:
                          existingField.dropdownValues ||
                          fieldData.dropdownValues,
                        newDynamicFormField: true,
                      };
                    } else {
                      model[section][category][fieldKey] = fieldData;
                    }
                    console.log(
                      `Set dynamic field in ${section}/${category}: ${fieldKey} = ${fieldValue}`
                    );
                  }
                });
              });
            } else {
              console.warn("No dynamic fields found in response.");
            }

            if (model["Quality Certificates"]) {
              if (model["Quality Certificates"]["Standard Certifications"]) {
                if (
                  r &&
                  r.TO_QA_CERTIFICATES &&
                  r.TO_QA_CERTIFICATES.results &&
                  r.TO_QA_CERTIFICATES.results.length > 0
                ) {
                  r.TO_QA_CERTIFICATES.results.forEach((cert) => {
                    const certName = `${cert.CERTI_NAME.replace(
                      / /g,
                      "_"
                    )}_DONE_BY`;
                    if (
                      model["Quality Certificates"]["Standard Certifications"][
                        certName
                      ]
                    ) {
                      model["Quality Certificates"]["Standard Certifications"][
                        certName
                      ].value = cert.DONE_BY || "N/A";
                      model["Quality Certificates"]["Standard Certifications"][
                        certName
                      ].isCertified = cert.AVAILABLE === "YES" ? "Yes" : "No";
                      console.log(
                        `Updated certification: ${certName}, DONE_BY: ${cert.DONE_BY}, AVAILABLE: ${cert.AVAILABLE}`
                      );
                    }
                  });
                } else {
                  console.error("No QA certificates found in response.");
                }
              }
            }

            const sub = model["Submission"]?.["Declaration"];
            if (sub) {
              sub["COMPLETED_BY"].value = r.COMPLETED_BY || "";
              sub["DESIGNATION"].value = r.DESIGNATION || "";
              sub["SUBMISSION_DATE"].value = r.SUBMISSION_DATE || "";
              sub["ACK_VALIDATION"].value = true;
            }

            // Log final model for debugging
            console.log("Final model:", JSON.stringify(model, null, 2));
          }

          return model;
        },

        createDynamicForm: function (data, type) {
          this.createSupplierFormPage(data["Supplier Information"], type);
          this.createFinanceFormPage(data["Finance Information"]);
          this.createOperationalFormPage(data["Operational Information"]);
          this.createDisclosureForm(data["Disclosures"], type);
          // this.createQualityCertificatesForm(data["Quality Certificates"]);
          // this.createAttachmentsForm(data["Attachments"]);
          this.createSubmission(data.Submission);
        },

        createSupplierFormPage: function (
          supplierData,
          pageType,
          dynamicFields
        ) {
          var oContainer = this.getView().byId(
            "SupplierInformationFormContainer"
          );
          if (!oContainer) {
            console.error("SupplierInformationFormContainer not found");
            sap.m.MessageBox.error("Form container not found.");
            return;
          }
          oContainer.removeAllContent();
          oContainer.setWidth("100%"); // Ensure container width supports two columns
          console.log("Container cleared and width set to 100%:", oContainer);

          // Ensure formDataModel has editable property
          var oModel = this.getView().getModel("formDataModel");
          if (!oModel) {
            oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "formDataModel");
          }
          if (oModel.getProperty("/editable") === undefined) {
            oModel.setProperty("/editable", false); // Default to non-editable
          }

          // Ensure requestInfo model exists
          var oRequestInfoModel = this.getView().getModel("requestInfo");
          if (!oRequestInfoModel) {
            oRequestInfoModel = new sap.ui.model.json.JSONModel({
              editable: pageType === "registration",
            });
            this.getView().setModel(oRequestInfoModel, "requestInfo");
          }

          // Initialize or update formDataModel with supplierData
          if (!oModel.getProperty("/Supplier Information")) {
            oModel.setProperty("/Supplier Information", {});
          }
          const sections = {
            "Supplier Information": supplierData["Supplier Information"],
            Address: supplierData["Address"] || [],
            "Primary Contact": supplierData["Primary Contact"],
          };

          // Integrate dynamic fields into formDataModel (with safeguard)
          const dynamicData = dynamicFields || [];
          dynamicData.forEach(function (dynamicField) {
            const { SECTION, CATEGORY, DATA } = dynamicField;
            const parsedData = JSON.parse(DATA);
            if (!oModel.getProperty(`/${SECTION}`)) {
              oModel.setProperty(`/${SECTION}`, {});
            }
            if (
              SECTION === "Supplier Information" &&
              CATEGORY.startsWith("PrimaryAddress")
            ) {
              let addressIndex = 0; // PrimaryAddress is first
              if (!oModel.getProperty("/Supplier Information/Address")) {
                oModel.setProperty("/Supplier Information/Address", []);
              }
              if (
                !oModel.getProperty(
                  `/Supplier Information/Address/${addressIndex}`
                )
              ) {
                oModel.getProperty("/Supplier Information/Address").push({});
              }
              Object.keys(parsedData).forEach((fieldKey) => {
                oModel.setProperty(
                  `/Supplier Information/Address/${addressIndex}/${fieldKey}`,
                  {
                    value: parsedData[fieldKey],
                    label: fieldKey,
                    visible: true,
                    type: "text",
                    ADDRESS_TYPE: "Primary",
                  }
                );
              });
            } else if (
              SECTION === "Supplier Information" &&
              CATEGORY === "Other Office Address"
            ) {
              let addressIndex =
                oModel.getProperty("/Supplier Information/Address")?.length ||
                1;
              if (!oModel.getProperty("/Supplier Information/Address")) {
                oModel.setProperty("/Supplier Information/Address", []);
              }
              if (
                !oModel.getProperty(
                  `/Supplier Information/Address/${addressIndex}`
                )
              ) {
                oModel.getProperty("/Supplier Information/Address").push({});
              }
              Object.keys(parsedData).forEach((fieldKey) => {
                oModel.setProperty(
                  `/Supplier Information/Address/${addressIndex}/${fieldKey}`,
                  {
                    value: parsedData[fieldKey],
                    label: fieldKey,
                    visible: true,
                    type: "text",
                    ADDRESS_TYPE: "Other Office Address",
                  }
                );
              });
            } else {
              if (!oModel.getProperty(`/${SECTION}/${CATEGORY}`)) {
                oModel.setProperty(`/${SECTION}/${CATEGORY}`, {});
              }
              Object.keys(parsedData).forEach((fieldKey) => {
                oModel.setProperty(`/${SECTION}/${CATEGORY}/${fieldKey}`, {
                  value: parsedData[fieldKey],
                  label: fieldKey,
                  visible: true,
                  type: "text",
                });
              });
            }
          });

          // Spacer VBox for adding margins between sections
          var oSpacer = new sap.m.VBox({
            height: "2rem", // Small margin between sections
          });

          // Horizontal line for section separation
          var oHorizontalLine = new sap.ui.core.HTML({
            content:
              "<hr style='border: 1px solid #d9d9d9; width: 100%; margin: 10px 0;' />",
          });

          // Calculate maximum label length for uniform width
          let maxLabelLength = 0;
          Object.keys(sections).forEach(function (sectionName) {
            const sectionData =
              oModel.getProperty(`/Supplier Information/${sectionName}`) ||
              sections[sectionName];
            if (!sectionData) return;

            if (sectionName === "Address") {
              sectionData.forEach(function (address) {
                Object.keys(address).forEach(function (fieldKey) {
                  if (fieldKey === "ADDRESS_TYPE") return;
                  const field = address[fieldKey];
                  if (!field || !field.visible) return;
                  maxLabelLength = Math.max(maxLabelLength, field.label.length);
                });
              });
            } else {
              Object.keys(sectionData).forEach(function (fieldKey) {
                const field = sectionData[fieldKey];
                if (!field || !field.visible) return;
                maxLabelLength = Math.max(maxLabelLength, field.label.length);
              });
            }
          });

          // Convert max label length to width (approximate 0.5rem per character)
          const labelWidth = `${Math.ceil(maxLabelLength * 0.5)}rem`;

          Object.keys(sections).forEach(
            function (sectionName) {
              const sectionData =
                oModel.getProperty(`/Supplier Information/${sectionName}`) ||
                sections[sectionName];
              if (!sectionData) return;

              if (sectionName === "Address") {
                sectionData.forEach(
                  function (address, index) {
                    const addressType =
                      address.ADDRESS_TYPE ||
                      (index === 0 ? "Primary" : "Other Office Address");

                    // Create a VBox for the entire section
                    var oSectionVBox = new sap.m.VBox({
                      width: "100%",
                    });

                    // Add title with H5 size
                    oSectionVBox.addItem(
                      new sap.m.Title({
                        text: `${addressType} Address`,
                        level: "H5",
                        titleStyle: "H5",
                      })
                    );

                    // Add toolbar with "Add Other Office Address" button if applicable
                    const showAddBtn =
                      pageType === "registration" &&
                      addressType === "Primary" &&
                      !sectionData.some(
                        (a) => a.ADDRESS_TYPE === "Other Office Address"
                      );

                    if (showAddBtn) {
                      var oTitleBar = new sap.m.Toolbar({
                        content: [
                          new sap.m.Title({
                            text: "Address",
                            level: "H5",
                            titleStyle: "H5",
                          }),
                          new sap.m.ToolbarSpacer(),
                          new sap.m.Button({
                            text: "Add Other Office Address",
                            icon: "sap-icon://add",
                            type: "Emphasized",
                            press: this.onAddOtherOfficeAddress.bind(this),
                          }),
                        ],
                      });
                      oSectionVBox.addItem(oTitleBar);
                    }

                    // Collect all fields in an array to process in pairs for two-column layout
                    var aFields = [];
                    Object.keys(address).forEach(
                      function (fieldKey) {
                        if (fieldKey === "ADDRESS_TYPE") return;
                        const field = address[fieldKey];
                        if (!field || !field.visible) return;

                        // Label without colon, with uniform width
                        var oLabel = new sap.m.Label({
                          text: field.label,
                          required: field.mandatory,
                          width: labelWidth,
                        }).addStyleClass("customLabelBold");

                        // Colon as a separate text element
                        var oColon = new sap.m.Text({
                          text: ":",
                          width: "0.5rem", // Fixed width for colon to ensure alignment
                        });

                        // Non-editable Text control for display mode
                        var oText = new sap.m.Text({
                          text: `{formDataModel>/Supplier Information/Address/${index}/${fieldKey}/value}`,
                          width: "20rem",
                          visible: "{= !${requestInfo>/editable} }",
                        });

                        // Editable control for edit mode
                        let oField;
                        switch (field.type.toLowerCase()) {
                          case "f4help":
                            let valueHelpHandler;
                            if (
                              fieldKey === "VENDOR_TYPE" ||
                              field.label.toLowerCase().includes("vendor type")
                            ) {
                              valueHelpHandler = function (oEvent) {
                                console.log(
                                  "VENDOR_TYPE value help triggered:",
                                  { sectionName, fieldKey, index }
                                );
                                this.onValueHelpVendorFrag(
                                  oEvent.getSource(),
                                  sectionName,
                                  fieldKey,
                                  index
                                );
                              }.bind(this);
                            } else if (
                              fieldKey === "VENDOR_SUB_TYPE" ||
                              field.label
                                .toLowerCase()
                                .includes("vendor sub type")
                            ) {
                              valueHelpHandler = function (oEvent) {
                                console.log(
                                  "VENDOR_SUB_TYPE value help triggered:",
                                  { sectionName, fieldKey, index }
                                );
                                this.onValueHelpSubVendorFrag
                                  ? this.onValueHelpSubVendorFrag(
                                      oEvent.getSource(),
                                      sectionName,
                                      fieldKey,
                                      index
                                    )
                                  : console.log(
                                      "onValueHelpSubVendorFrag not implemented"
                                    );
                              }.bind(this);
                            } else {
                              valueHelpHandler = function () {
                                console.log(
                                  `No value help handler defined for ${fieldKey}`
                                );
                              }.bind(this);
                            }

                            oField = new sap.m.Input({
                              value: `{formDataModel>/Supplier Information/Address/${index}/${fieldKey}/value}`,
                              showValueHelp: true,
                              valueHelpRequest: valueHelpHandler,
                              suggestionItems: field.suggestionPath
                                ? {
                                    path: field.suggestionPath,
                                    template: new sap.ui.core.ListItem({
                                      key: "{SPRAS}",
                                      text: "{SPRAS}",
                                      additionalText:
                                        fieldKey === "VENDOR_TYPE"
                                          ? "{TXT40}"
                                          : "{TXT30}",
                                    }),
                                  }
                                : undefined,
                              suggestionItemSelected: this
                                .onSuggestionItemSelected
                                ? this.onSuggestionItemSelected.bind(this)
                                : undefined,
                              visible: "{requestInfo>/editable}",
                              width: "20rem",
                              change: function (oEvent) {
                                const value = oEvent.getSource().getValue();
                                const oModel =
                                  this.getView().getModel("formDataModel");
                                if (oModel) {
                                  oModel.getData()["Supplier Information"][
                                    "Address"
                                  ][index][fieldKey].value = value;
                                  oModel.refresh();
                                } else {
                                  console.warn("formDataModel not found.");
                                }
                              }.bind(this),
                            });
                            break;

                          case "dropdown":
                            if (fieldKey === "COUNTRY") {
                              oField = new sap.m.Select({
                                required: field.mandatory,
                                selectedKey:
                                  field.defaultValue || field.value || "IN",
                                items: {
                                  path: "/Country",
                                  sorter: new sap.ui.model.Sorter(
                                    "LANDX",
                                    false
                                  ),
                                  template: new sap.ui.core.Item({
                                    key: "{LAND1}",
                                    text: "{LANDX}",
                                  }),
                                },
                                visible: "{requestInfo>/editable}",
                                width: "20rem",
                                change: function (oEvent) {
                                  const selectedKey = oEvent
                                    .getSource()
                                    .getSelectedKey();
                                  const oModel =
                                    this.getView().getModel("formDataModel");
                                  const path = `/Supplier Information/Address/${index}/${fieldKey}/value`;
                                  oModel.setProperty(path, selectedKey);
                                }.bind(this),
                              });
                            } else {
                              const dropdownOptions = field.dropdownValues
                                ? field.dropdownValues
                                    .split(",")
                                    .map((opt) => opt.trim())
                                : ["Option 1", "Option 2"];
                              const items = [
                                new sap.ui.core.Item({
                                  key: "",
                                  text: field.placeholder || "Select an option",
                                }),
                                ...dropdownOptions.map(
                                  (opt) =>
                                    new sap.ui.core.Item({
                                      key: opt,
                                      text: opt,
                                    })
                                ),
                              ];
                              oField = new sap.m.Select({
                                required: field.mandatory,
                                selectedKey:
                                  field.defaultValue || field.value || "",
                                items: items,
                                visible: "{requestInfo>/editable}",
                                width: "20rem",
                                change: function (oEvent) {
                                  const selectedKey = oEvent
                                    .getSource()
                                    .getSelectedKey();
                                  const oModel =
                                    this.getView().getModel("formDataModel");
                                  const path = `/Supplier Information/Address/${index}/${fieldKey}/value`;
                                  oModel.setProperty(path, selectedKey);
                                }.bind(this),
                              });
                            }
                            break;

                          case "checkbox":
                            oField = new sap.m.CheckBox({
                              selected:
                                field.value === "true" || field.value === true,
                              visible: "{requestInfo>/editable}",
                              select: function (oEvent) {
                                const selected = oEvent
                                  .getSource()
                                  .getSelected();
                                const oModel =
                                  this.getView().getModel("formDataModel");
                                const path = `/Supplier Information/Address/${index}/${fieldKey}/value`;
                                oModel.setProperty(path, selected);
                              }.bind(this),
                            });
                            break;

                          case "radio":
                            oField = new sap.m.RadioButtonGroup({
                              selectedIndex:
                                field.value === "Yes"
                                  ? 0
                                  : field.value === "No"
                                  ? 1
                                  : -1,
                              visible: "{requestInfo>/editable}",
                              buttons: [
                                new sap.m.RadioButton({ text: "Yes" }),
                                new sap.m.RadioButton({ text: "No" }),
                              ],
                              select: function (oEvent) {
                                const selectedIndex = oEvent
                                  .getSource()
                                  .getSelectedIndex();
                                const value =
                                  selectedIndex === 0 ? "Yes" : "No";
                                const oModel =
                                  this.getView().getModel("formDataModel");
                                const path = `/Supplier Information/Address/${index}/${fieldKey}/value`;
                                oModel.setProperty(path, value);
                              }.bind(this),
                            });
                            break;

                          case "number":
                            oField = new sap.m.Input({
                              value: field.value,
                              type: "Number",
                              required: field.mandatory,
                              visible: "{requestInfo>/editable}",
                              min: field.minimum
                                ? parseFloat(field.minimum)
                                : undefined,
                              max: field.maximum
                                ? parseFloat(field.maximum)
                                : undefined,
                              placeholder: field.placeholder || "",
                              valueStateText: field.mandatory
                                ? `${field.label} is required`
                                : "",
                              width: "20rem",
                              change: function (oEvent) {
                                const value = oEvent.getSource().getValue();
                                const oModel =
                                  this.getView().getModel("formDataModel");
                                const path = `/Supplier Information/Address/${index}/${fieldKey}/value`;
                                oModel.setProperty(path, value);
                              }.bind(this),
                            });
                            break;

                          case "calendar":
                            oField = new sap.m.DatePicker({
                              value: field.value,
                              required: field.mandatory,
                              visible: "{requestInfo>/editable}",
                              placeholder: field.placeholder || "",
                              valueStateText: field.mandatory
                                ? `${field.label} is required`
                                : "",
                              width: "20rem",
                              change: function (oEvent) {
                                const value = oEvent.getSource().getValue();
                                const oModel =
                                  this.getView().getModel("formDataModel");
                                const path = `/Supplier Information/Address/${index}/${fieldKey}/value`;
                                oModel.setProperty(path, value);
                              }.bind(this),
                            });
                            break;

                          case "text":
                          default:
                            oField = new sap.m.Input({
                              value: field.value,
                              type: field.label.toLowerCase().includes("email")
                                ? "Email"
                                : field.label.toLowerCase().includes("contact")
                                ? "Tel"
                                : "Text",
                              required: field.mandatory,
                              visible: "{requestInfo>/editable}",
                              valueState: "None",
                              minLength: field.minimum
                                ? parseInt(field.minimum)
                                : undefined,
                              maxLength: field.maximum
                                ? parseInt(field.maximum)
                                : undefined,
                              placeholder: field.placeholder || "",
                              valueStateText: field.mandatory
                                ? `${field.label} is required`
                                : "",
                              width: "20rem",
                              change: function (oEvent) {
                                const value = oEvent.getSource().getValue();
                                const oModel =
                                  this.getView().getModel("formDataModel");
                                const path = `/Supplier Information/Address/${index}/${fieldKey}/value`;
                                oModel.setProperty(path, value);
                              }.bind(this),
                            });
                            break;
                        }

                        // Combine label and colon in an HBox for proper alignment
                        var oLabelWithColon = new sap.m.HBox({
                          items: [oLabel, oColon],
                          alignItems: "Center",
                        });

                        // Wrap Text and Field in an HBox to ensure they occupy the same space
                        var oFieldValueHBox = new sap.m.HBox({
                          items: [oText, oField],
                        });

                        // Wrap the HBox in a VBox to add top and bottom margins
                        var oFieldValueVBox = new sap.m.VBox({
                          items: [oFieldValueHBox],
                          height: "auto",
                        }).addStyleClass("customFieldValueMargin");

                        // Wrap LabelWithColon and FieldValueVBox in an HBox for the field (one column)
                        var oFieldHBox = new sap.m.HBox({
                          items: [oLabelWithColon, oFieldValueVBox],
                          width: "50%", // Each column takes 50% of the width for two-column layout
                        });

                        aFields.push(oFieldHBox);
                      }.bind(this)
                    );

                    // Create two-column layout by pairing fields into HBox rows
                    for (var i = 0; i < aFields.length; i += 2) {
                      var oRowHBox = new sap.m.HBox({
                        width: "100%",
                        items: [
                          aFields[i], // First column
                          aFields[i + 1] || new sap.m.HBox({ width: "50%" }), // Second column (empty if no pair)
                        ],
                      });
                      oSectionVBox.addItem(oRowHBox);
                    }

                    oContainer.addContent(oSectionVBox);
                    // Add horizontal line after each address section
                    oContainer.addContent(oHorizontalLine.clone());
                    // Add spacer after the horizontal line
                    oContainer.addContent(oSpacer.clone());
                  }.bind(this)
                );
              } else {
                // Create a VBox for the entire section
                var oSectionVBox = new sap.m.VBox({
                  width: "100%",
                });

                // Add title with H5 size
                oSectionVBox.addItem(
                  new sap.m.Title({
                    text: sectionName,
                    level: "H5",
                    titleStyle: "H5",
                  })
                );

                // Collect all fields in an array to process in pairs for two-column layout
                var aFields = [];
                Object.keys(sectionData).forEach(
                  function (fieldKey) {
                    const field = sectionData[fieldKey];
                    if (!field || !field.visible) return;

                    // Label without colon, with uniform width
                    var oLabel = new sap.m.Label({
                      text: field.label,
                      required: field.mandatory,
                      width: labelWidth,
                    }).addStyleClass("customLabelBold");

                    // Colon as a separate text element
                    var oColon = new sap.m.Text({
                      text: ":",
                      width: "0.5rem", // Fixed width for colon to ensure alignment
                    });

                    // Non-editable Text control for display mode
                    var oText = new sap.m.Text({
                      text: `{formDataModel>/Supplier Information/${sectionName}/${fieldKey}/value}`,
                      width: "20rem",
                      visible: "{= !${requestInfo>/editable} }",
                    });

                    // Editable control for edit mode
                    let oField;
                    switch (field.type.toLowerCase()) {
                      case "f4help":
                        let valueHelpHandler;
                        if (
                          fieldKey === "VENDOR_TYPE" ||
                          field.label.toLowerCase().includes("vendor type")
                        ) {
                          valueHelpHandler = function (oEvent) {
                            console.log("VENDOR_TYPE value help triggered:", {
                              sectionName,
                              fieldKey,
                            });
                            this.onValueHelpVendorFrag(
                              oEvent.getSource(),
                              sectionName,
                              fieldKey
                            );
                          }.bind(this);
                        } else if (
                          fieldKey === "VENDOR_SUB_TYPE" ||
                          field.label.toLowerCase().includes("vendor sub type")
                        ) {
                          valueHelpHandler = function (oEvent) {
                            console.log(
                              "VENDOR_SUB_TYPE value help triggered:",
                              { sectionName, fieldKey }
                            );
                            this.onValueHelpSubVendorFrag
                              ? this.onValueHelpSubVendorFrag(
                                  oEvent.getSource(),
                                  sectionName,
                                  fieldKey
                                )
                              : console.log(
                                  "onValueHelpSubVendorFrag not implemented"
                                );
                          }.bind(this);
                        } else {
                          valueHelpHandler = function () {
                            console.log(
                              `No value help handler defined for ${fieldKey}`
                            );
                          }.bind(this);
                        }

                        const inputProps = {
                          value: `{formDataModel>/Supplier Information/${sectionName}/${fieldKey}/value}`,
                          showValueHelp: true,
                          valueHelpRequest: valueHelpHandler,
                          visible: "{requestInfo>/editable}",
                          width: "20rem",
                          change: function (oEvent) {
                            const value = oEvent.getSource().getValue();
                            const oModel =
                              this.getView().getModel("formDataModel");
                            if (oModel) {
                              oModel.getData()["Supplier Information"][
                                sectionName
                              ][fieldKey].value = value;
                              oModel.refresh();
                            } else {
                              console.warn("formDataModel not found.");
                            }
                          }.bind(this),
                        };

                        if (field.suggestionPath) {
                          inputProps.suggestionItems = {
                            path: field.suggestionPath,
                            template: new sap.ui.core.ListItem({
                              key: "{SPRAS}",
                              text: "{SPRAS}",
                              additionalText:
                                fieldKey === "VENDOR_TYPE"
                                  ? "{TXT40}"
                                  : "{TXT30}",
                            }),
                          };
                        }

                        if (this.onSuggestionItemSelected) {
                          inputProps.suggestionItemSelected =
                            this.onSuggestionItemSelected.bind(this);
                        }

                        oField = new sap.m.Input(inputProps);
                        break;

                      case "dropdown":
                        const dropdownOptions = field.dropdownValues
                          ? field.dropdownValues
                              .split(",")
                              .map((opt) => opt.trim())
                          : ["Option 1", "Option 2"];
                        const items = [
                          new sap.ui.core.Item({
                            key: "",
                            text: field.placeholder || "Select an option",
                          }),
                          ...dropdownOptions.map(
                            (opt) =>
                              new sap.ui.core.Item({ key: opt, text: opt })
                          ),
                        ];
                        oField = new sap.m.Select({
                          required: field.mandatory,
                          selectedKey: field.defaultValue || field.value || "",
                          items: items,
                          visible: "{requestInfo>/editable}",
                          width: "20rem",
                          change: function (oEvent) {
                            const selectedKey = oEvent
                              .getSource()
                              .getSelectedKey();
                            const oModel =
                              this.getView().getModel("formDataModel");
                            const path = `/Supplier Information/${sectionName}/${fieldKey}/value`;
                            oModel.setProperty(path, selectedKey);
                          }.bind(this),
                        });
                        break;

                      case "checkbox":
                        oField = new sap.m.CheckBox({
                          selected:
                            field.value === "true" || field.value === true,
                          visible: "{requestInfo>/editable}",
                          select: function (oEvent) {
                            const selected = oEvent.getSource().getSelected();
                            const oModel =
                              this.getView().getModel("formDataModel");
                            const path = `/Supplier Information/${sectionName}/${fieldKey}/value`;
                            oModel.setProperty(path, selected);
                          }.bind(this),
                        });
                        break;

                      case "radio":
                        oField = new sap.m.RadioButtonGroup({
                          selectedIndex:
                            field.value === "Yes"
                              ? 0
                              : field.value === "No"
                              ? 1
                              : -1,
                          visible: "{requestInfo>/editable}",
                          buttons: [
                            new sap.m.RadioButton({ text: "Yes" }),
                            new sap.m.RadioButton({ text: "No" }),
                          ],
                          select: function (oEvent) {
                            const selectedIndex = oEvent
                              .getSource()
                              .getSelectedIndex();
                            const value = selectedIndex === 0 ? "Yes" : "No";
                            const oModel =
                              this.getView().getModel("formDataModel");
                            const path = `/Supplier Information/${sectionName}/${fieldKey}/value`;
                            oModel.setProperty(path, value);
                          }.bind(this),
                        });
                        break;

                      case "number":
                        oField = new sap.m.Input({
                          value: field.value,
                          type: "Number",
                          required: field.mandatory,
                          visible: "{requestInfo>/editable}",
                          min: field.minimum
                            ? parseFloat(field.minimum)
                            : undefined,
                          max: field.maximum
                            ? parseFloat(field.maximum)
                            : undefined,
                          placeholder: field.placeholder || "",
                          valueStateText: field.mandatory
                            ? `${field.label} is required`
                            : "",
                          width: "20rem",
                          change: function (oEvent) {
                            const value = oEvent.getSource().getValue();
                            const oModel =
                              this.getView().getModel("formDataModel");
                            const path = `/Supplier Information/${sectionName}/${fieldKey}/value`;
                            oModel.setProperty(path, value);
                          }.bind(this),
                        });
                        break;

                      case "calendar":
                        oField = new sap.m.DatePicker({
                          value: field.value,
                          required: field.mandatory,
                          visible: "{requestInfo>/editable}",
                          placeholder: field.placeholder || "",
                          valueStateText: field.mandatory
                            ? `${field.label} is required`
                            : "",
                          width: "20rem",
                          change: function (oEvent) {
                            const value = oEvent.getSource().getValue();
                            const oModel =
                              this.getView().getModel("formDataModel");
                            const path = `/Supplier Information/${sectionName}/${fieldKey}/value`;
                            oModel.setProperty(path, value);
                          }.bind(this),
                        });
                        break;

                      case "text":
                      default:
                        oField = new sap.m.Input({
                          value: field.value,
                          type: field.label.toLowerCase().includes("email")
                            ? "Email"
                            : field.label.toLowerCase().includes("contact")
                            ? "Tel"
                            : "Text",
                          required: field.mandatory,
                          visible: "{requestInfo>/editable}",
                          valueState: "None",
                          minLength: field.minimum
                            ? parseInt(field.minimum)
                            : undefined,
                          maxLength: field.maximum
                            ? parseInt(field.maximum)
                            : undefined,
                          placeholder: field.placeholder || "",
                          valueStateText: field.mandatory
                            ? `${field.label} is required`
                            : "",
                          width: "20rem",
                          change: function (oEvent) {
                            const value = oEvent.getSource().getValue();
                            const oModel =
                              this.getView().getModel("formDataModel");
                            const path = `/Supplier Information/${sectionName}/${fieldKey}/value`;
                            oModel.setProperty(path, value);
                          }.bind(this),
                        });
                        break;
                    }

                    // Combine label and colon in an HBox for proper alignment
                    var oLabelWithColon = new sap.m.HBox({
                      items: [oLabel, oColon],
                      alignItems: "Center",
                    });

                    // Wrap Text and Field in an HBox to ensure they occupy the same space
                    var oFieldValueHBox = new sap.m.HBox({
                      items: [oText, oField],
                    });

                    // Wrap the HBox in a VBox to add top and bottom margins
                    var oFieldValueVBox = new sap.m.VBox({
                      items: [oFieldValueHBox],
                      height: "auto",
                    }).addStyleClass("customFieldValueMargin");

                    // Wrap LabelWithColon and FieldValueVBox in an HBox for the field (one column)
                    var oFieldHBox = new sap.m.HBox({
                      items: [oLabelWithColon, oFieldValueVBox],
                      width: "50%", // Each column takes 50% of the width for two-column layout
                    });

                    aFields.push(oFieldHBox);
                  }.bind(this)
                );

                // Create two-column layout by pairing fields into HBox rows
                for (var i = 0; i < aFields.length; i += 2) {
                  var oRowHBox = new sap.m.HBox({
                    width: "100%",
                    items: [
                      aFields[i], // First column
                      aFields[i + 1] || new sap.m.HBox({ width: "50%" }), // Second column (empty if no pair)
                    ],
                  });
                  oSectionVBox.addItem(oRowHBox);
                }

                oContainer.addContent(oSectionVBox);
                // Add horizontal line after each section
                oContainer.addContent(oHorizontalLine.clone());
                // Add spacer after the horizontal line
                oContainer.addContent(oSpacer.clone());
              }
            }.bind(this)
          );
        },

        createFinanceFormPage: function (financeData) {
          var oContainer = this.getView().byId(
            "FinanceInformationFormContainer"
          );
          if (!oContainer) {
            console.error("FinanceInformationFormContainer not found");
            sap.m.MessageBox.error("Finance container not found.");
            return;
          }
          oContainer.removeAllContent();
          oContainer.setWidth("100%"); // Ensure container width supports two columns
          console.log("Container cleared and width set to 100%:", oContainer);

          // Ensure formDataModel has editable property
          var oModel = this.getView().getModel("formDataModel");
          if (oModel.getProperty("/editable") === undefined) {
            oModel.setProperty("/editable", false); // Default to non-editable
          }

          // Spacer VBox for adding margins between sections
          var oSpacer = new sap.m.VBox({
            height: "2rem", // Small margin between sections
          });
          var oHorizontalLine = new sap.ui.core.HTML({
            content:
              "<hr style='border: 1px solid #d9d9d9; width: 100%; margin: 10px 0;' />",
          });

          const categories = {
            "Primary Bank details": financeData["Primary Bank details"],
          };

          // Calculate maximum label length for uniform width
          let maxLabelLength = 0;
          Object.keys(categories).forEach(function (categoryName) {
            const categoryData = categories[categoryName];
            if (!categoryData) return;

            categoryData.forEach(function (bank) {
              Object.keys(bank).forEach(function (fieldKey) {
                if (fieldKey === "BANK_TYPE") return;
                const field = bank[fieldKey];
                if (field.visible) {
                  maxLabelLength = Math.max(maxLabelLength, field.label.length);
                }
              });
            });
          });
          if (financeData["TAX-VAT-GST"]) {
            Object.keys(financeData["TAX-VAT-GST"]).forEach(function (
              fieldKey
            ) {
              const field = financeData["TAX-VAT-GST"][fieldKey];
              if (field.visible) {
                maxLabelLength = Math.max(maxLabelLength, field.label.length);
              }
            });
          }

          // Convert max label length to width (approximate 0.5rem per character)
          const labelWidth = `${Math.ceil(maxLabelLength * 0.5)}rem`;

          Object.keys(categories).forEach(
            function (categoryName) {
              var categoryData = categories[categoryName];
              if (!categoryData) {
                console.warn(`No data for category: ${categoryName}`);
                return;
              }
              console.log(`Processing category: ${categoryName}`, categoryData);

              categoryData.forEach(
                function (bank, index) {
                  var bankType = bank.BANK_TYPE;

                  // Create a VBox for the entire form section
                  var oFormVBox = new sap.m.VBox({
                    width: "100%",
                  });

                  // Add title with H6 size
                  oFormVBox.addItem(
                    new sap.m.Title({
                      text: bankType + " Bank Details",
                      level: "H5",
                      titleStyle: "H5",
                    })
                  );

                  // Add toolbar for "Primary" bank if no "Other Bank Details" exist
                  if (
                    bankType === "Primary" &&
                    !categoryData.some(
                      (b) => b.BANK_TYPE === "Other Bank Details"
                    )
                  ) {
                    var oToolbar = new sap.m.Toolbar({
                      content: [
                        new sap.m.Title({
                          text: "Bank Details",
                          level: "H5",
                          titleStyle: "H5",
                        }),
                        new sap.m.ToolbarSpacer(),
                       
                      ],
                    });
                    oFormVBox.addItem(oToolbar);
                    console.log(
                      "Added toolbar with title 'Bank Details' and button to Primary Bank Details header"
                    );
                  }

                  // Collect all fields in an array to process in pairs for two-column layout
                  var aFields = [];
                  Object.keys(bank).forEach(
                    function (fieldKey) {
                      if (fieldKey === "BANK_TYPE") return;
                      var field = bank[fieldKey];
                      console.log(
                        `Processing field: ${fieldKey} in ${bankType}`,
                        field
                      );

                      if (field.visible) {
                        var oLabel = new sap.m.Label({
                          text: field.label,
                          width: labelWidth,
                          customData: [
                            new sap.ui.core.CustomData({
                              key: "fieldKey",
                              value: fieldKey,
                            }),
                            new sap.ui.core.CustomData({
                              key: "index",
                              value: index,
                            }),
                          ],
                        }).addStyleClass("customLabelBold");

                        var oColon = new sap.m.Text({
                          text: ":",
                          width: "0.5rem",
                        });

                        var oText = new sap.m.Text({
                          text:
                            "{formDataModel>/Finance Information/Primary Bank details/" +
                            index +
                            "/" +
                            fieldKey +
                            "/value}",
                          width: "20rem",
                          visible: "{= !${requestInfo>/editable} }",
                          customData: [
                            new sap.ui.core.CustomData({
                              key: "fieldKey",
                              value: fieldKey,
                            }),
                            new sap.ui.core.CustomData({
                              key: "index",
                              value: index,
                            }),
                          ],
                        });

                        var oInput = new sap.m.Input({
                          value:
                            "{formDataModel>/Finance Information/Primary Bank details/" +
                            index +
                            "/" +
                            fieldKey +
                            "/value}",
                          width: "20rem",
                          visible: "{requestInfo>/editable}",
                          change: this.onFieldChange.bind(this),
                          customData: [
                            new sap.ui.core.CustomData({
                              key: "fieldKey",
                              value: fieldKey,
                            }),
                            new sap.ui.core.CustomData({
                              key: "index",
                              value: index,
                            }),
                          ],
                        });

                        // Combine label and colon in an HBox for proper alignment
                        var oLabelWithColon = new sap.m.HBox({
                          items: [oLabel, oColon],
                          alignItems: "Center",
                        });

                        // Wrap Text and Input in an HBox to ensure they occupy the same space
                        var oFieldValueHBox = new sap.m.HBox({
                          items: [oText, oInput],
                        });

                        // Wrap the HBox in a VBox to add top and bottom margins
                        var oFieldValueVBox = new sap.m.VBox({
                          items: [oFieldValueHBox],
                          height: "auto",
                        }).addStyleClass("customFieldValueMargin");

                        // Wrap LabelWithColon and FieldValueVBox in an HBox for the field (one column)
                        var oFieldHBox = new sap.m.HBox({
                          items: [oLabelWithColon, oFieldValueVBox],
                          width: "50%", // Each column takes 50% of the width for two-column layout
                        });

                        aFields.push(oFieldHBox);
                        console.log(
                          `Added field: ${field.label} in ${bankType} with value: ${field.value}`
                        );
                      }
                    }.bind(this)
                  );

                  // Create two-column layout by pairing fields into HBox rows
                  for (var i = 0; i < aFields.length; i += 2) {
                    var oRowHBox = new sap.m.HBox({
                      width: "100%",
                      items: [
                        aFields[i], // First column
                        aFields[i + 1] || new sap.m.HBox({ width: "50%" }), // Second column (empty if no pair)
                      ],
                    });
                    oFormVBox.addItem(oRowHBox);
                  }

                  oContainer.addContent(oFormVBox);
                  // Add spacer after each bank section (Primary or Other)
                  oContainer.addContent(oSpacer.clone());
                  oContainer.addContent(oHorizontalLine.clone());

                  console.log(`Added form for ${bankType} Bank Details`);
                }.bind(this)
              );
            }.bind(this)
          );

          var taxData = financeData["TAX-VAT-GST"];
          if (taxData) {
            // Create a VBox for the TAX/VAT/GST section
            var oTaxFormVBox = new sap.m.VBox({
              width: "100%",
            });

            // Add title with H6 size
            oTaxFormVBox.addItem(
              new sap.m.Title({
                text: "TAX/VAT/GST",
                level: "H6",
                titleStyle: "H6",
              })
            );

            // Collect all fields in an array to process in pairs for two-column layout
            var aTaxFields = [];
            Object.keys(taxData).forEach(
              function (fieldKey) {
                var field = taxData[fieldKey];
                if (field.visible) {
                  var oLabel = new sap.m.Label({
                    text: field.label,
                    width: labelWidth,
                    customData: [
                      new sap.ui.core.CustomData({
                        key: "fieldKey",
                        value: fieldKey,
                      }),
                    ],
                  }).addStyleClass("customLabelBold");

                  var oColon = new sap.m.Text({
                    text: ":",
                    width: "0.5rem",
                  });

                  var oText = new sap.m.Text({
                    text:
                      "{formDataModel>/Finance Information/TAX-VAT-GST/" +
                      fieldKey +
                      "/value}",
                    width: "20rem",
                    visible: "{= !${requestInfo>/editable} }",
                    customData: [
                      new sap.ui.core.CustomData({
                        key: "fieldKey",
                        value: fieldKey,
                      }),
                    ],
                  });

                  var oInput = new sap.m.Input({
                    value:
                      "{formDataModel>/Finance Information/TAX-VAT-GST/" +
                      fieldKey +
                      "/value}",
                    width: "20rem",
                    visible: "{requestInfo>/editable}",
                    change: this.onFieldChange.bind(this),
                    customData: [
                      new sap.ui.core.CustomData({
                        key: "fieldKey",
                        value: fieldKey,
                      }),
                    ],
                  });

                  // Combine label and colon in an HBox for proper alignment
                  var oLabelWithColon = new sap.m.HBox({
                    items: [oLabel, oColon],
                    alignItems: "Center",
                  });

                  // Wrap Text and Input in an HBox to ensure they occupy the same space
                  var oFieldValueHBox = new sap.m.HBox({
                    items: [oText, oInput],
                  });

                  // Wrap the HBox in a VBox to add top and bottom margins
                  var oFieldValueVBox = new sap.m.VBox({
                    items: [oFieldValueHBox],
                    height: "auto",
                  }).addStyleClass("customFieldValueMargin");

                  // Wrap LabelWithColon and FieldValueVBox in an HBox for the field (one column)
                  var oFieldHBox = new sap.m.HBox({
                    items: [oLabelWithColon, oFieldValueVBox],
                    width: "50%", // Each column takes 50% of the width for two-column layout
                  });

                  aTaxFields.push(oFieldHBox);
                  console.log(
                    `Added field: ${field.label} in TAX-VAT-GST with value: ${field.value}`
                  );
                }
              }.bind(this)
            );

            // Create two-column layout by pairing fields into HBox rows
            for (var i = 0; i < aTaxFields.length; i += 2) {
              var oRowHBox = new sap.m.HBox({
                width: "100%",
                items: [
                  aTaxFields[i], // First column
                  aTaxFields[i + 1] || new sap.m.HBox({ width: "50%" }), // Second column (empty if no pair)
                ],
              });
              oTaxFormVBox.addItem(oRowHBox);
            }

            oContainer.addContent(oTaxFormVBox);
            // Add spacer after TAX/VAT/GST section
            oContainer.addContent(oSpacer.clone());
            console.log("Added form for TAX-VAT-GST");
          }
        },

        createOperationalFormPage: function (operationalData) {
          var oContainer = this.getView().byId(
            "OperationalInformationFormContainer"
          );
          if (!oContainer) {
            console.error("OperationalInformationFormContainer not found");
            sap.m.MessageBox.error("Operational container not found.");
            return;
          }
          oContainer.removeAllContent();
          oContainer.setWidth("100%"); // Ensure container width supports two columns
          console.log("Container cleared and width set to 100%:", oContainer);

          // Ensure formDataModel has editable property
          var oModel = this.getView().getModel("formDataModel");
          if (oModel.getProperty("/editable") === undefined) {
            oModel.setProperty("/editable", false); // Default to non-editable
          }

          // Spacer VBox for adding margins between sections
          var oSpacer = new sap.m.VBox({
            height: "2rem", // Small margin between sections
          });
          var oHorizontalLine = new sap.ui.core.HTML({
            content:
              "<hr style='border: 1px solid #d9d9d9; width: 100%; margin: 10px 0;' />",
          });

          var categories = {
            "Product-Service Description":
              operationalData["Product-Service Description"],
            "Operational Capacity": operationalData["Operational Capacity"],
          };

          // Calculate maximum label length for uniform width
          let maxLabelLength = 0;
          Object.keys(categories).forEach(function (categoryName) {
            const categoryData = categories[categoryName];
            if (!categoryData) return;

            Object.keys(categoryData).forEach(function (fieldKey) {
              const field = categoryData[fieldKey];
              if (field.visible) {
                maxLabelLength = Math.max(maxLabelLength, field.label.length);
              }
            });
          });

          // Convert max label length to width (approximate 0.5rem per character)
          const labelWidth = `${Math.ceil(maxLabelLength * 0.5)}rem`;

          Object.keys(categories).forEach(
            function (categoryName, index, array) {
              var categoryData = categories[categoryName];
              if (!categoryData) {
                console.warn(`No data for category: ${categoryName}`);
                return;
              }
              console.log(`Processing category: ${categoryName}`, categoryData);

              // Create a VBox for the entire section
              var oSectionVBox = new sap.m.VBox({
                width: "100%",
              });

              // Add title with H6 size
              oSectionVBox.addItem(
                new sap.m.Title({
                  text: categoryName,
                  level: "H5",
                  titleStyle: "H5",
                })
              );

              // Collect all fields in an array to process in pairs for two-column layout
              var aFields = [];
              Object.keys(categoryData).forEach(
                function (fieldKey) {
                  var field = categoryData[fieldKey];
                  if (field.visible) {
                    var oLabel = new sap.m.Label({
                      text: field.label,
                      required: field.mandatory,
                      width: labelWidth,
                    }).addStyleClass("customLabelBold");

                    var oColon = new sap.m.Text({
                      text: ":",
                      width: "0.5rem",
                    });

                    // Non-editable Text control for display mode
                    var oText = new sap.m.Text({
                      text: `{formDataModel>/Operational Information/${categoryName}/${fieldKey}/value}`,
                      width: "20rem",
                      visible: "{= !${requestInfo>/editable} }",
                    });

                    // Editable control for edit mode
                    var oControl;
                    switch (field.type.toLowerCase()) {
                      case "dropdown":
                        if (fieldKey === "PRODUCT_CATEGORY") {
                          const items = field.dropdownValues
                            ? [
                                new sap.ui.core.Item({
                                  key: "",
                                  text: field.placeholder || "Select an option",
                                }),
                                ...field.dropdownValues
                                  .split(",")
                                  .map(
                                    (opt) =>
                                      new sap.ui.core.Item({
                                        key: opt.trim(),
                                        text: opt.trim(),
                                      })
                                  ),
                              ]
                            : [
                                new sap.ui.core.Item({
                                  key: "",
                                  text: field.placeholder || "Select an option",
                                }),
                                new sap.ui.core.ListItem({
                                  text: "Electrical Equipment",
                                  key: "EE",
                                }),
                                new sap.ui.core.ListItem({
                                  text: "Mechanical Parts",
                                  key: "MP",
                                }),
                                new sap.ui.core.ListItem({
                                  text: "Raw Materials",
                                  key: "RM",
                                }),
                              ];
                          oControl = new sap.m.ComboBox({
                            required: field.mandatory,
                            visible: "{requestInfo>/editable}",
                            selectedKey:
                              field.defaultValue || field.value || "",
                            items: items,
                            width: "20rem",
                            change: function (oEvent) {
                              const selectedKey = oEvent
                                .getSource()
                                .getSelectedKey();
                              const oModel =
                                this.getView().getModel("formDataModel");
                              const path = `/Operational Information/${categoryName}/${fieldKey}/value`;
                              oModel.setProperty(path, selectedKey);
                            }.bind(this),
                          });
                        } else {
                          const dropdownOptions = field.dropdownValues
                            ? field.dropdownValues
                                .split(",")
                                .map((opt) => opt.trim())
                            : ["Option 1", "Option 2"];
                          oControl = new sap.m.Select({
                            required: field.mandatory,
                            visible: "{requestInfo>/editable}",
                            selectedKey:
                              field.defaultValue || field.value || "",
                            items: [
                              new sap.ui.core.Item({
                                key: "",
                                text: field.placeholder || "Select an option",
                              }),
                              ...dropdownOptions.map(
                                (opt) =>
                                  new sap.ui.core.Item({ key: opt, text: opt })
                              ),
                            ],
                            width: "20rem",
                            change: function (oEvent) {
                              const selectedKey = oEvent
                                .getSource()
                                .getSelectedKey();
                              const oModel =
                                this.getView().getModel("formDataModel");
                              const path = `/Operational Information/${categoryName}/${fieldKey}/value`;
                              oModel.setProperty(path, selectedKey);
                            }.bind(this),
                          });
                        }
                        break;

                      case "checkbox":
                        oControl = new sap.m.CheckBox({
                          selected:
                            field.value === "true" || field.value === true,
                          visible: "{requestInfo>/editable}",
                          select: function (oEvent) {
                            const selected = oEvent.getSource().getSelected();
                            const oModel =
                              this.getView().getModel("formDataModel");
                            const path = `/Operational Information/${categoryName}/${fieldKey}/value`;
                            oModel.setProperty(path, selected);
                          }.bind(this),
                        });
                        break;

                      case "radio":
                        oControl = new sap.m.RadioButtonGroup({
                          selectedIndex:
                            field.value === "Yes"
                              ? 0
                              : field.value === "No"
                              ? 1
                              : -1,
                          visible: "{requestInfo>/editable}",
                          columns: 2, // Horizontal arrangement
                          buttons: [
                            new sap.m.RadioButton({ text: "Yes" }),
                            new sap.m.RadioButton({ text: "No" }),
                          ],
                          select: function (oEvent) {
                            const selectedIndex = oEvent
                              .getSource()
                              .getSelectedIndex();
                            const value = selectedIndex === 0 ? "Yes" : "No";
                            const oModel =
                              this.getView().getModel("formDataModel");
                            const path = `/Operational Information/${categoryName}/${fieldKey}/value`;
                            oModel.setProperty(path, value);
                          }.bind(this),
                        });
                        break;

                      case "number":
                        oControl = new sap.m.Input({
                          value: field.value,
                          type: "Number",
                          required: field.mandatory,
                          visible: "{requestInfo>/editable}",
                          min: field.minimum
                            ? parseFloat(field.minimum)
                            : undefined,
                          max: field.maximum
                            ? parseFloat(field.maximum)
                            : undefined,
                          placeholder: field.placeholder || "",
                          valueStateText: field.mandatory
                            ? `${field.label} is required`
                            : "",
                          width: "20rem",
                          change: function (oEvent) {
                            const value = oEvent.getSource().getValue();
                            const oModel =
                              this.getView().getModel("formDataModel");
                            const path = `/Operational Information/${categoryName}/${fieldKey}/value`;
                            oModel.setProperty(path, value);
                          }.bind(this),
                        });
                        break;

                      case "calendar":
                        oControl = new sap.m.DatePicker({
                          value: field.value,
                          required: field.mandatory,
                          visible: "{requestInfo>/editable}",
                          placeholder: field.placeholder || "",
                          valueStateText: field.mandatory
                            ? `${field.label} is required`
                            : "",
                          width: "20rem",
                          change: function (oEvent) {
                            const value = oEvent.getSource().getValue();
                            const oModel =
                              this.getView().getModel("formDataModel");
                            const path = `/Operational Information/${categoryName}/${fieldKey}/value`;
                            oModel.setProperty(path, value);
                          }.bind(this),
                        });
                        break;

                      case "text":
                      default:
                        oControl = new sap.m.Input({
                          value: field.value,
                          type: field.label.toLowerCase().includes("email")
                            ? "Email"
                            : field.label.toLowerCase().includes("contact")
                            ? "Tel"
                            : "Text",
                          required: field.mandatory,
                          visible: "{requestInfo>/editable}",
                          minLength: field.minimum
                            ? parseInt(field.minimum)
                            : undefined,
                          maxLength: field.maximum
                            ? parseInt(field.maximum)
                            : undefined,
                          placeholder: field.placeholder || "",
                          valueStateText: field.mandatory
                            ? `${field.label} is required`
                            : "",
                          width: "20rem",
                          change: function (oEvent) {
                            const value = oEvent.getSource().getValue();
                            const oModel =
                              this.getView().getModel("formDataModel");
                            const path = `/Operational Information/${categoryName}/${fieldKey}/value`;
                            oModel.setProperty(path, value);
                          }.bind(this),
                        });
                        break;
                    }

                    // Combine label and colon in an HBox for proper alignment
                    var oLabelWithColon = new sap.m.HBox({
                      items: [oLabel, oColon],
                      alignItems: "Center",
                    });

                    // Wrap Text and Control in an HBox to ensure they occupy the same space
                    var oFieldValueHBox = new sap.m.HBox({
                      items: [oText, oControl],
                    });

                    // Wrap the HBox in a VBox to add top and bottom margins
                    var oFieldValueVBox = new sap.m.VBox({
                      items: [oFieldValueHBox],
                      height: "auto",
                    }).addStyleClass("customFieldValueMargin");

                    // Wrap LabelWithColon and FieldValueVBox in an HBox for the field (one column)
                    var oFieldHBox = new sap.m.HBox({
                      items: [oLabelWithColon, oFieldValueVBox],
                      width: "50%", // Each column takes 50% of the width for two-column layout
                    });

                    aFields.push(oFieldHBox);
                    console.log(
                      `Added field: ${field.label} in ${categoryName}`
                    );
                  }
                }.bind(this)
              );

              // Create two-column layout by pairing fields into HBox rows
              for (var i = 0; i < aFields.length; i += 2) {
                var oRowHBox = new sap.m.HBox({
                  width: "100%",
                  items: [
                    aFields[i], // First column
                    aFields[i + 1] || new sap.m.HBox({ width: "50%" }), // Second column (empty if no pair)
                  ],
                });
                oSectionVBox.addItem(oRowHBox);
              }

              oContainer.addContent(oSectionVBox);
              // Add spacer after each section
              oContainer.addContent(oSpacer.clone());
              // Add horizontal line only if it's not the last section
              if (index < array.length - 1) {
                oContainer.addContent(oHorizontalLine.clone());
              }
              console.log(`Added form for ${categoryName}`);
            }.bind(this)
          );
        },

        createDisclosureForm: function (disclosureData, type) {
          var oContainer = this.getView().byId("DisclosureFormContainer");
          if (!oContainer) {
            console.error(
              "DisclosureFormContainer not found in view:",
              this.getView().getId()
            );
            sap.m.MessageBox.error(
              "Disclosure container not found. Check view XML for ID 'DisclosureFormContainer'."
            );
            return;
          }
          oContainer.removeAllContent();
          oContainer.setWidth("100%");
          console.log(
            "Container cleared and width set to 100%:",
            oContainer.getId()
          );
          console.log("Container type:", oContainer.getMetadata().getName());

          // Log raw disclosureData
          console.log(
            "Raw disclosureData:",
            JSON.stringify(disclosureData, null, 2)
          );
          if (!disclosureData || Object.keys(disclosureData).length === 0) {
            console.warn("disclosureData is empty or invalid");
            oContainer.addContent(
              new sap.m.Text({ text: "No disclosure data available" })
            );
            return;
          }

          // Ensure formDataModel exists
          var oModel = this.getView().getModel("formDataModel");
          if (!oModel) {
            console.error("formDataModel not found. Creating a new one.");
            oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "formDataModel");
          }
          if (oModel.getProperty("/editable") === undefined) {
            oModel.setProperty("/editable", type === "registration");
            console.log("Editable set to:", type === "registration");
          }

          // Ensure requestInfo model exists
          var oRequestInfoModel = this.getView().getModel("requestInfo");
          if (!oRequestInfoModel) {
            console.warn("requestInfo model not found. Creating a new one.");
            oRequestInfoModel = new sap.ui.model.json.JSONModel({
              editable: type === "registration",
            });
            this.getView().setModel(oRequestInfoModel, "requestInfo");
          }

          // Initialize Disclosures in formDataModel
          if (!oModel.getProperty("/Disclosures")) {
            console.log("Initializing /Disclosures in formDataModel");
            var oFormData = { Disclosures: {} };
            Object.keys(disclosureData).forEach(function (categoryName) {
              oFormData.Disclosures[categoryName] = {};
              Object.keys(disclosureData[categoryName]).forEach(function (
                fieldKey
              ) {
                var field = disclosureData[categoryName][fieldKey];
                console.log(
                  `disclosureData value for ${categoryName}/${fieldKey}:`,
                  field.value
                );
                oFormData.Disclosures[categoryName][fieldKey] = {
                  value: field.value || "N/A",
                  label: field.label || fieldKey,
                  mandatory: field.mandatory || false,
                  visible: field.visible !== undefined ? field.visible : true,
                };
              });
            });
            oModel.setData(oFormData, true); // Merge to preserve other sections
          } else {
            console.log(
              "Disclosures already exists in formDataModel:",
              JSON.stringify(oModel.getProperty("/Disclosures"), null, 2)
            );
          }

          // Log model data
          console.log(
            "formDataModel data after initialization:",
            JSON.stringify(oModel.getData(), null, 2)
          );

          // Spacer VBox
          var oSpacer = new sap.m.VBox({
            height: "1rem",
          });

          // FlexBox for layout
          var oFlexBox = new sap.m.FlexBox({
            width: "100%",
            direction: "Column",
            alignItems: "Stretch",
          });
          oContainer.addContent(oFlexBox);

          // Add section title
          // oFlexBox.addItem(new sap.m.Title({
          //     text: "Disclosures",
          //     level: "H4",
          //     titleStyle: "H4"
          // }));

          // Calculate maximum label length for uniform width
          let maxLabelLength = 0;
          Object.keys(disclosureData).forEach(function (categoryName) {
            const categoryData = disclosureData[categoryName];
            if (!categoryData) return;
            Object.keys(categoryData).forEach(function (fieldKey) {
              const field = categoryData[fieldKey];
              if (field.visible) {
                maxLabelLength = Math.max(
                  maxLabelLength,
                  (field.label || fieldKey).length
                );
              }
            });
          });
          // Convert max label length to width (approximate 0.5rem per character)
          const labelWidth = `${Math.ceil(maxLabelLength * 0.5)}rem`;

          var bHasFields = false;
          Object.keys(disclosureData).forEach(
            function (categoryName) {
              var categoryData = disclosureData[categoryName];
              if (!categoryData) {
                console.warn(`No data for category: ${categoryName}`);
                return;
              }
              console.log(
                `Processing category: ${categoryName}`,
                JSON.stringify(categoryData, null, 2)
              );

              // Section VBox
              var oSectionVBox = new sap.m.VBox({
                width: "100%",
              });

              var aFields = [];
              Object.keys(categoryData).forEach(
                function (fieldKey) {
                  var field = categoryData[fieldKey];
                  if (!field.visible) {
                    console.log(
                      `Skipping ${categoryName}/${fieldKey} as not visible`
                    );
                    return;
                  }

                  var sBindingPath = `/Disclosures/${categoryName}/${fieldKey}/value`;
                  var fieldValue = oModel.getProperty(sBindingPath);
                  console.log(
                    `Field value for ${categoryName}/${fieldKey}:`,
                    fieldValue
                  );

                  var oLabel = new sap.m.Label({
                    text: field.label || fieldKey,
                    width: labelWidth,
                    design: "Standard",
                    required: field.mandatory || false,
                  }).addStyleClass("customLabelBold");

                  var oColon = new sap.m.Text({
                    text: ":",
                    width: "0.5rem",
                  });

                  var oText = new sap.m.Text({
                    text: `{formDataModel>${sBindingPath}}`,
                    width: "20rem",
                    visible: "{= !${requestInfo>/editable} }",
                  });

                  var oControl = new sap.m.Select({
                    selectedKey: `{formDataModel>${sBindingPath}}`,
                    visible: "{requestInfo>/editable}",
                    width: "20rem",
                    required: field.mandatory || false,
                    items: [
                      new sap.ui.core.Item({ key: "Yes", text: "Yes" }),
                      new sap.ui.core.Item({ key: "No", text: "No" }),
                      new sap.ui.core.Item({ key: "N/A", text: "N/A" }),
                    ],
                    change: function (oEvent) {
                      var selectedKey = oEvent.getSource().getSelectedKey();
                      var oModel = this.getView().getModel("formDataModel");
                      oModel.setProperty(sBindingPath, selectedKey);
                      console.log(
                        `Updated value for ${sBindingPath}:`,
                        selectedKey
                      );
                    }.bind(this),
                  });

                  // Combine label and colon in an HBox for proper alignment
                  var oLabelWithColon = new sap.m.HBox({
                    items: [oLabel, oColon],
                    alignItems: "Center",
                  });

                  var oFieldValueHBox = new sap.m.HBox({
                    items: [oText, oControl],
                  });

                  var oFieldHBox = new sap.m.HBox({
                    items: [oLabelWithColon, oFieldValueHBox],
                    width: "50%",
                  });

                  aFields.push(oFieldHBox);
                  console.log(
                    `Added field: ${field.label || fieldKey} in ${categoryName}`
                  );
                  bHasFields = true;
                }.bind(this)
              );

              // Two-column layout
              for (var i = 0; i < aFields.length; i += 2) {
                var oRowHBox = new sap.m.HBox({
                  width: "100%",
                  items: [
                    aFields[i],
                    aFields[i + 1] || new sap.m.HBox({ width: "50%" }),
                  ],
                });
                oSectionVBox.addItem(oRowHBox);
              }

              if (aFields.length > 0) {
                oFlexBox.addItem(oSectionVBox);
                oFlexBox.addItem(oSpacer.clone());
                console.log(`Added form for ${categoryName}`);
              }
            }.bind(this)
          );

          if (!bHasFields) {
            console.warn("No fields added to Disclosures form");
            oFlexBox.addItem(
              new sap.m.Text({ text: "No disclosure fields available" })
            );
          }
        },

        createSubmission: function (subData) {
          debugger;

          var oContainer = this.getView().byId("SubmissionFormContainer");
          if (!oContainer) {
            console.error("SubmissionFormContainer not found");
            sap.m.MessageBox.error("Submission container not found.");
            return;
          }
          oContainer.removeAllContent();
          oContainer.setWidth("100%"); // Ensure container width supports three columns
          console.log("Container cleared and width set to 100%:", oContainer);
          console.log("Container type:", oContainer.getMetadata().getName());

          // Log the raw subData to verify its structure and values
          console.log("Raw subData:", JSON.stringify(subData, null, 2));

          // Ensure formDataModel exists and has editable property
          var oModel = this.getView().getModel("formDataModel");
          if (!oModel) {
            console.error("formDataModel not found. Creating a new one.");
            oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "formDataModel");
          }
          if (oModel.getProperty("/editable") === undefined) {
            oModel.setProperty("/editable", false); // Default to non-editable
          }

          // Initialize Submission in formDataModel if not already present
          if (!oModel.getProperty("/Submission")) {
            console.log("Initializing /Submission in formDataModel");
            var oFormData = { Submission: {} };
            Object.keys(subData).forEach(function (categoryName) {
              oFormData.Submission[categoryName] = {};
              Object.keys(subData[categoryName]).forEach(function (fieldKey) {
                var field = subData[categoryName][fieldKey];
                console.log(
                  `subData value for ${categoryName}/${fieldKey}:`,
                  field.value
                );
                oFormData.Submission[categoryName][fieldKey] = {
                  value:
                    field.value ||
                    (field.type.toLowerCase() === "checkbox" ? false : ""), // Fallback for checkbox or text
                };
              });
            });
            oModel.setData(oFormData, true); // Merge with existing data
          } else {
            console.log(
              "Submission already exists in formDataModel:",
              oModel.getProperty("/Submission")
            );
          }

          // Log the model data to verify values
          console.log(
            "formDataModel data after initialization:",
            JSON.stringify(oModel.getData(), null, 2)
          );

          // Wrap content in a FlexBox to ensure horizontal layout support
          var oFlexBox = new sap.m.FlexBox({
            width: "100%",
            direction: "Column",
            alignItems: "Stretch",
          });
          oContainer.addContent(oFlexBox);

          // Create a VBox for the entire section
          var oSectionVBox = new sap.m.VBox({
            width: "100%",
          });

          // Separate input fields and checkbox
          var aInputFields = [];
          var aCheckboxes = [];
          Object.keys(subData["Declaration"]).forEach(function (fieldKey) {
            var field = subData["Declaration"][fieldKey];
            if (field.visible) {
              if (field.type.toLowerCase() === "checkbox") {
                aCheckboxes.push({ fieldKey: fieldKey, field: field });
              } else {
                aInputFields.push({ fieldKey: fieldKey, field: field });
              }
            }
          });

          // Create three-column layout for input fields
          for (var i = 0; i < aInputFields.length; i += 3) {
            var firstField = aInputFields[i];
            var secondField = aInputFields[i + 1];
            var thirdField = aInputFields[i + 2];

            var firstColumn = firstField
              ? this._createFieldVBox(
                  firstField.fieldKey,
                  firstField.field,
                  "Submission/Declaration"
                )
              : new sap.m.VBox({ width: "100%" });
            var secondColumn = secondField
              ? this._createFieldVBox(
                  secondField.fieldKey,
                  secondField.field,
                  "Submission/Declaration"
                )
              : new sap.m.VBox({ width: "100%" });
            var thirdColumn = thirdField
              ? this._createFieldVBox(
                  thirdField.fieldKey,
                  thirdField.field,
                  "Submission/Declaration"
                )
              : new sap.m.VBox({ width: "100%" });

            var oRowHBox = new sap.m.HBox({
              width: "100%",
              alignItems: "Start",
              justifyContent: "SpaceBetween",
              wrap: "NoWrap",
              items: [
                new sap.m.VBox({
                  width: "33.33%",
                  items: [firstColumn],
                  alignItems: "Start",
                }).addStyleClass("sapUiSmallMarginEnd"),
                new sap.m.VBox({
                  width: "33.33%",
                  items: [secondColumn],
                  alignItems: "Start",
                }).addStyleClass("sapUiSmallMarginEnd"),
                new sap.m.VBox({
                  width: "33.33%",
                  items: [thirdColumn],
                  alignItems: "Start",
                }),
              ],
            }).addStyleClass("threeColumnHBox");

            oSectionVBox.addItem(oRowHBox);
          }

          // Add checkboxes below in a single column with wrapping description
          aCheckboxes.forEach(
            function (checkbox) {
              var oCheckboxVBox = this._createFieldVBox(
                checkbox.fieldKey,
                checkbox.field,
                "Submission/Declaration"
              );
              var oCheckboxRow = new sap.m.HBox({
                width: "100%",
                items: [oCheckboxVBox],
              });
              oSectionVBox.addItem(oCheckboxRow);
            }.bind(this)
          );

          oFlexBox.addItem(oSectionVBox);
          console.log("Added Submission form");
        },

        _createFieldVBox: function (fieldKey, field, sectionPath) {
          // Use sap.m.Label for normal text styling
          var oLabel = new sap.m.Label({
            text: field.label,
            width: "12rem",
            design: "Standard",
          });

          // Construct the binding path
          var sBindingPath = "/" + sectionPath + "/" + fieldKey + "/value";

          // Log the value to verify it's being accessed correctly
          var oModel = this.getView().getModel("formDataModel");
          var fieldValue = oModel.getProperty(sBindingPath);
          console.log(
            `Field value for ${sectionPath}/${fieldKey}:`,
            fieldValue
          );

          // Non-editable Text control for display mode (for text fields)
          var oText =
            field.type.toLowerCase() !== "checkbox"
              ? new sap.m.Text({
                  text: "{formDataModel>" + sBindingPath + "}",
                  width: "20rem",
                  visible: "{= !${requestInfo>/editable} }",
                })
              : null;

          // Editable control for edit mode
          var oControl;
          switch (field.type.toLowerCase()) {
            case "text":
              oControl = new sap.m.Input({
                value: "{formDataModel>" + sBindingPath + "}",
                type: field.label.toLowerCase().includes("email")
                  ? "Email"
                  : field.label.toLowerCase().includes("contact")
                  ? "Tel"
                  : field.label.toLowerCase().includes("date")
                  ? "Date"
                  : "Text",
                required: field.mandatory,
                visible: "{requestInfo>/editable}",
                minLength: field.minimum ? parseInt(field.minimum) : undefined,
                maxLength: field.maximum ? parseInt(field.maximum) : undefined,
                placeholder: field.placeholder || "",
                valueStateText: field.mandatory
                  ? `${field.label} is required`
                  : "",
                width: "100%", // Adjusted to fit within column
                change: function (oEvent) {
                  const value = oEvent.getSource().getValue();
                  const oModel = this.getView().getModel("formDataModel");
                  const path = `/${sectionPath}/${fieldKey}/value`;
                  oModel.setProperty(path, value);
                  console.log(`Updated value for ${path}:`, value);
                }.bind(this),
              });
              break;
            case "checkbox":
              oControl = new sap.m.CheckBox({
                selected: "{formDataModel>" + sBindingPath + "}",
                text: field.description,
                enabled: "{requestInfo>/editable}",
                width: "100%",
                wrapping: true, // Enable text wrapping for long description
                select: function (oEvent) {
                  const value = oEvent.getSource().getSelected();
                  const oModel = this.getView().getModel("formDataModel");
                  const path = `/${sectionPath}/${fieldKey}/value`;
                  oModel.setProperty(path, value);
                  console.log(`Updated checkbox value for ${path}:`, value);
                }.bind(this),
              });
              break;
            default:
              oControl = new sap.m.Input({
                value: "{formDataModel>" + sBindingPath + "}",
                type: "Text",
                required: field.mandatory,
                visible: "{requestInfo>/editable}",
                width: "100%",
              });
          }

          // Use VBox to stack label and control vertically
          var items =
            field.type.toLowerCase() === "checkbox"
              ? [oLabel, oControl]
              : [oLabel, oText, oControl];
          return new sap.m.VBox({
            items: items,
            width: "100%",
            alignItems: "Start",
          });
        },

        onFieldChange: function (oEvent) {
          var oInput = oEvent.getSource();
          var sValue = oInput.getValue();
          var sFieldKey = oInput.data("fieldKey");
          var sIndex = oInput.data("index");
          var oModel = this.getView().getModel("formDataModel");

          var sPath;
          if (sIndex !== undefined) {
            // Primary Bank details
            sPath = `/Finance Information/Primary Bank details/${sIndex}/${sFieldKey}/value`;
          } else {
            // TAX-VAT-GST
            sPath = `/Finance Information/TAX-VAT-GST/${sFieldKey}/value`;
          }

          oModel.setProperty(sPath, sValue);
          console.log(
            `Updated formDataModel at ${sPath} with value: ${sValue}`
          );
        },

        onAddOtherBankDetails: function () {
          // Placeholder for adding more bank details
          console.log("Add More Bank Details button pressed");
        },

        onNavBack: function () {
          history.go(-1);
        },

        onPreviewAttachment: function (oEvent) {
          debugger;
          let base64URL = oEvent.getSource().data("customData"); // Your base64 URL

          // Decode base64 string, convert to binary data
          // var byteCharacters = atob(base64URL);
          // var byteNumbers = new Array(byteCharacters.length);
          // for (var i = 0; i < byteCharacters.length; i++) {
          //     byteNumbers[i] = byteCharacters.charCodeAt(i);
          // }
          // var byteArray = new Uint8Array(byteNumbers);

          // // Create a blob from the byte array
          // var blob = new Blob([byteArray], { type: 'application/pdf' });

          // // Create an object URL from the blob
          // var objectURL = URL.createObjectURL(blob);

          // Open the object URL in a new tab
          window.open(base64URL);
        },

        onDialogCancel: function () {
          this.sendBackFragment.close();
        },

        onEditPress: function () {
          const oView = this.getView();
          const oModel = oView.getModel("requestInfo");
          const bEditable = oModel.getProperty("/editable");

          // Flip edit mode
          oModel.setProperty("/editable", !bEditable);

          // Enable/Disable buttons
          oView.byId("idSendBackBtn").setEnabled(bEditable); // disable when entering edit mode
          oView.byId("idRejectBtn").setEnabled(bEditable);
          oView.byId("idAcceptBtn").setEnabled(bEditable);

          // Show Submit button only in edit mode
          oView.byId("idSubmitBtn").setVisible(!bEditable);
        },

        formatDate: function (sDate) {
          if (!sDate) {
            return "";
          }
          // Assuming sDate is in a format like "2025-04-30T00:00:00Z"
          var oDate = new Date(sDate);
          var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
            pattern: "dd MMMM yyyy",
          });
          return oDateFormat.format(oDate); // Returns date like "30 April 2025"
        },

        onActionConfirm: async function (sAction) {
          const that = this;
          const oBundle = this.getView().getModel("i18n").getResourceBundle();
          const sText = `Are you sure you want to ${sAction
            .toLowerCase()
            .replace("_", " ")} this request?`;

          MessageBox.confirm(sText, {
            title: "Confirmation",
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            onClose: async function (oAction) {
              if (oAction === MessageBox.Action.OK) {
                await that._submitPostRegAction(sAction);
              }
            },
          });
        },

        _submitPostRegAction: function (actionType, sComment) {
          const oView = this.getView();
          const oODataModel = oView.getModel();
          const oRouter = this.getOwnerComponent().getRouter();
          const oRequestInfoModel = oView.getModel("requestInfo");
          const oFormModel = oView.getModel("formDataModel");
          const oRequestInfoData = oRequestInfoModel
            ? oRequestInfoModel.getData()
            : {};
          const oFormData = oFormModel.getData();

          console.log("RequestInfo Data:", oRequestInfoData);
          console.log("Form Data:", oFormData);
          console.log("Disclosures Data:", oFormData.Disclosures);

          if (!oFormData) {
            sap.ui.core.BusyIndicator.hide();
            sap.m.MessageBox.error(
              "Form data is not loaded. Please reload the form and try again."
            );
            return;
          }

          const aDynamicFormFields = [];
          const extractCustomFields = (section, category, data, srNo = 0) => {
            const customFields = {};
            Object.keys(data).forEach((key) => {
              if (
                key !== "ADDRESS_TYPE" &&
                key !== "BANK_TYPE" &&
                data[key]?.newDynamicFormField
              ) {
                customFields[key] = data[key].value || ""; // Preserve original key case
              }
            });
            if (Object.keys(customFields).length > 0) {
              aDynamicFormFields.push({
                SECTION: section,
                CATEGORY: category,
                DATA: JSON.stringify(customFields),
              });
            }
          };

          Object.keys(oFormData).forEach((section) => {
            if (section === "Attachments") return;
            const sectionData = oFormData[section];
            if (section === "Disclosures") {
              Object.keys(sectionData).forEach((category) => {
                extractCustomFields(
                  section,
                  "Disclosures",
                  sectionData[category]
                );
              });
            } else {
              Object.keys(sectionData).forEach((category) => {
                const categoryData = sectionData[category];
                if (Array.isArray(categoryData)) {
                  categoryData.forEach((record, index) => {
                    let dynamicCategory = category;
                    if (
                      section === "Supplier Information" &&
                      category === "Address"
                    ) {
                      dynamicCategory =
                        record.ADDRESS_TYPE === "Primary"
                          ? "PrimaryAddress"
                          : "Other Office Address";
                    } else if (
                      section === "Finance Information" &&
                      category === "Primary Bank details"
                    ) {
                      dynamicCategory =
                        record.BANK_TYPE === "Primary"
                          ? "Primary Bank"
                          : "Other Bank Details";
                    }
                    extractCustomFields(section, dynamicCategory, record);
                  });
                } else {
                  extractCustomFields(section, category, categoryData);
                }
              });
            }
          });

          const payload = {
            action: actionType,
            stepNo: oRequestInfoData.APPROVER_LEVEL || "",
            REQUEST_NO: oRequestInfoData.REQUEST_NO || "",

            reqHeader: [
              {
                REGISTERED_ID:
                  oFormData["Supplier Information"]?.["Supplier Information"]
                    ?.REGISTERED_ID?.value ||
                  oRequestInfoData.REGISTERED_ID ||
                  "",
                WEBSITE:
                  oFormData["Supplier Information"]?.["Supplier Information"]
                    ?.WEBSITE?.value ||
                  oRequestInfoData.WEBSITE ||
                  "",
                VENDOR_NAME1:
                  oFormData["Supplier Information"]?.["Supplier Information"]
                    ?.VENDOR_NAME1?.value ||
                  oRequestInfoData.VENDOR_NAME1 ||
                  "",
                COMPLETED_BY:
                  oFormData["Submission"]?.["Declaration"]?.COMPLETED_BY
                    ?.value ||
                  oRequestInfoData.COMPLETED_BY ||
                  "",
                DESIGNATION:
                  oFormData["Submission"]?.["Declaration"]?.DESIGNATION
                    ?.value ||
                  oRequestInfoData.DESIGNATION ||
                  "",
                SUBMISSION_DATE:
                  oFormData["Submission"]?.["Declaration"]?.SUBMISSION_DATE
                    ?.value ||
                  oRequestInfoData.SUBMISSION_DATE ||
                  "",
                COMPANY_CODE:
                  oFormData["Supplier Information"]?.["Supplier Information"]
                    ?.COMPANY_CODE?.value ||
                  oRequestInfoData.COMPANY_CODE ||
                  "",
                REQUEST_TYPE: oRequestInfoData.REQUEST_TYPE || "",
              },
            ],

            addressData: (oFormData["Supplier Information"]?.Address || []).map(
              (addr, index) => ({
                SR_NO: index,
                STREET: addr.HOUSE_NUM1?.value || "",
                STREET1: addr.STREET1?.value || "",
                STREET2: addr.STREET2?.value || "",
                STREET3: addr.STREET3?.value || "",
                STREET4: addr.STREET4?.value || "",
                COUNTRY: addr.COUNTRY?.value || "",
                STATE: addr.STATE?.value || "",
                CITY: addr.CITY?.value || "",
                POSTAL_CODE: addr.POSTAL_CODE?.value || "",
                EMAIL: addr.EMAIL?.value || "",
                CONTACT_NO: addr.CONTACT_NO?.value || "",
                ADDRESS_TYPE: addr.ADDRESS_TYPE || "",
              })
            ),

            contactsData: [
              oFormData["Supplier Information"]?.["Primary Contact"] || {},
            ].map((c, index) => ({
              SR_NO: index,
              FIRST_NAME: c.FIRST_NAME?.value || "",
              LAST_NAME: c.LAST_NAME?.value || "",
              CITY: c.CITY?.value || "",
              STATE: c.STATE?.value || "",
              COUNTRY: c.COUNTRY?.value || "",
              POSTAL_CODE: c.POSTAL_CODE?.value || "",
              DESIGNATION: c.DESIGNATION?.value || "",
              EMAIL: c.EMAIL?.value || "",
              CONTACT_NO: c.CONTACT_NUMBER?.value || "",
              MOBILE_NO: c.MOBILE?.value || "",
            })),

            DyanamicFormFields: aDynamicFormFields,

            bankData: (
              oFormData["Finance Information"]?.["Primary Bank details"] || []
            ).map((bank, index) => ({
              SR_NO: index,
              BANK_SECTION: bank.BANK_TYPE || "",
              SWIFT_CODE: bank.SWIFT_CODE?.value || "",
              BRANCH_NAME: bank.BRANCH_NAME?.value || "",
              IFSC: bank.ROUTING_CODE?.value || "",
              BANK_COUNTRY: bank.BANK_COUNTRY?.value || "",
              BANK_NAME: bank.BANK_NAME?.value || "",
              BENEFICIARY: bank.BENEFICIARY?.value || "",
              ACCOUNT_NO: bank.ACCOUNT_NO?.value || "",
              ACCOUNT_NAME: bank.BENEFICIARY?.value || "",
              IBAN_NUMBER: bank.IBAN_NUMBER?.value || "",
              ROUTING_CODE: bank.ROUTING_CODE?.value || "",
              OTHER_CODE_NAME: "IFSC CODE",
              OTHER_CODE_VAL: bank.ROUTING_CODE?.value || "",
              BANK_CURRENCY: bank.BANK_CURRENCY?.value || "",
              GST:
                oFormData["Finance Information"]?.["TAX-VAT-GST"]?.GST_NO
                  ?.value || "",
              GSTYES_NO:
                oFormData["Finance Information"]?.["TAX-VAT-GST"]?.[
                  "TAX/VAT/GST"
                ]?.value || "",
            })),

            Operational_Prod_Desc: (Array.isArray(
              oFormData["Operational Information"]?.[
                "Product-Service Description"
              ]
            )
              ? oFormData["Operational Information"][
                  "Product-Service Description"
                ]
              : [
                  oFormData["Operational Information"]?.[
                    "Product-Service Description"
                  ] || {},
                ]
            ).map((p, index) => ({
              SR_NO: index,
              PROD_NAME: p.PRODUCT_NAME?.value || "",
              PROD_DESCRIPTION: p.PRODUCT_DESCRIPTION?.value || "",
              PROD_TYPE: p.PRODUCT_TYPE?.value || "",
              PROD_CATEGORY: p.PRODUCT_CATEGORY?.value || "",
            })),

            Operational_Capacity: (Array.isArray(
              oFormData["Operational Information"]?.["Operational Capacity"]
            )
              ? oFormData["Operational Information"]["Operational Capacity"]
              : [
                  oFormData["Operational Information"]?.[
                    "Operational Capacity"
                  ] || {},
                ]
            ).map((cap, index) => ({
              SR_NO: index,
              TOTAL_PROD_CAPACITY: cap.PRODUCTION_CAPACITY?.value || "",
              MINIMUM_ORDER_SIZE: cap.ORDER_SIZE_MIN?.value || "",
              MAXMIMUM_ORDER_SIZE: cap.ORDER_SIZE_MAX?.value || "",
              CITY: cap.PRODUCTION_LOCATION?.value || "",
            })),

            Disclosure_Fields: oFormData.Disclosures
              ? [
                  {
                    SR_NO: 0,
                    INTEREST_CONFLICT:
                      oFormData.Disclosures["Conflict of Interest"]
                        ?.CONFLICT_OF_INTEREST?.value || "",
                    ANY_LEGAL_CASES:
                      oFormData.Disclosures["Legal Case Disclosure"]
                        ?.LEGAL_DISCLOSURE?.value || "",
                    ABAC_REG:
                      oFormData.Disclosures["Anti-Corruption Regulation"]
                        ?.ANTI_CORRUPTION?.value || "",
                    CONTROL_REGULATION:
                      oFormData.Disclosures["Export Control"]?.EXPORT_CONTROL
                        ?.value || "",
                  },
                ]
              : [],

            Quality_Certificates: (
              oRequestInfoData.TO_QA_CERTIFICATES?.results || []
            ).map((q) => ({
              SR_NO: q.SR_NO,
              CERTI_NAME: q.CERTI_NAME,
              CERTI_TYPE: q.CERTI_TYPE,
              AVAILABLE: q.AVAILABLE,
              DONE_BY: q.DONE_BY,
            })),

            Attachments: (oRequestInfoData.TO_ATTACHMENTS?.results || []).map(
              (file) => ({
                REGESTERED_MAIL: file.REGESTERED_MAIL,
                DESCRIPTION: file.DESCRIPTION,
                ATTACH_SHORT_DEC: file.ATTACH_SHORT_DEC,
                IMAGEURL: file.IMAGEURL,
                IMAGE_FILE_NAME: file.IMAGE_FILE_NAME,
              })
            ),
          };

          if (actionType === "SEND_BACK") {
            payload.reqHeader[0].INSTRUCTIONS = sComment || "";
          }
          if (actionType === "REJECT") {
            payload.REJECTION_COMMENT = sComment || "";
          }
          if (actionType === "APPROVE") {
            payload.reqHeader[0].APPROVED_COMMENT = sComment || "";
          }

          console.log("Payload:", JSON.stringify(payload, null, 2));

          sap.ui.core.BusyIndicator.show(0);

          oODataModel.create("/PostRegData", payload, {
            success: function (oResponseData) {
              sap.ui.core.BusyIndicator.hide();
              sap.m.MessageBox.success(
                oResponseData?.PostRegData || `${actionType} successful`,
                {
                  title: "Success",
                  onClose: function () {
                    oRouter.navTo("RouteRegistrationApproval");
                  },
                }
              );
            },
            error: function (oError) {
              sap.ui.core.BusyIndicator.hide();
              const errorMsg =
                oError?.responseText || "Unexpected error occurred";
              sap.m.MessageBox.error(
                `Failed to ${actionType.toLowerCase()}: ${errorMsg}`
              );
            },
          });
        },

        onSubmitRequestForm: function () {
          // this.onActionConfirm("APPROVE");
          if (!this._pApproveCommentDialog) {
            this._pApproveCommentDialog = Fragment.load({
              id: this.getView().getId(), // ensure uniqueness
              name: "com.registration.registrationapprovalaisp.fragments.ApproveComment",
              controller: this,
            }).then(
              function (oDialog) {
                this.getView().addDependent(oDialog);
                return oDialog;
              }.bind(this)
            );
          }
          this._pApproveCommentDialog.then(
            function (oDialog) {
              this.byId("approveCommentTextArea")?.setValue(""); // clear old comment
              oDialog.open();
            }.bind(this)
          );
        },

        onRejectRegistration: function () {
          if (!this._pRejectCommentDialog) {
            this._pRejectCommentDialog = Fragment.load({
              id: this.getView().getId(), // ensure uniqueness
              name: "com.registration.registrationapprovalaisp.fragments.RejectionComment",
              controller: this,
            }).then(
              function (oDialog) {
                this.getView().addDependent(oDialog);
                return oDialog;
              }.bind(this)
            );
          }

          this._pRejectCommentDialog.then(
            function (oDialog) {
              this.byId("rejectCommentTextArea")?.setValue(""); // clear old comment
              oDialog.open();
            }.bind(this)
          );
        },

        onRejectCommentLiveChange: function (oEvent) {
          const sValue = oEvent.getParameter("value") || "";
          this.byId("rejectCharCounter").setText(`${sValue.length} / 500`);
        },

        onSendBackCommentLiveChange: function (oEvent) {
          const sValue = oEvent.getParameter("value") || "";
          this.byId("sendBackCharCounter").setText(`${sValue.length} / 500`);
        },

        onRejectCommentConfirm: function () {
          const sComment = this.byId("rejectCommentTextArea").getValue();

          if (!sComment?.trim()) {
            MessageBox.warning("Please enter a rejection comment.");
            return;
          }

          this.byId("rejectCommentDialog").close();
          this._submitPostRegAction("REJECT", sComment);
        },

        onApproveCommentConfirm: function () {
          const sComment = this.byId("approveCommentTextArea").getValue();
          if (!sComment?.trim()) {
            MessageBox.warning("Please enter a Approve comment.");
            return;
          }

          this.byId("approveCommentDialog").close();
          this._submitPostRegAction("APPROVE", sComment);
        },

        onRejectCommentCancel: function () {
          this.byId("rejectCommentDialog").close();
        },

        onApproveCommentCancel: function () {
          this.byId("approveCommentDialog").close();
        },

        onSubmitEditRegistration: function () {
          this._submitPostRegAction("EDIT");
        },

        onSendBackRegistration: function () {
          if (!this._pSendBackDialog) {
            this._pSendBackDialog = Fragment.load({
              id: this.getView().getId(),
              name: "com.registration.registrationapprovalaisp.fragments.SendBackComment",
              controller: this,
            }).then(
              function (oDialog) {
                this.getView().addDependent(oDialog);
                return oDialog;
              }.bind(this)
            );
          }

          this._pSendBackDialog.then(function (oDialog) {
            oDialog.open();
          });
        },

        onSendBackConfirm: function () {
          const oDialog = this.byId("sendBackDialog");
          const sComment = this.byId("sendBackCommentTextArea").getValue();

          if (!sComment?.trim()) {
            MessageBox.warning("Please enter a comment before proceeding.");
            return;
          }

          oDialog.close();
          this._submitPostRegAction("SEND_BACK", sComment); // pass comment
        },

        onSendBackCancel: function () {
          this.byId("sendBackDialog").close();
        },

        onPressLog: function () {
          const oLayoutData = this.byId("previewSplitterLayout");
          if (oLayoutData) {
            oLayoutData.setSize("70%");
          }
        },

        onDeclinePress: function () {
          const oLayoutData = this.byId("previewSplitterLayout");
          if (oLayoutData) {
            oLayoutData.setSize("100%");
          }
        },
      }
    );
  }
);
