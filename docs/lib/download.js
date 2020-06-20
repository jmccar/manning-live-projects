"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.modifyLine = modifyLine;
exports.getMilliSeconds = getMilliSeconds;
exports.isSlotInsert = isSlotInsert;
exports.fetchText = fetchText;
exports.getDateFromQuery = getDateFromQuery;
exports.isValidDate = isValidDate;
exports.getTimeFrom = getTimeFrom;
exports.getTimeDifferenceFrom = getTimeDifferenceFrom;
exports.getFirstDate = getFirstDate;
exports.getFirstDateTimeDifference = getFirstDateTimeDifference;
exports.getFormattedDate = getFormattedDate;
exports.modifyDateInLine = modifyDateInLine;
exports.modifyContents = modifyContents;

function modifyLine(line) {
  return "y";
}

function getMilliSeconds(timeString) {
  //let timeString ='0:00:00.109993'
  var millSeconds = 0;
  var splitter = timeString.split(".");
  if (splitter.length > 1) millSeconds = millSeconds + Number(splitter[1]) / 1000;
  var splitTimes = splitter[0].split(":");
  millSeconds = millSeconds + Number(splitTimes[2]) * 1000;
  millSeconds = millSeconds + Number(splitTimes[1]) * 60 * 1000;
  millSeconds = millSeconds + Number(splitTimes[0]) * 60 * 60 * 1000;
  return millSeconds;
}

function isSlotInsert(line) {
  var query = line.toLowerCase();
  return query.indexOf("insert into public.slot") > -1 && isValidDate(query);
}

function fetchText(fileUrl) {
  return fetch(fileUrl).then(function (r) {
    return r.text();
  });
}

function getDateFromQuery(line) {
  //const regex = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d\d)/g;
  var regex = /(\d{4}-\d{2}-\d{2})/g;
  var found = line.match(regex);
  if (found && found.length == 1) return found[0];else return null;
}

function isValidDate(line) {
  return null != getDateFromQuery(line);
}

function getTimeFrom(line) {
  if (isValidDate(line)) {
    var d = new Date(getDateFromQuery(line));
    return d.getTime();
  } else {
    throw new Error("Invalid Date");
  }
}

function getTimeDifferenceFrom(line) {
  var today = new Date().getTime();
  var existing = getTimeFrom(line);
  var differenceInDays = (today - existing) / (1000 * 3600 * 24);
  return differenceInDays * 24 * 3600 * 1000;
}

function getFirstDate(line) {
  var firstLine = line.split(/\r?\n/).find(function (val) {
    return isSlotInsert(val);
  });
  return getDateFromQuery(firstLine);
}

function getFirstDateTimeDifference(line) {
  var firstDate = getFirstDate(line);
  return getTimeDifferenceFrom(firstDate);
}

function padTwo(elem) {
  if (elem < 10) return "0" + elem;else return "" + elem;
}

function getFormattedDate(timeInMs) {
  var d = new Date(timeInMs); //return '2020-05-04 10:00:00'
  // return d.getFullYear() + "-" + padTwo(d.getMonth() + 1)  + "-" + padTwo(d.getDate()) + " " + padTwo(d.getHours()) + ":" + padTwo(d.getMinutes()) + ":" + padTwo(d.getSeconds());

  return d.getFullYear() + "-" + padTwo(d.getMonth() + 1) + "-" + padTwo(d.getDate());
}

function modifyDateInLine(line, firstDateDifference) {
  var dateInQuery = getDateFromQuery(line);
  var dateInQueryAsTimeStamp = getTimeFrom(dateInQuery);
  var updatedTimeStamp = dateInQueryAsTimeStamp + firstDateDifference;
  var changedDateAsString = getFormattedDate(updatedTimeStamp);
  var result = line.replace(dateInQuery, changedDateAsString);
  return result;
}

function modifyContents(contents) {
  var firstDateDifference = getFirstDateTimeDifference(contents);
  var lines = contents.split(/\r?\n/);
  var results = "";
  lines.forEach(function (line) {
    if (isSlotInsert(line)) {
      results += modifyDateInLine(line, firstDateDifference) + "\n";
    } else {
      results += line + "\n";
    }
  });
  return results;
}