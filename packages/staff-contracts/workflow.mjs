export const DAY = 86_400_000;
export function feedbackDeadline(scheduledAt) {
  return new Date(Date.parse(scheduledAt) + DAY).toISOString();
}
export function followupState(task, now = new Date().toISOString()) {
  const deadline = Date.parse(task.scheduledAt) + DAY;
  if (task.completedAt)
    return Date.parse(task.completedAt) > deadline
      ? "completed_late"
      : "completed";
  const time = Date.parse(now);
  return time < Date.parse(task.scheduledAt)
    ? "upcoming"
    : time > deadline
      ? "overtime"
      : "due";
}
export function taskState(task, now = new Date().toISOString()) {
  return ["completed", "cancelled"].includes(task.status)
    ? task.status
    : Date.parse(now) > Date.parse(task.deadlineAt)
      ? "overdue"
      : task.status;
}
export function normalizePhone(raw) {
  let number = String(raw).replace(/[^0-9]/g, "");
  if (number.startsWith("00")) number = number.slice(2);
  if (/^07\d{8}$/.test(number)) number = `93${number.slice(1)}`;
  if (!/^937\d{8}$/.test(number))
    throw new Error("Enter a valid Afghan mobile number.");
  return `+${number}`;
}
export function createSerial(agentId, sequence) {
  if (
    !Number.isSafeInteger(agentId) ||
    agentId < 1 ||
    !Number.isSafeInteger(sequence) ||
    sequence < 1
  )
    throw new Error("Invalid serial counter.");
  return `CA${String(agentId).padStart(2, "0")}-L${sequence}`;
}
export function validateFeedback(input, role, now = new Date().toISOString()) {
  if (!["followup", "visit", "closed", "lost"].includes(input.outcome))
    throw new Error("Select an outcome.");
  if (input.outcome === "closed") {
    if (role !== "sales")
      throw new Error("Only a sales agent can close a deal.");
    if (
      !/^\d{1,12}(\.\d{1,2})?$/.test(String(input.amount)) ||
      Number(input.amount) <= 0
    )
      throw new Error(
        "Enter a positive deal amount with at most two decimals.",
      );
    if (!["AFN", "USD"].includes(input.currency))
      throw new Error("Choose deal currency.");
  } else if (input.outcome === "lost") {
    if (!String(input.reason || "").trim())
      throw new Error("A loss reason is required.");
  } else {
    if (!String(input.notes || "").trim())
      throw new Error("Feedback is required.");
    if (
      !Number.isFinite(Date.parse(input.nextScheduledAt)) ||
      Date.parse(input.nextScheduledAt) <= Date.parse(now)
    )
      throw new Error("Choose a next follow-up date and time in the future.");
    if (!Number.isInteger(input.nextAssigneeId) || input.nextAssigneeId < 1)
      throw new Error("Select the next agent.");
  }
  return input;
}
