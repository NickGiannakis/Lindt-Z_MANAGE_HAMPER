sap.ui.define(
    [
        "sap/ui/base/Object",
        "sap/m/MessageBox",
        "sap/m/MessageItem",
        "sap/m/MessageView",
        "sap/m/Button",
        "sap/m/Dialog",
        "sap/m/Bar",
        "sap/m/Title",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/IconPool",
    ],
    function (UI5Object, MessageBox, MessageItem, MessageView, Button, Dialog, Bar, Title, JSONModel, IconPool) {
        "use strict";

        return UI5Object.extend(
            "zmanagehamper.controller.ErrorHandler",
            {
                /**
                 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
                 * @class
                 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
                 * @public
                 * @alias zmanagehamper.controller.ErrorHandler
                 */
                constructor: function (oComponent) {

                    var that = this;

                    this._oResourceBundle = oComponent
                        .getModel("i18n")
                        .getResourceBundle();
                    this._oComponent = oComponent;
                    this._oModel = oComponent.getModel();
                    this._bMessageOpen = false;
                    this._sErrorText =
                        this._oResourceBundle.getText("errorText");

                    this._oModel.attachMetadataFailed(function (oEvent) {
                        var oParams = oEvent.getParameters();
                        this._showServiceError(oParams.response);
                    }, this);

                    this._oModel.attachRequestFailed(function (oEvent) {
                        var oParams = oEvent.getParameters();
                        // An entity that was not found in the service is also throwing a 404 error in oData.
                        // We already cover this case with a notFound target so we skip it here.
                        // A request that cannot be sent to the server is a technical error that we have to handle though
                        if (
                            oParams.response.statusCode !== "404" ||
                            (oParams.response.statusCode === 404 &&
                                oParams.response.responseText.indexOf(
                                    "Cannot POST"
                                ) === 0)
                        ) {
                            this._showServiceError(oParams.response);
                        }
                    }, this);

                    var oMessageTemplate = new MessageItem({
                        type: "{type}",
                        title: "{title}",
                        description: "{description}",
                        subtitle: "{subtitle}",
                        counter: "{counter}",
                        markupDescription: "{markupDescription}"
                    });

                    this._oMessageView = new MessageView({
                        showDetailsPageHeader: false,
                        itemSelect: function () {
                            oBackButton.setVisible(true);
                        },
                        items: {
                            path: "/",
                            template: oMessageTemplate
                        }
                    });

                    var oBackButton = new Button({
                        icon: IconPool.getIconURI("nav-back"),
                        visible: false,
                        press: function () {
                            that._oMessageView.navigateBack();
                            this.setVisible(false);
                        }
                    });

                    this._oDialog = new Dialog({
                        resizable: true,
                        content: this._oMessageView,
                        state: 'Error',
                        beginButton: new Button({
                            press: function () {
                                this.getParent().close();
                            },
                            text: "Close"
                        }),
                        customHeader: new Bar({
                            contentLeft: [oBackButton],
                            contentMiddle: [
                                new Title({ text: this._oResourceBundle.getText("TIT_ERROR") })
                            ]
                        }),
                        contentHeight: "30%",
                        contentWidth: "50%",
                        verticalScrolling: false
                    });

                },

                /**
                 * Shows a {@link sap.m.MessageBox} when a service call has failed.
                 * Only the first error message will be display.
                 * @param {string} sDetails a technical error to be displayed on request
                 * @private
                 */
                _showServiceError: function (sDetails) {
                    if (sDetails.statusCode === 503 || sDetails.statusCode === 401) {
                        if (this._bMessageOpen) {
                            return;
                        }

                        this._bMessageOpen = true;

                        MessageBox.error(sDetails.body, {
                            id: "serviceErrorMessageBox503",
                            styleClass:
                                this._oComponent.getContentDensityClass(),
                            actions: [MessageBox.Action.CLOSE],
                            onClose: function () {
                                this._bMessageOpen = false;
                            }.bind(this),
                        });
                    } else {
                        var aErrorDetails = [
                            {
                                message: "",
                            },
                        ];

                        if (sDetails.responseText.indexOf("<?xml") > -1) {
                            var oXML = jQuery.parseXML(sDetails.responseText);
                            var oXMLMsg = oXML.querySelector("message");
                            aErrorDetails[0].message = oXMLMsg.textContent;
                        } else if (
                            sDetails.responseText.indexOf("<html") > -1
                        ) {
                        } else {
                            try {
                                var oDetails = JSON.parse(
                                    sDetails.responseText
                                );
                                aErrorDetails =
                                    oDetails.error.innererror.errordetails;
                            } catch (error) {
                                aErrorDetails[0].message =
                                    sDetails.responseText;
                            }
                        }
                        if (this._bMessageOpen) {
                            return;
                        }

                        this._bMessageOpen = true;

                        if (aErrorDetails.length > 0) {

                            if (aErrorDetails.length === 0) {

                                let sMessage = aErrorDetails[0].message;

                                if (!sMessage.includes("YMSG")) {
                                    MessageBox.error(sMessage, {
                                        id: "serviceErrorMessageBox",
                                        //details: aErrorDetails[0].message,
                                        styleClass:
                                            this._oComponent.getContentDensityClass(),
                                        actions: [MessageBox.Action.CLOSE],
                                        onClose: function () {
                                            this._bMessageOpen = false;
                                        }.bind(this),
                                    });
                                } else {
                                    // Cut the YMSG part of the string
                                    sMessage = sMessage.slice(4);

                                    MessageBox.warning(sMessage, {
                                        id: "serviceWarningMessageBox",
                                        styleClass:
                                            this._oComponent.getContentDensityClass(),
                                        actions: [MessageBox.Action.CLOSE],
                                        onClose: function () {
                                            this._bMessageOpen = false;
                                        }.bind(this),
                                    });
                                }
                            } else {

                                var aMessages = [];

                                for (let index = 0; index < aErrorDetails.length; index++) {
                                    const element = aErrorDetails[index];

                                    if (element.code !== "") {

                                        let sType = "Error";
                                        let sTitle = this._oResourceBundle.getText("TIT_ERROR_MSG");

                                        switch (element.severity) {
                                            case "error":
                                                sType = "Error";
                                                sTitle = this._oResourceBundle.getText("TIT_ERROR_MSG");
                                                break;
                                            case "warning":
                                                sType = "Warning";
                                                sTitle = this._oResourceBundle.getText("TIT_WARNING_MSG");
                                                break;
                                            case "success":
                                                sType = "Success";
                                                sTitle = this._oResourceBundle.getText("TIT_SUCCESS_MSG");
                                                break;
                                            case "information":
                                                sType = "Information";
                                                sTitle = this._oResourceBundle.getText("TIT_INFO_MSG");
                                                break;
                                            default:
                                                break;
                                        }

                                        var oMessage = {
                                            type: sType,
                                            title: sTitle,
                                            description: element.message,
                                            subtitle: element.code,
                                            counter: 1
                                        }

                                        aMessages.push(oMessage);

                                    }

                                }

                                var oModel = new JSONModel();
                                oModel.setData(aMessages);
                                this._oMessageView.setModel(oModel);
                                this._oMessageView.navigateBack();
                                this._oDialog.open();

                            }
                        }
                    }
                },
            }
        );
    }
);
