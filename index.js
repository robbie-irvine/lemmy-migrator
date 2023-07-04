#!/usr/bin/env node
import { LemmyHttp } from 'lemmy-js-client';
import { srcInstance, destInstance } from './login-data.js';
import ps from 'prompt-sync';

let prompt = ps();

let srcUrl = srcInstance.url;
let srcClient = new LemmyHttp(srcUrl);

let destUrl = destInstance.url;
let destClient = new LemmyHttp(destUrl);

// logs into the given lemmy client using the given username and password, prompting for 2fa
async function lemmyLogin(client, username, password, url) {
  console.log("Logging into " + username + "@" + (new URL(url)).hostname);

  // constructs login form
  let twofa = prompt("Enter 2FA key (leave blank if 2FA not used): ")
  let loginForm = {
    username_or_email: username,
    password: password,
    totp_2fa_token: twofa
  };

  // returns login promise
  return client.login(loginForm);
}

// Returns the name of the community in the format of community@instance, e.g. "asklemmy@lemmy.ml"
function fetchFullName(cmnt) {
  let cName = cmnt.name; // community name
  let cURL = new URL(cmnt.actor_id); // url of community; domain is extracted from this
  let cInst = cURL.hostname; // domain name of instance

  return cName + "@" + cInst;
}

// Main asynchronous function
async function connect() {
  // login to source and destination instances
  let srcLogin; let destLogin;
  try {
    srcLogin = await lemmyLogin(srcClient, srcInstance.username_or_email, srcInstance.password, srcUrl);
    destLogin = await lemmyLogin(destClient, destInstance.username_or_email, destInstance.password, destUrl);
  } catch (e) {
    console.error(e);
    return false;
  }
  
  //gathers source user's data to be copied over to the destination user
  let siteData = await srcClient.getSite({auth: srcLogin.jwt}).catch((e) => { console.error(e); return false; });
  let userData = siteData.my_user;

  //lists communities source user is subscribed to
  console.log("--" + userData.local_user_view.person.name + "'s subscribed communities on " + srcUrl + "--");
  for (const i of userData.follows) {
    console.log(fetchFullName(i.community));
  }

  // ask the destination user to subscribe to source user's instances
  let destUnameFull = destInstance.username_or_email + "@" + (new URL(destUrl).hostname);
  let doSubscribeP = prompt("Subscribe to instances on " + destUnameFull + "? (Y/n): ");
  let doSubscribe = doSubscribeP === "" || doSubscribeP[0].toLowerCase() === "y"; // y = True, "" = True, other values = false

  //gets user settings from source
  let susForm = {
    bio: userData.local_user_view.person.bio,
    bot_account: userData.local_user_view.person.bot_account,
    default_listing_type: userData.local_user_view.local_user.default_listing_type,
    default_sort_type: userData.local_user_view.local_user.default_sort_type,
    discussion_languages: userData.discussion_languages,
    interface_language: userData.local_user_view.local_user.interface_language,
    send_notifications_to_email: userData.local_user_view.local_user.send_notifications_to_email,
    show_avatars: userData.local_user_view.local_user.show_avatars,
    show_bot_accounts: userData.local_user_view.local_user.show_bot_accounts,
    show_new_post_notifs: userData.local_user_view.local_user.show_new_post_notifs,
    show_nsfw: userData.local_user_view.local_user.show_nsfw,
    show_read_posts: userData.local_user_view.local_user.show_read_posts,
    show_scores: userData.local_user_view.local_user.show_scores,
    theme: userData.local_user_view.local_user.theme
  }

  console.log(susForm)
  susForm.auth = destLogin.jwt;

  //gets blocked communities from source
  for (const i of userData.community_blocks) {
    console.log(fetchFullName(i.community));
  }

  //gets blocked users from source
  for (const i of userData.person_blocks) {
    console.log(fetchFullName(i.target));
  }
}

connect();
