#!/usr/bin/env node
import { LemmyHttp } from 'lemmy-js-client';
import { source_instance, destination_instance } from './login-data.js';

let baseUrl = source_instance.url;
let client = new LemmyHttp(baseUrl);
let loginForm = {
  username_or_email: source_instance.username_or_email,
  password: source_instance.password
};

async function connect() {
    //TODO: add 2FA to console prompt
    let login = await client.login(loginForm).catch((e) => { console.error(e); return false; });
    
    console.log(login.jwt)
}

connect()
