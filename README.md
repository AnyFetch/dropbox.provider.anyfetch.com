# Google Contact Cluestr Provider
> Visit http://cluestr.com for details about Cluestr.

Cluestr provider for contacts stored in Google Contacts.

# How to install?
Vagrant up everything (`vagrant up`, `vagrant ssh`).

You'll need to define some environment variables

```shell
# Go to https://code.google.com/apis/console/b/0/?pli=1#access to ask from app id and secret
export GOOGLE_CONTACTS_ID={google-app-id}
export GOOGLE_CONTACTS_SECRET={google-app-secret}

# Callback after google consent, most probably http://your-host/init/callback
export GOOGLE_CONTACTS_CALLBACK_URL={callback-after-google-consent}

# Cluestr app id and secret
export GOOGLE_CONTACTS_CLUESTR_ID={cluestr-app-id}
export GOOGLE_CONTACTS_CLUESTR_SECRET={cluestr-app-secret}

# See below for details
export GOOGLE_CONTACTS_TEST_REFRESH_TOKEN={refresh-token}
```

# How does it works?
Cluestr Core will call `/init/connect` with cluestr authorization code. The user will be transparently redirected to Google consentment page.
Google will then call us back on `/init/callback` with a `code` parameter. We'll trade the `code` for an `access_token` and a `refresh_token` and store it in the database, along with Cluestr tokens.

We can now sync datas between Google and Cluestr.

This is where the `upload` helper comes into play.
Every time `upload` is called, the function will retrieve, for all the accounts, the contacts modified since the last run, and upload the datas to Cluestr.
Deleted contacts will also be deleted from Cluestr.

# How to test?
Unfortunately, testing this module is really hard.
This project is basically a simple bridge between Google and Cluestr, so testing requires tiptoeing with the network and Google Server / Cluestr server.

Before running the test suite, you'll need to do:

```
> node test-auth.js
```

Follow the link in your browser with your Google Account. You'll be redirected to `localhost` (server is not running, so you'll get an error). Copy-paste the `code` parameter in your shell (in the URL, after /init/callback), then save the token as GOOGLE_CONTACTS_TEST_REFRESH_TOKEN environment variable.

> Warning: a refresh token is only displayed once. If you get it wrong for some reason, you'll need to clear the permission for your app on https://www.google.com/settings/u/1/security

Support: `support@papiel.fr`.
