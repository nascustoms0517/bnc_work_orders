import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = process.env.TWILIO_PHONE_NUMBER;

// Send an SMS — wraps Twilio in try/catch so it never crashes the server
export async function sendSMS(to, body) {
  try {
    const msg = await client.messages.create({ from: FROM, to, body });
    console.log(`SMS sent to ${to} — SID: ${msg.sid}`);
    return true;
  } catch (err) {
    console.error(`SMS failed to ${to}:`, err.message);
    return false;
  }
}

// Opt-in invite — sent when a new job is created
export async function sendOptInInvite(to, customerName) {
  const body = `Hi ${customerName}! This is Bonnie & Clyde Stereo. Reply START to receive updates about your vehicle service. Reply STOP to opt out. Msg & data rates may apply.`;
  return sendSMS(to, body);
}

// Check-in confirmation — sent after customer opts in
export async function sendCheckIn(to, customerName, year, make, model) {
  const body = `Hi ${customerName}, your ${year} ${make} ${model} has been checked in at Bonnie & Clyde Stereo. We'll text you when it's ready! Reply STOP to unsubscribe.`;
  return sendSMS(to, body);
}

// Ready for pickup
export async function sendReadyNotification(to, customerName, year, make, model) {
  const body = `Hi ${customerName}, your ${year} ${make} ${model} is ready for pickup at Bonnie & Clyde Stereo! See you soon. Reply STOP to unsubscribe.`;
  return sendSMS(to, body);
}

// Tech assignment notification
export async function sendTechAssignment(to, techName, jobNumber, customerName, year, make, model) {
  const body = `Hi ${techName}, Job #${jobNumber} assigned to you: ${year} ${make} ${model} for ${customerName}.`;
  return sendSMS(to, body);
}

// Handle inbound STOP/START/HELP replies
export function handleInboundSMS(body) {
  const msg = body.trim().toUpperCase();
  if (msg === 'STOP') return 'You have been unsubscribed from Bonnie & Clyde Stereo messages. Reply START to resubscribe.';
  if (msg === 'START') return 'You are now subscribed to Bonnie & Clyde Stereo service updates. Reply STOP to unsubscribe anytime.';
  if (msg === 'HELP') return 'Bonnie & Clyde Stereo: Reply STOP to unsubscribe, START to resubscribe. Msg & data rates may apply. Support: (your shop number here).';
  return null;
}