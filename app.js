"use strict";
import { app, errorHandler } from 'mu';
const { default: Axios } = require('axios');
const { default: main } = require('./services/main');

var CronJob = require('cron').CronJob;

const cronFrequency =  '*/20 * * * * *';
var inProgress;

new CronJob(cronFrequency, function() {
  console.log(`*************************************************************************`);
  console.log(`***  Email delivery triggered by cron job at ${new Date().toISOString()} ***`);
  console.log(`*************************************************************************`);

  if(!inProgress){
    Axios.patch('http://localhost/email-delivery/');
    inProgress = true
  } else {
    console.log(" *** currently in progress *** ")
  }
}, null, true);

app.patch('/email-delivery/', async function(req, res, next) {

  await main(res)

});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});



app.use(errorHandler);