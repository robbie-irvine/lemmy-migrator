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
    
    console.log(login.jwt);
}

connect()
