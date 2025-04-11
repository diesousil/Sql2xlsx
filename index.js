import dotenv from "dotenv";
import Sql2Xlsx from "./Sql2Xlsx.js";

const config = dotenv.config().parsed;

if (config.error) {
    throw config.error;
}

//console.log(config);

const sql2xlsx = new Sql2Xlsx(config.DB_HOST, 
                               config.DB_USERNAME, 
                               config.DB_PASSWORD, 
                               config.DB_PORT, 
                               config.DB_NAME);

await sql2xlsx.init();
await sql2xlsx.exportTables();
await sql2xlsx.destroy();