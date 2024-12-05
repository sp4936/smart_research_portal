const express = require('express');
const oracledb = require('oracledb');
const app = express();
const PORT = 3001;
const dotenv = require('dotenv');
dotenv.config();
// const Fuse = require('fuse.js');
const cors = require('cors');


app.use(express.json()); // Add this middleware to parse JSON
app.use(express.urlencoded({ extended: true }));

// Oracle DB connection details
const dbConfig = {
  user: process.env.YOUR_DB_USER,
  password: process.env.YOUR_DB_PASSWORD,
  connectString: process.env.YOUR_DB_HOSTNAME,
};

const dbConfig2 = {
  user: process.env.DB_USER_DNB,
  password: process.env.DB_PASSWORD_DNB,
  connectString: process.env.DB_HOSTNAME_DNB,
}
// Middleware to parse JSON request body
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from your frontend
}));


//python script
const { exec } = require('child_process');


// API route to assign lead and trigger Python script
app.post('/api/assign-lead', async (req, res) => {
  const { customerName, certificateNumber, entityId, dunsNumber, dataType } = req.body;

  console.log("Payload received in backend:", req.body);

  if (!dataType) {
    return res.status(400).json({ error: 'Insufficient data to identify the record' });
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    let query;
    let params = {};
    let industryField;

    // Determine query, parameters, and industry field based on data type
    switch (dataType) {
      case "COMBINED_DATA":
        if (!customerName || !certificateNumber) {
          return res.status(400).json({ error: "Customer Name and Certificate Number are required for COMBINED_DATA" });
        }
        // console.log("In combined data");
        query = `
          SELECT INDUSTRY_TYPE, TOTAL_ASSETS
          FROM dev_fccdw.CS_CUSTOMER_RESEARCH_DATA
          WHERE CUSTOMER_NAME = :customerName AND CERTIFICATE_NUMBER = :certificateNumber
        `;
        params = { customerName, certificateNumber };
        industryField = 'INDUSTRY_TYPE';

        break;

      case "SNP_GLOBAL_DATA":
        if (!entityId) {
          return res.status(400).json({ error: "Entity ID is required for SNP_GLOBAL_DATA" });
        }
        query = `
          SELECT INDUSTRY_CLASSIFICATION, TOTAL_ASSETS
          FROM dev_fccdw.STG_SNP_GLOBAL_DATA
          WHERE ENTITY_ID = :entityId
        `;
        params = { entityId };
        industryField = 'INDUSTRY_CLASSIFICATION';
        break;

      case "DNB_DATA":
        if (!dunsNumber) {
          return res.status(400).json({ error: "DUNS Number is required for DNB_DATA" });
        }
        query = `
          SELECT INDUSTRY_TYPE, TOTAL_ASSETS
          FROM dev_fccdw.dun_bradstreet_hierarchy
          WHERE DUNS_NUMBER = :dunsNumber
        `;
        params = { dunsNumber };
        industryField = 'INDUSTRY_TYPE';
        break;

      default:
        return res.status(400).json({ error: "Invalid data type provided" });
    }

    const result = await connection.execute(query, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No data found for the provided criteria` });
    }

    const { [industryField]: INDUSTRY_TYPE, TOTAL_ASSETS } = result.rows[0];
    console.log(result.rows[0]);

    var assets = TOTAL_ASSETS !== null ? TOTAL_ASSETS : 0;
    if (TOTAL_ASSETS === null) {
      console.log("Total Assests are null");
    } else {
      assets = TOTAL_ASSETS;
    }

    // Execute the Python script
    exec(`python leadAssignment.py "${INDUSTRY_TYPE}" ${assets}`, (error, stdout, stderr) => {
      console.log(`Executing Python script with: INDUSTRY_TYPE="${INDUSTRY_TYPE}", assets=${assets}`);
    
      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        return res.status(500).json({ error: 'Error in lead assignment process' });
      }
      if (stderr) {
        console.error(`Python script error: ${stderr}`);
        return res.status(500).json({ error: 'Error in lead assignment process' });
      }
    
      console.log(`Python script output: ${stdout}`);
    
      try {
        const output = JSON.parse(stdout);
        console.log('Parsed JSON output:', output);
        res.status(200).json({
          message: 'Lead assignment completed',
          team: output.team,
          industryType: INDUSTRY_TYPE,
          totalAssets: assets
        });
      } catch (e) {
        console.log('Output is not JSON:', stdout);
        res.status(500).json({ error: 'Invalid JSON output from Python script' });
      }
    });
    
    


    await connection.close();
  } catch (err) {
    console.error('Error fetching lead data:', err);
    res.status(500).send('Error fetching lead data');
  }
});






// API route to fetch data based on searchTerm and dataType
app.post('/api/search', async (req, res) => {
  const {
    customerName,
    address,
    certificateNumber,
    source,
    industryType,
    cityname,
    dataType,
    dunsNumber,
    businessName,
    entityName,
    entityId,
    streetAddress,
    page = 1,
    pageSize = 50,
  } = req.body;

  let query = '';
  let conditions = [];
  let params = {};
  let dbConfigToUse = dbConfig;  // Default to dbConfig for COMBINED_DATA and SNP_GLOBAL_DATA

  // Base query for each dataType
  switch (dataType) {
    case 'COMBINED_DATA':
      query = `SELECT SOURCE,	CUSTOMER_NAME, ADDRESS,	WEBSITE,	ZIP_CODE,	RSSD_ID, CERTIFICATE_NUMBER,INDUSTRY_TYPE,	TOTAL_ASSETS,		CIK_ID,	FDIC_ID,	FAX,	PHONE,	CITY,	STATE,INACTIVE,	NET_INCOME,		ABA_NUMBER,	LAST_UPDATED_DATE FROM dev_fccdw.CS_CUSTOMER_RESEARCH_DATA`;
      break;
    case 'SNP_GLOBAL_DATA':
      query = `SELECT * FROM dev_fccdw.STG_SNP_GLOBAL_DATA`;
      break;
    case 'DNB_DATA':
      dbConfigToUse = dbConfig2;
      query = `SELECT * FROM fccdw.DUN_AND_BRADSTREET`;
      break;
    default:
      return res.status(400).json({ error: 'Invalid dataType provided' });
  }

  // Add filters dynamically with fuzzy search
  if (customerName) {
    conditions.push('SOUNDEX(UPPER(CUSTOMER_NAME)) = SOUNDEX(UPPER(:customerName))');
    params.customerName = customerName;
  }
  if (entityName) {
    conditions.push('SOUNDEX(UPPER(ENTITY_NAME)) = SOUNDEX(UPPER(:entityName))');
    params.entityName = entityName;
  }

  if (entityId) {
    conditions.push('ENTITY_ID = :entityId');
    params.entityId = entityId;
  }
  if (address) {
    conditions.push('SOUNDEX(UPPER(ADDRESS)) = SOUNDEX(UPPER(:address))');
    params.address = address;
  }
  if (cityname) {
    conditions.push('SOUNDEX(UPPER(CITY_NAME)) = SOUNDEX(UPPER(:cityname))');
    params.cityname = cityname;
  }
  if (certificateNumber) {
    conditions.push(`CERTIFICATE_NUMBER = :certificateNumber`);
    params.certificateNumber = certificateNumber;
  }
  if (dunsNumber) {
    conditions.push(`DUNS_NUMBER = :dunsNumber`);
    params.dunsNumber = dunsNumber;
  }
  if (businessName) {
    conditions.push('SOUNDEX(UPPER(BUSINESS_NAME)) = SOUNDEX(UPPER(:businessName))');
    params.businessName = businessName;
  }
  if (streetAddress) {
    conditions.push('SOUNDEX(UPPER(STREET_ADDRESS)) = SOUNDEX(UPPER(:streetAddress))');
    params.streetAddress = streetAddress;
  }
  if (source && source !== 'all') {
    conditions.push('SOURCE = :source');
    params.source = source;
  }
  if (industryType && industryType !== 'all') {
    conditions.push('INDUSTRY_TYPE = :industryType');
    params.industryType = industryType;
  }

  // Append conditions to the query
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Add pagination
  const offset = (page - 1) * pageSize;
  query += ` OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`;

  params.offset = offset;
  params.pageSize = pageSize;


  try {
    // Use the appropriate DB connection based on dataType
    const connection = await oracledb.getConnection(dbConfigToUse);

    // Execute the query with the chosen dbConfig
    const result = await connection.execute(query, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    // Return the result
    res.json(result.rows);
    await connection.close();
  } catch (err) {
    console.error('Error querying database:', err);
    res.status(500).send('Error querying database');
  }
});



// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
// app.listen(PORT, () => {
//   console.log(`Server is running on http://192.168.1.100:${PORT}`);
// });
// http://localhost:${PORT}