import sql from 'mssql'
const dbsettings  = {
  // server:"localhost",
  // database:"pokemon",
  // user:"oman",
  // password:"papas123",
  // options:{
  //   trustCertificate: false,
  //   encrypt:false
  // }

  server: "servidor-tnt.database.windows.net",
  database: 'pokepoke',
  user: 'tnt-admin',
  password: 'papas123.',
  options: {
    encrypt: true,
  }
}

export const getconnection = async () =>{
  try {
    const pool = await sql.connect(dbsettings);  
    return pool;
  } catch (error) {
    console.log(error.message);
  }
}

export {sql}