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
  // Bind connection to events (to get notifications).
  //mongoose.connection.on('connected', () => console.log('Mongoose connection is open.'))
  //mongoose.connection.on('error', err => console.error(`Mongoose connection error has occurred: ${err}`))
  //mongoose.connection.on('disconnected', () => console.log('Mongoose connection is disconnected.'))

  // If the Node process ends, close the Mongoose connection.
  process.on('SIGINT', () => {
    /*mongoose.connection.close(() => {
      console.log('Mongoose connection is disconnected due to application termination.')
      process.exit(0)
    })*/
  })

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

  console.log(databaseNames)

  let containsReadingsDB = databaseNames.includes('readings_db');

  console.log(containsReadingsDB)

  if (containsReadingsDB) {
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
    /*await client.writePoints([
      {
        measurement: 'readings',
        tags: {},
        fields: { temperature: 0, humidity: 0 }
      }
    ])*/

    console.log(await client.getMeasurements())

  }

  return client
}

