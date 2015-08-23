// Builds the packing slip
var buildPackingSlips = function(itemList, scope) {
  $("#packingSlip").empty();
  var packingSlip;
  var orderNum;

  var OrderNumber = Parse.Object.extend("OrderNumber");
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
      packingSlip += '<strong class="col-2 packingName">Packing Slip</strong>';
      packingSlip += '</div>';
      // Left column of subheading
      packingSlip += '<div class="row packingRow"><div class="col-8">';
      packingSlip += '<p class="packingP">73 Huia Road, Otahuhu, Auckland</p>';
      packingSlip += '<p class="packingP">PO Box 9511 New Market, Auckland</p>';
      packingSlip += '<p class="packingP">Email: <a href="#">feltd@xtra.co.nz</a></p></div>';
      // Right column of subheading
      packingSlip += '<div class="col-4">';
      packingSlip += '<p class="packingP right">Phone:    (09) 276-2681</p>';
      packingSlip += '<p class="packingP right">Fax:      (09) 276-2682</p>';
      packingSlip += '<p class="packingP right">Website:  <a href="#">www.fortunenz.com </a></p></div>';
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
      packingSlip += '<p class="packingP">Packing slip no.: ';
      packingSlip += orderNum;
      packingSlip += '</p>';
      packingSlip += '<p class="packingP">Account no.: ';
      packingSlip += itemList.selectedBranch.acc;
      packingSlip += '</p>';
      packingSlip += '<p class="packingP">Date: ' + new Date().toJSON().slice(0,10) + '</p>';
      packingSlip += '</div></div>';

      // If the order is for a backorder
      if (itemList.backOrder === true) {
        packingSlip += '<div class="center"><strong>Backorder</strong></div>';
      }

      // Item details with table
      var table = '';

      table += '<table class="packingTable"><tr><th>Code</th><th>Description</th><th>Packaging</th><th>Quantity</th><th>Carton</th></tr>';
      table += buildPackingRow(itemList);
      table += '</table>';

      packingSlip += table;
      // Name and signature
      packingSlip += '<div class="packingSign">';
      packingSlip += '<p>Name: _________________________________</p>';
      packingSlip += '<p>Signature: _____________________________</p></div>';

      $("#packingSlip").append(packingSlip);

      packingSlip += '<div class="break"></div>';
      $("#packingSlip").prepend(packingSlip);

      results.set("orderNumber", orderNum);
      results.save();

      window.print();

      itemList.selectedBranch.name = "";
      itemList.selectedBranch.short = "";
      itemList.selectedBranch.acc = "";
      itemList.selectedBranch.address = "";
      itemList.selectedBranch.city = "";
      itemList.selectedBranch.selected = false;
      $("#orderForm")[0].reset();
      for (i = 0, len = itemList.items.length; i < len; i++) {
        itemList.items[i].ordered = 0;
      }
      $('html, body').animate({ scrollTop: 0 }, 'fast');

      scope.$apply();
    },
    error: function(object, error) {
      // The object was not retrieved successfully.
      // error is a Parse.Error with an error code and message.
      console.log("Unable to get the current order number");
    }
  });
};

var buildPackingRow = function(itemList) {
  var table = "";
  var quantity = 0;

  for (i = 0; i < itemList.items.length; i++) {
    var tempItem = itemList.items[i];
    if (tempItem.ordered > 0) {
      table += '<tr><td>';
      table += tempItem.code;
      table += '</td>';
      table += '<td>';
      table += tempItem.description;
      table += '</td>';
      table += '<td>';
      table += tempItem.packaging;
      table += '</td>';

      table += '<td>';

      // Calculation for displaying correct quantities
      if (tempItem.unit == "1000") {
        quantity =  tempItem.ordered * tempItem.quantity;
        table += quantity + " pcs";
      } else if (tempItem.packaging.includes("4 rolls/ctn") && tempItem.description.includes("bag")) {
        table += (tempItem.ordered * 4) + " roll";
      } else {
        table += tempItem.ordered + " " + tempItem.orderAs;
      }

      table += '</td>';
      table += '<td>';

      // Calculation for displaying correct carton values

      // Calculation for gloves
      if (tempItem.code.includes("GLOVE") && tempItem.ordered%10 !== 0) {
        if (tempItem.ordered < 10) {
          table += (tempItem.ordered % 10)+ " boxes";
        } else {
          table += ((tempItem.ordered/10)-((tempItem.ordered%10)/10)) + " ctn + " + (tempItem.ordered % 10)+ " boxes";
        }
      } else if (tempItem.unit == "box") {
        table += (tempItem.ordered / 10) + " ctn";
      // Calculation for bag seal tape 9mmx66m
      } else if (tempItem.code.includes("SEAL09")) {
        if (tempItem.ordered%48 === 0) {
          table += (tempItem.ordered / 48) + " ctn";
        } else {
          if (tempItem.ordered < 48) {
            table += tempItem.ordered + " rolls";
          } else {
            table += ((tempItem.ordered/48)-((tempItem.ordered%48)/48)) + " ctn + " + (tempItem.ordered % 48)+ " rolls";
          }
        }
      // Calculation for bag seal tape 12mmx66m
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
      } else {
        table += tempItem.ordered + ' ' + tempItem.orderAs;
      }

      table += '</td>';
      table += '</tr>';
    }
  }

  return table;
};
