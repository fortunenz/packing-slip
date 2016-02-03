// Builds the packing slip
var buildPackingSlips = function(appData, scope, filter) {
  $("#packingSlip").empty();

  // If the user is using a new customer while in invoice view then set
  // irrelevent variables to null
  if (appData.invoiceNewCustomer === true && appData.invoice === true) {
    scope.selectedCustomer.short = "";
    scope.selectedCustomer.acc = "";
    scope.selectedCustomer.city = "";
    scope.selectedCustomer.shippingComment = "";
  }

  // Formats date
  var tokens = appData.date.toString().split(" ");
  var date = tokens[2] + " " + tokens[1] + " " + tokens[3];

  scope.slipNumber++;

  var packingSlip;
  packingSlip = "";
  packingSlip += '<div class="packingSlips">';
  // Header
  packingSlip += '<div class="row">';
  packingSlip += '<h1 class="col-10 packingTitle"><img class="logo"src="images/logo.png"> FORTUNE ENTERPRISES CO (NZ) LTD</h1>';
  if (appData.invoice === true) {
    packingSlip += '<strong class="col-2 packingName">Invoice Slip</strong>';
  } else {
    packingSlip += '<strong class="col-2 packingName">Packing Slip</strong>';
  }
  packingSlip += '</div>';
  // Left column of subheading
  packingSlip += '<div class="row packingRow"><div class="col-8">';
  packingSlip += '<p class="packingP">73 Huia Road, Otahuhu, Auckland</p>';
  packingSlip += '<p class="packingP">PO Box 9511 New Market, Auckland</p>';
  packingSlip += '<p class="packingP">Email: <a href="#">feltd@xtra.co.nz</a></p></div>';
  // Right column of subheading
  packingSlip += '<div class="col-4">';
  packingSlip += '<p class="packingP">Phone:    (09) 276-8681</p>';
  packingSlip += '<p class="packingP">Fax:      (09) 276-8682</p>';
  packingSlip += '<p class="packingP">Website:  <a href="#">www.fortunenz.com </a></p></div>';
  packingSlip += '</div>';
  // Left side shop details
  packingSlip += '<div class="row packingRow"><div class="col-8">';
  packingSlip += '<p class="packingP">Deliver to:</p>';
  packingSlip += '<p class="packingP"><strong>';
  packingSlip += scope.selectedCustomer.name;
  packingSlip += '</strong></p>';
  packingSlip += '<p class="packingP">';
  packingSlip += scope.selectedCustomer.address;
  packingSlip += '</p>';
  packingSlip += '<p class="packingP">';
  packingSlip += scope.selectedCustomer.city;
  packingSlip += '</p></div>';
  // Right side date + packing slip number
  packingSlip += '<div class="col-4">';
  if (appData.invoice === true) {
    packingSlip += '<p class="packingP">Invoice slip no.: ';
  } else {
    packingSlip += '<p class="packingP">Packing slip no.: ';
  }
  packingSlip += scope.slipNumber;
  packingSlip += '</p>';
  packingSlip += '<p class="packingP">Account no.: ';
  packingSlip += scope.selectedCustomer.acc;
  packingSlip += '</p>';
  packingSlip += '<p class="packingP">Order no.: ';
  packingSlip += appData.orderNo;
  packingSlip += '</p>';
  packingSlip += '<p class="packingP">Date: ' + date + '</p>';
  packingSlip += '</div></div>';

  // If the order is for a backorder
  if (appData.backOrder === true && appData.invoice === false) {
    packingSlip += '<div class="center"><strong>Backorder</strong></div>';
  }

  // Item details with table
  var table = '';

  // Adds the required columns based on whether user is in invoice or
  // packing slip view as not all are required for either view
  table += '<table class="packingTable"><tr><th class="packingT">Code</th><th class="packingT">Description</th>';
  if (appData.invoice === false) {
    table += '<th class="packingT">Packaging</th>';
  }
  table += '<th class="packingT">Quantity</th><th class="packingT">Carton</th>';
  if (appData.invoice === true) {
    table += '<th class="packingT">Price</th><th class="packingT">Total</th></tr>';
  }
  table += buildPackingRow(appData, filter, scope);
  table += '</table>';

  packingSlip += table;

  // Displays totals of invoice if user is in invoice view
  if (appData.invoice === true) {
    packingSlip += '<div class="packingTotalTable right">';
    packingSlip += '<table>';
    // If the customer has their prices as including GST the sub total price
    // will be treated as the grand total instead
    if (scope.selectedCustomer.includeGST !== true) {
      packingSlip += buildTotalRow("Sub Total", filter('currency')(appData.subTotal));
      packingSlip += buildTotalRow("GST", filter('currency')(appData.gst));
      packingSlip += buildTotalRow("Total", filter('currency')(appData.grandTotal));
    } else {
      packingSlip += buildTotalRow("Total including GST", filter('currency')(appData.subTotal));
    }
    packingSlip += '</table>';
    packingSlip += '</div>';
  }

  // Name and signature only if sending in Auckland meaning will be delivered
  if (scope.selectedCustomer.city == "Auckland") {
    var tempLength = 0;
    for (var i = 0, len = scope.items.length; i < len; i++) {
      if (scope.items[i].ordered > 0) {
        tempLength++;
      }
    }
    if (tempLength < 10) {
      packingSlip += '<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>';
    } else {
      packingSlip += '<br><br>';
    }
    packingSlip += '<div class="packingSign">';
    packingSlip += '<p>Name: _________________________________</p><br>';
    packingSlip += '<p>Signature: _____________________________</p>';
    if (appData.invoice === true && scope.selectedCustomer.acc !== " ") {
      packingSlip += '<p class="packingPaymentInfo">Please pay direct to bank account: Westpac 03-0166-0248508-00</p>';
    }
    packingSlip += '</div>';
  } else {
    packingSlip += '<br><br>';
  }

  // Appends notes to the bottom of the page
  if (appData.notes.trim().length !== 0) {
    packingSlip += '<div class="packingNotes"><p class="packingNotesInner">';
    packingSlip += appData.notes;
    packingSlip += '</p></div>';
  }

  // Christmas time closing message
  // ----------------------------------------------------------------------
  /*packingSlip += '<div class="packingChristmasNotes">';
  packingSlip += '<p class="packingNotesInner">Please be aware that we will be closing on the 23/12/2015 and will re-open on 13/01/2016</p>';
  packingSlip += '<p class="packingNotesInner">Have a Merry Christmas and a Happy New Year!</p>';
  packingSlip += '</div>';*/

  // ----------------------------------------------------------------------

  $("#packingSlip").append(packingSlip);

  packingSlip += '<div class="break"></div>';
  $("#packingSlip").prepend(packingSlip);

  // If the customer is out of Auckland they most likely require shipping
  // so shipping addresses will be printed automatically if the user requires
  if (scope.selectedCustomer.city !== "Auckland" && appData.invoiceNewCustomer === false) {
    var check = confirm("Would you like to print shipping addresses for your customer?");
    if (check) {
      var labelAmount = prompt("How many addresses do you need?", 0);
      if (isNaN(parseInt(labelAmount))) {
        alert("No shipping addresses will be printed because you did not enter a valid number");
      } else {
        var shippingLabel = '<div class="shippingLabel">';
        if (scope.selectedCustomer.shippingComment !== undefined) {
          shippingLabel += '<br><br>';
        } else {
          shippingLabel += '<br><br><br><br><br>';
        }
        shippingLabel += '<p>' + scope.selectedCustomer.name + '</p>';
        shippingLabel += '<p>' + scope.selectedCustomer.address + '</p>';
        shippingLabel += '<p>' + scope.selectedCustomer.city + '</p>';
        // If the customer has special needs the program will append a note
        // in the shipping address label
        if (scope.selectedCustomer.shippingComment !== undefined) {
          shippingLabel += '<br><p>' + scope.selectedCustomer.shippingComment + '</p><br>';
        }
        shippingLabel += '</div>';
        for (var i = 0; i < labelAmount; i++) {
          $("#packingSlip").append(shippingLabel);
        }
      }
    }
  }

  window.print();

  // Saves the shop data to be reloaded if most recent order needs to be
  // modified at a later stage
  if (appData.invoiceNewCustomer === false) {
    var tempJson = {};

    tempJson.short =  scope.selectedCustomer.short;
    tempJson.notes = appData.notes;
    tempJson.orderNo = appData.orderNo;

    for ( i = 0; i < scope.items.length; i++) {
      if (scope.items[i].ordered > 0) {
        tempJson[scope.items[i].code] = scope.items[i].ordered;
      }
    }

    var ordersRef = new Firebase('https://popping-torch-7294.firebaseio.com/slipOrders');
    ordersRef.push(tempJson);
  }

  //
  var ref = new Firebase('https://popping-torch-7294.firebaseio.com/');
  ref.child("slipNumber").set(scope.slipNumber);

  // If customer is being invoiced prices will be checked and if needed
  // will be saved for next time
  if (appData.invoice === true && appData.invoiceNewCustomer === false) {
    for (var i = 0, len = scope.items.length; i < len; i++) {
      if (scope.items[i].ordered > 0 && scope.items[i].tempPrice !== scope.selectedCustomer[scope.items[i].code]) {
        var tempJson = {};
        tempJson[scope.items[i].code] = scope.items[i].tempPrice;
        ref.child("customers").child(scope.selectedCustomer.$id).update(
          tempJson
        );
        console.log("New price has been saved for item " + scope.items[i].code + " with the price of $" + scope.items[i].tempPrice);

      }
    }
  }

  appData.resetApp();
};

var buildPackingRow = function(appData, filter, scope) {
  var table = "";
  var quantity = 0;
  var tempItemOrdered;

  for (var i = 0; i < scope.items.length; i++) {
    var tempItem = scope.items[i];
    if (tempItem.ordered > 0) {
      table += '<tr><td class="packingT">';
      table += tempItem.code;
      table += '</td>';
      table += '<td class="packingT">';
      table += tempItem.description;
      table += '</td>';
      if (appData.invoice === false) {
        table += '<td class="packingT">';
        table += tempItem.packaging;
        table += '</td>';
      }

      table += '<td class="packingT">';

      // -------------------------------------------------------------------
      // Logic for displaying correct quantities

      if (tempItem.code.includes("RE0") || tempItem.code.includes("WENDY01")) {
        tempItemOrdered = tempItem.ordered * 1000;
        table += insertComma(tempItemOrdered.toString()) + " pcs";
      } else if (tempItem.unit == "1000") {
        quantity =  tempItem.ordered * tempItem.quantity;

        // Checks if it's a set item or just normal pcs
        if (tempItem.orderAs == "ctn+ctn") {
          table += insertComma(quantity.toString()) + " sets";
        } else {
          table += insertComma(quantity.toString()) + " pcs";
        }
      } else if (tempItem.unit == "Roll" && tempItem.orderAs == "ctn") {
        quantity =  tempItem.ordered * tempItem.quantity;
        table += insertComma(quantity.toString()) + " rolls";
      } else if (tempItem.unit == "Box" && tempItem.orderAs == "ctn") {
        quantity =  tempItem.ordered * tempItem.quantity;
        table += insertComma(quantity.toString()) + " boxes";
      } else {
        table += tempItem.ordered + " " + tempItem.orderAs;
      }

      table += '</td>';
      table += '<td class="packingT">';

      // -------------------------------------------------------------------
      // Logic for displaying correct carton values

      // Logic for bag seal tape 9mmx66m
      if (tempItem.code.includes("SEAL09")) {
        if (tempItem.ordered%48 === 0) {
          table += (tempItem.ordered / 48) + " ctn";
        } else {
          if (tempItem.ordered < 48) {
            table += tempItem.ordered + " rolls";
          } else {
            table += ((tempItem.ordered/48)-((tempItem.ordered%48)/48)) + " ctn + " + (tempItem.ordered % 48)+ " rolls";
          }
        }
      // Logic for bag seal tape 12mmx66m
      } else if (tempItem.code.includes("SEAL12")) {
        if (tempItem.ordered%36 === 0) {
          table += (tempItem.ordered / 36) + " ctn";
        } else {
          if (tempItem.ordered < 36) {
            table += tempItem.ordered + " rolls";
          } else {
            table += ((tempItem.ordered/36)-((tempItem.ordered%36)/36)) + " ctn + " + (tempItem.ordered % 36)+ " rolls";
          }
        }
      // Logic for gloves
      } else if (tempItem.code.includes("GLOVES")) {
        if (tempItem.ordered < 1) {
          table += (tempItem.ordered * 10) + " boxes";
        } else if (tempItem.ordered.toString().includes(".")) {
          table += tempItem.ordered-(tempItem.ordered%1) + " ctn + " + parseInt(tempItem.ordered%1*10) + " boxes";
        } else {
          table += tempItem.ordered + " ctn";
        }
      // Logic for resealable bags
      } else if (tempItem.code.includes("RE0")) {
        if (tempItemOrdered < tempItem.quantity) {
          table += insertComma(tempItemOrdered.toString()) + " pcs";
        } else {
          if (tempItemOrdered%tempItem.quantity === 0) {
            table += (tempItemOrdered / tempItem.quantity) + " ctn";
          } else {
            table += ((tempItemOrdered/tempItem.quantity)-((tempItemOrdered%tempItem.quantity)/tempItem.quantity)) + " ctn + " + insertComma((tempItemOrdered % tempItem.quantity).toString()) + " pcs";
          }
        }
      } else if (tempItem.code.includes("WENDY01")) {
        table += (tempItemOrdered/tempItem.quantity) + " ctn";
      } else if (tempItem.orderAs == "1000") {
        quantity =  tempItem.ordered * tempItem.quantity;
        table += insertComma(quantity.toString()) + " pcs";
      } else {
        table += tempItem.ordered + " " + tempItem.orderAs;
      }

      table += '</td>';

      // Displays price and total for items if the user is in invoice view
      if (appData.invoice === true) {
        table += '<td class="packingT">';
        table += filter('currency')(tempItem.tempPrice);
        table += '</td><td class="packingT">';
        table += filter('currency')(tempItem.tempPrice * tempItem.ordered);
        table += '</td>';
      }

      table += '</tr>';
    }
  }

  return table;
};

// Inserts approprate commas for quantities for ease of viewing when invoicing
var insertComma = function(number) {
  if (number.length < 4) {
    return number;
  } else if (number.length > 6) {
    number = number.slice(0,number.length-6) + "," + number.slice(number.length-6, number.length-3) + "," + number.slice(number.length-3);
    return number;
  } else {
    number = number.slice(0,number.length-3) + "," + number.slice(number.length-3);
    return number;
  }
};

// Builds one of the rows for totals of the invoicing table
var buildTotalRow = function(name, total) {
  var table = '<tr>';
  table += '<th class="packingT">';
  table += name;
  table += '</th><td class="packingT">';
  table += total;
  table += '</td></tr>';

  return table;
};
