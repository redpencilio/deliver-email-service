import updateSentDate from "../queries/update-sent-date";

/**
 * Ensures a sentDate is added to the email.
 * @param  {object} email
 * @param  {integer} count
 */
async function ensureSentDate(email, count) {
  if (!email.sentDate) {
    await updateSentDate(email);
    console.log(
      `Email ${count}: No send date found, a send date has been created.`
    );
  }
}

export default ensureSentDate;
