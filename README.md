# Sql2xlsx
## A node script which creates a dump of a mysql database exported to xlsx sheets

1. Run: npm install
2. Copy or rename .env.example to .env and set the content with the access credentials to the database that should be exported
3. Confirm that is possible to write on output subdirectory (create it if doesn't exists with the correct permissions)
4. Run: npm run start
5. Exported files should be generated within 'output/{database name}/' directory
