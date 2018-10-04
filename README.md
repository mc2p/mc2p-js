# MyChoice2Pay JS


# Overview

MyChoice2Pay JS provides integration access to the MyChoice2Pay API.

# Installation

You can install using `bower`:

    bower install mc2p-js
    
or install using `npm`:

    npm install mc2p-js

or to install from source, download [mc2p.min.js](https://raw.github.com/mc2p/mc2p-js/master/dist/mc2p.min.js) and include it in your HTML document, this will add a global object called MC2P:

    <script src="mc2p.min.js"></script>

# Quick Start Example

    var mc2p = new MC2P('PUBLIC KEY', 'TRANSACTION TOKEN');

    // GET GATEWAYS FOR THE TRANSACTION //
    // Synchronous
    var gatewaysData = mc2p.getGateways();

    // Asynchronous
    mc2p.getGateways(function (gatewaysData) {
      // do somethig with gateways
      gatewaysData.gateways; // Array of gateways to use in this transaction
    });

    // PAY WITH A CARD //
    // Synchronous
    var cardResponse = mc2p.card('GATEWAY_CODE', cardData);

    // Asynchronous
    mc2p.card('GATEWAY_CODE', cardData, function (cardResponse) {
      // do somethig with card response
      if (cardResponse.result == 'success') {
        // Everything great!
      } else {
        // error, check card response
      }
    });

    // DIVIDE PAYMENT WITH DIVVY //
    // Synchronous
    var divvyResponse = mc2p.share(divvyData);

    // Asynchronous
    mc2p.share(divvyData, function (divvyResponse) {
      // do somethig with divvy response
      if (divvyResponse.result == 'success') {
        // Everything great!
      } else {
        // error, check card response
      }
    });
