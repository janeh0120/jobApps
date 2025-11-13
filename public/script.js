// fetch items from API endpoint and populate the content div
const getData = async () => {
    const response = await fetch('/apps')
    if (response.ok) {
        const data = await response.json()
        // document.querySelector('#content').innerHTML = `<h3>✅ MongoDB connected. </h3>`
        console.log(data)
        data.forEach(item => {
            let div = document.createElement('div')
            const title = item.Job_Title || item.JobTitle || item.name || item.Company || 'Untitled'
            div.textContent = title
            document.querySelector('#content').appendChild(div)
        })
    // refresh count when list loads
    getCount()
    }
    else {
        document.querySelector('#content').innerHTML = `<div>❌ MongoDB is not connected. Please check your connection string in .env file.</div>`
    }

}

getData()

// handle form submission
const form = document.querySelector('#myForm')
if (form) {
    form.addEventListener('submit', async (evt) => {
        evt.preventDefault()

        // build payload from form elements
        const fd = new FormData(form)
        const out = {}
        for (const [k, v] of fd.entries()) {
            // handle multiple checkboxes with same name (process)
            if (out[k]) {
                if (Array.isArray(out[k])) out[k].push(v)
                else out[k] = [out[k], v]
            } else {
                out[k] = v
            }
        }

        // convert checkbox booleans
        out.Design_Related_ = !!document.querySelector('#isRelated')?.checked
        out.Offered = !!document.querySelector('#isOffered')?.checked
        out.Referred_ = !!document.querySelector('#isReferred')?.checked
        out.Tailored_App_ = !!document.querySelector('#isTailored')?.checked

        // send payload to server
        const resp = await fetch('/apps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(out)
        })
        if (resp.ok) {
            // refresh list
            getData()
            form.reset()
            // refresh count after successful submit
            getCount()
        } else {
            console.error('Failed to save', await resp.text())
            alert('Failed to save entry')
        }
    })
}

// fetch and display total count
async function getCount() {
    try {
        const r = await fetch('/apps/count')
        if (!r.ok) return
        const j = await r.json()
        const el = document.querySelector('#countBadge')
        if (el && typeof j.count === 'number') el.textContent = j.count
    } catch (err) {
        console.error('Failed to fetch count', err)
    }
}

// initial count load
getCount()

// Modal behavior: open/close
const modal = document.querySelector('#modal')
const openBtn = document.querySelector('#openFormBtn')
const closeTriggers = modal ? modal.querySelectorAll('[data-close]') : []

function openModal() {
    if (!modal) return
    modal.classList.add('open')
    modal.setAttribute('aria-hidden', 'false')
}

function closeModal() {
    if (!modal) return
    modal.classList.remove('open')
    modal.setAttribute('aria-hidden', 'true')
}

if (openBtn) openBtn.addEventListener('click', () => openModal())
closeTriggers.forEach(btn => btn.addEventListener('click', () => closeModal()))

// close on Esc
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal()
})

// close after successful submit
if (form) {
    const origSubmit = form.dispatchEvent
    // hook into successful form submit by wrapping fetch response handling above — we already call getData() and form.reset(); so close modal there
    // find the existing submit listener and modify its behavior by adding a MutationObserver or simply add a submit event after the existing listener
    form.addEventListener('submit', (e) => {
        // delay close slightly to allow existing handler to run
        setTimeout(() => {
            closeModal()
        }, 200)
    }, { capture: false })
}
