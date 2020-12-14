# Table of content

- [Description](#description)
- [Basic Usage](#basic-usage)
  * [Prerequisites](#prerequisites)
  * [Docker-compose](#docker-compose)
- [Models](#models)
  * [Mailbox](#mailbox)
  * [Folder](#folder)
  * [Email](#email)
  * [Attachments](#attachments)
- [Example Structure](#example-structure)
- [Ontology & Prefixes](#ontology--prefixes)
- [Environment Variables](#environment-variables)
  * [Database](#database)
  * [Email](#email-1)
  * [Debugging](#debugging)
- [Development](#development)
  * [Backend](#backend)
  * [Docker-compose](#docker-compose-1)
- [Testing](#testing)
  * [Backend](#backend-1)
  * [Docker-compose](#docker-compose-2)
- [REST API](#rest-api)
  * [Usefull](#usefull)
- [Useful Queries](#useful-queries)
  * [Creating a mail](#creating-a-mail)
  * [Tracking mails](#tracking-mails)

  <br> <br>
# Description

Service used for processing emails. It uses a cron job to periodically look for emails that need to be send. Emails are send using [Nodemailer](https://nodemailer.com/).

**Docker-image:** https://hub.docker.com/repository/docker/redpencil/deliver-email-service

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
    image: redpencil/deliver-email-service:1.1.0
    labels:
        - "logging=true"
    restart: always
```
# Models

## Mailbox

![mailboxStructure](https://user-images.githubusercontent.com/52280338/101146729-a7abc080-361b-11eb-948a-3ee07351c9ce.png)

## Folder

![folderStructure](https://user-images.githubusercontent.com/52280338/98683653-94cc0600-2365-11eb-98f7-cae7c7eb085c.png)

## Email

![emailStructure](https://user-images.githubusercontent.com/52280338/100217257-8cea9500-2f13-11eb-9180-20fe7cb1a3a6.png)


## Attachments

Attachments are linked trough  `nmo:hasAttachment` property on the email. 
The model of the attachment itself is based on [NEPOMUK](http://oscaf.sourceforge.net/nmo.html#nmo:hasAttachment) and the conventions used for the [mu-semtech/file-service](https://github.com/mu-semtech/file-service)

# Example Structure

This service relies on a certain structure. By default it searches for an "outbox" folder to find the emails that need to be send, a "failbox" for the emails that have failed etc.. You can modify the structure in the code as needed but in case you want to use the default, then you can migrate the following file: [Migration file](https://github.com/aatauil/app-deliver-email/blob/master/config/migrations/20190122110800-mailbox-folders.sparql)

If you havent yet worked with the migration service then you can find a detailed explanation on how to migrate a file to your database [HERE](https://github.com/mu-semtech/mu-migrations-service).

The migration file is included by default when using the example app: (app-deliver-email)[https://github.com/aatauil/app-deliver-email]
When the file has succesfully migrated to your database, then the mailbox & folder structure in the backend should look like this:

![exampleStructure](https://user-images.githubusercontent.com/52280338/98683867-d361c080-2365-11eb-9c4d-7a800f393106.png)

<sup><b>Emails & header boxes are displayed only for illustration purposes. They are NOT included in the migrations file by default</b></sup>

<br> <br>
# Ontology & Prefixes

This deliver-email-service is build around the [Nepomuk Message Ontology](http://oscaf.sourceforge.net/nmo.html)

| Prefix  | URI |
|---|---|
| nfo | http://www.semanticdesktop.org/ontologies/2007/03/22/nfo# |
| nie | http://www.semanticdesktop.org/ontologies/2007/01/19/nie# |
| dct | http://purl.org/dc/terms/ |
| dbpedia | http://dbpedia.org/ontology/ |

<br> <br>
# Environment Variables

The following environment variables can be added to your docker-compose file. You can find the list below sorted by which subject they are closest related to. All the environment variables are meant to be added under the email-delivery-service environment section in your docker-compose file.

## Database

| ENV  | Description | default | required |
|---|---|---|---|
| MAILBOX_URI | Specify the uri of the mailbox that you want to manipulate  | None |X |


## Email

| ENV  | Description | default | required |
|---|---|---|---|
| SECURE_CONNECTION | if true the connection will use TLS when connecting to server. If false (the default) then TLS is used if server supports the STARTTLS extension. In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false  | false |   |
| EMAIL_PROTOCOL | Choose which protocol you want te use to send the e-mails. Options: "smtp", "rest" or "test"   | null | X |
| HOURS_DELIVERING_TIMEOUT | Timeout after which the service will stop retrying to send the e-mail after it has failed  | 1 |
| HOURS_SENDING_TIMEOUT | Timeout after which emails in the sending box will be either retried or moved to the failbox  | .5 |
| MAX_BATCH_SIZE | Max amount of emails allowed to be send in parallel. Its recommended not to set this number too high as it can overload the database.  | 200 |
| MAX_RETRY_ATTEMPTS | Max amount of times an email will be tried to resend after it fails  | 5 |
| WELL_KNOWN_SERVICE | Specify the email service you will be using to send the emails. Options: [list](https://github.com/redpencilio/deliver-email-service/blob/main/data/node-mailer-services.js) or "server"  | null | X |
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

This will show you how to setup a development environment so you can take advantage of features and tools like **live reload** & **chrome debugger tool**;


**Optional:**
   You might want to go through the [testing](#testing) section first if you want to test your mails using a temporary mailbox
<br>

## Backend
If you already have a backend you want to use for development then you can ignore this, otherwise we have a development backend available that is already configured and has the example structure migrations file to get you up and running quickly. Follow the readme file of the following repo:

[App-deliver-email](https://github.com/aatauil/app-deliver-email)

## Docker-compose

As the image has been build using the [mu-javascript-template](https://hub.docker.com/r/semtech/mu-javascript-template), you will be able to setup a development environment with chrome debugging. To get started quickly, change the deliver-email-service in your docker-compose file to this:

```yaml
  deliver-email-service:
    image: redpencil/deliver-email-service:1.1.0
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
      - ./data/files:/share
      - /path/to/local/cloned/deliver-email-service/folder/:/app/ (for debugging purposes)
    logging: *default-logging

```

<sup><b>Don't forget to change WELL_KNOW_SERVICE, EMAIL_ADDRESS, EMAIL_PASSWORD & FROM_NAME to your own.</b></sup>
<br> <br>
# Testing

Testing environment will send create a temporary ethereal mailbox where you can inspect the email. <br>
<sup><strong>important to know</strong>: This will not ACTUALLY send the emails. This will only act <strong>as if</strong> the email has been send and received. The specified receiver will not receive the emails nor will the sender actually send the email from. In reality you can enter any (random) sender email address and (random) receiver address.</sup>

## Backend
If you already have a backend you want to use for development then you can ignore this, otherwise we have a development backend available that is already configured and has the example structure migrations file to get you up and running quickly. Follow the readme file of the following repo:

[App-deliver-email](https://github.com/aatauil/app-deliver-email)

## Docker-compose

You can easily inspect the mails by changing the EMAIL_PROTOCOL in your docker-compose file to "test"
```yaml
  deliver-email-service:
    image: redpencil/deliver-email-service:1.1.0
    environment:
      EMAIL_PROTOCOL: "test"
      FROM_NAME: "RedPencil"
    labels:
      - "logging=true"
    restart: always
    logging: *default-logging
```
When creating an email in the database (see [useful queries](#useful-queries)) the email will go through the same process as it would when sending an email using SMTP or any other service. The main difference being that the service will create a temporary generated ethereal mailbox for you where you can view your send emails. At the end of each send email, the logs will display a preview url:

```
> EMAIL 3: Preview url https://ethereal.email/message/123456788abcdefg
```
When clicking on the link you will be redirected to the temporary generated mailbox where you can inspect the contents of the mail.
You do not have to worry about it spamming your own or any other mailbox when the test protocol is set.
<br> <br>

# REST API

**POST /email-delivery**
Initiate a new email-delivery cycle asynchronously.

Returns 202 Accepted if the email-delivery process started successfully.

Returns 204 No Content if the email-delivery got triggered but no emails where found that need to be send.

Returns 500 Bad Request if something unexpected went wrong while initiating the email-delivery process.

## Useful

You can use postman to trigger the service or use this command (locally)

`wget --post-data='' http://localhost/email-delivery/`

This only works if you add the following to your dispatcher

```ruby
  post "/email-delivery/*path" do
    Proxy.forward conn, path, "http://deliver-email-service/email-delivery/"
  end
```


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
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#messageFrom> "johan@redpencil.io";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#emailTo> "niels@redpencil.io";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#emailCc> "erika@redpencil.io";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#emailBcc> "aad@redpencil.io";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#messageSubject> "Email deliver service";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#plainTextMessageContent> "I really like this service! But when encountering bugs, its important           to create an issue in the repo so it can get resolved";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#sentDate> "";
       <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#isPartOf> <http://data.lblod.info/id/mail-folders/2>.
 }
}
```

<sup>You will want to modify <http://data.lblod.info/id/emails/1> after each inserted mail otherwise you will create duplicates. e.g.  <http://data.lblod.info/id/emails/2>,  <http://data.lblod.info/id/emails/3> etc..</sup>

## Tracking mails

```

PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>
PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>

   SELECT  ?email
      ?messageSubject
      ?messageFrom
      ?emailTo
      ?emailCc
      ?messageId
      ?plainTextMessageContent
      ?htmlMessageContent
      ?sentDate
      ?folder
      ?numberOfRetries

    WHERE {
      GRAPH <http://mu.semte.ch/graphs/system/email> {
        <http://data.lblod.info/id/mailboxes/1> nie:hasPart ?mailfolder.
        ?mailfolder nie:title ?folder.
        ?email nmo:isPartOf ?mailfolder.
        ?email nmo:messageSubject ?messageSubject.
        ?email nmo:messageFrom ?messageFrom.
        ?email nmo:emailTo ?emailTo.

        BIND(0 as ?defaultRetries).
        OPTIONAL {?email task:numberOfRetries ?optionalRetries}.
        BIND(coalesce(?optionalRetries, ?defaultRetries) as ?numberOfRetries).

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
GROUP BY ?email ?messageSubject ?messageFrom ?messageId ?plainTextMessageContent ?htmlMessageContent ?sentDate ?numberOfRetries
```
