let cardContainer = document.getElementById("cardContainer")
let spinnerContainer = document.getElementById("spinnerContainer")
let emptyMessage = document.getElementById("emptyMessage")
let errorMessage = document.getElementById("errorMessage")
let errorText = document.getElementById("errorText")
let btn_refresh = document.getElementById("btn_refresh")
let timerInterval = null

let tabla_fifo = document.getElementById('tabla_fifo').getElementsByTagName('tbody')[0]
let tabla_result = document.getElementById('tabla_result').getElementsByTagName('tbody')[0]
let inp_verifyFIFO = document.getElementById("inp_verifyFIFO")
let submitScanSU = document.getElementById("submitScanSU")
let alerta_scan = document.getElementById("alerta_scan")
let cPartNum = document.getElementById("cPartNum")
let cPartDesc = document.getElementById("cPartDesc")
let btnTransferir = document.getElementById("btnTransferir")
let cantidadErrores = document.getElementById("cantidadErrores")
let btnRefreshClose = document.querySelectorAll(".btnRefreshClose")
let user_id = document.getElementById("user_id")

let array_fifo = []
let selected_serials = []
let serials_obsoletos = []
let dates = {}
let lower_date = "12/12/9999"
let errorFifoText = document.getElementById("errorFifoText")
let currentMaterial = ""
let currentDescription = ""
let currentRequestId = ""
let currentRequestArea = ""

btn_refresh.addEventListener("click", loadTransferList)
btnTransferir.addEventListener("click", transferSU)
btnRefreshClose.forEach(el => el.addEventListener("click", function () {
    cleanFifo()
    loadTransferList()
}))

tabla_fifo.addEventListener("click", function (e) {
    if (e.target.classList.contains("cycleButton") && !e.target.disabled) {
        cycleAdd(e)
    }
})

loadTransferList()

// ==================== LISTA DE SOLICITUDES ====================

function loadTransferList() {
    if (timerInterval) clearInterval(timerInterval)

    spinnerContainer.style.display = ""
    emptyMessage.style.display = "none"
    errorMessage.style.display = "none"
    cardContainer.innerHTML = ""

    axios({
        method: 'post',
        url: "/getTransferFifoList",
        headers: { 'Content-Type': 'application/json' }
    })
    .then((result) => {
        spinnerContainer.style.display = "none"

        if ((typeof result.data === "string") && result.data.includes("<!DOCTYPE html>")) {
            location.href = "/login/Acreditacion"
            return
        }

        let data = result.data
        if (!Array.isArray(data) || data.length === 0) {
            emptyMessage.style.display = ""
            return
        }

        data = data.filter((item) => {
            const m = (item.sapMaterial || "").trim().toUpperCase()
            return m.startsWith("5S") && !m.startsWith("5STP")
        })
        if (data.length === 0) {
            emptyMessage.style.display = ""
            return
        }

        data.sort((a, b) => new Date(a.requestTime) - new Date(b.requestTime))

        let groups = {}
        data.forEach((item) => {
            if (!groups[item.area]) groups[item.area] = []
            groups[item.area].push(item)
        })

        Object.keys(groups).sort().forEach((area) => {
            cardContainer.insertAdjacentHTML("beforeend", buildAreaHeader(area, groups[area].length))
            groups[area].forEach((item) => {
                cardContainer.insertAdjacentHTML("beforeend", buildCard(item))
            })
        })

        updateAllTimers()
        timerInterval = setInterval(updateAllTimers, 1000)
    })
    .catch((err) => {
        spinnerContainer.style.display = "none"
        errorMessage.style.display = ""
        errorText.innerHTML = "Error al obtener solicitudes: " + (err.message || err)
    })
}

function formatElapsed(ms) {
    let totalSeconds = Math.floor(ms / 1000)
    let days = Math.floor(totalSeconds / 86400)
    let hours = Math.floor((totalSeconds % 86400) / 3600)
    let minutes = Math.floor((totalSeconds % 3600) / 60)
    let seconds = totalSeconds % 60

    let pad = (n) => String(n).padStart(2, "0")

    if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function updateAllTimers() {
    let timers = document.querySelectorAll("[data-request-time]")
    let now = Date.now()
    timers.forEach((el) => {
        let reqTime = parseInt(el.getAttribute("data-request-time"))
        let elapsed = now - reqTime
        el.textContent = formatElapsed(elapsed)

        let icon = el.parentElement.querySelector(".fas.fa-stopwatch")
        if (icon) {
            let minutes = Math.floor(elapsed / 60000)
            icon.classList.remove("text-success", "text-warning", "text-danger")
            if (minutes < 5) {
                icon.classList.add("text-success")
            } else if (minutes <= 15) {
                icon.classList.add("text-warning")
            } else {
                icon.classList.add("text-danger")
            }
        }
    })
}

function adjustToMexicoTime(isoString) {
    let date = new Date(isoString)
    return date.getTime() + (6 * 60 * 60 * 1000)
}

const EXCLUDED_STORAGE_BINS = ["CICLI", "JR", "V11"]

function isExcludedStorageBin(location) {
    const upper = (location || "").trim().toUpperCase()
    return EXCLUDED_STORAGE_BINS.some(term => upper.includes(term))
}

function buildAreaHeader(area, count) {
    return `
    <div class="d-flex align-items-center mt-3 mb-2">
      <span class="fas fa-warehouse text-secondary mr-2"></span>
      <strong style="font-size:0.9rem;">${area}</strong>
      <span class="badge badge-dark ml-2">${count}</span>
      <hr class="flex-grow-1 ml-2 my-0">
    </div>
    `
}

function buildCard(item) {
    let requestMs = adjustToMexicoTime(item.requestTime)

    return `
    <div class="card mb-2 border-left-0 border-right-0" style="border-left: 4px solid #17a2b8 !important; cursor:pointer;"
      onclick='getSEMFIFO(${JSON.stringify(item.sapMaterial)}, ${JSON.stringify(item.materialDescription || "")}, ${JSON.stringify(item._id != null ? String(item._id) : "")}, ${JSON.stringify(item.area || "")})'>
      <div class="card-body p-2">
        <div class="d-flex justify-content-between align-items-start">
          <div class="text-left" style="flex:1; min-width:0;">
            <h6 class="mb-1 ${item.alreadyTransferred ? 'text-success' : 'text-info'} font-weight-bold" style="font-size:0.95rem;">${item.alreadyTransferred ? '<span class="fas fa-circle text-success mr-1" style="font-size:0.45rem;vertical-align:0.2em;" title="Transferencia registrada (SAP)"></span>' : ''}${item.sapMaterial}</h6>
            <p class="mb-1" style="font-size:0.8rem;">
              <span class="fas fa-industry mr-1 text-muted"></span>${item.stationName}
            </p>
            <p class="mb-0 text-muted" style="font-size:0.75rem;">${item.materialDescription || ""}</p>
          </div>
          <div class="text-right" style="white-space:nowrap;">
            <span class="badge ${item.alreadyTransferred ? 'badge-success' : 'badge-info'}" style="font-size:1rem;">${item.quantity}</span>
            ${item.alreadyTransferred
              ? `<p class="mb-0 mt-1" style="font-size:0.7rem;"><span class="fas fa-check-circle text-success" style="font-size:1rem;" title="Transferencia registrada (SAP)"></span></p>`
              : `<p class="mb-0 mt-1 text-muted" style="font-size:0.7rem;">
              <span class="fas fa-stopwatch mr-1"></span>
              <span class="font-weight-bold" data-request-time="${requestMs}">--:--:--</span>
            </p>`}
          </div>
        </div>
      </div>
    </div>
    `
}

// ==================== FIFO LOGIC ====================

function getSEMFIFO(material, description, requestId, area) {
    currentMaterial = material
    currentDescription = description
    currentRequestId = requestId || ""
    currentRequestArea = area || ""
    selected_serials = []
    serials_obsoletos = []
    dates = {}
    lower_date = "12/12/9999"
    btnTransferir.disabled = true

    $('#modalSpinner').modal({ backdrop: 'static', keyboard: false })

    let estacion = document.getElementById("estacion").innerHTML.trim()
    let data = {
        material: material,
        user_id: user_id.innerHTML.trim(),
        storage_type: "SEM",
        estacion: estacion
    }

    axios({
        method: 'post',
        url: "/getSEMFIFO",
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(data)
    })
    .then((result) => {
        if ((typeof result.data === "string") && result.data.includes("<!DOCTYPE html>")) {
            location.href = "/login/Acreditacion"
            return
        }

        if (result.data.key) {
            soundWrong()
            errorFifoText.innerHTML = result.data.key ? result.data.key : result.data.message
            setTimeout(() => {
                $('#modalSpinner').modal('hide')
                $('#modalErrorFifo').modal({ backdrop: 'static', keyboard: false })
            }, 500)
            return
        }

        if (!Array.isArray(result.data) || result.data.length === 0) {
            soundWrong()
            errorFifoText.innerHTML = "No se encontraron Storage Units para este material."
            setTimeout(() => {
                $('#modalSpinner').modal('hide')
                $('#modalErrorFifo').modal({ backdrop: 'static', keyboard: false })
            }, 500)
            return
        }

        let response = result.data
        array_fifo = response
        tabla_fifo.innerHTML = ""
        dates = {}

        array_fifo.forEach((element) => {
            if (!isExcludedStorageBin(element.LGPLA)) {
                let date_ = element.WDATU === "00000000" ? "20110101" : element.WDATU
                let key = JSON.stringify(moment(date_, "YYYYMMDD").format("MM/DD/YYYY"))
                dates[key] = (dates[key] || 0) + 1
            }
        })

        let sorted = array_fifo.sort((d1, d2) => {
            let a = d1.WDATU === "00000000" ? "20110101" : d1.WDATU
            let b = d2.WDATU === "00000000" ? "20110101" : d2.WDATU
            return new Date(moment(a, "YYYYMMDD").format('MM/DD/YYYY')) - new Date(moment(b, "YYYYMMDD").format('MM/DD/YYYY'))
        })

        sorted.forEach((element) => {
            let date_ = element.WDATU === "00000000" ? "20110101" : element.WDATU
            let lenum = (element.LENUM).replace(/^0+/gm, "")
            let lgpla = element.LGPLA.trim()
            let fifoDate = moment(date_, "YYYYMMDD").format("MM/DD/YYYY")

            let newRow = tabla_fifo.insertRow(tabla_fifo.rows.length)
            newRow.setAttribute("id", lenum)
            newRow.setAttribute("hu_quantity", parseInt(parseFloat(element.VERME)))
            newRow.setAttribute("part_number", (element.MATNR).trim())

            let isExcluded = isExcludedStorageBin(lgpla)

            if (isExcluded) {
                newRow.setAttribute("class", "bg-secondary text-white")
                newRow.innerHTML = `
                    <td>${lgpla}</td>
                    <td>${lenum}</td>
                    <td>${fifoDate}</td>
                    <td><button type="button" class="cycleButton btn btn-sm btn-secondary fas fa-recycle" disabled></button></td>
                `
            } else {
                newRow.innerHTML = `
                    <td>${lgpla}</td>
                    <td>${lenum}</td>
                    <td>${fifoDate}</td>
                    <td><button type="button" class="cycleButton btn btn-sm btn-warning fas fa-recycle"></button></td>
                `
            }
        })

        cPartNum.innerHTML = material
        cPartDesc.innerHTML = description

        setTimeout(() => {
            $('#modalSpinner').modal('hide')
            $('#modalFIFO').modal({ backdrop: 'static', keyboard: false })
        }, 500)

        setTimeout(() => { inp_verifyFIFO.focus() }, 600)
    })
    .catch((err) => {
        soundWrong()
        errorFifoText.innerHTML = "Error de conexión: " + (err.message || err)
        setTimeout(() => {
            $('#modalSpinner').modal('hide')
            $('#modalErrorFifo').modal({ backdrop: 'static', keyboard: false })
        }, 500)
    })
}

function updateTransferButtonState() {
    btnTransferir.disabled = !(selected_serials.length > 0 || serials_obsoletos.length > 0)
}

function cycleAdd(e) {
    e.preventDefault()
    let row = e.target.parentElement.parentElement
    row.classList.add("bg-warning")
    e.target.classList.add("text-white")
    e.target.disabled = true
    let serial_obsoleto = row.id
    let hu_quantity = row.getAttribute("hu_quantity")
    let part_number = row.getAttribute("part_number")
    serials_obsoletos.push({ serial: serial_obsoleto, hu_quantity: hu_quantity, part_number: part_number })

    Object.entries(dates).forEach(entry => {
        const [key, value] = entry
        if (moment(key, 'MM/DD/YYYY') <= moment(lower_date, 'MM/DD/YYYY') && value > 0) {
            lower_date = key
        }
    })

    dates[`${lower_date}`] = dates[`${lower_date}`] - 1
    lower_date = "12/12/9999"
    updateTransferButtonState()
}

submitScanSU.addEventListener("submit", function (e) {
    e.preventDefault()

    if (inp_verifyFIFO.value.charAt(0) !== "S" && inp_verifyFIFO.value.charAt(0) !== "s") {
        inp_verifyFIFO.value = ""
        return
    }

    let serial = (inp_verifyFIFO.value).substring(1)
    let currentSU = document.getElementById(serial)

    Object.entries(dates).forEach(entry => {
        const [key, value] = entry
        if (moment(key, 'MM/DD/YYYY') <= moment(lower_date, 'MM/DD/YYYY') && value > 0) {
            lower_date = key
        }
    })

    if (currentSU === null) {
        soundWrong()
        alerta_scan.classList.remove("animate__flipOutX")
        alerta_scan.classList.add("animate__flipInX")
        setTimeout(() => {
            alerta_scan.classList.remove("animate__flipInX")
            alerta_scan.classList.add("animate__flipOutX")
        }, 1500)
        inp_verifyFIFO.value = ""
        lower_date = "12/12/9999"
    } else if (isExcludedStorageBin(currentSU.cells[0].innerHTML)) {
        soundWrong()
        inp_verifyFIFO.value = ""
        lower_date = "12/12/9999"
    } else if (serials_obsoletos.some(o => o.serial === serial)) {
        soundWrong()
        inp_verifyFIFO.value = ""
        lower_date = "12/12/9999"
    } else if (moment(`"${currentSU.cells[2].innerHTML}"`, 'MM/DD/YYYY').format('MM/DD/YYYY') !== moment(lower_date, 'MM/DD/YYYY').format('MM/DD/YYYY')) {
        soundWrong()
        alerta_scan.classList.remove("animate__flipOutX")
        alerta_scan.classList.add("animate__flipInX")
        setTimeout(() => {
            alerta_scan.classList.remove("animate__flipInX")
            alerta_scan.classList.add("animate__flipOutX")
        }, 1500)
        inp_verifyFIFO.value = ""
        lower_date = "12/12/9999"
    } else {
        let current_hu_quantity = currentSU.getAttribute("hu_quantity")
        let current_part_number = currentSU.getAttribute("part_number")
        dates[`${lower_date}`] = dates[`${lower_date}`] - 1
        soundOk()
        inp_verifyFIFO.value = ""
        currentSU.classList.add("bg-success", "text-white")

        let cycleBtn = currentSU.querySelector(".cycleButton")
        if (cycleBtn) {
            cycleBtn.classList.remove("btn-warning")
            cycleBtn.classList.add("btn-success")
            cycleBtn.disabled = true
        }

        selected_serials.push(JSON.stringify({ "serial": serial, "hu_quantity": current_hu_quantity, "part_number": current_part_number }))
        updateTransferButtonState()
        lower_date = "12/12/9999"
    }
})

function transferSU() {
    $('#modalFIFO').modal('hide')
    $('#modalSpinner').modal({ backdrop: 'static', keyboard: false })

    let parsedSerials = selected_serials.map(s => JSON.parse(s))

    let data = {
        proceso: "transfer_sem_confirmed",
        user_id: user_id.innerHTML.trim(),
        estacion: document.getElementById("estacion").innerHTML.trim(),
        serial: parsedSerials,
        storage_type: "SEM",
        serials_obsoletos: serials_obsoletos,
        request_id: currentRequestId,
        area: currentRequestArea
    }

    axios({
        method: 'post',
        url: "/transferSEM_FIFO",
        headers: { 'Content-Type': 'application/json' },
        data: data
    })
    .then((result) => {
        let response = typeof result.data === "string" ? JSON.parse(result.data) : result.data
        let errors = 0
        soundOk()

        tabla_result.innerHTML = ""

        if (response.serials_transferred) {
            response.serials_transferred.forEach((element) => {
                let lenum = (element.I_LENUM || "").replace(/^0+/gm, "")
                let tanum = element.E_TANUM || ""
                let newRow = tabla_result.insertRow(tabla_result.rows.length)
                newRow.classList.add("bg-success", "text-white")
                newRow.innerHTML = `
                    <td>${lenum}</td>
                    <td>${tanum}</td>
                `
            })
        }

        if (response.serials_errors) {
            response.serials_errors.forEach((element) => {
                let newRow = tabla_result.insertRow(tabla_result.rows.length)
                newRow.classList.add("bg-danger", "text-white")
                newRow.innerHTML = `
                    <td>${element.serial_num || element.abapMsgV1 || ""}</td>
                    <td>${element.error || element.key || element.message || ""}</td>
                `
                errors++
            })
        }

        if (response.serials_obsoletos) {
            response.serials_obsoletos.forEach((element) => {
                let newRow = tabla_result.insertRow(tabla_result.rows.length)
                newRow.classList.add("bg-warning")
                newRow.innerHTML = `
                    <td>${element.serial_num || ""}</td>
                    <td>${element.result || ""}</td>
                `
            })
        }

        cantidadErrores.innerHTML = errors

        setTimeout(() => {
            $('#modalSpinner').modal('hide')
            $('#modalResult').modal({ backdrop: 'static', keyboard: false })
        }, 500)
    })
    .catch((err) => {
        soundWrong()
        errorFifoText.innerHTML = "Error al transferir: " + (err.message || err)
        setTimeout(() => {
            $('#modalSpinner').modal('hide')
            $('#modalErrorFifo').modal({ backdrop: 'static', keyboard: false })
        }, 500)
    })
}

function cleanFifo() {
    selected_serials = []
    serials_obsoletos = []
    dates = {}
    lower_date = "12/12/9999"
    btnTransferir.disabled = true
    currentMaterial = ""
    currentDescription = ""
    currentRequestId = ""
    currentRequestArea = ""
}
