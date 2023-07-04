#!/usr/bin/env node
import { LemmyHttp } from 'lemmy-js-client';
import { srcInstance, destInstance } from './login-data.js';
import ps from 'prompt-sync';

let prompt = ps();

let srcUrl = srcInstance.url;
let srcClient = new LemmyHttp(srcUrl);

// logs into the given lemmy client using the given username and password, prompting for 2fa
async function lemmyLogin(client, username, password) {
  let twofa = prompt("Enter 2FA key (leave blank if 2FA not used): ")
  let loginForm = {
    username_or_email: username,
    password: password,
    totp_2fa_token: twofa
  };
  return await client.login(loginForm).catch((e) => { console.error(e); return false; });
}

async function connect() {
  let srcLogin = await lemmyLogin(srcClient, srcInstance.username_or_email, srcInstance.password);
  
  //console.log(login.jwt);
  let siteData = await srcClient.getSite({auth: srcLogin.jwt}).catch((e) => { console.error(e); return false; });
  let userData = siteData.my_user;

  //lists communities source user is subscribed to
  console.log("--" + userData.local_user_view.person.name + "'s subscribed communities on " + srcUrl + "--");
  for (const i of userData.follows) {
    console.log(fetchCommunityName(i.community));
  }
}

// Returns the name of the community in the format of community@instance, e.g. "asklemmy@lemmy.ml"
function fetchCommunityName(cmnt) {
  let cName = cmnt.name;
  let cURL = new URL(cmnt.actor_id);
  let cInst = cURL.hostname;

  return cName + "@" + cInst;
}

connect();
