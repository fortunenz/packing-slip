// Function to build the table to be printed
var buildTable = function(spreadsheetArray) {
  $("#print").empty();
  var tempTotal;

  var table = "<table>";
  table += "<tr>";
  table += "<th></th>";
  for (i = 0, len = spreadsheetArray.length; i < len; i++) {
    table += "<th>" + spreadsheetArray[i].attributes.short + "</th>";
  }
  table += "<th>Total</th>";
  table += "</tr>";

  table += buildRow(spreadsheetArray);

  table += "</table>";

  $("#print").append(table);
};

// Loops through each shop in spreadsheet and builds a packing slip
// to be printed
var buildPackingSlips = function(spreadsheetArray) {
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

      for (i = 0; i < spreadsheetArray.length; i++) {
        orderNum++;
        for (j = 0; j < 2; j++) {
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
          //packingSlip += '<h1 style="text-align: center">Packing Slip</h1>'
          packingSlip += '<div class="row packingRow"><div class="col-8">';
          packingSlip += '<p class="packingP">Deliver to:</p>';
          packingSlip += '<p class="packingP"><strong>';
          packingSlip += spreadsheetArray[i].attributes.name;
          packingSlip += '</strong></p>';
          packingSlip += '<p class="packingP">';
          packingSlip += spreadsheetArray[i].attributes.address;
          packingSlip += '</p>';
          packingSlip += '<p class="packingP">';
          packingSlip += spreadsheetArray[i].attributes.city;
          packingSlip += '</p></div>';
          // Right side date + packing slip number
          packingSlip += '<div class="col-4">';
          packingSlip += '<p class="packingP">Packing slip no.: ';
          packingSlip += orderNum;
          packingSlip += '</p>';
          packingSlip += '<p class="packingP">Account no.: ';
          packingSlip += spreadsheetArray[i].attributes.acc;
          packingSlip += '</p>';
          packingSlip += '<p class="packingP">Date: ' + new Date().toJSON().slice(0,10) + '</p>';
          packingSlip += '</div></div>';
          // Item details with table
          var table = '';

          table += '<table class="packingTable"><tr><th>Code</th><th>Description</th><th>Packaging</th><th>Quantity</th><th>Carton</th></tr>';
          table += buildPackingRow(spreadsheetArray[i]);
          table += '</table>';

          packingSlip += table;
          // Name and signature
          packingSlip += '<div class="packingSign">';
          packingSlip += '<p>Name: _________________________________</p>';
          packingSlip += '<p>Signature: _____________________________</p>';

          $("#packingSlip").append(packingSlip);
        }
      }
      results.set("orderNumber", orderNum);
      results.save();
    },
    error: function(object, error) {
      // The object was not retrieved successfully.
      // error is a Parse.Error with an error code and message.
      console.log("Unable to get the current order number");
    }
  });
};

// Builds all the rows
var buildRow = function(spreadsheetArray) {
  var table = "";
  var tempTotal;
  var items = model.items;

  for (k = 0; k < items.length; k++) {
    tempTotal = 0;
    for (i = 0, len = spreadsheetArray.length; i < len; i++) {
      tempTotal += spreadsheetArray[i].attributes[items[k].code];
    }

    if (tempTotal > 0) {
      table += "<tr><th>" + items[k].description + "</th>";
      for (i = 0, len = spreadsheetArray.length; i < len; i++) {
        table += "<td>";
        if (spreadsheetArray[i].attributes[items[k].code] > 0) {
          table += spreadsheetArray[i].attributes[items[k].code];
        }
        table += "</td>";
      }
      table += "<td>" + tempTotal + "</td><td>" + items[k].orderAs + "</td>";
      table += "</tr>";
    }
  }

  return table;
};

var buildPackingRow = function(spreadsheetArray) {
  var table = "";
  var items = model.items;
  var quantity = 0;

  for (k = 0; k < items.length; k++) {
    if (items[k].code in spreadsheetArray.attributes) {
      if (spreadsheetArray.attributes[items[k].code] > 0) {
        table += '<tr><td>';
        table += items[k].code;
        table += '</td>';
        table += '<td>'
        table += items[k].description;
        table += '</td>'
        table += '<td>'
        table += items[k].packaging;
        table += '</td>'
        table += '<td>'

        // Calculation for displaying correct quantities
        if (items[k].unit == "1000") {
          quantity =  spreadsheetArray.attributes[items[k].code] * items[k].quantity;
          table += quantity + " pcs";
        } else if (items[k].packaging.includes("4 rolls/ctn") && items[k].description.includes("bag")) {
          table += (spreadsheetArray.attributes[items[k].code] * 4) + " roll";
        } else {
          table += spreadsheetArray.attributes[items[k].code] + " " + items[k].orderAs;
        }

        table += '</td>'
        table += '<td>'

        // Calculation for displaying correct carton values

        // Calculation for gloves
        if (items[k].code.includes("GLOVE") && spreadsheetArray.attributes[items[k].code]%10 !== 0) {
          if (spreadsheetArray.attributes[items[k].code] < 10) {
            table += (spreadsheetArray.attributes[items[k].code] % 10)+ " boxes";
          } else {
            table += ((spreadsheetArray.attributes[items[k].code]/10)-((spreadsheetArray.attributes[items[k].code]%10)/10)) + " ctn + " + (spreadsheetArray.attributes[items[k].code] % 10)+ " boxes";
          }
        } else if (items[k].unit == "box") {
          table += (spreadsheetArray.attributes[items[k].code] / 10) + " ctn";
        // Calculation for bag seal tape 9mmx66m
        } else if (items[k].code.includes("SEAL09")) {
          if (spreadsheetArray.attributes[items[k].code]%48 == 0) {
            table += (spreadsheetArray.attributes[items[k].code] / 48) + " ctn";
          } else {
            if (spreadsheetArray.attributes[items[k].code] < 48) {
              table += spreadsheetArray.attributes[items[k].code] + " rolls";
            } else {
              table += ((spreadsheetArray.attributes[items[k].code]/48)-((spreadsheetArray.attributes[items[k].code]%48)/48)) + " ctn + " + (spreadsheetArray.attributes[items[k].code] % 48)+ " rolls";
            }
          }
        // Calculation for bag seal tape 12mmx66m
        } else if (items[k].code.includes("SEAL12")) {
          if (spreadsheetArray.attributes[items[k].code]%36 == 0) {
            table += (spreadsheetArray.attributes[items[k].code] / 36) + " ctn";
          } else {
            if (spreadsheetArray.attributes[items[k].code] < 36) {
              table += spreadsheetArray.attributes[items[k].code] + " rolls";
            } else {
              table += ((spreadsheetArray.attributes[items[k].code]/36)-((spreadsheetArray.attributes[items[k].code]%36)/36)) + " ctn + " + (spreadsheetArray.attributes[items[k].code] % 36)+ " rolls";
            }
          }
        } else {
          table += spreadsheetArray.attributes[items[k].code] + ' ' + items[k].orderAs;
        }

        table += '</td>';
        table += '</tr>';
      }
    }
  }

  return table;
};
