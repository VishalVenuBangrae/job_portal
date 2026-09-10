import { readFileSync } from "node:fs";
// Disposable local preview. Never reads or connects to the deployment database.
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
process.env.NODE_ENV = "test";
process.env.ADMIN_EMAILS = "admin@example.test";
process.env.JWT_SECRET = "disposable-preview-secret-not-for-deployment-123";
process.env.MONGOMS_DOWNLOAD_DIR = fileURLToPath(
  new URL("../../../work/mongodb-binaries/", import.meta.url),
);
const { app } = await import("../server.js");
const { default: User } = await import("../models/User.js");
const { default: Job } = await import("../models/Job.js");
const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());
const password = "PreviewOnly123!";
const employer = await User.create({
  name: "Alex Morgan",
  email: "employer@example.test",
  phone: "+15550101000",
  password,
  userType: "employer",
  emailVerified: true,
  vessel: { name: "Demo Vessel", callSign: "DEMO" },
});
await User.create({
  name: "NCA Admin",
  email: "admin@example.test",
  phone: "+15550101999",
  password,
  userType: "employer",
  emailVerified: true,
  vessel: { name: "NCA Administration", callSign: "ADMIN" },
  employerApproval: { status: "approved", source: "staff" },
});
const doc = {
  data: Buffer.from("%PDF-1.4\nDemo document only\n%%EOF"),
  contentType: "application/pdf",
  originalName: "demo-document.pdf",
};
for (const [i, name, position] of [
  [0, "Emma Reed", "Interior"],
  [1, "James Wilson", "Deckhand"],
  [2, "Sofia Martin", "Chef"],
  [3, "Oliver Brown", "Deckhand"],
]) {
  await User.create({
    name,
    email: i === 0 ? "crew@example.test" : `crew${i}@example.test`,
    phone: "+15550101001",
    password,
    userType: "jobseeker",
    emailVerified: true,
    crewProfile: {
      firstName: name.split(" ")[0],
      lastName: name.split(" ")[1],
      profileComplete: true,
      profileStatus: "active",
      profileLastActive: new Date(),
      positions: [position],
      primaryPosition: position,
      currentLocation: {
        city: "Fort Lauderdale",
        country: "United States",
        port: "Port Everglades",
        displayName: "Fort Lauderdale, United States",
      },
      duration: "3 days",
      nationality: "US",
      travelKm: 30,
      availability: { mode: "now" },
      workTypes: ["Daywork", "Freelance"],
      workEligibilityCountries: ["United States"],
      yachtSize: "30–50 m",
      dayRate: "USD 180 / day · negotiable",
      contactPreferences: ["email", "phone"],
      experience: ["1 year +"],
      keywords: [
        "Washdown",
        "Detailing",
        "Laundry",
        "Turnaround",
        "Crew cooking",
      ],
      documents: {
        photo: {
          data: readFileSync(
            new URL("../public/images/nca-logo.png", import.meta.url),
          ),
          contentType: "image/png",
          originalName: "sample-logo-photo.png",
        },
        cv: doc,
        stcw: doc,
        eng1: doc,
        passport: doc,
        references: doc,
      },
    },
  });
}
for (const [title, position, department, tags, crewNeeded] of [
  [
    "Deckhand · turnaround support",
    "Deckhand",
    "Deck",
    ["Washdown", "Detailing"],
    2,
  ],
  [
    "Interior dayworker · guest preparation",
    "Interior",
    "Interior",
    ["Laundry", "Turnaround"],
    1,
  ],
  [
    "Crew cook · temporary galley support",
    "Chef",
    "Galley",
    ["Crew cooking"],
    1,
  ],
]) {
  await Job.create({
    title,
    position,
    department,
    tags,
    crewNeeded,
    employer: employer._id,
    location: {
      country: "United States",
      city: "Fort Lauderdale",
      port: "Port Everglades",
      displayName: "Fort Lauderdale, United States",
    },
    description:
      "Sample opportunity in the disposable preview. Assist the crew with a busy turnaround. Daily hours and final rate to be agreed before starting.",
    salary: "USD 180–220 / day",
    jobType: "Daywork",
    vesselFlag: "Foreign Flagged",
    startDate: new Date(Date.now() + 86400000),
    endDate: new Date(Date.now() + 4 * 86400000),
    requiredCertificates: ["stcw", "eng1"],
  });
}
const server = app.listen(8080, "127.0.0.1", () =>
  console.log(
    "Disposable preview: http://127.0.0.1:8080 · employer@example.test or crew@example.test · PreviewOnly123!",
  ),
);
const close = async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
};
process.on("SIGINT", close);
process.on("SIGTERM", close);
