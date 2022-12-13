# Table of content

- [Description](#description)
- [Docker-compose](#docker-compose)
- [Models](#models)
  * [Mailbox](#mailbox)
  * [Folder](#folder)
  * [Email](#email)
  * [Attachments](#attachments)
- [Example Structure](#example-structure)
- [Ontology & Prefixes](#ontology--prefixes)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)
- [REST API](#rest-api)
- [Useful Queries](#useful-queries)

  <br> <br>
# Description

Service used for processing emails. It uses a cron job to periodically look for emails that need to be send. Emails are send using [Nodemailer](https://nodemailer.com/) or [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/outlook-mail-concept-overview).

**Docker-image:** https://hub.docker.com/repository/docker/redpencil/deliver-email-service

# Docker-compose

To use the service add the following to your docker-compose.yml file

```yaml
deliver-email-service:
    image: redpencil/deliver-email-service:latest
    environment: 
      MAILBOX_URI: 'http://data.lblod.info/id/mailboxes/1'
```

# Models

## Mailbox

![mailboxStructure](https://user-images.githubusercontent.com/52280338/101146729-a7abc080-361b-11eb-948a-3ee07351c9ce.png)

## Folder

![folderStructure](https://user-images.githubusercontent.com/52280338/98683653-94cc0600-2365-11eb-98f7-cae7c7eb085c.png)

## Email

![emailStructure](https://user-images.githubusercontent.com/22411874/158777581-af48f4ad-af0c-40fc-96ea-f87634d34ce5.png)


## Attachments

Attachments are linked through  `nmo:hasAttachment` property on the email. 
The model of the attachment itself is based on [NEPOMUK](http://oscaf.sourceforge.net/nmo.html#nmo:hasAttachment) and the conventions used for the [mu-semtech/file-service](https://github.com/mu-semtech/file-service).

Note that when using the Graph API to send attachments there's a hard limit of 150 MB per file. The service won't attach larger files to emails. Other size restrictions apply to the total size of the email, these based on the mail provider's settings. In general, 35 MB is the max total size (i.e. the sum size of all the attachments and the email itself) for emails sent via the Graph API

# Example Structure

This service expects a certain structure in the database to exist. By default it searches for an "outbox" folder to find the emails that need to be send, when mails fail to send the service will move them to the "failbox" folder... You can modify this structure in the code as needed but in case you want to use the default, then you can migrate the following file to the database: [Migration file](https://github.com/aatauil/app-deliver-email/blob/master/config/migrations/20190122110800-mailbox-folders.sparql)

If you havent yet worked with the migration service then you can find a detailed explanation on how to migrate a file to your database [HERE](https://github.com/mu-semtech/mu-migrations-service).

The migration file is included by default when using the example/test app: [app-deliver-email](https://github.com/aatauil/app-deliver-email)
When the file has succesfully migrated to your database, then the mailbox & folder structure in the backend should look like this:

![exampleStructure](https://user-images.githubusercontent.com/52280338/98683867-d361c080-2365-11eb-9c4d-7a800f393106.png)

<sup><b>Emails & header boxes are displayed only for illustration purposes. They dont come included in the migration file. There is a usefull query at the bottom of this readme to create (test) emails.</b></sup>

<br> <br>
# Ontology & Prefixes

This deliver-email-service is build around the [Nepomuk Message Ontology](http://oscaf.sourceforge.net/nmo.html)

| Prefix  | URI |
|---|---|
| nmo | http://www.semanticdesktop.org/ontologies/2007/03/22/nmo# |
| nfo | http://www.semanticdesktop.org/ontologies/2007/03/22/nfo# |
| nie | http://www.semanticdesktop.org/ontologies/2007/01/19/nie# |
| dct | http://purl.org/dc/terms/ |
| rlog | http://persistence.uni-leipzig.org/nlp2rdf/ontologies/rlog# |
| task | http://redpencil.data.gift/vocabularies/tasks/ |

<br> <br>
# Environment Variables

The following environment variables can be added to your docker-compose file. You can find the list below sorted by which subject they are closest related to.

<details>
 <summary>Database</summary>

| ENV  | Description | default | required |
|---|---|---|---|
| MAILBOX_URI | Specify the uri of the mailbox that you want to manipulate  | null |X |

</details>

<details>
 <summary>Emails</summary>

| ENV  | Description | default | required |
|---|---|---|---|
| EMAIL_CRON_PATTERN | Pattern describing when a new cron job should trigger. Default: every second of every minute of every first hour of the day. Useful: [cron-pattern-generator](https://crontab.guru/#*/2_*_*_*_*) & [used cron library](https://www.npmjs.com/package/cron#available-cron-patterns). Note that this library uses **6 fields** as opposed to 5, i.e. it has granularity up to 1 second. | * * 1 * * * |
| SECURE_CONNECTION | if true the connection will use TLS when connecting to server. If false (the default) then TLS is used if server supports the STARTTLS extension. In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false  | false |   |
| EMAIL_PROTOCOL | Choose which protocol you want te use to send the e-mails. Available options are "smtp" "MS_Graph_API"  | "smtp" |  |
| HOURS_DELIVERING_TIMEOUT | Timeout after which the service will stop retrying to send the e-mail after it has failed  | 1 |
| HOURS_SENDING_TIMEOUT | Timeout after which emails in the sending box will be either retried or moved to the failbox  | .5 |
| MAX_BATCH_SIZE | Max amount of emails allowed to be send in parallel. Emails in a batch are sent sequentially, there's a wait time between batches | 10 |
| MAX_BATCH_WAIT_TIME | Amount of time (in milliseconds) to wait between batches | 1000 |
| MAX_RETRY_ATTEMPTS | Max amount of times an email will be tried to resend after it fails  | 5 |
| WELL_KNOWN_SERVICE | Specify the email service you will be using to send the emails. Options: [list](https://github.com/redpencilio/deliver-email-service/blob/main/data/node-mailer-services.js) or "test" | " " | x |
| FROM_NAME  | Name that will be displayed to receiver of the e-mail  | " " |
| EMAIL_ADDRESS | E-mail address from sender  | null | unless "test"  |
| EMAIL_PASSWORD | Password from sender (api-key if service is SendGrid)  | null | unless "test"  |
| ERROR_LOGS_GRAPH | Graph where your error logs will be stored | "http://mu.semte.ch/graphs/public" | |
| LOG_ERRORS | If true, will log the error message in the database when an email was send but returned an error | false | |
| HOST | Is the hostname or IP address to connect to.  | null | unless "test" |
| PORT | is the port to connect to (defaults to 587 if "SECURE_CONNECTION" is false or 465 if true)  | null |
| MS_GRAPH_API_CLIENT_ID | Client (or Application) ID of the Microsoft App that will be used to connect with the Graph API | null | if `EMAIL_PROTOCOL="MS_Graph_API"` |
| MS_GRAPH_API_TENANT_ID | Tenant (or Directory) ID of the tenant/Active Directory that hosts the email accounts we will use for sending | null | if `EMAIL_PROTOCOL="MS_Graph_API"` |
| MS_GRAPH_API_CLIENT_SECRET | Client secret value of the Microsoft App | null | if `EMAIL_PROTOCOL="MS_Graph_API"` |
| MS_GRAPH_API_RETRIEVE_WAIT_TIME | the amount of time (in milliseconds) to wait when retrying the fetching of an email | 10000 |

</details>

<details>
 <summary>debugging</summary>

| ENV  | Description | default | required |
|---|---|---|---|
| NODE_ENV  | Choose your node environment. options: "production" or "development"   | "production" | |
| LOG_MS_GRAPH_API_REQUESTS | whether to log all the requests sent to the Microsoft Graph API | false |

</details>

<br> <br>
# Development

This will show you how to setup a development environment so you can take advantage of features and tools like **live reload** & **chrome debugger tool**;


**Optional:**
   You might want to go through the [testing](#testing) section first if you want to test your mails using a temporary mailbox
<br>

<details>
 <summary>Backend</summary>
 
If you already have a backend you want to use for development then you can ignore this, otherwise we have a development backend available that is already configured and has the example structure migrations file to get you up and running quickly. Follow the readme file of the following repo:

[App-deliver-email](https://github.com/aatauil/app-deliver-email)
</details>

<details>
 <summary>Docker-compose</summary>
 
As the image has been build using the [mu-javascript-template](https://hub.docker.com/r/semtech/mu-javascript-template), you will be able to setup a development environment with chrome debugging. To get started quickly, change the deliver-email-service in your docker-compose file to this:

```yaml
  deliver-email-service:
    image: redpencil/deliver-email-service:0.1.3
    ports:
      - 8888:80
      - 9229:9229
    environment:
      MAILBOX_URI: 'http://data.lblod.info/id/mailboxes/1'
      SECURE_CONNECTION: "true"
      NODE_ENV: "development"
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

<sup><b>Don't forget to change WELL_KNOW_SERVICE, EMAIL_ADDRESS, EMAIL_PASSWORD & FROM_NAME to your own + volume paths.</b></sup>

</details>

<br> <br>
# Testing

Testing environment will create a temporary ethereal mailbox where you can inspect the email. <br>
<sup><strong>important to know</strong>: This will not ACTUALLY send the emails. This will only act <strong>as if</strong> the email has been send and received. The specified receiver will not receive the emails nor will the sender actually send the email from their own email address. In reality you can enter any (random) sender email address and (random) receiver address and it will still work.</sup>

<details>
 <summary>Backend</summary>
 
If you already have a backend you want to use for development then you can ignore this, otherwise we have a development backend available that is already configured and has the example structure migrations file to get you up and running quickly. Follow the readme file of the following repo:

[App-deliver-email](https://github.com/aatauil/app-deliver-email)
</details>

<details>
 <summary>Docker-compose</summary>
 
You can easily inspect the mails by changing the WELL_KNOWN_SERVICE in your docker-compose file to "test"
```yaml
  deliver-email-service:
    image: redpencil/deliver-email-service:0.1.3
    environment:
      MAILBOX_URI: 'http://data.lblod.info/id/mailboxes/1'
      WELL_KNOWN_SERVICE: "test"
      FROM_NAME: "RedPencil"
```
When creating an email in the database (see [useful queries](#useful-queries)) the email will go through the same process as it would when sending an email in the non-testing environment. The main difference being that the service will create a temporary generated ethereal mailbox for you where you can view your send emails. At the end of each send email, the logs will display a preview url:

```
> EMAIL 3: Preview url https://ethereal.email/message/123456788abcdefg
```
When clicking on the link you will be redirected to the temporary generated mailbox where you can inspect the contents of the mail.
You do not have to worry about it spamming your own or any other mailbox when the test protocol is set.
</details>
<br> <br>


# REST API

**POST /email-delivery**
Initiate a new email-delivery cycle asynchronously.

Returns **202 Accepted** if the email-delivery process started successfully.

Returns **204 No Content** if the email-delivery got triggered but no emails where found that need to be send.

Returns **500 Bad Request** if something unexpected went wrong while initiating the email-delivery process.

## Useful

<details>
 <summary>Manually triggering the service</summary>
 
 Add the following snippet to your dispatcher file.
 
 ```ruby
  post "/email-delivery/*path" do
    Proxy.forward conn, path, "http://deliver-email-service/email-delivery/"
  end
```

You can now use postman to send a post request to the '/email-delivery' endpoint or you can run the following command in your terminal.

`wget --post-data='' http://localhost/email-delivery/`

<small> Do not forget to remove this before deploying to production </small>


</details>

# Useful Queries

<details>
 <summary>Creating an email</summary>

```
PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>

INSERT DATA {
  GRAPH <http://mu.semte.ch/graphs/system/email> {

    <http://data.lblod.info/id/emails/1> a nmo:Email;
        nmo:messageFrom "johan@redpencil.io";
        nmo:emailTo "niels@redpencil.io";
        nmo:emailCc "erika@redpencil.io";
        nmo:emailBcc "aad@redpencil.io";
        nmo:messageSubject "Email deliver service";
        nmo:plainTextMessageContent "I really like this service! But when encountering bugs, its important           to create an issue in the repo so it can get resolved";
        nmo:sentDate "";
        nmo:isPartOf <http://data.lblod.info/id/mail-folders/2>.
 }
}
```

<sup>You will want to modify <http://data.lblod.info/id/emails/1> after each inserted mail otherwise you will create duplicates. e.g.  <http://data.lblod.info/id/emails/2>,  <http://data.lblod.info/id/emails/3> etc..</sup>

</details>


<details>
 <summary>Tracking mails</summary>
 
 ```

PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
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
 </details>

