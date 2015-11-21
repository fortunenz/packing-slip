// Builds the packing slip
var buildPackingSlips = function(itemList, scope, filter) {
  $("#packingSlip").empty();
  var packingSlip;
  var orderNum;

  // Formats date
  var tokens = itemList.date.toString().split(" ");
  var date = tokens[2] + " " + tokens[1] + " " + tokens[3];

  var OrderNumber = Parse.Object.extend("OrderNumber");
  var Orders = Parse.Object.extend("Orders");
  var queryOrderNumber = new Parse.Query(OrderNumber);
  queryOrderNumber.exists("orderNumber");
  queryOrderNumber.descending("updatedAt");
  queryOrderNumber.first({
    success: function(results) {
      orderNum = results.attributes.orderNumber;
      orderNum++;

      packingSlip = "";
      packingSlip += '<div class="packingSlips">';
      // Header
      packingSlip += '<div class="row">';
      packingSlip += '<h1 class="col-10 packingTitle"><img class="logo"src="images/logo.png"> FORTUNE ENTERPRISES CO (NZ) LTD</h1>';
      if (itemList.invoice === true) {
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
      packingSlip += itemList.selectedBranch.name;
      packingSlip += '</strong></p>';
      packingSlip += '<p class="packingP">';
      packingSlip += itemList.selectedBranch.address;
      packingSlip += '</p>';
      packingSlip += '<p class="packingP">';
      packingSlip += itemList.selectedBranch.city;
      packingSlip += '</p></div>';
      // Right side date + packing slip number
      packingSlip += '<div class="col-4">';
      if (itemList.invoice === true) {
        packingSlip += '<p class="packingP">Invoice slip no.: ';
      } else {
        packingSlip += '<p class="packingP">Packing slip no.: ';
      }
      packingSlip += orderNum;
      packingSlip += '</p>';
      packingSlip += '<p class="packingP">Account no.: ';
      packingSlip += itemList.selectedBranch.acc;
      packingSlip += '</p>';
      packingSlip += '<p class="packingP">Order no.: ';
      packingSlip += itemList.orderNo;
      packingSlip += '</p>';
      packingSlip += '<p class="packingP">Date: ' + date + '</p>';
      packingSlip += '</div></div>';

      // If the order is for a backorder
      if (itemList.backOrder === true && itemList.invoice === false) {
        packingSlip += '<div class="center"><strong>Backorder</strong></div>';
      }

      // Item details with table
      var table = '';

      // Adds the required columns based on whether user is in invoice or
      // packing slip view as not all are required for either view
      table += '<table class="packingTable"><tr><th class="packingT">Code</th><th class="packingT">Description</th>';
      if (itemList.invoice === false) {
        table += '<th class="packingT">Packaging</th>';
      }
      table += '<th class="packingT">Quantity</th><th class="packingT">Carton</th>';
      if (itemList.invoice === true) {
        table += '<th class="packingT">Price</th><th class="packingT">Total</th></tr>';
      }
      table += buildPackingRow(itemList, filter);
      table += '</table>';

      packingSlip += table;

      // Displays totals of invoice if user is in invoice view
      if (itemList.invoice === true) {
        packingSlip += '<div class="packingTotalTable right">';
        packingSlip += '<table>';
        packingSlip += buildTotalRow("Sub Total", filter('currency')(itemList.subTotal));
        packingSlip += buildTotalRow("GST", filter('currency')(itemList.gst));
        packingSlip += buildTotalRow("Total", filter('currency')(itemList.grandTotal));
        packingSlip += '</table>';
        packingSlip += '</div>';
      }

      // Name and signature only if sending in Auckland meaning will be delivered
      if (itemList.selectedBranch.city == "Auckland") {
        var tempLength = 0;
        for (i = 0, len = itemList.items.length; i < len; i++) {
          if (itemList.items[i].ordered > 0) {
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
        if (itemList.invoice === true && itemList.selectedBranch.acc !== " ") {
          packingSlip += '<p class="packingPaymentInfo">Please pay direct to bank account: Westpac 03-0166-0248508-00</p>';
        }
        packingSlip += '</div>';
      } else {
        packingSlip += '<br><br>';
      }

      // Appends notes to the bottom of the page
      if (itemList.notes.trim().length !== 0) {
        packingSlip += '<div class="packingNotes"><p class="packingNotesInner">';
        packingSlip += itemList.notes;
        packingSlip += '</p></div>';
      }

      $("#packingSlip").append(packingSlip);

      packingSlip += '<div class="break"></div>';
      $("#packingSlip").prepend(packingSlip);

      results.set("orderNumber", orderNum);
      results.save();

      // If the customer is out of Auckland they most likely require shipping
      // so shipping addresses will be printed automatically if the user requires
      if (itemList.selectedBranch.city !== "Auckland") {
        var check = confirm("Would you like to print shipping addresses for your customer?");
        if (check) {
          var labelAmount = prompt("How many addresses do you need?", 0);
          if (isNaN(parseInt(labelAmount))) {
            alert("No shipping addresses will be printed because you did not enter a valid number");
          } else {
            var shippingLabel = '<div class="shippingLabel">';
            if (itemList.selectedBranch.shippingComment !== "") {
              shippingLabel += '<br><br>';
            } else {
              shippingLabel += '<br><br><br><br><br>';
            }
            shippingLabel += '<p>' + itemList.selectedBranch.name + '</p>';
            shippingLabel += '<p>' + itemList.selectedBranch.address + '</p>';
            shippingLabel += '<p>' + itemList.selectedBranch.city + '</p>';
            // If the customer has special needs the program will append a note
            // in the shipping address label
            if (itemList.selectedBranch.shippingComment !== "") {
              shippingLabel += '<br><p>' + itemList.selectedBranch.shippingComment + '</p><br>';
            }
            shippingLabel += '</div>';
            for (i = 0; i < labelAmount; i++) {
              $("#packingSlip").append(shippingLabel);
            }
          }
        }
      }

      window.print();

      if (itemList.invoice === false) {
        // Saves the shop data to be reloaded if most recent order needs to be
        // modified at a later stage
        var orders = new Orders();
        orders.set("name", itemList.selectedBranch.name);
        orders.set("city", itemList.selectedBranch.city);
        orders.set("notes", itemList.notes);
        orders.set("backOrder", itemList.backOrder);
        orders.set("orderNo", itemList.orderNo);
        for (i = 0, len = itemList.items.length; i < len; i++) {
          orders.set(itemList.items[i].code, Number(itemList.items[i].ordered));
        }
        orders.save(null,{
          success: function(orders) {
            console.log('New object created with objectId: ' + orders.id);
          },
          error: function(orders, error) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            alert('Failed to create new object, with error code: ' + error.message);
          }
        });
      }

      // Resets the order form
      itemList.selectedBranch.name = "";
      itemList.selectedBranch.short = "";
      itemList.selectedBranch.acc = "";
      itemList.selectedBranch.address = "";
      itemList.selectedBranch.city = "";
      itemList.selectedBranch.shippingComment = "";
      itemList.selectedBranch.full = "";
      itemList.backOrder = false;
      itemList.orderNo = "";
      itemList.searchBox = "";
      itemList.notes = "";
      itemList.date = new Date();
      $("#orderForm")[0].reset();
      for (i = 0, len = itemList.items.length; i < len; i++) {
        itemList.items[i].ordered = 0;
      }
      itemList.checkoutList();
      itemList.displayedItems = itemList.items;
      $('html, body').animate({ scrollTop: 0 }, 'fast');

      // Applies the change to the view
      scope.$apply();
    },
    error: function(object, error) {
      // The object was not retrieved successfully.
      // error is a Parse.Error with an error code and message.
      console.log("Unable to get the current order number");
    }
  });
};

var buildPackingRow = function(itemList, filter) {
  var table = "";
  var quantity = 0;
  var tempItemOrdered;

  for (i = 0; i < itemList.items.length; i++) {
    var tempItem = itemList.items[i];
    if (tempItem.ordered > 0) {
      table += '<tr><td class="packingT">';
      table += tempItem.code;
      table += '</td>';
      table += '<td class="packingT">';
      table += tempItem.description;
      table += '</td>';
      if (itemList.invoice === false) {
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
      if (itemList.invoice === true) {
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
