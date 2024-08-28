const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI"

async function getNextService(stopCode = "mo") {
    await fetch(`${BASE_URL}/api/V1/Stop/NextService/${stopCode}`)
        .then(response => response.json())
        .then(data => { console.log(data) })
        .catch(error => console.log("an error has occured" + error))
}

export default getNextService