// Utility functions that belong only to background

const parse = require("date-fns").parse;

//
function parseWotcTime(str) {
  try {
    let datePart = str.split(" ")[0];
    let timePart = str.split(" ")[1];
    let midnight = str.split(" ")[2];

    datePart = datePart.split("/");
    timePart = timePart.split(":");

    timePart.forEach(function(s, index) {
      timePart[index] = parseInt(s);
    });
    datePart.forEach(function(s, index) {
      datePart[index] = parseInt(s);
    });

    if (midnight == "PM" && timePart[0] != 12) {
      timePart[0] += 12;
    }
    if (midnight == "AM" && timePart[0] == 12) {
      timePart[0] = 0;
    }

    var date = new Date(
      datePart[2],
      datePart[0] - 1,
      datePart[1],
      timePart[0],
      timePart[1],
      timePart[2]
    );
    return date;
  } catch (e) {
    return new Date();
  }
}

// throws an error if it fails
function parseWotcTime2(dateStr) {
  // example input: 1/23/2019 8:42:41 PM
  return parse(dateStr, "M/d/yyyy h:mm:ss a..aaa", new Date());
}

function normaliseFields(iterator) {
  if (typeof iterator == "object") {
    return transform(iterator, function(result, value, key) {
      let nkey =
        typeof key == "string" ? key.replace(/List$/, "").toLowerCase() : key;
      result[nkey] = normaliseFields(value);
    });
  }
  return iterator;
}

module.exports = {
  parseWotcTime: parseWotcTime,
  parseWotcTime2: parseWotcTime2,
  normaliseFields: normaliseFields
};
