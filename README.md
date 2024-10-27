# Anokha 2024

Anokha 2024 TechFest server.

## Installation

1. Install `Node.js` and `npm`
2. Install `mysql`.
3. Create Databases.

```sql
CREATE DATABASE anokha;
CREATE DATABASE anokha_transactions;
```

4. Install dependencies.

```bash
npm i
```

5. Configure ENV variables. Create `.env.local` file in the root directory of the project using the following template.

```env
DB_HOST = '<MYSQL_HOST_NAME>'
DB_USER = '<MYSQL_USER_NAME>'
DB_PASS = '<MYSQL_PASSWORD>'

DB_NAME = 'anokha'
TXN_DB_NAME = 'anokha_transactions'

MAILER_SERVICE = 'Outlook365'
MAILER_HOST = 'smtp.office365.com'
MAILER_PORT = 587
MAILER_USER = '<OUTLOOK_EMAIL_ID>'
MAILER_PASS = '<OUTLOOK_EMAIL_PASSWORD>'

PAYU_TEST_KEY = '<PAYU_TEST_KEY>'
PAYU_TEST_SALT = '<PAYU_TEST_SALT>>'


PAYU_PROD_KEY = '<PAYU_PRODUCTION_KEY>'
PAYU_PROD_SALT = '<PAYU_PRODUCTION_SALT>'

isProduction = '1'

BASE_URL = "<FRONTEND_BASE_URL_FOR_REDIRECT_OPS>"
BACKEND_PORT = <BACKEND_PORT>
```

6. Run the server.

```bash
npm start
```

## Developers

`Ashwin Narayanan S`
`Abhinav Ramakrishnan`
