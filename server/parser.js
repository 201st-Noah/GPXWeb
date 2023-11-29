const fs = require('fs');
const xml2js = require('xml2js');
const Decimal = require('decimal.js')
const filePath = 'testrun.gpx';
//const filePath = 'running_2022-06-14_20-16-58_TomTom.gpx'

function getTrackPoints(filePath, callback) {
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return callback(err, null);
    }

    xml2js.parseString(data, { explicitArray: false }, (parseErr, result) => {
      if (parseErr) {
        return callback(parseErr, null);
      }
      console.log(result)
      const trackPoints = result.gpx.trk.trkseg.trkpt;
      callback(null, trackPoints);
    });
  });
}
function getLength(filePath, callback) {
  getTrackPoints(filePath, (err, trackPoints) => {
    if (err) {
      return callback(err, null);
    }

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < trackPoints.length; i++) {
      const lat1 = parseFloat(trackPoints[i - 1].$.lat);
      const lon1 = parseFloat(trackPoints[i - 1].$.lon);
      const lat2 = parseFloat(trackPoints[i].$.lat);
      const lon2 = parseFloat(trackPoints[i].$.lon);

      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = 6371000 * c; // Radius of Earth: 6371 km
      totalDistance += distance;
    }
    callback(null, totalDistance);
  });
}


//Output
getLength(filePath, (err, distance) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Total Distance:', distance.toFixed(2), 'meters');
  }
});
