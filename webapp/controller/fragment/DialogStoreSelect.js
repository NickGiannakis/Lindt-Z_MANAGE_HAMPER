sap.ui.define(
    [
        "./BaseManagedObject",
        "zmanagehamper/service/Service",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
    ],
    function (BaseManagedObject, Service, Filter, FilterOperator) {

        return BaseManagedObject.extend(
            "zmanagehamper.controller.fragment.DialogStoreSelect",
            {
                /**
                 * @constructor
                 * @public
                 * @param {object} oView - the current view
                 * @param {object} oModel - the OData model
                 */
                constructor: function (oView, oModel) {
                    this._oView = oView;
                    this._oODataModel = oModel;
                    this._oService = new Service();
                    this._oControl = sap.ui.xmlfragment(
                        oView.getId(),
                        "zmanagehamper.view.fragment.DialogStoreSelect",
                        this
                    );
                    /** @type sap.m.List */
                    this._oStoreList = this._oView.byId("listStores");

                    /** @type sap.m.SearchField */
                    this._oSearchField = this._oView.byId("searchFieldStore");
                },
                /**
                 * Initializes the fragment
                 * @function
                 * @public
                 */
                initializeView: function () {
                    this._oSearchField.setValue("");
                    if (this._oStoreList.getBinding("items")) {
                        this._oStoreList.removeSelections(true);
                        this._oStoreList.getBinding("items").filter([]);

                    }
                },

                onSearch: function (oEvent) {

                    let sSearchValue = oEvent.getParameter("newValue");

                    if (sSearchValue.length > 0) {
                        let aFilters = [];
                        let oFilter = new Filter(
                            "Description",
                            FilterOperator.EQ,
                            sSearchValue
                        );

                        aFilters.push(oFilter);
                        this._oStoreList.getBinding("items").filter(aFilters);
                    }

                },

                onSelectStore: function (oEvent) {
                    var oSelectedItem = oEvent.getSource().getSelectedItem();
                    let sSPathSelectedRow = oSelectedItem.getBindingContext().getPath();
                    var sSiteId = this.getParentControl().getModel().getProperty(sSPathSelectedRow + "/SiteId");
                    this.getParentControl().setStore(sSiteId);
                    this.close();
                },

                onPressCancel: function (oEvent) {
                    this.close();
                }
            }
        );

    },
/* bExport= */ true
);

