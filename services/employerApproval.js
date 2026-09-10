import PortalSettings from "../models/PortalSettings.js";
export const isStaff = (user) =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(user?.email?.toLowerCase());
export async function approvalMode() {
  const settings = await PortalSettings.findById("portal").lean();
  return (
    settings?.employerApprovalMode ||
    (process.env.EMPLOYER_APPROVAL_MODE === "manual" ? "manual" : "auto")
  );
}
export const approvalStatus = (user, mode) =>
  user.employerApproval?.status || (mode === "auto" ? "approved" : "pending");
export async function approvedEmployer(user) {
  return (
    user?.userType === "employer" &&
    approvalStatus(user, await approvalMode()) === "approved"
  );
}
export const staffOnly = (req, res, next) =>
  isStaff(req.user)
    ? next()
    : res.status(403).json({ message: "NCA staff access required" });
