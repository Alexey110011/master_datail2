/*global location */
sap.ui.define([
		"zjblessons/MasterTemplate2/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"zjblessons/MasterTemplate2/model/formatter",
		"sap/m/MessageToast"
	], function (BaseController, JSONModel, formatter, MessageToast) {
		"use strict";

		return BaseController.extend("zjblessons.MasterTemplate2.controller.Detail", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			onInit : function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var oViewModel = new JSONModel({
					busy : false,
					delay : 0
				});

				this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

				this.setModel(oViewModel, "detailView");

				this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Event handler when the share by E-Mail button has been clicked
			 * @public
			 */
			onShareEmailPress : function () {
				var oViewModel = this.getModel("detailView");

				sap.m.URLHelper.triggerEmail(
					null,
					oViewModel.getProperty("/shareSendEmailSubject"),
					oViewModel.getProperty("/shareSendEmailMessage")
				);
			},



			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */

			/**
			 * Binds the view to the object path and expands the aggregated line items.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched : function (oEvent) {
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				//added----------------------------------------------------
				var sObjectItemID = sObjectId.split(',')[0];
				var sObjectHeaderID = sObjectId.split(',')[1];
				//---------------------------------------------------------
				this.getModel().metadataLoaded().then( function() {
					var sObjectPath = this.getModel().createKey("zjblessons_base_Items", {
						//HeaderID :  sObjectId
						//changed
						ItemID : sObjectItemID,
						HeaderID :  sObjectHeaderID
					});
					this._bindView("/" + sObjectPath);
				}.bind(this));
			},

			/**
			 * Binds the view to the object path. Makes sure that detail view displays
			 * a busy indicator while data for the corresponding element binding is loaded.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound to the view.
			 * @private
			 */
			_bindView : function (sObjectPath) {
				// Set busy indicator during view binding
				var oViewModel = this.getModel("detailView");

				// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
				oViewModel.setProperty("/busy", false);

				this.getView().bindElement({
					path : sObjectPath,
					events: {
						change : this._onBindingChange.bind(this),
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},

			_onBindingChange : function () {
				var oView = this.getView(),
					oElementBinding = oView.getElementBinding();

				// No data for the binding
				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("detailObjectNotFound");
					// if object could not be found, the selection in the master list
					// does not make sense anymore.
					this.getOwnerComponent().oListSelector.clearMasterListSelection();
					return;
				}

				var sPath = oElementBinding.getPath(),
					oResourceBundle = this.getResourceBundle(),
					oObject = oView.getModel().getObject(sPath),
					sObjectId = oObject.HeaderID,
					sObjectName = oObject.HeaderID,
					oViewModel = this.getModel("detailView");

				this.getOwnerComponent().oListSelector.selectAListItem(sPath);

				oViewModel.setProperty("/shareSendEmailSubject",
					oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
				oViewModel.setProperty("/shareSendEmailMessage",
					oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
			},

			_onMetadataLoaded : function () {
				// Store original busy indicator delay for the detail view
				var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
					oViewModel = this.getModel("detailView");

				// Make sure busy indicator is displayed immediately when
				// detail view is displayed for the first time
				oViewModel.setProperty("/delay", 0);

				// Binding the view will set it to not busy - so the view is always busy if it is not bound
				oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			},
			
			_onCalculateBYN : function (oItem){
				var that = this;
				var sAmount = this._getAmount();
				jQuery.ajax({
					method:"GET",
					url:"https://api.nbrb.by/exrates/rates/EUR?parammode=2",
					success : function (data){
						console.log(data)
						var toast_msg = "Cтоимость товаров в BYN по курсу" + " " 
						+ parseFloat(data['Cur_OfficialRate']) + " " +"составляет"
						+ " " + parseFloat(data['Cur_OfficialRate'])*sAmount + " " + "BYN";
						MessageToast.show(toast_msg);
					}, 
					error : function (error) {
						console.log(error)
					}
				});
			},
			
			_getAmount :function (){
				var oView = this.getView(),
				oElementBinding = oView.getElementBinding();
				var sPath = oElementBinding.getPath(),
					oObject = oView.getModel().getObject(sPath),
					sObjectPrice = oObject.Price,
					sObjectQuantity = oObject.Quantity;
					console.log("Price",sObjectPrice, "Quantity", sObjectQuantity)
				     var sAmount = sObjectQuantity*sObjectPrice;
					console.log("Amount", sAmount)
					return sAmount;
			},
			
			_onRemoveItem :function (){
				var oModel = this.getView().getModel();
				var oObject = this.getView().getBindingContext()//.getObject()
				//console.log(oObject)
				var sPath = oObject.sPath;
				//console.log(sPath)
				
				oModel.remove(sPath, {
					success:function(oData, oResponse){
					console.log("Success!");
					},
					error: function(oError){
						console.log("Error",oError);
					}
				});
				oModel.submitChanges({success:this.mySuccessHandler, error:this.myErrorHandler});
			},
			
			_onUpdateItem :function (){
			 	var sInstance = this.getView().byId("idInstanceUpd").getValue();
			 	var sHeaderId = this.getView().byId("idHeaderIDUpd").getValue();
			 	var sItemID = this.getView().byId("idItemIDUpd").getValue();
			 	var sMaterialId = this.getView().byId("idMaterialIDUpd").getValue();
			 	//var sGroupId = this.getView().byId("idGroupID").getValue();
			 	//var sMaterialText = this.getView().byId("idMaterialText").getValue();
			 	var sQuantity = this.getView().byId("idQuantityUpd").getValue();
			 	var sPrice = this.getView().byId("idPriceUpd").getValue();
			 	var sCreatedBy = this.getView().byId("idCreatedByUpd").getValue();
			 	var sIntegrationId = this.getView().byId("idIntegrationIDUpd").getValue();
			 	var oModel = this.getView().getModel();
			 	var oObject = this.getView().getBindingContext();
				console.log(oObject);
				var sPath = oObject.sPath;
			 	var oData = {
			 		//Instance:sInstance,
			 		HeaderID:sHeaderId,
			 		ItemID:sItemID,
			 		MaterialID : sMaterialId,
			 		/*GroupID : sGroupId,
			 		MaterialText : sMaterialText,*/
			 		Quantity : sQuantity,
			 		Price : sPrice,
			 		CreatedBy : sCreatedBy,
			 		IntegrationID : sIntegrationId
			 	};
			 	
			 	oModel.update(sPath, oData, {
			 		success:function(oData, oResponse){
					console.log("Success!");
					},
					error: function(oError){
					console.log("Error",oError);
					}
				});
			 	oModel.submitChanges({success:this.mySuccessHandler, error:this.myErrorHandler});
			},
			
				_onOpenUpdateItemDialog: function(){
					//console.log("Frag")
					if(!this.updateItemDialog){
						this.updateItemDialog  =  this.loadFragment({
							name:"zjblessons.MasterTemplate2.view.UpdateItemDialog"
							});
						} 
					this.updateItemDialog.then(function(oDialog){
							oDialog.open();
						});
					},
					
					onCloseUpdateItemDialog: function(){
						this.byId("updateItemDialog").close();
					},
					
					mySuccessHandler :function(){
						console.log("success");
					},
					myErrorHandler :function(){
						console.log("error");
					}
		});
	}
);