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
  let srcUnameFull = makeFullName(userData.local_user_view.person.name, srcUrl)
  console.log("\n--" + srcUnameFull + "'s subscribed communities" + "--");
  let subbed = [];
  for (const i of userData.follows) {
    let cName = fetchFullName(i.community);
    console.log(cName);
    subbed.push(cName);
  }

  // ask the destination user to subscribe to source user's instances
  let destUnameFull = makeFullName(destInstance.username_or_email, destUrl);
  let doSubscribe = yesNoCheck(prompt("\nSubscribe to instances on " + destUnameFull + "? (Y/n): "));

  // if yes, subscribe to all instances on list if possible
  if (doSubscribe) {
    for (const i of subbed) {
      try {
        // get ID of community
        let comm = await destClient.getCommunity({name: i});
        let commId = comm.community_view.community.id;

        // subscribe
        await destClient.followCommunity({auth: destLogin.jwt, community_id: commId, follow: true});
        console.log("Subscribing to " + i + "...");

      } catch (e) {
        console.error("Error while subscribing to " + i + ": " + e);
      }
    }
  }

  // gets user settings from source
  let susForm = {
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

  // prompt to import settings
  console.log("\n--" + srcUnameFull + "'s settings" + "--");
  console.log(susForm)
  let changeSettings = yesNoCheck(prompt("Apply settings to " + destUnameFull + "? (Y/n): "));

  // if yes, import settings
  if (changeSettings) {
    susForm.auth = destLogin.jwt;
    try {
      await destClient.saveUserSettings(susForm);
      console.log("User settings applied!")
    } catch (e) {
      console.error("Error while applying settings: " + e);
    }
  }

  // prompt to block users and communities
  console.log("\n--" + srcUnameFull + "'s blocks--");
  console.log("Blocked communities: " + userData.community_blocks.length + ", Blocked users: " + userData.person_blocks.length);
  let confirmBlock = yesNoCheck(prompt("Block users on " + destUnameFull + "? (Y/n): "));

  // if yes, block
  if (confirmBlock) {
    // block communities
    let cBlockCnt = 0;

    for (const i of userData.community_blocks) {
      try {
      let cName = fetchFullName(i.community)
      let comm = await destClient.getCommunity({name: cName});
      let commId = comm.community_view.community.id;

      await destClient.blockCommunity({auth: destLogin.jwt, community_id: commId, block: true});
      cBlockCnt++;
      } catch (e) {
        console.error("Error while blocking an account: " + e);
      }
    }

    console.log("Blocked " + cBlockCnt + "/" + userData.community_blocks.length + " communities");

    // block users
    let pBlockCnt = 0;

    for (const i of userData.person_blocks) {
      try {
      let pName = fetchFullName(i.target);
      let person = await destClient.getPersonDetails({username: pName});
      let personId = person.person_view.person.id;

      await destClient.blockPerson({auth: destLogin.jwt, person_id: personId, block: true});
      pBlockCnt++;
      } catch (e) {
        console.error("Error while blocking a user: " + e);
      }
    }

    console.log("Blocked " + pBlockCnt + "/" + userData.person_blocks.length + " users");
  }
}

connect();
