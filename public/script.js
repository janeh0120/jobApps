// fetch items from API endpoint and populate the content div
const getData = async (params = {}) => {
    // build query string from params
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return
        qs.append(k, v)
    })
    const url = '/apps' + (qs.toString() ? ('?' + qs.toString()) : '')
    const response = await fetch(url)
    if (response.ok) {
        const data = await response.json()
        // document.querySelector('#content').innerHTML = `<h3>✅ MongoDB connected. </h3>`
        console.log(data)
        data.forEach(item => {
            const card = document.createElement('div')
            card.className = 'item'

            const title = item.Job_Title || item.JobTitle || item.Company || 'Untitled'
            const company = item.Company || '—'
            const applied = item.Applied_On || item.AppliedOn || '—'
            const connection = item.Connection_to_Company_ || item.Connection_To_Company || '—'
            const design = item.Design_Related_ ? 'Yes' : 'No'
            const offered = item.Offered ? 'Yes' : 'No'
            const referred = item.Referred_ ? 'Yes' : 'No'
            const tailored = item.Tailored_App_ ? 'Yes' : 'No'
            const status = item.Status || item.status || '—'
            // Process may be an array or single value
            // derive process badges from boolean schema fields
            const processFlags = [
                ['Email Questions', item.Email_Questions],
                ['One-sided', item.One_Sided_Interview],
                ['Behavioural', item.Behaviourial_Interview],
                ['Portfolio', item.Portfolio_Walkthrough],
                ['Design / Take-home', item.Take_home_Challenge],
                ['Recruiter', item.Recruiter_Call],
                ['Private', item.Private_Posting_]
            ]
            const process = processFlags.filter(([label, flag]) => !!flag).map(([label]) => label)
            // Year_ may be Json (number/string/object) depending on your data
            let year = '—'
            if (item.Year_ !== undefined && item.Year_ !== null) {
                if (typeof item.Year_ === 'object') year = JSON.stringify(item.Year_)
                else year = String(item.Year_)
            }

            card.innerHTML = `
                <p><strong>Job Title:</strong> ${escapeHtml(title)}</p>
                <p><strong>Company:</strong> ${escapeHtml(company)}</p>
                <p><strong>Applied:</strong> ${escapeHtml(applied)}</p>
                <p><strong>Connection:</strong> ${escapeHtml(connection)}</p>
                <p><strong>Design Related:</strong> ${escapeHtml(design)}</p>
                <p><strong>Offered:</strong> ${escapeHtml(offered)}</p>
                <p><strong>Referred:</strong> ${escapeHtml(referred)}</p>
                <p><strong>Tailored App:</strong> ${escapeHtml(tailored)}</p>
                <p><strong>Status:</strong> ${escapeHtml(status)}</p>
                <p><strong>Process:</strong> ${process.length ? process.map(escapeHtml).map(s => `<span class="badge">${s}</span>`).join(' ') : '—'}</p>
                <p><strong>Year:</strong> ${escapeHtml(year)}</p>
            `
            document.querySelector('#content').appendChild(card)
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

    // convert checkbox booleans for schema-aligned fields
    out.Design_Related_ = !!document.querySelector('#isRelated')?.checked
    out.Offered = !!document.querySelector('#isOffered')?.checked
    out.Referred_ = !!document.querySelector('#isReferred')?.checked
    out.Tailored_App_ = !!document.querySelector('#isTailored')?.checked

    // process boolean fields
    out.Email_Questions = !!document.querySelector('#Email_Questions')?.checked
    out.One_Sided_Interview = !!document.querySelector('#One_Sided_Interview')?.checked
    out.Behaviourial_Interview = !!document.querySelector('#Behaviourial_Interview')?.checked
    out.Portfolio_Walkthrough = !!document.querySelector('#Portfolio_Walkthrough')?.checked
    out.Take_home_Challenge = !!document.querySelector('#Take_home_Challenge')?.checked
    out.Recruiter_Call = !!document.querySelector('#Recruiter_Call')?.checked

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

// Filter form wiring
const filterForm = document.querySelector('#filterForm')
const clearFiltersBtn = document.querySelector('#clearFilters')

function readFilters() {
    const form = new FormData(filterForm)
    const out = {}
    for (const [k, v] of form.entries()) {
        if (v === '') continue
        if (k === 'design') out.design = true
        else out[k] = v
    }
    // design unchecked -> undefined (no filter)
    if (!document.querySelector('#filterDesign').checked) delete out.design
    // gather process checkboxes selected in the filter bar
    const procBoxes = document.querySelectorAll('.filter-process:checked')
    if (procBoxes.length > 0) {
        const vals = Array.from(procBoxes).map(b => b.value)
        out.process = vals.join(',')
    }
    return out
}

if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const f = readFilters()
        document.querySelector('#content').innerHTML = ''
        getData(f)
    })
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
        filterForm.reset()
        document.querySelector('#content').innerHTML = ''
        getData()
    })
}

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

// simple HTML escape helper
function escapeHtml(str) {
    if (str === undefined || str === null) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
