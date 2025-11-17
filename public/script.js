// Helper to format application details
function formatApplicationDetails(item) {
    const title = item.Job_Title || item.JobTitle || item.Company || 'Untitled'
    const company = item.Company || '—'
    const applied = item.Applied_On || item.AppliedOn || '—'
    const connection = item.Connection_to_Company || item.Connection_To_Company || '—'
    const design = item.Design_Related ? 'Yes' : 'No'
    const referred = item.Referred ? 'Yes' : 'No'
    const tailored = item.Tailored_App ? 'Yes' : 'No'
    const status = item.Status || item.status || '—'
    
    const processFlags = [
        ['Email Questions', item.Email_Questions],
        ['One-sided', item.One_Sided_Interview],
        ['Behavioural', item.Behaviourial_Interview],
        ['Portfolio', item.Portfolio_Walkthrough],
        ['Take-home Challenge', item.Take_home_Challenge],
        ['Recruiter', item.Recruiter_Call],
        ['Private', item.Private_Posting]
    ]
    const process = processFlags.filter(([label, flag]) => !!flag).map(([label]) => label)
    
    let year = '—'
    if (item.Year !== undefined && item.Year !== null) {
        if (typeof item.Year === 'object') year = JSON.stringify(item.Year)
        else year = String(item.Year)
    }
    
    return {
        title, company, applied, connection, design, referred, tailored, status, process, year
    }
}

// fetch items from API endpoint (no longer rendered as list)
const getData = async (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return
        qs.append(k, v)
    })
    const url = '/apps' + (qs.toString() ? ('?' + qs.toString()) : '')
    const response = await fetch(url)
    if (response.ok) {
        getCount()
    }
}

// Render applications as grid squares with layered images
const renderGrid = async (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return
        qs.append(k, v)
    })
    // Set a very high limit to fetch all records
    if (!qs.has('limit')) {
        qs.append('limit', '10000')
    }
    const url = '/apps' + (qs.toString() ? ('?' + qs.toString()) : '')
    const response = await fetch(url)
    if (response.ok) {
        const data = await response.json()
        const gridContainer = document.querySelector('#gridContainer')
        gridContainer.innerHTML = ''
        
        data.forEach(item => {
            const square = document.createElement('div')
            square.className = 'grid-square'
            square.title = item.Job_Title || 'Untitled'
            
            // Build list of image layers (bottom to top)
            const layers = []
            
            // Layer 1: Process type images (multiple possible)
            if (item.Email_Questions) layers.push('email_questions.png')
            if (item.One_Sided_Interview) layers.push('one-sided_interview.png')
            if (item.Behaviourial_Interview) layers.push('behavioural_interview.png')
            if (item.Portfolio_Walkthrough) layers.push('portfolio_walkthrough.png')
            if (item.Take_home_Challenge) layers.push('take-home_challenge.png')
            if (item.Recruiter_Call) layers.push('recruiter_call.png')
            
            // Layer 2: Status image (only one)
            if (item.Status) {
                const status = String(item.Status).toLowerCase()
                if (status.includes('rejected')) layers.push('rejected.png')
                else if (status.includes('accepted')) layers.push('accepted.png')
                else if (status.includes('no answer') || status.includes('ongoing')) layers.push('no_answer_ongoing.png')
            }
            
            // Layer 3: Design-related
            if (item.Design_Related) layers.push('design_related.png')
            
            // Layer 4: Referred
            if (item.Referred) layers.push('referred.png')
            
            // Add layered images
            layers.forEach(imageName => {
                const img = document.createElement('img')
                img.src = `/assets/images/${imageName}`
                img.alt = imageName.replace('.png', '').replace(/_/g, ' ')
                img.onerror = () => {
                    console.warn(`Failed to load image: ${imageName}`)
                }
                square.appendChild(img)
            })
            
            // Add hover handlers to show detail card
            square.addEventListener('mouseenter', (e) => {
                const details = formatApplicationDetails(item)
                const detailTitle = document.querySelector('#detailTitle')
                const detailContent = document.querySelector('#detailContent')
                
                detailTitle.textContent = details.title
                detailContent.innerHTML = `
                    <p><strong>Company:</strong> ${escapeHtml(details.company)}</p>
                    <p><strong>Applied:</strong> ${escapeHtml(details.applied)}</p>
                    <p><strong>Connection:</strong> ${escapeHtml(details.connection)}</p>
                    <p><strong>Design Related:</strong> ${escapeHtml(details.design)}</p>
                    <p><strong>Referred:</strong> ${escapeHtml(details.referred)}</p>
                    <p><strong>Tailored App:</strong> ${escapeHtml(details.tailored)}</p>
                    <p><strong>Status:</strong> ${escapeHtml(details.status)}</p>
                    <p><strong>Process:</strong> ${details.process.length ? details.process.map(escapeHtml).map(s => `<span class="badge">${s}</span>`).join(' ') : '—'}</p>
                    <p><strong>Year:</strong> ${escapeHtml(details.year)}</p>
                `
            })
            
            gridContainer.appendChild(square)
        })
        
        getCount()
    } else {
        const gridContainer = document.querySelector('#gridContainer')
        gridContainer.innerHTML = '<div>❌ Failed to load applications</div>'
    }
}

// Initial render grid on page load
renderGrid()

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
    out.Design_Related = !!document.querySelector('#isRelated')?.checked
    out.Referred = !!document.querySelector('#isReferred')?.checked
    out.Tailored_App = !!document.querySelector('#isTailored')?.checked

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
            // refresh grid with all entries
            renderGrid()
            form.reset()
            // refresh count after successful submit
            getCount()
            // close modal after successful submit
            closeModal()
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

// Auto-refresh system: track count and refresh grid if data changes
let lastKnownCount = null
async function autoRefreshCheck() {
    try {
        const r = await fetch('/apps/count')
        if (!r.ok) return
        const j = await r.json()
        const currentCount = j.count
        
        // If count changed (data added or deleted), refresh grid
        if (lastKnownCount !== null && lastKnownCount !== currentCount) {
            console.log(`Data changed: ${lastKnownCount} → ${currentCount}. Refreshing grid...`)
            const f = readFilters()
            await renderGrid(f)
            await getCount()
        }
        
        lastKnownCount = currentCount
    } catch (err) {
        console.error('Auto-refresh check failed', err)
    }
}

// Start auto-refresh polling every 2 seconds
setInterval(autoRefreshCheck, 2000)

// Filter form wiring
const filterForm = document.querySelector('#filterForm')
const clearFiltersBtn = document.querySelector('#clearFilters')

function readFilters() {
    const form = new FormData(filterForm)
    const out = {}
    for (const [k, v] of form.entries()) {
        if (v === '') continue
        if (k === 'design') out.design = true
        else if (k === 'referred') out.referred = true
        else if (k === 'tailored') out.tailored = true
        else out[k] = v
    }
    // unchecked checkboxes -> undefined (no filter)
    if (!document.querySelector('#filterDesign').checked) delete out.design
    if (!document.querySelector('#filterReferred').checked) delete out.referred
    if (!document.querySelector('#filterTailored').checked) delete out.tailored
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
        renderGrid(f)
    })
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
        filterForm.reset()
        renderGrid({})
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
