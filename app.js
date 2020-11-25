"use strict";

/** IMPORTS */ 
import { app, errorHandler } from 'mu';
import Axios from 'axios';
import main from './services/main';
const CronJob = require('cron').CronJob;

/** ENV */ 
import { CRON_FREQUENCY } from './config';

/**
 * Cron job that triggers on a timely basis. 
 * 
 * @param  {string} cronFrequency
 */
new CronJob(CRON_FREQUENCY, function() {
  console.log(`*************************************************************************`);
  console.log(`***  Email delivery triggered by cron job at ${new Date().toISOString()} ***`);
  console.log(`*************************************************************************`);
  Axios.post('http://localhost/email-delivery/');

}, null, true);

/**
 * post route that will be called by CronJob. It will trigger the process of sending the emails.
 * Calls the main function situated in the services folder
 */
app.post('/email-delivery/', async function(req, res, next) {
  try{
    await main(res);
    res.status(202).send().end();
  }
  catch(err){
    console.log('ERROR: something went wrong while initiating the email delivery.');
    console.log(err);
    res.status(500).send(e.message).end();
  }
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

app.use(errorHandler);