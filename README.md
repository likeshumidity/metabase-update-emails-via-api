# Update Metabase user emails via API from a CSV list

- Tested with Node v18.12.1 and yarn 1.22.19

## Installation and Configuration
```
$ yarn install
```
- Set the following environment variables or copy and update the `env_sample` to a `.env` file
    - METABASE_ADMIN_USER - must have admin permissions to manage users
    - METABASE_ADMIN_PASS
    - METABASE_BASE_URL


## Running
```
$ node ./bin/index.js --emaillist emails_to_update.csv
```

## CSV format
- should have a header row
- should have only two columns
- first column should be original email
- second column should be new email


