/*global history */
sap.ui.define([
		"zjblessons/MasterTemplate2/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/GroupHeaderListItem",
		"sap/ui/Device",
		"zjblessons/MasterTemplate2/model/formatter",
		"sap/ui/core/Fragment"
	], function (BaseController, JSONModel, Filter, FilterOperator, GroupHeaderListItem, Device, formatter,Fragment) {
		"use strict";

		return BaseController.extend("zjblessons.MasterTemplate2.controller.Master", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
			 * @public
			 */
			onInit : function () {
				// Control state model
				var oList = this.byId("list"),
					oViewModel = this._createViewModel(),
					// Put down master list's original value for busy indicator delay,
					// so it can be restored later on. Busy handling on the master list is
					// taken care of by the master list itself.
					iOriginalBusyDelay = oList.getBusyIndicatorDelay();


				this._oList = oList;
				// keeps the filter and search state
				this._oListFilterState = {
					aFilter : [],
					aSearch : []
				};

				this.setModel(oViewModel, "masterView");
				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
				oList.attachEventOnce("updateFinished", function(){
					// Restore original busy indicator delay for the list
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				});

				this.getView().addEventDelegate({
					onBeforeFirstShow: function () {
						this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
					}.bind(this)
				});

				this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
				this.getRouter().attachBypassed(this.onBypassed, this);
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * After list data is available, this handler method updates the
			 * master list counter and hides the pull to refresh control, if
			 * necessary.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onUpdateFinished : function (oEvent) {
				_oList = oEvent.getSource()
				// update the master list object counter after new data is loaded
				this._updateListItemCount(oEvent.getParameter("total"));
				// hide pull to refresh if necessary
				this.byId("pullToRefresh").hide();
			},

			/**
			 * Event handler for the master search field. Applies current
			 * filter value and triggers a new search. If the search field's
			 * 'refresh' button has been pressed, no new search is triggered
			 * and the list binding is refresh instead.
			 * @param {sap.ui.base.Event} oEvent the search event
			 * @public
			 */
			onSearch : function (oEvent) {
				if (oEvent.getParameters().refreshButtonPressed) {
					// Search field's 'refresh' button has been pressed.
					// This is visible if you select any master list item.
					// In this case no new search is triggered, we only
					// refresh the list binding.
					this.onRefresh();
					return;
				}

				var sQuery = oEvent.getParameter("query");

				if (sQuery) {
					this._oListFilterState.aSearch = [new Filter("ItemID", FilterOperator.Contains, sQuery)];
				} else {
					this._oListFilterState.aSearch = [];
				}
				this._applyFilterSearch();

			},

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh : function () {
				this._oList.getBinding("items").refresh();
			},



			/**
			 * Event handler for the list selection event
			 * @param {sap.ui.base.Event} oEvent the list selectionChange event
			 * @public
			 */
			onSelectionChange : function (oEvent) {
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			},

			/**
			 * Event handler for the bypassed event, which is fired when no routing pattern matched.
			 * If there was an object selected in the master list, that selection is removed.
			 * @public
			 */
			onBypassed : function () {
				this._oList.removeSelections(true);
			},

			/**
			 * Used to create GroupHeaders with non-capitalized caption.
			 * These headers are inserted into the master list to
			 * group the master list's items.
			 * @param {Object} oGroup group whose text is to be displayed
			 * @public
			 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
			 */
			createGroupHeader : function (oGroup) {
				return new GroupHeaderListItem({
					title : oGroup.text,
					upperCase : false
				});
			},

			/**
			 * Event handler for navigating back.
			 * We navigate back in the browser historz
			 * @public
			 */
			onNavBack : function() {
				history.go(-1);
			},
		    
		    //Create and Close AddItemDialog------------------------------------------------------------
		    
			onOpenAddItemDialog: function(){
				//console.log("Frag")
				if(!this.addItemDialog){
					this.addItemDialog  =  this.loadFragment({
						name:"zjblessons.MasterTemplate2.view.AddItemDialog"
					});
				} 
				this.addItemDialog.then(function(oDialog){
					oDialog.open();
				});
			},
			
			onCloseAddItemDialog: function(){
				this.byId("addItemDialog").close();
			},
			
			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */


			_createViewModel : function() {
				return new JSONModel({
					isFilterBarVisible: false,
					filterBarLabel: "",
					delay: 0,
					title: this.getResourceBundle().getText("masterTitleCount", [0]),
					noDataText: this.getResourceBundle().getText("masterListNoDataText"),
					sortBy: "HeaderID",
					groupBy: "None"
				});
			},

			/**
			 * If the master route was hit (empty hash) we have to set
			 * the hash to to the first item in the list as soon as the
			 * listLoading is done and the first item in the list is known
			 * @private
			 */
			_onMasterMatched :  function() {
				this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
					function (mParams) {
						if (mParams.list.getMode() === "None") {
							return;
						}
					//	var sObjectId = mParams.firstListitem.getBindingContext().getProperty("HeaderID");
						//changed
						var sObjectHeaderID = mParams.firstListitem.getBindingContext().getProperty("HeaderID");
						//added----------------------------------------------------------------------------
						var sObjectItemID = mParams.firstListitem.getBindingContext().getProperty("ItemID");
						//var sObjectId = sObjectItemID.concat(sObjectHeaderID);
						this.getRouter().navTo("object", {objectId : [sObjectHeaderID,sObjectItemID]}, true);
					}.bind(this),
					function (mParams) {
						if (mParams.error) {
							return;
						}
						this.getRouter().getTargets().display("detailNoObjectsAvailable");
					}.bind(this)
				);
			},

			/**
			 * Shows the selected item on the detail page
			 * On phones a additional history entry is created
			 * @param {sap.m.ObjectListItem} oItem selected Item
			 * @private
			 */
			_showDetail : function (oItem) {
				var bReplace = !Device.system.phone;
				this.getRouter().navTo("object", {
					//changed---------------------------------------------------
					objectId : oItem.getBindingContext().getProperty("ItemID") + ',' + oItem.getBindingContext().getProperty("HeaderID")
					//----------------------------------------------------------
				}, bReplace);
			},
			
			/**
			 * Sets the item count on the master list header
			 * @param {integer} iTotalItems the total number of items in the list
			 * @private
			 */
			_updateListItemCount : function (iTotalItems) {
				var sTitle;
				// only update the counter if the length is final
				if (this._oList.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
					this.getModel("masterView").setProperty("/title", sTitle);
				}
			},

			/**
			 * Internal helper method to apply both filter and search state together on the list binding
			 * @private
			 */
			_applyFilterSearch : function () {
				var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
					oViewModel = this.getModel("masterView");
				this._oList.getBinding("items").filter(aFilters, "Application");
				// changes the noDataText of the list in case there are no filter results
				if (aFilters.length !== 0) {
					oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
				} else if (this._oListFilterState.aSearch.length > 0) {
					// only reset the no data text to default when no new search was triggered
					oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
				}
			},

			/**
			 * Internal helper method to apply both group and sort state together on the list binding
			 * @param {sap.ui.model.Sorter[]} aSorters an array of sorters
			 * @private
			 */
			_applyGroupSort : function (aSorters) {
				this._oList.getBinding("items").sort(aSorters);
			},

			/**
			 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
			 * @param {string} sFilterBarText the selected filter value
			 * @private
			 */
			_updateFilterBar : function (sFilterBarText) {
				var oViewModel = this.getModel("masterView");
				oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
				oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
			},
			
			 //Create new Item in Master view----------------------------------------------
			 onAddItemLocal : function (){
			 	var sInstance = this.getView().byId("idInstance").getValue();
			 	var sHeaderId = this.getView().byId("idHeaderID").getValue();
			 	var sID = this.getView().byId("idID").getValue();
			 	var sMaterialId = this.getView().byId("idMaterialID").getValue();
			 	//var sGroupId = this.getView().byId("idGroupID").getValue();
			 	//var sMaterialText = this.getView().byId("idMaterialText").getValue();
			 	var sQuantity = this.getView().byId("idQuantity").getValue();
			 	var sPrice = this.getView().byId("idPrice").getValue();
			 	var sCreatedBy = this.getView().byId("idCreatedBy").getValue();
			 	var sIntegrationId = this.getView().byId("idIntegrationID").getValue();
			 	
			 		var oModel = this.getView().getModel();
			 		var oContext  = oModel.createEntry('/tItems', {
			 			properties:{
			 				Instance:sInstance,
			 				HeaderID:sHeaderId,
			 				ID:sID,
			 				MaterialID : sMaterialId,
			 				/*GroupID : sGroupId,
			 				MaterialText : sMaterialText,*/
			 				Quantity : sQuantity,
			 				Price : sPrice,
			 				CreatedBy : sCreatedBy,
			 				IntegrationID : sIntegrationId
			 			}
			 		});
			 		
			 		oContext.created()
			 		.then(this.onSubmitModel());
			 		},
			 		
			// Submits model if hasPendingChages == true -----------------------------------------------
			onSubmitModel :function(){
				var oModel = this.getView().getModel();
				if(oModel.hasPendingChanges()){
					oModel.submitChanges({
						success:this.mySuccessHandler,
						error:this.myErrorHandler
					});
				} else {
					console.log("No changes")
				}
			},
			
			mySuccessHandler : function(oData){
				console.log("success", oData);
				
			},
			
			myErrorHandler :  function(oError){
				console.log("error", oError);
			}
			
		});
	}
);