"use strict";
import { app, errorHandler } from 'mu';
const { default: Axios } = require("axios");
const { default: getEmails } = require('./services/getEmails')
const { default: sendEmails } = require('./services/sendEmails')

var CronJob = require('cron').CronJob;

const cronFrequency =  '*/10 * * * * *';

new CronJob(cronFrequency, function() {
  console.log(`*************************************************************************`);
  console.log(`***  Email delivery triggered by cron job at ${new Date().toISOString()} ***`);
  console.log(`*************************************************************************`);
  Axios.patch('http://localhost/email-delivery/');
}, null, true);

app.patch('/email-delivery/', async function(req, res, next) {
  console.log(" >>> Step 1: Find & Retrieve Emails from the database.")
  let getClass = new getEmails()
  let emails = await getClass.retrieveEmails();

  if (emails.length == 0){
    console.log("*** No Emails found to be send. Stopping after step 1. ***")
    return res.status(204).end()
  }

  console.log(` >  ${emails.length} emails found that need to be send. `)
  console.log(` >>> Step 2: Start sending emails using ${process.env.SMTP_OR_REST}`)

  let sendClass = new sendEmails()
  let count = 0;
  emails.forEach(async email => {
      count++;
      console.log(` > Sending email ${count} out of ${emails.length} `)      
      await sendClass.sendEmail(email)
  });

  console.log("Done")
});


app.use(errorHandler);