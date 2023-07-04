#!/usr/bin/env node
import { LemmyHttp } from 'lemmy-js-client';
import { source_instance, destination_instance } from './login-data.js';
import ps from 'prompt-sync';

let prompt = ps();

let baseUrl = source_instance.url;
let client = new LemmyHttp(baseUrl);

async function connect() {
  let twofa = prompt("Enter 2FA key (leave blank if 2FA not used): ")
  let loginForm = {
    username_or_email: source_instance.username_or_email,
    password: source_instance.password,
    totp_2fa_token: twofa
  };
  
  let login = await client.login(loginForm).catch((e) => { console.error(e); return false; });
  
  //console.log(login.jwt);
  let siteData = await client.getSite({auth: login.jwt}).catch((e) => { console.error(e); return false; });
  let userData = siteData.my_user;

  //lists communities source user is subscribed to
  console.log("--" + userData.local_user_view.person.name + "'s subscribed communities on " + baseUrl + "--");
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
