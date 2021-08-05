;(function () {

  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server. Use `self` instead of `window` for `WebWorker` support.
  var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global;

  var MC2P = function(MC2PPublicKey, token, customOptions) {
    this.MC2PPublicKey = MC2PPublicKey;
    this.token = token;
    this.PAY_ORIGIN_URL = 'https://pay.mychoice2pay.com';
    this.API_URL = 'https://api.mychoice2pay.com/v1/pay/' + this.token + '/';
    this.API_HTML_URL = this.API_URL + 'html/';
    this.API_CARD_URL = this.API_URL + 'card/';
    this.API_ACCOUNT_URL = this.API_URL + 'account/';
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
      cardDataCVVId: (customOptions && customOptions.cardDataCVVId) || 'mc2p-card-cvv',
      iFrameId: (customOptions && customOptions.iFrameId) || false,
      iFrameGateways: (customOptions && customOptions.iFrameGateways) || {},
      sendCardDetailsCallback: (customOptions && customOptions.sendCardDetailsCallback) || undefined,
      sendAccountDetailsCallback: (customOptions && customOptions.sendAccountDetailsCallback) || undefined,
      openInWindow: (customOptions && customOptions.openInWindow) || false,
      windowGateways: (customOptions && customOptions.windowGateways) || {},
      windowsClosedCallback: (customOptions && customOptions.windowsClosedCallback) || undefined,
      windowsFinishedCallback: (customOptions && customOptions.windowsFinishedCallback) || undefined
    };

    this.gatewaysList = [];
    this.gatewaySelected = null;
  };

  var replaceHtml = function (htmlDiv, mc2p) {
    return function (data) {
      htmlDiv.innerHTML = data.html;
      mc2p.showId(mc2p.options.htmlDivId);
    };
  };

  var replaceAndSubmitHtml = function (htmlDiv, mc2p) {
    return function (data) {
      htmlDiv.innerHTML = data.html;
      mc2p.showId(mc2p.options.htmlDivId);
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

  MC2P.prototype.account = function (gatewayCode, data, callback) {
    return this.__request("POST", this.API_ACCOUNT_URL + gatewayCode + '/', data, callback);
  };

  MC2P.prototype.share = function (data, callback) {
    return this.__request("POST", this.API_SHARE_URL, data, callback);
  };

  MC2P.prototype.selectGateway = function (gatewayCode) {
    var htmlDiv = document.getElementById(this.options.htmlDivId);
    var iFrame = undefined;
    if (this.options.iFrameId) {
      iFrame = document.getElementById(this.options.iFrameId);
    }
    this.hideId(this.options.htmlDivId);
    this.hideId(this.options.cardDivId);
    if (this.options.iFrameId) {
      this.hideId(this.options.iFrameId);
    }

    var index = 0;
    for (; index < this.gatewaysList.length; index++) {
      if (this.gatewaysList[index].code === gatewayCode) {
        var gateway = this.gatewaysList[index];
        if (gateway.form === 'card') {
          this.showId(this.options.cardDivId);
        } else if (gateway.form === 'html') {
          if (this.options.notRedirectHtml) {
            this.html(gatewayCode, replaceAndSubmitHtml(htmlDiv, this));
          } else {
            var redirectUrl = this.REDIRECT_URL + gateway.code;
            if (this.options.openInWindow && (!(gateway.code in this.options.windowGateways) || this.options.windowGateways[gateway.code])) {
              var width = 400;
              var height = 560;
              var left = (window.outerWidth - width) / 2;
              var top = (window.outerHeight - height) / 2;
              var wnd = window.open(
                redirectUrl, 
                gatewayCode, 
                'width=' + width + ',height=' + height + ',scrollbars=NO,top=' + top + ',left=' + left
              );
              var mc2p = this;
              var closedTimer = setInterval(function () { 
                if(wnd.closed) {
                  clearInterval(closedTimer);
                  if (mc2p.options.windowsClosedCallback) {
                    mc2p.options.windowsClosedCallback({
                      gateway: gatewayCode 
                    });
                  }
                }
              }, 500);
              window.addEventListener('message', function (event) {
                if (event.data == 'MC2P_DONE' || event.data == 'MC2P_CANCEL' || event.data == 'MC2P_EXPIRED') {
                  if (event.origin == mc2p.PAY_ORIGIN_URL) {
                    clearInterval(closedTimer);
                    wnd.close();
                    if (mc2p.options.windowsFinishedCallback) {
                      mc2p.options.windowsFinishedCallback({
                        done: event.data == 'MC2P_DONE',
                        cancel: event.data == 'MC2P_CANCEL',
                        expired: event.data == 'MC2P_EXPIRED',
                        gateway: gatewayCode 
                      });
                    }
                  }
                }	
              });
            } else if (iFrame && (!(gateway.code in this.options.iFrameGateways) || this.options.iFrameGateways[gateway.code])) {
              iFrame.setAttribute('src', redirectUrl);
              this.showId(this.options.iFrameId);
            } else {
              document.location = redirectUrl;
            }
          }
        } else if (gateway.form === 'account') {
          this.html(gatewayCode, replaceHtml(htmlDiv, this));
        } else if (gateway.form === 'shared') {
          if (iFrame && (!(gateway.code in this.options.iFrameGateways) || this.options.iFrameGateways[gateway.code])) {
            var divvyUrl = this.DIVVY_URL + '/iframe';
            iFrame.setAttribute('src', divvyUrl);
            this.showId(this.options.iFrameId);
          } else {
            document.location = this.DIVVY_URL;
          }
        }
        this.gatewaySelected = gateway;
        break;
      }
    }
  };

  MC2P.prototype.sendCardDetails = function (callback) {
    callback = callback || this.options.sendCardDetailsCallback;
    var cardData = {
      'name': document.getElementById(this.options.cardDataNameId).value,
      'number': document.getElementById(this.options.cardDataNumberId).value,
      'month': document.getElementById(this.options.cardDataMonthId).value,
      'year': document.getElementById(this.options.cardDataYearId).value,
      'verification_value': document.getElementById(this.options.cardDataCVVId).value
    };
    var mc2p = this;
    return this.card(this.gatewaySelected.code, cardData, function(data) {
      if (data.html) {
        var htmlDiv = document.getElementById(mc2p.options.htmlDivId);
        replaceAndSubmitHtml(htmlDiv, mc2p)(data);
      } else {
        if (callback) {
          callback(data);
        }
      }
    });
  };

  MC2P.prototype.sendAccountDetails = function (callback) {
    callback = callback || this.options.sendAccountDetailsCallback;
    var htmlDiv = document.getElementById(this.options.htmlDivId);
    if (htmlDiv) {
      var accountForm = htmlDiv.getElementsByTagName('form');
      if (accountForm.length > 0) {
        accountForm = accountForm[0];
        var entries = new FormData(accountForm).entries();
        var accountData = {};
        while(true) {
          var iter = entries.next();
          if (iter.done) {
            break;
          }
          var value = iter.value;
          accountData[value[0]] = value[1];
        }
        this.account(this.gatewaySelected.code, accountData, callback);
      }
    }
    return false;
  };

  MC2P.prototype.hideClass = function (className) {
    var classNameElements = document.getElementsByClassName(className);
    for (var i = 0; i < classNameElements.length; i++) {
      classNameElements[i].style.display = 'none';
    }
  };

  MC2P.prototype.showClass = function (className) {
    var classNameElements = document.getElementsByClassName(className);
    for (var i = 0; i < classNameElements.length; i++) {
      classNameElements[i].style.display = 'block';
    }
  };

  MC2P.prototype.hideId = function (id) {
    var idElement = document.getElementById(id);
    if (idElement) {
      idElement.style.display = 'none';
    }
  };

  MC2P.prototype.showId = function (id) {
    var idElement = document.getElementById(id);
    if (idElement) {
      idElement.style.display = 'block';
    }
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
