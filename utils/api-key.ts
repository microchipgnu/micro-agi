const OPENAI_LS_KEY = "OPENAI_API_KEY";

export function getAPIKey() {
    return ""
    //return window.localStorage.getItem(OPENAI_LS_KEY);
}

export function setAPIKey(apiKey: string) {
    return 
    //window.localStorage.setItem(OPENAI_LS_KEY, apiKey);
}