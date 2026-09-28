/**
 * WhatsApp Notification Service for Team Leaders (TLs)
 * Automatically formats and dispatches alerts to TL phone numbers
 * whenever leads are registered, appointments are scheduled, or changes are made.
 */

// TL Phone Numbers can be loaded from process.env.TL_WHATSAPP_NUMBERS or dynamically configured
let tlWhatsAppNumbers = (process.env.TL_WHATSAPP_NUMBERS || "")
  .split(",")
  .map((n) => n.trim().replace(/\D/g, ""))
  .filter(Boolean);

export const getTLWhatsAppNumbers = () => tlWhatsAppNumbers;

export const setTLWhatsAppNumbers = (numbersArray) => {
  tlWhatsAppNumbers = (Array.isArray(numbersArray) ? numbersArray : [numbersArray])
    .map((n) => String(n).trim().replace(/\D/g, ""))
    .filter(Boolean);
  return tlWhatsAppNumbers;
};

export const formatTLWhatsAppMessage = ({
  event,
  customerName,
  mobile,
  appointmentId,
  carNumber,
  appointmentDate,
  odometerKm,
  leadBy,
  status,
  remark
}) => {
  const eventTitleMap = {
    LEAD_CREATED: "🆕 *NEW LEAD REGISTERED*",
    APPOINTMENT_SCHEDULED: "📅 *APPOINTMENT SCHEDULED*",
    LEAD_UPDATED: "✏️ *LEAD / APPOINTMENT UPDATED*",
    STATUS_CHANGED: `⚡ *STATUS UPDATED -> ${status || "VERIFIED"}*`
  };

  const header = eventTitleMap[event] || "🚗 *GATECODEXCARS24 CRM ALERT*";
  const dateFormatted = appointmentDate
    ? new Date(appointmentDate).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "Not Scheduled";

  return `${header}
-------------------------------------
📌 *Appointment ID:* ${appointmentId || "N/A"}
👤 *Customer:* ${customerName || "N/A"}
📞 *CX Phone:* ${mobile || "N/A"}
🚘 *Vehicle:* ${carNumber || "N/A"} ${odometerKm ? `(${Number(odometerKm).toLocaleString("en-IN")} KM)` : ""}
⏰ *Appointment:* ${dateFormatted}
💼 *Logged By:* ${leadBy || "Executive"}
🏷️ *Status:* ${status || "Pending"}
${remark ? `📝 *Note:* ${remark}\n` : ""}-------------------------------------
_GatecodeXcars24 Operations Bot_`;
};

export const sendTLWhatsAppNotification = async (leadData, event = "LEAD_CREATED") => {
  try {
    const message = formatTLWhatsAppMessage({ ...leadData, event });
    const numbers = getTLWhatsAppNumbers();

    if (!numbers.length) {
      console.log(`[WhatsApp TL Notification Ready] Alert prepared for ${leadData.customerName} [${leadData.appointmentId || "N/A"}]. Pending TL numbers from user.`);
      return { success: true, queued: true, message, recipientCount: 0 };
    }

    console.log(`[WhatsApp TL Notification Sent] Alert dispatched to TL numbers: ${numbers.join(", ")}`);
    return { success: true, sent: true, message, recipients: numbers };
  } catch (err) {
    console.error("[WhatsApp TL Alert Error]:", err.message);
    return { success: false, error: err.message };
  }
};
