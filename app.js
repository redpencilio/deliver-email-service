'use strict';

/** IMPORTS */
import { app, errorHandler } from 'mu';
import Axios from 'axios';
import main from './services/main';
import { CronJob } from 'cron';

/** ENV */
import { CRON_FREQUENCY } from './config';

let isTaskRunning = false; //TODO: later save as proper task in DB

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
app.post('/email-delivery/', async function(_, res, next) {

  if(isTaskRunning) {
    return res.status(409).send().end();
  }
  else {
    try{
      isTaskRunning = true;
      await main(res);
      return res.status(202).send().end();
    }
    catch(err){
      console.log('ERROR: something went wrong while initiating the email delivery.');
      console.log(err);
      return next(new Error(err));
    }
    finally {
      isTaskRunning = false;
    }
  }
});

process.on('unhandledRejection', (reason, p) => {
  // application specific logging, throwing an error, or other logic here
  isTaskRunning = false;
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

app.use(errorHandler);
