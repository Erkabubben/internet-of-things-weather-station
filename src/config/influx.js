/**
 * InfluxDB configuration.
 *
 * @author Erik Lindholm
 * @version 1.0.0
 */

import influx from 'influx'

export let client = ''

/**
 * Initiates the InfluxDB database.
 */
export const connectDB = async () => {
  // Creates an InfluxDB JavaScript client.
  client = new influx.InfluxDB({
    database: 'readings_db',
    host: 'localhost',
    port: process.env.INFLUXDB_PORT,
    username: process.env.INFLUXDB_ADMIN_USER,
    password: process.env.INFLUXDB_ADMIN_PASSWORD
  })

  // Tests the InfluxDB connection.
  client.ping(5000).then(hosts => {
    hosts.forEach(host => {
      if (host.online) {
        console.log(`${host.url.host} responded in ${host.rtt}ms running ${host.version})`)
      } else {
        console.log(`${host.url.host} is offline :(`)
      }
    })
  })

  // Checks whether the InfluxDB instance contains database readings_db. If it doesn't, or if
  // environment variable RESET_DB is set to true, creates a new readings_db database.
  const databaseNames = await client.getDatabaseNames()
  let containsReadingsDB = databaseNames.includes('readings_db')
  console.log('containsReadingsDB set to ' + containsReadingsDB + '.')

  if (containsReadingsDB && process.env.RESET_DB === 'true') {
    await client.dropDatabase('readings_db')
    console.log('Database "readings_db" was dropped.')
    containsReadingsDB = false
    console.log('containsReadingsDB set to ' + containsReadingsDB + ' as no database was found.')
  }

  if (!containsReadingsDB) {
    console.log('Creating new database "readings_db"...')
    await client.createDatabase('readings_db')
    await client.addSchema({
      measurement: 'readings',
      fields: {
        temperature: influx.FieldType.FLOAT,
        humidity: influx.FieldType.FLOAT
      },
      tags: []
    })

    /**
     * Utility function for returning a random number between the provided min and max values.
     *
     * @param {number} min - The minimum number returned (inclusive).
     * @param {number} max - The maximum number returned (exclusive).
     * @returns {number} - A number between the min and max values.
     */
    function getRndInteger (min, max) {
      return Math.floor(Math.random() * (max - min)) + min
    }

    // Set to true if you want to add some test data on startup. Should only be used
    // during development!
    const addTestData = (process.env.ADD_TEST_DATA === 'true')

    if (addTestData) {
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          date.setHours(j)
          await client.writePoints([
            {
              measurement: 'readings',
              tags: {},
              fields: { temperature: getRndInteger(0, 40), humidity: getRndInteger(0, 100) },
              timestamp: date
            }
          ])
        }
      }
    }
  }
}
