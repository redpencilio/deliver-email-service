# CHANGELOG
## 1.0.1 (2026-05-21)
- Fix an issue in the retry mechanism

> [!WARNING] 
> If your app has any mails stuck in the "sending" folder, they will be retried again after deploying this update. Make sure you move any old mails to the failed folder before that.

## 1.0.0 (2025-04-09)
- Fix env variable collision with javascript template, rename `PORT` and `HOST` to `EMAIL_PORT` and `EMAIL_HOST`
## 0.4.1 (2025-04-02)
- Improve int parsing for email retry counts.
- Update woodpecker configuration.
- Remove `.rc` tag from `mu-auth-sudo` in `package.json`

## 0.2.0
- Add Error logging capability