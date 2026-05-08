let btn_sfe_1 = document.getElementById("btn_sfe_1")
let btn_sfe_2 = document.getElementById("btn_sfe_2")
let btn_transfer_fifo = document.getElementById("btn_transfer_fifo")
let btn_cce_1 = document.getElementById("btn_cce_1")
let btn_aud_1 = document.getElementById("btn_aud_1")
let btn_logoff = document.getElementById("btn_logoff")





btn_logoff.addEventListener("click",()=>{ document.cookie = "accessToken" + '=; Max-Age=0', window.location.replace(window.location.origin + "/login/Acreditacion")})

// SE REDIRIGE A PAGINA 3014 DE TRANSFERENCIAS
btn_sfe_1.addEventListener("click", ()=>{
    location.replace("/consultaSEM")
})
btn_sfe_2.addEventListener("click", ()=>{
    location.replace("/transferSEM")
})
btn_transfer_fifo.addEventListener("click", ()=>{
    location.replace("/transferSEMFifo")
})
btn_cce_1.addEventListener("click", ()=>{
    location.replace("/conteo_ciclico/SEM")
})
btn_aud_1.addEventListener("click", ()=>{
    location.replace("/auditoriaProduccionSEM")
})