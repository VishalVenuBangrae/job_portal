export const endpoint = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (e) {
    next(e);
  }
};
export const fail = (status, message) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
export function sendDocument(res, doc) {
  if (!doc?.data) fail(404, "Document not found");
  res.set({
    "Content-Type": doc.contentType || doc.mimetype || "application/pdf",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.originalName || "document.pdf")}`,
    "Cache-Control": "private, no-store",
  });
  res.send(doc.data);
}
export const escapeHtml = (s) =>
  String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
