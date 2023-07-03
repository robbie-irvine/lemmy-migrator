// Copy and rename this file to "login-data.js" to have it recognised in the script!
// Be careful not to add sensitive data to the template if you are pushing changes

// The Lemmy instance you are taking your user data from
let source_instance = {
    username_or_email: "",
    password: "",
    totp_2fa_token: "", // Leave this blank if you don't use 2fa
    url: "https://"
}

// The Lemmy instance you are copying your user data to
let destination_instance = {
    username_or_email: "",
    password: "",
    totp_2fa_token: "", // Leave this blank if you don't use 2fa
    url: "https://"
}

export { source_instance, destination_instance };