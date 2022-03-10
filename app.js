const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();

let db = null;

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(4000, () => {
      console.log("Server is Running at http://localhost:4000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertStateDBToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDBToResponseObject = (objects) => {
  return {
    districtId: objects.district_id,
    districtName: objects.district_name,
    stateId: objects.state_id,
    cases: objects.cases,
    cured: objects.cured,
    active: objects.active,
    deaths: objects.deaths,
  };
};

//get api

app.get("/states/", async (request, response) => {
  const stateQuery = `
    SELECT * 
    FROM 
    state 
    ORDER BY 
    state_id`;
  const stateArray = await db.all(stateQuery);
  response.send(
    stateArray.map((eachState) => convertStateDBToResponseObject(eachState))
  );
});

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
SELECT 
* 
FROM 
state
WHERE 
state_id = ${stateId}`;
  const state = await db.get(getStateQuery);
  response.send(convertStateDBToResponseObject(state));
});

///post Api add another array or an object to the api

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const districtQuery = `
  INSERT INTO 
  district 
  (district_name,state_id,cases,cured,active,deaths)
  VALUES 
  ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}')`;

  const dbResponse = await db.run(districtQuery);
  const district = dbResponse.district_id;
  response.send("District Successfully Added");
});

// GET district Api get which is already present

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT * 
  FROM 
  district
  WHERE 
  district_id = ${districtId}`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictDBToResponseObject(district));
});

//DELETE Api From districts it is used to delete api

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE 
    FROM 
    district
    WHERE 
    district_id = ${districtId}`;
  const deleteDistrict = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

///Put is used to update the Api

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateQuery = `
    UPDATE 
    district 
    SET 
    district_name ='${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured =${cured},
    active =${active},
    deaths = ${deaths} 
    WHERE 
    district_id =${districtId}`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `
    SELECT 
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
    FROM 
    district
    WHERE 
    state_id = ${stateId}`;

  const stateStats = await db.get(getStateQuery);
  response.send(stateStats);

  /*Another way to send response is
  response.send(
      totalCases:stateStats["SUM(cases)"],
      totalCured:stateStats["SUM(cured)"],
      totalActive:stateStats["SUM(active)"],
      totalDeaths:stateStats["SUM(deaths)"]
  )
  */
});

app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
    state_name 
    FROM 
    state
    NATURAL JOIN 
    district
    WHERE 
    district_id =${districtId}`;

  const state = await db.get(getDistrictQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
