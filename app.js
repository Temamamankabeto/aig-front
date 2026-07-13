/**
 * cPanel/Passenger startup entry for the Next.js standalone server.
 * Configure the cPanel Node.js Application startup file as: app.js
 */
process.env.NODE_ENV = "production";
process.env.HOSTNAME = "0.0.0.0";

require("./server.js");
