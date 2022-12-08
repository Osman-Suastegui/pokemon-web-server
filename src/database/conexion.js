import sql from 'mssql'
const dbsettings  = {
  server:"servidor-invernadero.database.windows.net",
  database:"pokemon",
  user:"ismael",
  password:"mayel02-",
  options:{
    encrypt:true
  }

  // server: "servidor-tnt.database.windows.net",
  // database: 'pokepoke',
  // user: 'tnt-admin',
  // password: 'papas123.',
  // options: {
  //   encrypt: true,
  // }
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