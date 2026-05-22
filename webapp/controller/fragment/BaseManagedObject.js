sap.ui.define(
    [
        "sap/ui/base/ManagedObject",
        "sap/ui/core/Fragment",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/type/String",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
    ],
    function (
        ManagedObject,
        Fragment,
        JSONModel,
        typeString,
        Filter,
        FilterOperator
    ) {
        return ManagedObject.extend(
            "zmanagehamper.controller.fragment.BaseManagedObject",
            {
                
                /**
                 * Initiates the model for the view oDialog
                 * @param {sap.ui.core.Control} oDialog - The control wich holds the view model
                 * @function
                 * @public
                 */
                initViewModel: function(oDialog){
                    this._oViewModel = new JSONModel({
                        busy: false,
                        delay: 0,                        
                        tableBusyDelay: 0,
                        tableBusy: false,
                        tableTitle: ""
                    });

                    oDialog.setModel(this._oViewModel, "ViewModel");
                },

                /**
                 * Returns the view Model
                 * @returns {sap.ui.model.json.JSONModel} - the current view Model
                 * @function
                 * @public
                 */
                getViewModel: function(){
                    return this._oViewModel;
                },

                /**
                 * Controls the Busy Indicator of the current view
                 * @param {Boolean} bBusy - Shows or hides the busy control
                 * @function
                 * @public
                 */
                setBusyIndicator: function(bBusy){
                    this.getViewModel().setProperty(
                        "/busy",
                        bBusy
                    );
                },
                
                /**
                 * Shows an success or error message depending on the value of oData
                 * If oData is not empty, the messages of oData will be diplayed
                 * @param {Object} oData - The result, that contains messages
                 * @param {String} sSuccMessage - The i18n id for the success message
                 * @param {String} sErrorMessage - The i18n id for the error message
                 * @function
                 * @public
                 */
                writeSuccessMessage: function (
                    oData,
                    sSuccMessage,
                    sErrorMessage
                ) {
                    if (oData !== undefined) {
                        if (oData.results.length > 0) {
                            this.getParentControl().showMessageDialog(
                                oData.results
                            );
                        } else {
                            this.getParentControl().showSuccessMsg(
                                this.getParentControl().getI18nText(
                                    sSuccMessage
                                )
                            );
                        }
                    } else {
                        this.getParentControl().showErrorMsg(
                            this.getParentControl().getI18nText(sErrorMessage)
                        );
                    }
                },

                /**
                 * Binds the filter to the value help dialog of field supplier
                 * @param {sap.ui.model.Filter} oFilter - the filter object
                 * @param {sap.m.ValueHelpDialog} oValueHelpDialog - the value help dialog
                 * @function
                 * @private
                 */
                _filterTable: function (oFilter, oValueHelpDialog) {
                    oValueHelpDialog.getTableAsync().then(function (oTable) {
                        if (oTable.bindRows) {
                            oTable.getBinding("rows").filter(oFilter);
                        }

                        if (oTable.bindItems) {
                            oTable.getBinding("items").filter(oFilter);
                        }

                        oValueHelpDialog.update();
                    });
                },

                /**
                 * Opens the fragment
                 * @function
                 * @public
                 */
                open: function () {
                    if (!this._bInit) {
                        // Initialize our fragment
                        this.onInit();
                        this._bInit = true;
                        // connect fragment to the root view of this component (models, lifecycle)
                        this.getView().addDependent(this.getControl());
                    }

                    var args = Array.prototype.slice.call(arguments);
                    if (this.getControl().open) {
                        this.getControl().open.apply(this.getControl(), args);
                    } else if (this.getControl().openBy) {
                        this.getControl().openBy.apply(this.getControl(), args);
                    }
                },

                /**
                 * Deletes the fragment
                 * @function
                 * @public
                 */
                exit: function () {
                    delete this._oView;
                },

                /**
                 * Returns the control of the parent view
                 * @function
                 * @public
                 * @returns {object} - the controller
                 */
                getParentControl: function () {
                    return this._oView.getController();
                },

                /**
                 * Returns the component of the view
                 * @function
                 * @public
                 * @returns {object} - the component
                 */
                getOwnerComponent: function () {
                    return this._oView.getController().getOwnerComponent();
                },

                /**
                 * Returns the i18n text
                 * @param {String} sText - the text id
                 * @function
                 * @public
                 * @returns {string} - the text
                 */
                getI18nText: function (sText, aParams) {
                    return this._oView.getController().getI18nText(sText, aParams);
                },


                /**
                 * Closes the control
                 * @function
                 * @public
                 */
                close: function () {
                    this._oControl.close();
                },

                setView: function (oView) {
                    this._oView = oView;
                },

                /**
                 * Returns the fragment
                 * @function
                 * @public
                 * @returns {object} - the fragment
                 */
                getView: function () {
                    return this._oView;
                },

                /**
                 * Sets the current controll
                 * @param {String} sDialogName - the current name of the view element
                 * @param {zmanagehamper.controller.fragment.BaseManagedObject} oThis - the current Managed Object
                 * @function
                 * @public
                 */
                setControl: function (sDialogName, oThis) {
                    this._oControl = sap.ui.xmlfragment(
                        this.getView().getId(),
                        "zmanagehamper.view.fragment." +
                            sDialogName,
                        oThis
                    );
                },

                /**
                 * Returns the fragment control
                 * @function
                 * @public
                 * @returns {object} - the controller
                 */
                getControl: function () {
                    return this._oControl;
                },

                setModel: function (oModel) {
                    this._oModel = oModel;
                },

                /**
                 * Returns the fragment control
                 * @function
                 * @public
                 * @returns {object} - the controller
                 */
                getModel: function () {
                    return this._oModel;
                },

                /**
                 * Initiates the dialog
                 * @function
                 * @public
                 */
                onInit: function () {
                    this._oDialog = this.getControl();
                    this._sModelPath =
                        "zmanagehamper/model";
                },

                /**
                 * Destroys the dialog
                 * @function
                 * @public
                 */
                onExit: function () {
                    this._oDialog.destroy();
                },
            }
        );
    },
    /* bExport= */ true
);
