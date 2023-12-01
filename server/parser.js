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
//distance
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
        const lat1 = parseFloat(trackPoints[i - 1].$.lat).toFixed(8);
        const lon1 = parseFloat(trackPoints[i - 1].$.lon).toFixed(8);
        const lat2 = parseFloat(trackPoints[i].$.lat).toFixed(8);
        const lon2 = parseFloat(trackPoints[i].$.lon).toFixed(8);

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
    callback(null, totalDistance.toFixed(2));
  });
}
//Altitude
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
    callback(null, totalAscent.toNumber().toFixed(0));
  });
}
function getDescent(file, callback){
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

        if (h2 < h1) {
          const elevDiff = h1.minus(h2)
          totalAscent = totalAscent.plus(elevDiff)
        }
      }
    }
    callback(null, totalAscent.toNumber().toFixed(0));
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
//time
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
//speed
function getMinProKm(file, callback){
  getLength(file, (err, length) => {
    if (err) {
      return callback(err, null);
    }
    getDuration(file, (err, duration) => {
      if (err) {
        return callback(err, null);
      }
      const speed = (duration/60) / (length/1000)
      callback(null, speed.toFixed(2));
    });
  });
}
function getKmProH(file, callback){
  getLength(file, (err, length) => {
    if (err) {
      return callback(err, null);
    }
    getDuration(file, (err, duration) => {
      if (err) {
        return callback(err, null);
      }
      const speed = (length/1000) / (duration/3600)
      callback(null, speed.toFixed(2));
    });
  });
}
//heart rate
function getMeanHr(file, callback){
  getTrackPoints(file, (err, trackPoints) => {
    if (err) {
      return callback(err, null);
    }
    let meanHf = 0;
    if(trackPoints[0].extensions != null){
      for (let i = 0; i < trackPoints.length; i++){
        meanHf = meanHf + parseInt(trackPoints[i].extensions['ns3:TrackPointExtension']['ns3:hr'])
      }
    }
    callback(null, (meanHf/trackPoints.length).toFixed(0));
  });
}
function getMaxHr(file, callback){
  getTrackPoints(file, (err, trackPoints) => {
    if (err) {
      return callback(err, null);
    }
    let maxHf = 0;
    if(trackPoints[0].extensions != null){
      for (let i = 0; i < trackPoints.length; i++){
        maxHf = Math.max(maxHf, parseFloat(trackPoints[i].extensions['ns3:TrackPointExtension']['ns3:hr']))
      }
    }
    callback(null, maxHf.toFixed(0));
  });
}
//start
function getStartTime(file, callback){
  getTrackPoints(file, (err, trackPoints) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, trackPoints[0].time)
  });
}
function getStartCoords(file, callback){
  getTrackPoints(file, (err, trackPoints) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, [parseFloat(trackPoints[0].$.lat).toFixed(6), parseFloat(trackPoints[0].$.lon).toFixed(6)])
  });
}
function getType(file, callback){
  fs.readFile(file, 'utf-8', (err, data) => {
    if (err) {
      return callback(err, null);
    }
    xml2js.parseString(data, { explicitArray: false }, (parseErr, result) => {
      if (parseErr) {
        return callback(parseErr, null);
      }
      let res = result.gpx.trk;
      if(res.type != null){
        res = res.type
      }
      else{
        res = res.name
      }
      callback(null, res.toLowerCase());
    });
  });
}



//Output
getLength(filePath, (err, distance) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Total Distance:', distance, 'meters');
  }
});
getAscent(filePath, (err, ascent) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Total Ascent:', ascent, 'meters');
  }
});
getDescent(filePath, (err, ascent) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Total Descent:', ascent, 'meters');
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
getMinProKm(filePath, (err, duration) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Speed:', duration, 'min/km');
  }
});
getKmProH(filePath, (err, duration) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Speed:', duration, 'Km/h');
  }
});
getStartTime(filePath, (err, duration) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Started at:', duration);
  }
});
getStartCoords(filePath, (err, duration) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Started at Coords:', duration);
  }
});
getType(filePath, (err, type) =>{
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Type:', type);
  }
});
getMeanHr(filePath, (err, type) =>{
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Average Heart rate:', type, 'bpm');
  }
});
getMaxHr(filePath, (err, type) =>{
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Max Heart rate:', type, 'bpm');
  }
});
