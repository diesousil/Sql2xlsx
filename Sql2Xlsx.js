import mariadb from "mariadb";
import excel4node from "excel4node";
import fs from "fs";

export default class Sql2Xlsx {
    
    constructor(host, username, password, port, dbName) {
        this.host = host;
        this.username = username;
        this.password = password;
        this.port = port;
        this.dbName = dbName;
    
    }

    async init() {
        this.connection = await this.connect();
    }
    
    async connect() {
        return mariadb.createConnection({
            host: this.host, 
            user: this.username, 
            password: this.password,
            port: this.port,
            database: this.dbName
       });
    }

    async getSelect(query) {
        return await this.connection.query(
            query,
            (err,res,meta) => {
               if (err) {
                  console.error("Error querying data: ", err);
               } else {
                  console.log(res);
                  console.log(meta);
               }
            }
        );

    }

    async getTables() {
        return await this.getSelect("SHOW TABLES;");
    }

    async getTableComment(tableName) {
        const query = "SELECT table_comment "+
                      "FROM INFORMATION_SCHEMA.TABLES "+
                      "WHERE table_schema='"+this.dbName+"'" +
                      "AND table_name='"+tableName+"'";
        
        return await this.getSelect(query);

    }

    async getColumns(tableName) {
        const query = "SHOW FULL COLUMNS from "+ tableName + ";";
        
        return await this.getSelect(query);
    }

    async getData(tableName) {
        const query = "SELECT * FROM "+ tableName + " ORDER BY 1 ASC;";
        
        return await this.getSelect(query);
    }

    fillHeader(workbook, worksheet, columns) {
        var headerStyle = workbook.createStyle({
            font: {
                color: '#00FF00',
                backgrouncColor: '#000000',
                size: 12,
                bold: true
            }
        });  

        for(let i=0;i<columns.length;i++) {
            
            worksheet.cell(1,i+1).string(columns[i].Field).style(headerStyle);
            worksheet.cell(2,i+1).string(columns[i].Comment).style(headerStyle);
        }
    }

    fillData(workbook, worksheet, data) {
        var style = workbook.createStyle({
            font: {
                color: '#000000',
                size: 10
            },
            numberFormat: '$#,##0.00; ($#,##0.00); -'
        });
        
        for(let i=0;i<data.length;i++) {        
            let j=0;
            for (const [key, value] of Object.entries(data[i])) {
                j++;
                worksheet.cell(i+3,j).string(value + "").style(style);
            }            
        }        
    }

    async getFilename(tableName) {
        const tableCommentObj = await this.getTableComment(tableName);
        let tableComment = tableCommentObj[0].table_comment.trim()

        if(!tableComment)
            tableComment = "SemDescricao"

        this.debug("Table comment: " + tableComment);
        
        const fileName = tableName+"-"+tableComment.replace("/","_")+".xlsx";
        this.debug("File to save: " + fileName);

        return fileName;
    }

    async getFilePath(tableName) {
        const fileName = await this.getFilename(tableName);
        const basePath = "./output";
        const dbPath = basePath + "/" + this.dbName;

        if(!fs.existsSync(basePath))
            fs.mkdirSync(basePath);
        
        if(!fs.existsSync(dbPath))
            fs.mkdirSync(dbPath);

        return dbPath + "/" + fileName;


    }

    adjustColumnsWidths(columns, worksheet) {
        
        for(let i=0;i<columns.length;i++) {
            let length = columns[i].Comment.length+1;

            if(length<10)
                length=10;

            worksheet.column(i).setWidth(length);
        }

    }
    async exportTable(tableName) {
    
        const filePath = await this.getFilePath(tableName);

        if(fs.existsSync(filePath)) {
            this.debug("Already exported, file already exists on output directory.");
        } else {
            const workbook = new excel4node.Workbook();
            const worksheet = workbook.addWorksheet(tableName);
            
            const columns = await this.getColumns(tableName);
            this.fillHeader(workbook, worksheet, columns);
    
            const data = await this.getData(tableName);
            this.fillData(workbook, worksheet, data);
    
            this.adjustColumnsWidths(columns, worksheet);

            workbook.write(filePath);
        }


    }

    async exportTables() {
        const tables = await this.getTables();
     
        let i=5;
        for(let i=0;i<tables.length;i++) {

            const tableName = tables[i]["Tables_in_" + this.dbName];
            this.debug("\n\nProcessing table: " + tableName);

            await this.exportTable(tableName);
        }
        
    }

    debug(message) {
        console.log(message);
    }

    async destroy() {
        return await this.connection.end();
    }

}
