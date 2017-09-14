;(function () {

  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server. Use `self` instead of `window` for `WebWorker` support.
  var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global;

  var MC2P = function(MC2PPublicKey, token) {
    this.MC2PPublicKey = MC2PPublicKey;
    this.token = token;
    this.API_URL = 'https://api.mychoice2pay.com/v1/pay/' + this.token + '/';
    this.API_CARD_URL = this.API_URL + 'card/';
    this.API_SHARE_URL = this.API_URL + 'share/';
  };

  MC2P.prototype.__request = function(method, url, data, callback) {
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

  MC2P.prototype.getGateways = function(callback) {
    return this.__request("GET", this.API_URL, null, callback);
  };

  MC2P.prototype.card = function(gatewayCode, data, callback) {
    return this.__request("POST", this.API_CARD_URL + gatewayCode + '/', data, callback);
  };

  MC2P.prototype.share = function(data, callback) {
    return this.__request("POST", this.API_SHARE_URL, data, callback);
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