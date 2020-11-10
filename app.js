"use strict";

// IMPORTS
import { app, errorHandler } from 'mu';
import Axios from 'axios';
import main from './services/main';
const CronJob = require('cron').CronJob;

// ENV
import { CRON_FREQUENCY } from './config';

/**
 * Cron job trigggered 
 * @param  {} cronFrequency
 */
new CronJob(CRON_FREQUENCY, function() {
  console.log(`*************************************************************************`);
  console.log(`***  Email delivery triggered by cron job at ${new Date().toISOString()} ***`);
  console.log(`*************************************************************************`);
  Axios.post('http://localhost/email-delivery/');

}, null, true);

app.post('/email-delivery/', async function(req, res, next) {

  try{
    await main(res);
  }
  catch(err){
    console.log(err);
  }

});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});



app.use(errorHandler);