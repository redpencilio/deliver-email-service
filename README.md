
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


## Docker-compose **build service file and add image name

To use the service add the following to your docker-compose.yml file

```yaml 
deliver-email-service:
    image: Need-to-be-made-created!!
    labels:
        - "logging=true"
    restart: always
```

## Mailbox Structure *fix sparql file

This service relies on the backend having the right structure so it can look in the sendbox folder for emails to be send and if they fail while sending, move them to the failbox folder. If you do no have a mailbox structure in the backend then you will have to migrate the following file [HERE](assets\20190122110800-mailbox-folders.sparql) to your backend using the [Migration Service](https://github.com/mu-semtech/mu-migrations-service).

When the file has succesfully migrated to your backend you should you should have a mailbox structure that looks like this:


![browsermode](assets/mailbox-structure.png)


> Emails + header boxes are displayed only for illustration purposes & are NOT included in the migration file by default.


# Environment Variables

The following environment variables can be added to your docker-compose file. You can find the list below sorted by which subject they are closest related. All these environment variables are meant to be added under the email-delivery-service in your docker-compose file. 

## Database

| ENV  | Description | default |
|---|---|---|
| GRAPH_NAME | Specify the graph that you want to manipulate  | "http://mu.semte.ch/graphs/system/email"  |
| MAILFOLDER_URI | Specify the uri of the mailfolder that you want to manipulate  | "http://data.lblod.info/id/mailboxes/1"  |


## Email *

| ENV  | Description | default |
|---|---|---|
| SECURE_CONNECTION  | if true the connection will use TLS when connecting to server. If false (the default) then TLS is used if server supports the STARTTLS extension. In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false  | "false"  |
| EMAIL_PROTOCOL  | Choose which protocol you want te use to send the e-mails. Options: "smtp" or "rest"   | null |
| HOURS_DELIVERING_TIMEOUT  | NEED CHANGE *  | 1 |
| WELL_KNOWN_SERVICE_OR_SERVER  | Specify the email service you will be using to send the emails. Options: [list](https://nodemailer.com/smtp/well-known/) or "server"  | null |
| FROM_NAME  | Name that will be displayed to receiver of the e-mail  | null |
| EMAIL_ADDRESS | E-mail address from sender  | null |
| EMAIL_PASSWORD | Password from sender  | null |
| HOST | Is the hostname or IP address to connect to.  | "localhost" |
| PORT | is the port to connect to (defaults to 587 if "SECURE_CONNECTION" is false or 465 if true)  | 587 |

## Debugging *

TODO*


# Development

## Optional
    You might want to dev


# Testing





