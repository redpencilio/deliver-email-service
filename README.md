# Table of content

- [Description](#description)
- [Basic Usage](#basic-usage)
  * [Prerequisite](#prerequisite)
  * [Docker-compose](#docker-compose)
  * [Mailbox Structure](#mailbox-structure)
- [Environment Variables](#environment-variables)
  * [Database](#database)
  * [Email](#email)
  * [Debugging](#debugging)
- [Development](#development)
  * [Optional](#optional)
- [Testing](#testing)
    
  <br> <br>
# Description

Service used for processing emails. This is meant be used in a mu-semtech stack. It uses a cron job to periodically look for emails located in the sendBox folder. It uses NodeMailer to send the E-mails.

# Basic Usage

The minimum to get the email service up and running.

## Prerequisites

- You will need to have a mu-semtech stack running in the backend with at least the following services:

| Service  | Repository
|---|---|
| mu-identifier  | https://github.com/mu-semtech/mu-identifier  |
| mu-dispatcher  | https://github.com/mu-semtech/mu-dispatcher  |
| virtuoso  | https://hub.docker.com/r/tenforce/virtuoso/  |
| mu-cl-resources  | https://github.com/mu-semtech/mu-cl-resources  |

## Docker-compose

To use the service add the following to your docker-compose.yml file

```yaml
deliver-email-service:
    image: aatauil/deliver-email-service:1.1.0
    labels:
        - "logging=true"
    restart: always
```
# Models

## Mailbox

![mailboxStructure](https://user-images.githubusercontent.com/52280338/98683577-7f56dc00-2365-11eb-8704-e5f9145e1755.png)

## Folder

![folderStructure](https://user-images.githubusercontent.com/52280338/98683653-94cc0600-2365-11eb-98f7-cae7c7eb085c.png)

## Email

![emailStructure](https://user-images.githubusercontent.com/52280338/98683719-aa413000-2365-11eb-8c3d-a3d7dbbfd294.png)

# Example Structure

This service relies on a certain structure. By default it searches for an "outbox" folder to find the emails that need to be send, a "failbox" for emails that have failed etc. You can modify the structure in the code as needed but if you want to use the defaults then you can just migrate the following file: [HERE](https://github.com/aatauil/app-deliver-email/blob/master/config/migrations/20190122110800-mailbox-folders.sparql)

If you havent yet worked with the migration service then you can find a detailed explanation on how to migrate a file to your database [HERE](https://github.com/mu-semtech/mu-migrations-service).

The migration file is included by default when using the example app: (app-deliver-email-service)[https://github.com/aatauil/app-deliver-email]
When the file has succesfully migrated to your backend then the folder structure should look like this:

![exampleStructure](https://user-images.githubusercontent.com/52280338/98683867-d361c080-2365-11eb-9c4d-7a800f393106.png)

<sup><b>!! Emails + header boxes are displayed only for illustration purposes & are NOT included in the migration file by default !!</b></sup>

<br> <br>
# Environment Variables

The following environment variables can be added to your docker-compose file. You can find the list below sorted by which subject they are closest related. All these environment variables are meant to be added under the email-delivery-service environment section in your docker-compose file.

## Database

| ENV  | Description | default | required |
|---|---|---|---|
| GRAPH_NAME | Specify the graph that you want to manipulate  | "http://mu.semte.ch/graphs/system/email"  | |
| MAILFOLDER_URI | Specify the uri of the mailfolder that you want to manipulate  | "http://data.lblod.info/id/mailboxes/1"  | |


## Email

| ENV  | Description | default | required |
|---|---|---|---|
| SECURE_CONNECTION  | if true the connection will use TLS when connecting to server. If false (the default) then TLS is used if server supports the STARTTLS extension. In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false  | "false"  |   |
| EMAIL_PROTOCOL  | Choose which protocol you want te use to send the e-mails. Options: "smtp", "rest" or "test"   | null | X |
| HOURS_DELIVERING_TIMEOUT  | NEED CHANGE *  | 1 |
| WELL_KNOWN_SERVICE  | Specify the email service you will be using to send the emails. Options: [list](https://github.com/redpencilio/deliver-email-service/blob/main/data/node-mailer-services.js) or "server"  | null | X |
| FROM_NAME  | Name that will be displayed to receiver of the e-mail  | null |
| EMAIL_ADDRESS | E-mail address from sender  | null | For smtp  |
| EMAIL_PASSWORD | Password from sender (api-key if service is SendGrid)  | null | For smtp  |
| HOST | Is the hostname or IP address to connect to.  | "localhost" | 
| PORT | is the port to connect to (defaults to 587 if "SECURE_CONNECTION" is false or 465 if true)  | 587 |

## Debugging

| ENV  | Description | default | required |
|---|---|---|---|
| NODE_ENV  | Choose your node environment. options: "production" or "development"   | "production" | |

<br> <br>
# Development


**Optional:**
   You might want to go through the [testing](#testing) section first if you want to test your mails using a temporary mailbox
<br>

## Backend
If you already have a backend you want to use for development then you can ignore this, otherwise we have a development backend available that is already configured and has the necessary migrations file to get you up and running quickly. Follow the readme file of the following repo:

[link to backend repo](http://comingsoon)

## Environment

As the image has been build using the [mu-javascript-template](https://hub.docker.com/r/semtech/mu-javascript-template), you will be able to setup a development environment with chrome debugging. To get started quickly, change the deliver-email-service in your docker-compose file to this:

```yaml
  deliver-email-service:
    image: aatauil/deliver-email-service:1.0.0
    ports:
      - 8888:80
      - 9229:9229
    environment:
      SECURE_CONNECTION: "true"
      NODE_ENV: "development"
      EMAIL_PROTOCOL: "smtp"
      WELL_KNOWN_SERVICE: "myservice"
      EMAIL_ADDRESS: "mymail@myservice.com"
      EMAIL_PASSWORD: "myemailpassword"
      FROM_NAME: "myname"
    labels:
      - "logging=true"
    restart: always
    volumes:
      - /path/to/local/cloned/deliver-email-service/folder/:/app/
    logging: *default-logging

```
<br> <br>
# Testing

You can easily inspect the mails by changing the EMAIL_PROTOCOL ENV in your docker-compose file to "test"
```yaml
  deliver-email-service:
    image: aatauil/deliver-email-service:1.0.0
    environment:
      EMAIL_PROTOCOL: "test"
      FROM_NAME: "RedPencil"
    labels:
      - "logging=true"
    restart: always
    logging: *default-logging
```
When creating a mail in the database (see [useful queries](#useful-queries)) the email will go through the same process as it would when sending a mail using SMTP (exluding testing for WELL_KNOWN_SERVICE). The main difference being that nodemailer will create a temporary ethereal mailbox for you where you can view your send mail. At the end of the logs you will see something like:

```
> EMAIL 1: Preview ur https://ethereal.email/message/123456788abcdefg
```
When clicking on the link you will be redirected to the temporary mailbox where you can inspect the contents of the mail.
Now you do not have to worry about spamming your own mailbox when testing.
<br> <br>
# Useful Queries

## Creating a mail

```
PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>
PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>

INSERT DATA {
  GRAPH <http://mu.semte.ch/graphs/system/email> {

    <http://data.lblod.info/id/emails/1> a <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#Email>;
       <http://mu.semte.ch/vocabularies/core/uuid> "0cad72fd-4f21-4ea7-af8c-88d24577ee56";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#messageFrom> "johan@redpencil.io";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#emailTo> "niels@redpencil.io";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#emailCc> "erika@redpencil.io";
      <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#emailBcc> "aad@redpencil.io";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#messageSubject> "Email deliver service";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#plainTextMessageContent> "I really like this service! But when encountering bugs, its important to create an    issue in the repo so it can get resolved";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#sentDate> "";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#isPartOf> <http://data.lblod.info/id/mail-folders/2>.
 }
}
```

## Tracking mails

```

PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>
PREFIX ext: <http://mu.semte.ch/vocabularies/ext#>

   SELECT  ?email
      ?uuid
      ?messageSubject
      ?messageFrom
      ?emailTo
      ?emailCc
      ?messageId
      ?plainTextMessageContent
      ?htmlMessageContent
      ?sentDate
      ?folder
      ?lastSendingAttempt

    WHERE {
      GRAPH <http://mu.semte.ch/graphs/system/email> {
        <http://data.lblod.info/id/mailboxes/1> fni:hasPart ?mailfolder.
        ?mailfolder nie:title ?folder.
        ?email nmo:isPartOf ?mailfolder.
        ?email <http://mu.semte.ch/vocabularies/core/uuid> ?uuid.
        ?email nmo:messageSubject ?messageSubject.
        ?email nmo:messageFrom ?messageFrom.
        ?email nmo:emailTo ?emailTo.

        BIND(false as ?defaultSA).
        OPTIONAL {?email ext:lastSendingAttempt ?optionalSA}.
        BIND(coalesce(?optionalSA, ?defaultSA ) as ?lastSendingAttempt).

        BIND('' as ?defaultEmailCc).
        OPTIONAL {?email nmo:emailCc ?optionalEmailCc}.
        BIND(coalesce(?optionalEmailCc, ?defaultEmailCc) as ?emailCc).

        BIND('' as ?defaultmessageId).
        OPTIONAL {?email nmo:messageId ?optionalMessageId}.
        BIND(coalesce(?optionalMessageId, ?defaultmessageId) as ?messageId).

        BIND('' as ?defaultPlainTextMessageContent).
        OPTIONAL {?email nmo:plainTextMessageContent ?optionalPlainTextMessageContent}.
        BIND(coalesce(?optionalPlainTextMessageContent, ?defaultPlainTextMessageContent) as ?plainTextMessageContent).

        BIND('' as ?defaultHtmlMessageContent).
        OPTIONAL {?email nmo:htmlMessageContent ?optionalHtmlMessageContent}.
        BIND(coalesce(?optionalHtmlMessageContent, ?defaultHtmlMessageContent) as ?htmlMessageContent).

        BIND('' as ?defaultSentDate).
        OPTIONAL {?email nmo:sentDate ?optionalSentDate}.
        BIND(coalesce(?optionalSentDate, ?defaultSentDate) as ?sentDate).

      }
    }
GROUP BY ?email ?uuid ?messageSubject ?messageFrom ?messageId ?plainTextMessageContent ?htmlMessageContent ?sentDate
```

## Delete all emails (!!)

**This deletes all emails in all folders! use with caution**

```

PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>
PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>

  DELETE {
    GRAPH <http://mu.semte.ch/graphs/system/email> {
        ?email nmo:isPartOf ?folder.
    }
  }
  WHERE {
    GRAPH  <http://mu.semte.ch/graphs/system/email> {
          ?email a nmo:Email.
          ?email nmo:isPartOf ?folder.
    }
  }

```





