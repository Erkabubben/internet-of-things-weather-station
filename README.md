# Assignment - Internet of Things

Hardware and sensors are constantly added to our lives. Sensors produce data, data that often need to be collected and analyzed. Having a basic knowledge of IoT protocols opens many doors for exciting projects as a web developer. This assignment aims to create a thing that connects to the web, a Web Thing. 

## Description

Build a thing that connects to the internet, either independently or through a gateway. The function and if it should have actions, properties, or both are up to you and your project. Create a web interface for your thing. Do you collect a lot of data? Why not show it on a chart?

Looking for inspiration? Please have a look at [some of our example projects](https://coursepress.lnu.se/kurser/webben-som-applikationsplattform/iot/exempel)

## Requirements

The requirements for the assignment are quite vague by design. There are some musts, and even they can be discussed if they are stopping you from achieving your goals.

### Must

* The thing (preferable a microcontroller) must be connected to the web (freestanding, not relayed through a personal computer)
* The thing must be either or both:
    * be accessible through an API
    * have its data presented through an API
* Have a user interface that communicates with the API(s)
* Be presented (see details)

### Should

* Have an API that follows the Web Thing Model

### Could

* Be presented using a public link.
* Implement the API as an implementation of another information model (e.g. Fiware).
* Use a time-series database to store sensor data (e.g. Influx) and add data retention.
* In the report, analyze and reflect on your choices (hardware, protocols, information models, software, data storage, etc., in greater depth).

## Assignment Report

Your application will be presented using a "Tutorial style" assignment report. For details, see the included [template](./Template.md). It is recommended that you replace this README.md with your final report, but you are free to place the report wherever you want as long as it is linked in the Merge Request.

## Merge Request

You hand in the assignment by making a Merge Request of your project against the lnu/submit-branch. It is OK to have additional projects and repositories, but include a link to them in the Submission report. 
Pay extra attention to including a link to your Assignment Report. 
