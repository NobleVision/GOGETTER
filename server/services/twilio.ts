import { ENV } from "../_core/env";

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

function basicAuth(): string {
  const sid = ENV.twilioSid;
  const token = ENV.twilioAuthToken;
  if (!sid || !token) {
    throw new Error("TWILIO_SID and TWILIO_AUTH_TOKEN must be configured");
  }
  return "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
}

function accountSid(): string {
  return ENV.twilioSid;
}

async function twilioFetch<T>(
  path: string,
  init: { method?: string; body?: URLSearchParams } = {},
): Promise<T> {
  const url = `${TWILIO_API_BASE}/Accounts/${accountSid()}${path}`;
  const response = await fetch(url, {
    method: init.method ?? "POST",
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: init.body,
  });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    // keep as text
  }
  if (!response.ok) {
    throw new Error(
      `Twilio API ${init.method ?? "POST"} ${path} failed: ${response.status} ${response.statusText} — ${text.slice(0, 500)}`,
    );
  }
  return parsed as T;
}

export type TwilioCallResource = {
  sid: string;
  status: string;
  to: string;
  from: string;
  direction: string;
  date_created?: string;
  start_time?: string;
  end_time?: string;
  duration?: string;
  price?: string;
  price_unit?: string;
};

export async function placeOutboundCall(input: {
  toNumber: string;
  fromNumber?: string;
  twimlUrl?: string;
  twimlBin?: string;
  statusCallback?: string;
  machineDetection?: "Enable" | "DetectMessageEnd";
}): Promise<TwilioCallResource> {
  const form = new URLSearchParams();
  form.set("To", input.toNumber);
  form.set("From", input.fromNumber ?? ENV.twilioPhoneNumber);

  if (input.twimlUrl) {
    form.set("Url", input.twimlUrl);
  } else if (input.twimlBin) {
    form.set("Twiml", input.twimlBin);
  } else {
    form.set(
      "Twiml",
      "<Response><Say voice=\"alice\">GoGetterOS assistant connecting, please hold.</Say></Response>",
    );
  }

  if (input.statusCallback) form.set("StatusCallback", input.statusCallback);
  if (input.machineDetection) {
    form.set("MachineDetection", input.machineDetection);
  }

  return twilioFetch<TwilioCallResource>(`/Calls.json`, {
    method: "POST",
    body: form,
  });
}

export async function hangUpCall(callSid: string): Promise<TwilioCallResource> {
  const form = new URLSearchParams();
  form.set("Status", "completed");
  return twilioFetch<TwilioCallResource>(`/Calls/${callSid}.json`, {
    method: "POST",
    body: form,
  });
}

export async function getCall(callSid: string): Promise<TwilioCallResource> {
  return twilioFetch<TwilioCallResource>(`/Calls/${callSid}.json`, {
    method: "GET",
  });
}

export function twilioConfigured(): boolean {
  return Boolean(ENV.twilioSid && ENV.twilioAuthToken && ENV.twilioPhoneNumber);
}

export async function synthesizeTwimlSay(text: string): Promise<string> {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<Response><Say voice="alice">${escaped}</Say></Response>`;
}
