/*!
 * ${copyright}
 */
sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/core/Manifest",
	"sap/f/cards/CardManifest",
	"sap/base/Log",
	"sap/f/CardRenderer"
], function (
	Control,
	Manifest,
	CardManifest,
	Log,
	CardRenderer
) {
	"use strict";

	/**
	 * Constructor for a new <code>Card</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * A control that represents header and content area as a card. Content area of a card should use controls or component located in the sub package sal.f.cardcontents.
	 *
	 * <h3>Overview</h3>
	 *
	 * The control consist of a header and content section
	 *
	 * <h3>Usage</h3>
	 *
	 * <h3>Responsive Behavior</h3>
	 *
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version ${version}
	 *
	 * @constructor
	 * @experimental
	 * @since 1.60
	 * @see {@link TODO Card}
	 * @alias sap.f.Card
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SAPCard = Control.extend("sap.f.SAPCard", /** @lends sap.f.Card.prototype */ {
		metadata: {
			library: "sap.f",
			interfaces: ["sap.f.cards.ICard"],
			properties: {

				manifest: { type: "any", defaultValue: "" },

				/**
				 * Defines the width of the Card
				 *
				 * <b>Note:</b> If no width is set, sap.f.Card will take 100% of its parent container
				 * @since 1.61
				 */
				width: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%" },

				/**
				 * Defines the height of the Card
				 *
				 * <b>Note:</b> If no height is set, sap.f.Card will take 100% of its parent container
				 * @since 1.61
				 */
				height: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%" }
			},
			aggregations: {
				_header: { type: "sap.f.cards.IHeader", multiple: false },
				_content: { type: "sap.ui.core.Control", multiple: false }
			}
		},
		renderer: CardRenderer
	});

	/**
	 * Called on destroying the control
	 * @private
	 */
	SAPCard.prototype.exit = function () {
		if (this._oCardManifest) {
			this._oCardManifest.destroy();
			this._oCardManifest = null;
		}
	};

	SAPCard.prototype.setManifest = function (vValue) {
		this.setBusy(true);
		this.setProperty("manifest", vValue, true);
		if (typeof vValue === "string") {
			this.initManifest(vValue).then(function () {
				this._applyManifestSettings();
			}.bind(this));
		} else if (typeof vValue === "object") {
			this._oCardManifest = new CardManifest(vValue);
			this._applyManifestSettings();
		}
		return this;
	};

	SAPCard.prototype.initManifest = function (sManifestUrl) {
		var oPromise = Manifest.load({
			manifestUrl: sManifestUrl,
			async: true
		});

		return oPromise.then(function (oManifest) {
			var oJson = oManifest._oRawManifest;
			this._oCardManifest = new CardManifest(oJson);
			return oManifest._loadI18n(true).then(function (oBundle) {
				this._oCardManifest.registerTranslator(oBundle);
				if (this._oCardManifest.get("sap.app/type") !== "card") {
					throw Error("sap.app/type entry in manifest is not 'card'");
				}
			}.bind(this));
		}.bind(this));
	};

	/**
	 * Apply all manifest settings after the manifest is fully ready
	 */
	SAPCard.prototype._applyManifestSettings = function () {
		this._setHeaderFromManifest();
		this._setContentFromManifest();
	};

	SAPCard.prototype._getHeader = function () {
		return this.getAggregation("_header");
	};

	SAPCard.prototype._getContent = function () {
		return this.getAggregation("_content");
	};

	SAPCard.prototype._setHeaderFromManifest = function () {
		var oHeader = this._oCardManifest.get("sap.card/header");

		if (!oHeader) {
			Log.error("Card header is mandatory!");
			return;
		}

		if (oHeader.type === "kpi") {
			sap.ui.require(["sap/f/cards/KpiHeader"], this._setCardHeaderFromManifest.bind(this));
		} else {
			sap.ui.require(["sap/f/cards/Header"], this._setCardHeaderFromManifest.bind(this));
		}
	};

	SAPCard.prototype._setContentFromManifest = function () {
		var sCardType = this._oCardManifest.get("sap.card/type");

		if (!sCardType) {
			Log.error("Card type property is mandatory!");
			return;
		}

		switch (sCardType.toLowerCase()) {
			case "list":  sap.ui.require(["sap/f/cards/ListContent"], this._setCardContentFromManifest.bind(this));
				break;
			case "table": sap.ui.require(["sap/f/cards/TableContent"], this._setCardContentFromManifest.bind(this));
				break;
			case "analytical":
				sap.ui.getCore().loadLibrary("sap.viz", { async: true }).then(function() {
					sap.ui.require(["sap/f/cards/AnalyticalContent"], this._setCardContentFromManifest.bind(this));
				}.bind(this)).catch(function () {
					Log.error("Analytical type card is not available with this distribution");
				});
				break;
		}
	};

	SAPCard.prototype._setCardHeaderFromManifest = function (CardHeader) {
		var oClonedSettings = jQuery.extend(true, {}, this._oCardManifest.get("sap.card/header"));
		delete oClonedSettings.type;
		if (oClonedSettings.icon) {
			oClonedSettings.iconSrc = oClonedSettings.icon.src;
			oClonedSettings.iconDisplayShape = oClonedSettings.icon.displayShape;
			oClonedSettings.iconInitials = oClonedSettings.icon.initials;
			delete oClonedSettings.icon;
		}
		this.setAggregation("_header", new CardHeader(oClonedSettings));
	};

	SAPCard.prototype._setCardContentFromManifest = function(CardContent) {
		var mSettings = this._oCardManifest.get("sap.card/content");
		var oClonedSettings = {
			manifestContent: jQuery.extend(true, {}, mSettings)
		};
		var oContent = new CardContent(oClonedSettings);
		this.setAggregation("_content", oContent);
		this.setBusy(false);
	};

	return SAPCard;
});
