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
  console.log("Login for " + username + "@" + (new URL(url)).hostname);

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
function fetchCommunityName(cmnt) {
  let cName = cmnt.name;
  let cURL = new URL(cmnt.actor_id);
  let cInst = cURL.hostname;

  return cName + "@" + cInst;
}

// Main asynchronous function
async function connect() {
  let srcLogin = await lemmyLogin(srcClient, srcInstance.username_or_email, srcInstance.password, srcUrl)
  .catch((e) => { console.error(e); return false; });
  
  //console.log(login.jwt);
  let siteData = await srcClient.getSite({auth: srcLogin.jwt}).catch((e) => { console.error(e); return false; });
  let userData = siteData.my_user;

  //lists communities source user is subscribed to
  console.log("--" + userData.local_user_view.person.name + "'s subscribed communities on " + srcUrl + "--");
  for (const i of userData.follows) {
    console.log(fetchCommunityName(i.community));
  }

  
}

connect();
