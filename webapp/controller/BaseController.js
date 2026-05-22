sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/UIComponent",
        "sap/m/library",
        "../service/Service",
        "sap/m/MessageBox"
    ],
    function (Controller, UIComponent, mobileLibrary, Service, MessageBox) {
        "use strict";

        // shortcut for sap.m.URLHelper
        var URLHelper = mobileLibrary.URLHelper;

        return Controller.extend("zmanagehamper.controller.BaseController", {

            /**
                     * Convenience method for accessing the router.
                     * @public
                     * @returns {sap.ui.core.routing.Router} the router for this component
                     */
            getRouter: function () {
                return UIComponent.getRouterFor(this);
            },

            getCurrentRoute: function (router = this.getOwnerComponent().getRouter()) {
                const currentHash = router.getHashChanger().getHash();
                const { name } = router.getRouteInfoByHash(currentHash); // API available since 1.75
                return router.getRoute(name);
            },

            getCurrentRouteName: function (router = this.getOwnerComponent().getRouter()) {
                const currentHash = router.getHashChanger().getHash();
                const { name } = router.getRouteInfoByHash(currentHash); // API available since 1.75
                return name; // API available since 1.75
            },

            /**
             * Convenience method for getting the view model by name.
             * @public
             * @param {string} [sName] the model name
             * @returns {sap.ui.model.Model} the model instance
             */
            getModel: function (sName) {
                return this.getView().getModel(sName);
            },

            /**
             * Returns the model of the OData service
             * @public
             * @returns {sap.ui.model.Model} the model instance
             */
            getServiceModel: function () {
                return this.getOwnerComponent().getModel();
            },

            /**
                 * Returns a instance of Service
                 * @public
                 * @returns {zmanagehamper.service.Service} the service instance
                 */
            getService: function () {
                return new Service();
            },

            /**
                 * Convenience method for setting the view model.
                 * @public
                 * @param {sap.ui.model.Model} oModel the model instance
                 * @param {string} sName the model name
                 * @returns {sap.ui.mvc.View} the view instance
                 */
            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },

            /**
                 * Getter for the resource bundle.
                 * @public
                 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
                 */
            getResourceBundle: function () {
                return this.getOwnerComponent()
                    .getModel("i18n")
                    .getResourceBundle();
            },

            /**
             * Getter for the resource bundle text.
             * @param {string} sTextId - The text id
             * @param {array} aParams - Parameter
             * @returns {string} The text
             * @function
             * @public
             */
            getI18nText: function (sTextId, aParams) {
                var oBundle = this.getResourceBundle();

                if (aParams !== null) {
                    return oBundle.getText(sTextId, aParams);
                } else {
                    return oBundle.getText(sTextId);
                }
            },

            /**
                 * Returns the app customizing
                 * @public
                 * @returns {sap.ui.model.json.JSONModel} JSONModel mit dem App Parametern
                 */
            getHamperCustomizing: function () {
                return this.getOwnerComponent().getHamperCustomizing();
            },

            /**
             * Sets the app customizing
             * @public
             * @param {sap.ui.model.json.JSONModel} oCustomizing JSONModel mit dem App Parametern
             */
            setHamperCustomizing: function (oCustomizing) {
                this.getOwnerComponent().setHamperCustomizing(oCustomizing);
            },

            showErrorMessage: function (sMessage) {
                MessageBox.error(sMessage);
            },

            showSuccessMessage: function (sMessage) {
                MessageBox.success(sMessage);
            }

        });
    }
);