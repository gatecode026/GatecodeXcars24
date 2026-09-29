import http from "node:http";
import https from "node:https";

const url = "https://bpo-management-server.onrender.com/uploads/1784006067777-WhatsApp_Image_2026-07-13_at_5.51.19_PM.jpeg";

console.log(`Checking URL: ${url}`);

https.get(url, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log("Headers:", res.headers);
}).on("error", (e) => {
  console.error("Error:", e);
});
