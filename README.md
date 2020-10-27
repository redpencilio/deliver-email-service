# Table of content

- [Description](#description)
- [Basic Usage](#basic-usage)
  * [Prerequisite](#prerequisite)
  * [Docker-compose **build service file and add image name](#docker-compose---build-service-file-and-add-image-name)
  * [Mailbox Structure *fix sparql file](#mailbox-structure--fix-sparql-file)
- [Environment Variables](#environment-variables)
  * [Database](#database)
  * [Email *](#email--)
  * [Debugging *](#debugging--)
- [Development](#development)
  * [Optional](#optional)
- [Testing](#testing)
- [API](#api)
  * [Folder Structure](#folder-structure)
  * [Root](#root)
    + [App.js](#appjs)
  * [Data](#data)
    + [nodeMailerServices.js](#nodemailerservicesjs)
  * [Queries](#queries)
    + [fetchEmails.js](#fetchemailsjs)
    + [createSentDate.js](#createsentdatejs)
    + [moveEmailToFolder.js](#moveemailtofolderjs)
    + [updateEmailId.js](#updateemailidjs)
  * [Services](#services)
    + [main.js](#mainjs)
  * [Protocols](#protocols)
    + [REST.js](#restjs)
    + [SMTP.js](#smtpjs)
    + [TEST.js](#testjs)
    
    
# Description

Service used for processing emails. This is meant be used in a mu-semtech stack. It uses a cron job to periodically look for emails located in the sendBox folder. It uses NodeMailer to send the E-mails.


# Basic Usage

The minimum to get the email service up and running as quickly as possible

## Prerequisite

- You will need to have a mu-semtech stack running in the backend with at least the following services:

| Service  | Repository 
|---|---|
| mu-identifier  | https://github.com/mu-semtech/mu-identifier  |
| mu-disptacher  | https://github.com/mu-semtech/mu-dispatcher  |
| virtuoso  | https://hub.docker.com/r/tenforce/virtuoso/  |
| mu-cl-resources  | https://github.com/mu-semtech/mu-cl-resources  |


## Docker-compose

To use the service add the following to your docker-compose.yml file

```yaml 
deliver-email-service:
    image: Need-to-be-made-created!!
    labels:
        - "logging=true"
    restart: always
```

## Mailbox Structure

This service relies on the backend having the right structure so it can look in the sendbox folder for emails to be send and if they fail while sending, move them to the failbox folder for example. If you do no have a mailbox structure in the backend then you will have to migrate the following file [HERE](https://github.com/aatauil/app-deliver-email/blob/master/config/migrations/20190122110800-mailbox-folders.sparql) to your backend using the [Migration Service](https://github.com/mu-semtech/mu-migrations-service).

When the file has succesfully migrated to your backend you should you should have a mailbox structure that looks like this:


![mailboxStructure](https://user-images.githubusercontent.com/52280338/97017210-edba3280-154d-11eb-8c16-baee06e7cca1.png)


> Emails + header boxes are displayed only for illustration purposes & are NOT included in the migration file by default. 


# Environment Variables

The following environment variables can be added to your docker-compose file. You can find the list below sorted by which subject they are closest related. All these environment variables are meant to be added under the email-delivery-service environment section in your docker-compose file. 

## Database

| ENV  | Description | default |
|---|---|---|
| GRAPH_NAME | Specify the graph that you want to manipulate  | "http://mu.semte.ch/graphs/system/email"  |
| MAILFOLDER_URI | Specify the uri of the mailfolder that you want to manipulate  | "http://data.lblod.info/id/mailboxes/1"  |


## Email

| ENV  | Description | default |
|---|---|---|
| SECURE_CONNECTION  | if true the connection will use TLS when connecting to server. If false (the default) then TLS is used if server supports the STARTTLS extension. In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false  | "false"  |
| EMAIL_PROTOCOL  | Choose which protocol you want te use to send the e-mails. Options: "smtp", "rest" or "test"   | null |
| HOURS_DELIVERING_TIMEOUT  | NEED CHANGE *  | 1 |
| WELL_KNOWN_SERVICE_OR_SERVER  | Specify the email service you will be using to send the emails. Options: [list](https://nodemailer.com/smtp/well-known/) or "server"  | null |
| FROM_NAME  | Name that will be displayed to receiver of the e-mail  | null |
| EMAIL_ADDRESS | E-mail address from sender  | null |
| EMAIL_PASSWORD | Password from sender  | null |
| HOST | Is the hostname or IP address to connect to.  | "localhost" |
| PORT | is the port to connect to (defaults to 587 if "SECURE_CONNECTION" is false or 465 if true)  | 587 |

## Debugging

| ENV  | Description | default |
|---|---|---|
| NODE_ENV  | Choose your node environment. options: "production" or "development"   | "production" |


# Development


**Optional:**
   You might want to go through the [testing](#testing) section first if you want to test your mails using a temporary mailbox
<br>

## Backend
If you already have a backend you want to use for development then you can ignore this, otherwise we have a development backend available that is already configured and has the nescessary migrations file to get you up and running quickly. Follow the readme file of the following repo:

[link to backend repo](http://comingsoon)

## environment

As the image has been build using the [mu-javascript-template](https://hub.docker.com/r/semtech/mu-javascript-template), you will be able to setup a development environment with chrome debuggin. To get started quickly, change the deliver-email-service in your docker-compose file to this:

```yaml
  deliver-email-service:
    image: deliver-email-service
    ports:
      - 8888:80
      - 9229:9229
    environment:
      SECURE_CONNECTION: "true"
      NODE_ENV: "development"
      EMAIL_PROTOCOL: "smtp"
      WELL_KNOWN_SERVICE_OR_SERVER: "myservice"
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

# Testing

You can easily inspect the mails by changing the EMAIL_PROTOCOL ENV in your docker-compose file to "test"
```yaml
  deliver-email-service:
    image: deliver-email-service
    environment:
      EMAIL_PROTOCOL: "test"
      FROM_NAME: "RedPencil"
    labels:
      - "logging=true"
    restart: always
    logging: *default-logging
```
When creating a mail in the database (see [usefull queries](#usefull-queries)) the email will go through the same process as it would when sending a mail using SMTP (exluding testing for WELL_KNOWN_SERVICE_OR_SERVER). The main difference being that nodemailer will create a temporary ethereal mailbox for you where you can view your send mail. At the end of the logs you will see something like:

```
> EMAIL 1: Preview ur https://ethereal.email/message/123456788abcdefg
```
When clicking on the link you will be redirected to the temporary mailbox where you can inspect the contents of the mail. 
Now you do not have to worry about spamming your own mailbox when testing.

# Usefull Queries

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
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#emailCc> "erica@redpencil.io";
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
    WHERE {
      GRAPH <http://mu.semte.ch/graphs/system/email> {
        <http://data.lblod.info/id/mailboxes/1> fni:hasPart ?mailfolder.
        ?mailfolder nie:title ?folder.
        ?email nmo:isPartOf ?mailfolder.
        ?email <http://mu.semte.ch/vocabularies/core/uuid> ?uuid.
        ?email nmo:messageSubject ?messageSubject.
        ?email nmo:messageFrom ?messageFrom.
        ?email nmo:emailTo ?emailTo.

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


# API

## Folder Structure

```
root
	├── data ( list of static data )
	├── queries ( all query files are located here )
	├── services ( bussiness logic of application )
	│   └── protocols ( files seperated by protocol used to send emails )
	└── utils ( functions used for e.g. parsing are located here )
```
## Root

### App.js

Entrypoint of application. It has one patch endpoint that calls the main() function. It is also responsible for triggering cron jobs. Bussiness logic should be seperated from this file.

## Data

### nodeMailerServices.js
This contains a list of known nodemailer services and can be extended if needed. The list should not be updated programatically.

## Queries

You can find all queries in the queries folder.

### fetchEmails.js

This query looks for emails that are located in the outbox folder. It returns a list of object with the found email details.
It expects a graphName & mailfolderUri as arguments.

### createSentDate.js

Every email that gets processed is checked for a sentDate. If the email does not have a sentdate specified then it gets the date of today specified as sentDate. 
It expects a graphName & email as arguments.


### moveEmailToFolder.js

This query is responsible for moving email around to the correct folder. An e-mail located in the outbox that is currently being send will be deleted from the "outbox" folder and placed inside the the "sending" folder. It should be impossible to have the same e-mail in both "oubox" & "sending" at the same time unless the email is being send twice. 
it expects a graphName, emailId, and a mailboxName.

### updateEmailId.js
After a mail has been sended , it gets assigned a new messageId. This query deletes the old messageId and replaces it by a new one.
It expects a graphNamen oldMessageId & a newMessageId.

## Services

This is where the main bussiness logic of the application is situated. Every service javascript file is seperated into sections.

	├── IMPORTS ( List of imports )
	├── ENV ( List of environment variables )
	├── MAIN FUNCTION ( The function called directly by other files )
	├── SUB FUNCTIONS ( Functions called by the file its main function )

Sub functions are prepended by an underscore (_) to indicate that they are not meant be called by other files and are exclusively used by the file its main function

### main.js

This contains the main function of the app that will be called everytime a cron job is triggered. It checks for emails that need to be send and processes them accordingly distributing the mail to the right function based on the protocol that has been defined in the environment variables.

## Protocols

List of supported protocols for sending the mail

### REST.js

Currently unsupported

### SMTP.js

When smtp has been specified as protocol , the main.js file will send the mail to this function. 


### TEST.js

You can specifiy "test" as protocol ENV. If you do so then Nodemailer will create a temporary email using Ethereal and will send the mail to that address. When the mails get send you will see a preview url displayed in the console per email. 
 






