/**
 * Mongoose configuration.
 *
 * @author Mats Loock
 * @version 1.0.0
 */

import influx from 'influx'

// DISCLAIMER: This is an example connection string. ALWAYS use an environment variable to store the connection string.
// const CONNECTION_STRING = 'mongodb://localhost:27017/<name>'
// const DB_CONNECTION_STRING = 'mongodb+srv://<dbuser>:<password>@<cluster>.mongodb.net/<name>?retryWrites=true&w=majority'

export let client = undefined

/**
* Establishes a connection to a database.
*
* @returns {Promise} Resolves to this if connection succeeded.
*/
export const connectDB = async () => {
  // Connect to the server.
  client = new influx.InfluxDB({
    database: 'readings_db',
    host: 'localhost',
    port: process.env.INFLUXDB_PORT,
    username: process.env.INFLUXDB_ADMIN_USER,
    password: process.env.INFLUXDB_ADMIN_PASSWORD
  })

  client.ping(5000).then(hosts => {
    hosts.forEach(host => {
      if (host.online) {
        console.log(`${host.url.host} responded in ${host.rtt}ms running ${host.version})`)
      } else {
        console.log(`${host.url.host} is offline :(`)
      }
    })
  })

  const databaseNames = await client.getDatabaseNames()

  let containsReadingsDB = databaseNames.includes('readings_db');

  if (containsReadingsDB && process.env.RESET_DB === 'true') {
    await client.dropDatabase('readings_db')
    containsReadingsDB = false
  }

  if (!containsReadingsDB) {
    await client.createDatabase('readings_db')
    await client.addSchema({
        measurement: 'readings',
        fields: {
          temperature: influx.FieldType.FLOAT,
          humidity: influx.FieldType.FLOAT
        },
        tags: []
      }
    )

    function getRndInteger(min, max) {
      return Math.floor(Math.random() * (max - min) ) + min;
    }

    const addTestData = true

    if (addTestData) {
      for (let i = 1; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          let now = new Date()
          now.setDate(now.getDate() - i)
          now.setHours(j)
          await client.writePoints([
            {
              measurement: 'readings',
              tags: {},
              fields: { temperature: getRndInteger(0, 40), humidity: getRndInteger(0, 100) },
              timestamp: now
            }
          ])
        }
      }
    }

    const results = await client.query(`
    select * from readings
    order by time asc
  `)

    console.log(results)
  }

  return client
}
