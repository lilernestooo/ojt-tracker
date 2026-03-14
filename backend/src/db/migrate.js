require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pool = require("./index");

async function migrate() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "migrate.sql"),
      "utf8"
    );

    await pool.query(sql);

    console.log("✅ Migration completed");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    process.exit();
  }
}

migrate();