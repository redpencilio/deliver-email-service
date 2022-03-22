import fs from "fs";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";
import moveEmailToFolder from "../../queries/move-email-to-folder";
import ensureSentDate from "../../utils/ensure-sent-date";
import fetchAttachmentsForEmail from "../../queries/fetch-attachments-for-email";
import {
  MAILBOX_URI,
  MS_GRAPH_API_AUTH_PROVIDER,
  MS_GRAPH_API_EMAIL_RETRIEVE_WAIT_TIME,
  MS_GRAPH_API_USER_PRINCIPAL_NAME,
} from "../../config";
import updateEmailId from "../../queries/update-email-id";
import sendOrRetry from "../../utils/send-or-retry";

/**
 * Sends email using Microsoft Graph API
 *
 * First, ensure the email has a sent date set in the database
 * Then, move the email to the "sending" box
 * Finally, call Graph API to perform the send
 *
 * @param {Object} email
 * @param {number} count
 */
async function sendMSGraphAPI(email, count) {
  try {
    await ensureSentDate(email, count);
    await moveEmailToFolder(MAILBOX_URI, email, "sending");
    await _sendMail(email, count);
  } catch (err) {
    console.log(err);
  }
}

/**
 * Call Microsoft Graph API to send email
 *
 * Flow:
 *  Create a Graph API client\
 *  Create a draft message - this way we have the an Outlook specific id we can use
 *  Send the draft message (using the id we received earlier)
 *  Get the sent message from the sentitems mailbox - from here we can get the messageId
 *    This can take a while, so we have to wait and retry
 *  Move email to sentbox in the database
 *
 * @param {Object} email
 * @param {number} count
 */
async function _sendMail(email, count) {
  await sendOrRetry(async () => {
    const client = Client.initWithMiddleware({
      authProvider: MS_GRAPH_API_AUTH_PROVIDER,
    });

    const mailProperties = await _generateMsGraphApiEmailProperties(email);

    let userPrincipalName = MS_GRAPH_API_USER_PRINCIPAL_NAME;
    if (email.messageFrom) {
      const response = await client
        .api("/users")
        .filter(`mail eq '${email.messageFrom}'`)
        .select("userPrincipalName")
        .get();

      const [fetchedUserPrincipalName] = response.value.map(
        (user) => user.userPrincipalName
      );
      userPrincipalName = fetchedUserPrincipalName ?? userPrincipalName;
    }

    // Create draft
    const immutableId = await _createDraftEmail(
      client,
      userPrincipalName,
      mailProperties
    );

    // Send draft
    await _sendDraftEmail(client, userPrincipalName, immutableId);

    // Get sent email
    const response = await _getSentEmail(
      client,
      userPrincipalName,
      immutableId
    );

    await moveEmailToFolder(MAILBOX_URI, email, "sentbox");

    if (!response.internetMessageId) {
      console.warn(`No messageId returned for ${email.email} and MS_GRAPH_API`);
    }

    await updateEmailId(email, response.internetMessageId || "");

    console.log(`Email ${count}: URI = ${email.email}`);
    console.log(`Email ${count}: Email moved to sentbox`);
    console.log(`Email ${count}: Email message ID updated`);
    console.log(
      `Email ${count}: MessageId updated from ${email.messageId} to ${response.internetMessageId}`
    );
  });
}

/**
 * Create a draft email using Graph API
 *
 * This is necessary to have an email Id we can use for further processing (sending & retrieving)
 * Note the usage of Prefer IdType="ImmutableId" header, this is so that the id we get for the
 * draft email does not change as the email gets moved around mailboxes
 *
 * API call docs
 * @see https://docs.microsoft.com/en-us/graph/api/user-post-messages?view=graph-rest-1.0&tabs=javascript
 *
 * @param {Client} client Graph API client
 * @param {string} userPrincipalName The UPN of the user that will be creating the draft email
 * @param {Object} mailProperties Message object as specified by the Graph API spec @see: https://docs.microsoft.com/en-us/graph/api/resources/message?view=graph-rest-1.0#properties
 * @returns Immutable id of the created draft email
 */
async function _createDraftEmail(client, userPrincipalName, mailProperties) {
  const response = await client
    .api(`/users/${userPrincipalName}/messages`)
    .header("Prefer", 'IdType="ImmutableId"')
    .post(mailProperties);
  return response.id;
}

/**
 * Send a (draft) email using Graph API
 *
 * API call docs
 * @see https://docs.microsoft.com/en-us/graph/api/message-send?view=graph-rest-1.0&tabs=javascript
 *
 * @param {Client} client Graph API client
 * @param {string} userPrincipalName The UPN of the user we will be sending the email for
 * @param {string} immutableId Immutable id of the email we will be sending
 * @returns
 */
async function _sendDraftEmail(client, userPrincipalName, immutableId) {
  return client
    .api(`/users/${userPrincipalName}/messages/${immutableId}/send`)
    .post();
}

/**
 * Retrieve an email using Graph API
 *
 * API call docs
 * @see https://docs.microsoft.com/en-us/graph/api/message-get?view=graph-rest-1.0&tabs=javascript
 *
 * @param {*} client
 * @param {*} userPrincipalName
 * @param {*} immutableId
 * @returns
 */
async function _getSentEmail(
  client,
  userPrincipalName,
  immutableId,
  retry = false
) {
  try {
    const response = await client
      .api(
        `/users/${userPrincipalName}/mailFolders/sentitems/messages/${immutableId}`
      )
      .select("internetMessageId")
      .get();
    return response;
  } catch (err) {
    if (err.statusCode === 404 && !retry) {
      console.warn(
        `Fetching message with id ${immutableId} failed with an error 404, retrying once.`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, MS_GRAPH_API_EMAIL_RETRIEVE_WAIT_TIME)
      );
      return _getSentEmail(client, userPrincipalName, immutableId, true);
    } else {
      throw err;
    }
  }
}

async function _generateMsGraphApiEmailProperties(email) {
  const attachments = [];
  const attachmentsData = await fetchAttachmentsForEmail(email.email);
  for (const attachment of attachmentsData) {
    const contentBytes = fs.readFileSync(attachment.path);

    const attachmentData = {
      "@odata.type": "#microsoft.graph.fileAttachment",
      contentBytes: contentBytes,
    };

    if (attachment.filename) {
      attachmentData.name = attachment.filename;
    }
    if (attachment.contentType) {
      attachmentData.contentType = attachment.contentType;
    }

    attachments.push(attachmentData);
  }

  const body = {};
  if (email.htmlMessageContent) {
    body.contentType = "HTML";
    body.content = email.htmlMessageContent;
  } else if (email.plainTextMessageContent) {
    body.contentType = "Text";
    body.content = email.plainTextMessageContent;
  } else {
    body.contentType = "Text";
    body.content = "";
  }

  const emailToMSApiRecipient = (email) => {
    return {
      emailAddress: {
        address: email,
      },
    };
  };
  const splitEmailString = (emails) => {
    if (emails === '') {
      return [];
    }

    const array = [];
    for (const email of emails.split(",")) {
      array.push(emailToMSApiRecipient(email));
    }
    return array;
  };

  const mailProperties = {
    toRecipients: splitEmailString(email.emailTo),
    ccRecipients: splitEmailString(email.emailCc),
    bccRecipients: splitEmailString(email.emailBcc),
    replyTo: splitEmailString(email.replyTo),
    subject: email.messageSubject,
    body: body,
    attachments: attachments,
  };

  return mailProperties;
}

export default sendMSGraphAPI;
