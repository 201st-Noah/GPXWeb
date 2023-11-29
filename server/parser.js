const fs = require('fs');
const xml2js = require('xml2js');
const Decimal = require('decimal.js')
const {max} = require("rxjs");
const filePath = 'testrun.gpx';
//const filePath = 'testRun2.gpx';
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
      const trackPoints = result.gpx.trk.trkseg.trkpt;
      callback(null, trackPoints);
    });
  });
}

function getLength(file, callback) {
  getTrackPoints(file, (err, trackPoints) => {
    if (err) {
      return callback(err, null);
    }

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < trackPoints.length; i++) {
      const t1 = new Date(trackPoints[i - 1].time).getTime()
      const t2 = new Date(trackPoints[i].time).getTime()
      if((t2 - t1) < 10000) {
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
    }
    callback(null, totalDistance);
  });
}

function getAscent(file, callback){
  getTrackPoints(file, (err, trackPoints) => {
    if (err) {
      return callback(err, null);
    }

    // Calculate total Ascent
    let totalAscent = new Decimal(0);
    for (let i = 1; i < trackPoints.length; i++) {
      const t1 = new Date(trackPoints[i - 1].time).getTime()
      const t2 = new Date(trackPoints[i].time).getTime()
      if((t2 - t1) < 10000) {
        const h1 = new Decimal(trackPoints[i - 1].ele);
        const h2 = new Decimal(trackPoints[i].ele);

        if (h2 > h1) {
          const elevDiff = h2.minus(h1)
          totalAscent = totalAscent.plus(elevDiff)
        }
      }
    }
    callback(null, totalAscent.toNumber());
  });
}

function getMaxAlt(file, callback){
  getTrackPoints(file, (err, trackPoints) => {
    if (err) {
      return callback(err, null);
    }
    let maxElevation = 0;
    for (let i = 0; i < trackPoints.length; i++) {
      const h = trackPoints[i].ele;
      maxElevation = Math.max(maxElevation, h)
    }
    callback(null, maxElevation.toFixed(0));
  });
}
function getMinAlt(file, callback){
  getTrackPoints(file, (err, trackPoints) => {
    if (err) {
      return callback(err, null);
    }
    let minElevation = 100000;
    for (let i = 0; i < trackPoints.length; i++) {
      const h = trackPoints[i].ele;
      minElevation = Math.min(minElevation, h)
    }
    callback(null, minElevation.toFixed(0));
  });
}
function getTotalDuration(file, callback){
  getTrackPoints(file, (err, trackPoints) => {
    if (err) {
      return callback(err, null);
    }
    const start =  new Date(trackPoints[0].time)
    const end =  new Date(trackPoints[trackPoints.length - 1].time)
    const durationdate = end.getTime() - start.getTime()
    const duration = durationdate/1000
    //const minutes = Math.floor(duration/60000);
    //const seconds = ((duration - minutes) * 0.6)
    callback(null, duration)
  });
}

function getDuration(file, callback){
  getTrackPoints(file, (err, trackPoints) => {
    if (err) {
      return callback(err, null);
    }

    // Calculate duration (if the pause between 2 trackpoints is greater than 10 s it counts as pause and will not be countet in to the timerunning)
    let totalDuration = 0;
    for (let i = 1; i < trackPoints.length; i++) {
      const t1 = new Date(trackPoints[i - 1].time).getTime();
      const t2 = new Date(trackPoints[i].time).getTime();

      if((t2 - t1) < 10000){
        totalDuration = totalDuration + (t2 - t1)
      }
    }
    callback(null, totalDuration/1000);
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
getAscent(filePath, (err, ascent) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Total Ascent:', ascent.toFixed(2), 'meters');
  }
});
getTotalDuration(filePath, (err, duration) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Total Duration:', duration, 'sec');
  }
});
getDuration(filePath, (err, duration) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Duration:', duration, 'sec');
  }
});
getMaxAlt(filePath, (err, duration) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Highest Point at:', duration, 'm');
  }
});
getMinAlt(filePath, (err, duration) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Lowest Point at:', duration, 'm');
  }
});

