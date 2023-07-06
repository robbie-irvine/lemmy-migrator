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

function makeFullName(prefix, atUrl) {
  return prefix + "@" + (new URL(atUrl)).hostname;
}

// Returns the name of the community/user in the format of name@instance, e.g. "asklemmy@lemmy.ml"
function fetchFullName(cmnt) {
  let cName = cmnt.name; // community name
  let cURL = new URL(cmnt.actor_id); // url of community; domain is extracted from this

  return makeFullName(cName, cURL);
}

// y = True, "" = True, other values = false
function yesNoCheck(input) {
  return input === "" || input[0].toLowerCase() === "y";
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
  console.log("\n--" + makeFullName(userData.local_user_view.person.name, srcUrl) + "'s subscribed communities" + "--");
  for (const i of userData.follows) {
    console.log(fetchFullName(i.community));
  }

  // ask the destination user to subscribe to source user's instances
  let destUnameFull = makeFullName(destInstance.username_or_email, destUrl);
  let doSubscribe = yesNoCheck(prompt("\nSubscribe to instances on " + destUnameFull + "? (Y/n): "));

  //TODO: if yes, subscribe to all instances on list if possible 

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

  //TODO: prompt to import settings
  console.log(susForm)
  susForm.auth = destLogin.jwt;

  //TODO: if yes, import settings

  //gets blocked communities from source
  for (const i of userData.community_blocks) {
    console.log(fetchFullName(i.community));
  }

  //gets blocked users from source
  for (const i of userData.person_blocks) {
    console.log(fetchFullName(i.target));
  }

  //TODO: prompt to block users and communities
  //TODO: if yes, block

}

connect();
