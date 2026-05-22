sap.ui.define(
    [
        "./BaseManagedObject",
        "zmanagehamper/service/Service"        
    ],
    function (BaseManagedObject, Service, Filter, FilterOperator) {

        return BaseManagedObject.extend(
            "zmanagehamper.controller.fragment.DialogPDFViewer",
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
                        "zmanagehamper.view.fragment.DialogPDFViewer",
                        this
                    );
                    
                    /** @type sap.m.PDFViewer */
                    this._oPDFViewer = this._oView.byId("pdfViewer");
                },
                /**
                 * Initializes the fragment
                 * @function
                 * @public
                 */
                initializeView: function () {
                    
                },
            }
        );

    },
    /* bExport= */ true
);

