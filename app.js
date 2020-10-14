"use strict";
import { app, errorHandler } from 'mu';
const { default: Axios } = require("axios");
const { default: getEmails } = require('./services/getEmails')
const { default: sendEmails } = require('./services/sendEmails')
const nodemailer = require("nodemailer");
var CronJob = require('cron').CronJob;

const cronFrequency =  '*/10 * * * * *';

new CronJob(cronFrequency, function() {
  console.log(`***  Email delivery triggered by cron job at ${new Date().toISOString()} ***`);
  Axios.patch('http://localhost/email-delivery/');
}, null, true);


app.patch('/email-delivery/', async function(req, res, next) {


  console.log(" >>> Step 1: Find & Retrieve Emails from the database.")

  let getClass = new getEmails()
  let fetchMails = await getClass.retrieveEmails();
  let emails = fetchMails.results.bindings

  if (emails.length == 0){
    console.log("> No Emails found to be send. Stopping after step 1.")
    return res.status(204).end()
  }
  console.log(` >  ${emails.length} emails found to send. `)

  console.log(` >>> Step 2: Start sending emails. `)
  let sendClass = new sendEmails()
  emails.forEach(email => {
      sendClass.sendEmail(email)
  });

  console.log("Done")


});


app.use(errorHandler);