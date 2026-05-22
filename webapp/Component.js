/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "./model/models",
    "./controller/ErrorHandler",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/message/ControlMessageProcessor",
],
    function (UIComponent, Device, models, ErrorHandler, JSONModel, ControlMessageProcessor) {
        "use strict";

        return UIComponent.extend("zmanagehamper.Component", {
            metadata: {
                manifest: "json"
            },

            /**
                 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
                 * In this function, the device models are set and the router is initialized.
                 * @public
                 * @override
                 */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // initialize the error handler with the component
                this._oErrorHandler = new ErrorHandler(this);

                // set device model
				var deviceModel = new JSONModel({
					isTouch: sap.ui.Device.support.touch,
					isNoTouch: !sap.ui.Device.support.touch,
					isPhone: sap.ui.Device.system.phone,
					isNoPhone: !sap.ui.Device.system.phone,
					//isPad: sap.ui.Device.system.tablet,
					//isNoPad: !sap.ui.Device.system.tablet,
					isDesktop: sap.ui.Device.system.desktop,
					isNoDesktop: !sap.ui.Device.system.desktop,
					listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
					listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive"
				});
				deviceModel.setDefaultBindingMode("OneWay");

                // set the device model
                //this.setModel(models.createDeviceModel(), "device");
                this.setModel(deviceModel, "device");

                // create the views based on the url/hash
                this.getRouter().initialize();
            },

            /**
             * The component is destroyed by UI5 automatically.
             * In this method, the ErrorHandler is destroyed.
             * @public
             * @override
             */
            destroy: function () {
                this._oErrorHandler.destroy();
                // call the base component's destroy function
                UIComponent.prototype.destroy.apply(this, arguments);
            },

            /**
                * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
                * design mode class should be set, which influences the size appearance of some controls.
                * @public
                * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
                */
            getContentDensityClass: function () {
                if (this._sContentDensityClass === undefined) {
                    // check whether FLP has already set the content density class; do nothing in this case
                    // eslint-disable-next-line sap-no-proprietary-browser-api
                    if (
                        document.body.classList.contains("sapUiSizeCozy") ||
                        document.body.classList.contains("sapUiSizeCompact")
                    ) {
                        this._sContentDensityClass = "";
                    } else if (!Device.support.touch) {
                        // apply "compact" mode if touch is not supported
                        this._sContentDensityClass = "sapUiSizeCompact";
                    } else {
                        // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
                        this._sContentDensityClass = "sapUiSizeCozy";
                    }
                }
                return this._sContentDensityClass;
            },

            /**
                 * Returns the customizing
                 * @public
                 * @returns {sap.ui.model.json.JSONModel} JSONModel mit dem App Parametern
                 */
            getHamperCustomizing: function () {
                return this._oCustomizing;
            },

            /**
             * Sets the customizing parameter
             * @public
             * @param {sap.ui.model.json.JSONModel} oCustomizing JSONModel mit dem App Parametern
             */
            setHamperCustomizing: function (oCustomizing) {
                this._oCustomizing = oCustomizing;
            },

        });
    }
);