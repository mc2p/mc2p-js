;(function () {

  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server. Use `self` instead of `window` for `WebWorker` support.
  var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global;

  var MC2P = function(MC2PPublicKey, token, customOptions) {
    this.MC2PPublicKey = MC2PPublicKey;
    this.token = token;
    this.API_URL = 'https://api.mychoice2pay.com/v1/pay/' + this.token + '/';
    this.API_HTML_URL = this.API_URL + 'html/';
    this.API_CARD_URL = this.API_URL + 'card/';
    this.API_SHARE_URL = this.API_URL + 'share/';
    this.REDIRECT_URL = 'https://pay.mychoice2pay.com/#/' + this.token + '/redirect/';
    this.DIVVY_URL = 'https://pay.mychoice2pay.com/#/' + this.token + '/divvy';

    this.options = {
      notRedirectHtml: (customOptions && customOptions.notRedirectHtml) || false,
      htmlDivId: (customOptions && customOptions.htmlDivId)|| 'mc2p-html-div',
      cardDivId: (customOptions && customOptions.cardDivId)|| 'mc2p-card-div',
      cardDataNameId: (customOptions && customOptions.cardDataNameId) || 'mc2p-card-name',
      cardDataNumberId: (customOptions && customOptions.cardDataNumberId) || 'mc2p-card-number',
      cardDataMonthId: (customOptions && customOptions.cardDataMonthId) || 'mc2p-card-month',
      cardDataYearId: (customOptions && customOptions.cardDataYearId) || 'mc2p-card-year',
      cardDataCVVId: (customOptions && customOptions.cardDataCVVId) || 'mc2p-card-cvv'
    };

    this.gatewaysList = [];
    this.gatewaySelected = null;
  };

  var replaceAndSubmitHtml = function (htmlDiv, mc2p) {
    return function (data) {
      htmlDiv.innerHTML = data.html;
      htmlDiv.style.visibility = 'visible';
      document.querySelector('#' + mc2p.options.htmlDivId + ' form').submit();
    };
  };

  MC2P.prototype.__request = function (method, url, data, callback) {
    var xmlHttp = new XMLHttpRequest();
    if (callback) {
      xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4) {
          callback(JSON.parse(xmlHttp.responseText));
        }
      }
    }

    xmlHttp.open(method, url, !!callback);
    xmlHttp.setRequestHeader("Authorization", "PublicKey " + this.MC2PPublicKey);
    xmlHttp.setRequestHeader("Content-type", "application/json");
    xmlHttp.send(data ? JSON.stringify(data) : null);
    if (!callback) {
      return JSON.parse(xmlHttp.responseText);
    }
  };

  MC2P.prototype.getGateways = function (callback) {
    if (callback) {
      var mc2p = this;
      return this.__request("GET", this.API_URL, null, function (data) {
        mc2p.gatewaysList = data.gateways;
        callback(data);
      });
    } else {
      var data = this.__request("GET", this.API_URL, null, callback);
      this.gatewaysList = data.gateways;
      return data;
    }
  };

  MC2P.prototype.html = function (gatewayCode, callback) {
    return this.__request("GET", this.API_HTML_URL + gatewayCode + '/', null, callback);
  };

  MC2P.prototype.card = function (gatewayCode, data, callback) {
    return this.__request("POST", this.API_CARD_URL + gatewayCode + '/', data, callback);
  };

  MC2P.prototype.share = function (data, callback) {
    return this.__request("POST", this.API_SHARE_URL, data, callback);
  };

  MC2P.prototype.selectGateway = function (gatewayCode) {
    var htmlDiv = document.getElementById(this.options.htmlDivId);
    var cardDiv = document.getElementById(this.options.cardDivId);
    htmlDiv.style.visibility = 'hidden';
    cardDiv.style.visibility = 'hidden';

    var index = 0;
    for (; index < this.gatewaysList.length; index++) {
      if (this.gatewaysList[index].code === gatewayCode) {
        var gateway = this.gatewaysList[index];
        if (gateway.form === 'card') {
          cardDiv.style.visibility = 'visible';
        } else if (gateway.form === 'html') {
          if (this.options.notRedirectHtml) {
            this.html(gatewayCode, replaceAndSubmitHtml(htmlDiv, this));
          } else {
            document.location = this.REDIRECT_URL + gateway.code;
          }
        } else if (gateway.form === 'shared') {
          document.location = this.DIVVY_URL;
        }
        this.gatewaySelected = gateway;
        break;
      }
    }
  };

  MC2P.prototype.sendCardDetails = function (callback) {
    var cardData = {
      'name': document.getElementById(this.options.cardDataNameId).value,
      'number': document.getElementById(this.options.cardDataNumberId).value,
      'month': document.getElementById(this.options.cardDataMonthId).value,
      'year': document.getElementById(this.options.cardDataYearId).value,
      'verification_value': document.getElementById(this.options.cardDataCVVId).value
    };
    return this.card(this.gatewaySelected.code, cardData, callback);
  };

  // Make module accessible:
  // export object for Node.js
  // or if we're in the browser, add `MC2P` as a global object.
  // (`nodeType` is checked to ensure that `module` and `exports` are not HTML elements.)
  if (typeof exports !== 'undefined' && !exports.nodeType) {
    if (typeof module !== 'undefined' && !module.nodeType && module.exports) {
      exports = module.exports = MC2P;
    }

    exports.MC2P = MC2P;
  } else {
    root.MC2P = MC2P;
  }
})();